'use client';

import { useState } from 'react';
import { Download, Share2, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DailySales, Transaction } from '@/types';
import { exportSalesToJSON, exportTransactionsToJSON, generateMonthlyReport } from '@/lib/utils';

interface ExportButtonsProps {
  sales: DailySales[];
  transactions: Transaction[];
  month: number;
  year: number;
}

export function ExportButtons({ sales, transactions, month, year }: ExportButtonsProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleDownloadJSON = (type: 'sales' | 'expenses' | 'payouts' | 'all') => {
    let data: any;
    let filename: string;
    const monthName = new Date(year, month).toLocaleString('default', { month: 'short', year: 'numeric' });

    if (type === 'all') {
      data = {
        sales: exportSalesToJSON(sales),
        transactions: exportTransactionsToJSON(transactions),
        summary: generateMonthlyReport(sales, transactions, month, year),
      };
      filename = `persis-all-data-${monthName}.json`;
    } else if (type === 'sales') {
      data = exportSalesToJSON(sales);
      filename = `persis-sales-${monthName}.json`;
    } else {
      const transactionType = type === 'expenses' ? 'expense' : 'payout';
      data = exportTransactionsToJSON(transactions, transactionType as 'expense' | 'payout');
      filename = `persis-${type}-${monthName}.json`;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleSyncToGoogleSheets = async () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID) {
      toast.error('Google Sheets not configured. Check IMPORT_JSON_TO_SHEETS.md');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales,
          transactions,
          month,
          year,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      
      // Open Google Sheet in new tab
      window.open(result.sheetsUrl, '_blank');
      
      toast.success('Opening Google Sheets... Download JSON and import using File → Import');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <div>
        <p className="text-sm text-gray-600 mb-2">Download Data:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDownloadJSON('sales')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
          >
            <Download size={16} />
            <span className="text-sm">Sales</span>
          </button>
          <button
            onClick={() => handleDownloadJSON('expenses')}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
          >
            <Download size={16} />
            <span className="text-sm">Expenses</span>
          </button>
          <button
            onClick={() => handleDownloadJSON('payouts')}
            className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition"
          >
            <Download size={16} />
            <span className="text-sm">Payouts</span>
          </button>
          <button
            onClick={() => handleDownloadJSON('all')}
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
          >
            <Download size={16} />
            <span className="text-sm">All Data</span>
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Cloud Backup:</p>
        <button
          onClick={handleSyncToGoogleSheets}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
        >
          {isSyncing ? <Loader size={16} className="animate-spin" /> : <Share2 size={16} />}
          <span className="text-sm">{isSyncing ? 'Syncing...' : 'Google Sheets'}</span>
        </button>
      </div>
    </div>
  );
}

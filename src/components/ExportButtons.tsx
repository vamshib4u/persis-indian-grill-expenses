'use client';

import { useState } from 'react';
import { Download, Share2, Loader, FileJson, FileSpreadsheet } from 'lucide-react';
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

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const handleDownloadCSV = (type: 'sales' | 'expenses' | 'payouts' | 'all') => {
    let data: any[];
    let filename: string;
    const monthName = new Date(year, month).toLocaleString('default', { month: 'short', year: 'numeric' });

    if (type === 'all') {
      // For all data, create multiple files or combine in one
      const allData = [
        ...exportSalesToJSON(sales).map(s => ({ ...s, category: 'Sales' })),
        ...exportTransactionsToJSON(transactions).map(t => ({ ...t, category: t.type })),
      ];
      data = allData;
      filename = `persis-all-data-${monthName}.csv`;
    } else if (type === 'sales') {
      data = exportSalesToJSON(sales);
      filename = `persis-sales-${monthName}.csv`;
    } else {
      const transactionType = type === 'expenses' ? 'expense' : 'payout';
      data = exportTransactionsToJSON(transactions, transactionType as 'expense' | 'payout');
      filename = `persis-${type}-${monthName}.csv`;
    }

    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

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

  const handleSaveToGitHub = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/save-to-github', {
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
      toast.success(`✅ Data saved to GitHub!`);
      console.log('GitHub save result:', result);
    } catch (error) {
      console.error('GitHub save error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed: ${errorMsg}`);
    } finally {
      setIsSyncing(false);
    }
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
    <div className="space-y-4 mb-6">
      <div>
        <p className="text-sm text-gray-600 mb-2">Export as CSV (for Google Sheets):</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDownloadCSV('sales')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
            title="Download as CSV - Import directly to Google Sheets"
          >
            <FileSpreadsheet size={16} />
            <span className="text-sm">Sales CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCSV('expenses')}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
            title="Download as CSV - Import directly to Google Sheets"
          >
            <FileSpreadsheet size={16} />
            <span className="text-sm">Expenses CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCSV('payouts')}
            className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition"
            title="Download as CSV - Import directly to Google Sheets"
          >
            <FileSpreadsheet size={16} />
            <span className="text-sm">Payouts CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCSV('all')}
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
            title="Download as CSV - Import directly to Google Sheets"
          >
            <FileSpreadsheet size={16} />
            <span className="text-sm">All Data CSV</span>
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Export as JSON (for backup):</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDownloadJSON('sales')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
            title="Download as JSON - Full data structure backup"
          >
            <FileJson size={16} />
            <span className="text-sm">Sales JSON</span>
          </button>
          <button
            onClick={() => handleDownloadJSON('expenses')}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
            title="Download as JSON - Full data structure backup"
          >
            <FileJson size={16} />
            <span className="text-sm">Expenses JSON</span>
          </button>
          <button
            onClick={() => handleDownloadJSON('payouts')}
            className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition"
            title="Download as JSON - Full data structure backup"
          >
            <FileJson size={16} />
            <span className="text-sm">Payouts JSON</span>
          </button>
          <button
            onClick={() => handleDownloadJSON('all')}
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
            title="Download as JSON - Full data structure backup"
          >
            <FileJson size={16} />
            <span className="text-sm">All Data JSON</span>
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Cloud Backup:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSaveToGitHub}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            title="Save data to GitHub repository"
          >
            {isSyncing ? <Loader size={16} className="animate-spin" /> : <Share2 size={16} />}
            <span className="text-sm">{isSyncing ? 'Saving...' : 'Save to GitHub'}</span>
          </button>
          <button
            onClick={handleSyncToGoogleSheets}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
            title="Open Google Sheets"
          >
            {isSyncing ? <Loader size={16} className="animate-spin" /> : <Share2 size={16} />}
            <span className="text-sm">{isSyncing ? 'Opening...' : 'Open Google Sheets'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

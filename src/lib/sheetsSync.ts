import { toast } from 'react-hot-toast';
import { DailySales, Transaction } from '@/types';
import { setSheetsStatus } from '@/lib/persistenceStatus';

export const syncSheetsNow = async (
  sales: DailySales[],
  transactions: Transaction[],
  month: number,
  year: number
) => {
  if (!process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID) {
    setSheetsStatus('disabled', 'Google Sheets not configured');
    return;
  }
  if (typeof window === 'undefined') return;
  if (!sessionStorage.getItem('persis_sheets_loaded')) {
    setSheetsStatus('not_connected', 'Postgres saved, Sheets not linked');
    return;
  }

  try {
    setSheetsStatus('connected', 'Syncing to Google Sheets');
    const res = await fetch('/api/google/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sales,
        transactions,
        month,
        year,
        spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Sync failed (${res.status})`);
    }
    setSheetsStatus('synced', 'Synced to Google Sheets');
    toast.success('Sheets synced');
  } catch (error) {
    setSheetsStatus(
      'error',
      `Postgres saved, Sheets sync failed${error instanceof Error ? `: ${error.message}` : ''}`
    );
    toast.error(`Sheets sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

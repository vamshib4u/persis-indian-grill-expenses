import { toast } from 'react-hot-toast';
import { DailySales, Transaction } from '@/types';

export const syncSheetsNow = async (
  sales: DailySales[],
  transactions: Transaction[],
  month: number,
  year: number
) => {
  if (!process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID) return;
  if (typeof window === 'undefined') return;
  if (!sessionStorage.getItem('persis_sheets_loaded')) return;

  try {
    await fetch('/api/google/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales, transactions, month, year }),
    });
  } catch (error) {
    toast.error(`Sheets sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

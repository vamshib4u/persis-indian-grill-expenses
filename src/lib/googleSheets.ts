import { google } from 'googleapis';
import { DailySales, Transaction } from '@/types';

// Note: For production, set up OAuth2 credentials via Google Cloud Console
// Store credentials securely in environment variables

export const sheetsConfig = {
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
};

interface SheetsClientConfig {
  spreadsheetId: string;
  apiKey: string;
}

export const initializeSheetsClient = (config: SheetsClientConfig) => {
  return google.sheets({ version: 'v4', auth: config.apiKey });
};

export const syncSalesToSheets = async (
  sales: DailySales[],
  spreadsheetId: string,
  apiKey: string
) => {
  try {
    const sheets = initializeSheetsClient({ spreadsheetId, apiKey });

    const values = [
      ['Date', 'Square Sales', 'Cash Collected', 'Total', 'Notes'],
      ...sales.map(sale => [
        new Date(sale.date).toLocaleDateString(),
        sale.squareSales,
        sale.cashCollected,
        sale.squareSales + sale.cashCollected,
        sale.notes || '',
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sales!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return { success: true, message: 'Sales synced to Google Sheets' };
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return { success: false, error: String(error) };
  }
};

export const syncExpensesToSheets = async (
  transactions: Transaction[],
  spreadsheetId: string,
  apiKey: string
) => {
  try {
    const sheets = initializeSheetsClient({ spreadsheetId, apiKey });
    
    const expenses = transactions.filter(t => t.type === 'expense');

    const values = [
      ['Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Spent By', 'Notes'],
      ...expenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        expense.amount,
        expense.paymentMethod,
        expense.description,
        expense.spentBy || '',
        expense.notes || '',
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Expenses!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return { success: true, message: 'Expenses synced to Google Sheets' };
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return { success: false, error: String(error) };
  }
};

export const syncPayoutsToSheets = async (
  transactions: Transaction[],
  spreadsheetId: string,
  apiKey: string
) => {
  try {
    const sheets = initializeSheetsClient({ spreadsheetId, apiKey });
    
    const payouts = transactions.filter(t => t.type === 'payout');

    const values = [
      ['Date', 'Payee', 'Amount', 'Purpose', 'Payment Method', 'Notes'],
      ...payouts.map(payout => [
        new Date(payout.date).toLocaleDateString(),
        payout.payeeName,
        payout.amount,
        payout.purpose || '',
        payout.paymentMethod,
        payout.notes || '',
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Payouts!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return { success: true, message: 'Payouts synced to Google Sheets' };
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return { success: false, error: String(error) };
  }
};

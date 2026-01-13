import { google } from 'googleapis';
import { DailySales, Transaction } from '@/types';
import fetch from 'node-fetch';
import { saveTokens, loadTokens } from './serverStorage';

// Existing API-key based helpers (kept for client-side fallbacks)
export const sheetsConfig = {
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
};

// ------------------------
// Server-side OAuth helpers
// ------------------------

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(TOKEN_ENDPOINT, { method: 'POST', body: params });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const tokens = await res.json();
  await saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken() {
  const tokens = await loadTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token available - please re-authorize');
  }

  const params = new URLSearchParams({
    refresh_token: tokens.refresh_token,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_ENDPOINT, { method: 'POST', body: params });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${await res.text()}`);
  const newTokens = await res.json();

  // Merge new tokens with existing (preserve refresh_token if new one not returned)
  const merged = { ...tokens, ...newTokens, refresh_token: newTokens.refresh_token || tokens.refresh_token };
  await saveTokens(merged);
  return merged;
}

export async function getAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error('Not authorized');

  // If access token expired or missing, refresh
  if (!tokens.access_token || (tokens.expires_at && Date.now() > tokens.expires_at)) {
    const refreshed = await refreshAccessToken();
    // set an approximate expires_at
    refreshed.expires_at = Date.now() + (refreshed.expires_in || 3600) * 1000;
    await saveTokens(refreshed);
    return refreshed.access_token;
  }

  return tokens.access_token;
}

async function putValuesWithAccessToken(spreadsheetId: string, range: string, values: any[][], accessToken: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to write to sheet');
  }
  return res.json();
}

// Server-side sync implementations (used by /api/google/sync)
export async function serverSyncAll(spreadsheetId: string, sales: DailySales[], transactions: Transaction[], month: number, year: number) {
  const accessToken = await getAccessToken();

  const salesValues = [
    ['Date', 'Square Sales', 'Cash Collected', 'Total', 'Notes'],
    ...sales.map(s => [new Date(s.date).toLocaleDateString(), s.squareSales, s.cashCollected, s.squareSales + s.cashCollected, s.notes || '']),
  ];

  const expenseValues = [
    ['Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Spent By', 'Notes'],
    ...transactions.filter(t => t.type === 'expense').map(e => [new Date(e.date).toLocaleDateString(), e.category || '', e.amount, e.paymentMethod || '', e.description || '', e.spentBy || '', e.notes || '']),
  ];

  const payoutsValues = [
    ['Date', 'Payee', 'Amount', 'Purpose', 'Payment Method', 'Notes'],
    ...transactions.filter(t => t.type === 'payout').map(p => [new Date(p.date).toLocaleDateString(), p.payeeName || '', p.amount, p.purpose || '', p.paymentMethod || '', p.notes || '']),
  ];

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalSales = sales.reduce((s, v) => s + (v.squareSales + v.cashCollected), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalPayouts = transactions.filter(t => t.type === 'payout').reduce((s, p) => s + p.amount, 0);
  const summaryValues = [
    ['Month', 'Total Sales', 'Total Expenses', 'Total Payouts', 'Net Profit'],
    [monthName, totalSales, totalExpenses, totalPayouts, totalSales - totalExpenses - totalPayouts],
  ];

  const sid = spreadsheetId || process.env.GOOGLE_SHEET_ID || process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  if (!sid) throw new Error('Spreadsheet ID not configured');

  await putValuesWithAccessToken(sid, 'Sales!A1', salesValues, accessToken);
  await putValuesWithAccessToken(sid, 'Expenses!A1', expenseValues, accessToken);
  await putValuesWithAccessToken(sid, 'Payouts!A1', payoutsValues, accessToken);
  await putValuesWithAccessToken(sid, 'Summary!A1', summaryValues, accessToken);

  return { success: true };
}

// Keep legacy client helpers for convenience
export const initializeSheetsClient = (config: { spreadsheetId: string; apiKey: string }) => {
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

// ... syncExpensesToSheets and syncPayoutsToSheets (kept unchanged)

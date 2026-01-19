import { google } from 'googleapis';
import { DailySales, Transaction } from '@/types';
import fetch from 'node-fetch';
import { saveTokens, loadTokens } from './serverStorage';

type SheetValue = string | number | boolean | null;
type SheetValues = SheetValue[][];

type SheetsPropertiesResponse = {
  sheets?: Array<{
    properties?: {
      title?: string;
      sheetId?: number;
    };
  }>;
};

type SheetsValuesResponse = {
  values?: string[][];
};

type OAuthTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  [key: string]: unknown;
};

const normalizeTokens = (raw: Record<string, unknown> | null): OAuthTokens | null => {
  if (!raw) return null;
  return {
    ...raw,
    access_token: typeof raw.access_token === 'string' ? raw.access_token : undefined,
    refresh_token: typeof raw.refresh_token === 'string' ? raw.refresh_token : undefined,
    expires_at: typeof raw.expires_at === 'number' ? raw.expires_at : undefined,
    expires_in: typeof raw.expires_in === 'number' ? raw.expires_in : undefined,
  };
};

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
  const tokens = (await res.json()) as Record<string, unknown>;
  await saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken() {
  const tokens = normalizeTokens(await loadTokens());
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
  const newTokens = normalizeTokens((await res.json()) as Record<string, unknown>) || {};

  // Merge new tokens with existing (preserve refresh_token if new one not returned)
  const merged: OAuthTokens = {
    ...tokens,
    ...newTokens,
    refresh_token: newTokens.refresh_token || tokens.refresh_token,
  };
  await saveTokens(merged);
  return merged;
}

export async function getAccessToken(): Promise<string> {
  const tokens = normalizeTokens(await loadTokens());
  if (!tokens) throw new Error('Not authorized');

  // If access token expired or missing, refresh
  if (!tokens.access_token || (tokens.expires_at && Date.now() > tokens.expires_at)) {
    const refreshed = await refreshAccessToken();
    // set an approximate expires_at
    refreshed.expires_at = Date.now() + (refreshed.expires_in || 3600) * 1000;
    await saveTokens(refreshed);
    if (!refreshed.access_token) {
      throw new Error('Missing access token after refresh');
    }
    return refreshed.access_token;
  }

  if (!tokens.access_token) {
    throw new Error('Missing access token');
  }
  return tokens.access_token;
}

async function putValuesWithAccessToken(spreadsheetId: string, range: string, values: SheetValues, accessToken: string) {
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

async function appendValuesWithAccessToken(spreadsheetId: string, range: string, values: SheetValues, accessToken: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to append to sheet');
  }
  return res.json();
}

async function getSheetId(spreadsheetId: string, sheetTitle: string, accessToken: string): Promise<number> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to load spreadsheet metadata');
  }
  const data = (await res.json()) as SheetsPropertiesResponse;
  const match = data?.sheets?.find(s => s?.properties?.title === sheetTitle);
  if (!match) throw new Error(`Sheet not found: ${sheetTitle}`);
  const id = match.properties?.sheetId;
  if (typeof id !== 'number') throw new Error(`Invalid sheet id for ${sheetTitle}`);
  return id;
}

async function getColumnValues(spreadsheetId: string, range: string, accessToken: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to read sheet values');
  }
  const data = (await res.json()) as SheetsValuesResponse;
  return data.values || [];
}

function buildDeleteRanges(rowIndices: number[]) {
  const sorted = [...rowIndices].sort((a, b) => a - b);
  const ranges: Array<{ startIndex: number; endIndex: number }> = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push({ startIndex: start - 1, endIndex: prev });
    start = cur;
    prev = cur;
  }
  ranges.push({ startIndex: start - 1, endIndex: prev });
  return ranges;
}

async function deleteMonthRows(spreadsheetId: string, sheetTitle: string, monthName: string, accessToken: string) {
  const values = await getColumnValues(spreadsheetId, `${sheetTitle}!A:A`, accessToken);
  const rowsToDelete: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i]?.[0] === monthName) rowsToDelete.push(i + 1);
  }
  if (!rowsToDelete.length) return;

  const sheetId = await getSheetId(spreadsheetId, sheetTitle, accessToken);
  const deleteRanges = buildDeleteRanges(rowsToDelete).sort((a, b) => b.startIndex - a.startIndex);
  const requests = deleteRanges.map(range => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: range.startIndex,
        endIndex: range.endIndex,
      },
    },
  }));

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Failed to delete ${monthName} rows from ${sheetTitle}`);
  }
}

// Server-side sync implementations (used by /api/google/sync)
export async function serverSyncAll(spreadsheetId: string, sales: DailySales[], transactions: Transaction[], month: number, year: number) {
  const accessToken = await getAccessToken();

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const salesValues = [
    ['Month', 'Date', 'Square Sales', 'Cash Collected', 'Total', 'Notes', 'Cash Holder'],
    ...sortedSales.map(s => [monthName, new Date(s.date).toLocaleDateString(), s.squareSales, s.cashCollected, s.squareSales + s.cashCollected, s.notes || '', s.cashHolder || '']),
  ];

  const sortedExpenses = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const expenseValues = [
    ['Month', 'Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Spent By', 'Notes'],
    ...sortedExpenses.map(e => [monthName, new Date(e.date).toLocaleDateString(), e.category || '', e.amount, e.paymentMethod || '', e.description || '', e.spentBy || '', e.notes || '']),
  ];

  const sortedPayouts = transactions
    .filter(t => t.type === 'payout')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const payoutsValues = [
    ['Month', 'Date', 'Payee', 'Amount', 'Purpose', 'Payment Method', 'Notes'],
    ...sortedPayouts.map(p => [monthName, new Date(p.date).toLocaleDateString(), p.payeeName || '', p.amount, p.purpose || '', p.paymentMethod || '', p.notes || '']),
  ];

  const totalSales = sales.reduce((s, v) => s + (v.squareSales + v.cashCollected), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalPayouts = transactions.filter(t => t.type === 'payout').reduce((s, p) => s + p.amount, 0);
  const summaryValues = [
    ['Month', 'Total Sales', 'Total Expenses', 'Total Payouts', 'Net Profit'],
    [monthName, totalSales, totalExpenses, totalPayouts, totalSales - totalExpenses - totalPayouts],
  ];

  const cashHolderTotals = sales.reduce<Record<string, number>>((acc, s) => {
    const holder = s.cashHolder?.trim() || 'Unassigned';
    acc[holder] = (acc[holder] || 0) + (s.cashCollected || 0);
    return acc;
  }, {});
  const totalCashCollected = sales.reduce((sum, s) => sum + (s.cashCollected || 0), 0);
  const cashHolderValues = [
    ['Cash Holder', 'Cash Collected'],
    ...Object.entries(cashHolderTotals).map(([holder, total]) => [holder, total]),
    ['Total Cash', totalCashCollected],
  ];

  const sid = spreadsheetId || process.env.GOOGLE_SHEET_ID || process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  if (!sid) throw new Error('Spreadsheet ID not configured');

  await deleteMonthRows(sid, 'Sales', monthName, accessToken);
  await deleteMonthRows(sid, 'Expenses', monthName, accessToken);
  await deleteMonthRows(sid, 'Payouts', monthName, accessToken);
  await deleteMonthRows(sid, 'Summary', monthName, accessToken);

  await putValuesWithAccessToken(sid, 'Sales!A1', [salesValues[0]], accessToken);
  await putValuesWithAccessToken(sid, 'Expenses!A1', [expenseValues[0]], accessToken);
  await putValuesWithAccessToken(sid, 'Payouts!A1', [payoutsValues[0]], accessToken);
  await putValuesWithAccessToken(sid, 'Summary!A1', [summaryValues[0]], accessToken);
  await putValuesWithAccessToken(sid, 'Summary!G1', cashHolderValues, accessToken);

  const appendIfRows = async (range: string, values: SheetValues) => {
    if (!values.length) return;
    await appendValuesWithAccessToken(sid, range, values, accessToken);
  };

  await appendIfRows('Sales!A2', salesValues.slice(1));
  await appendIfRows('Expenses!A2', expenseValues.slice(1));
  await appendIfRows('Payouts!A2', payoutsValues.slice(1));
  await appendIfRows('Summary!A2', summaryValues.slice(1));

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

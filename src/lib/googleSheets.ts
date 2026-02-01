import { google } from 'googleapis';
import { DailySales, Transaction } from '@/types';
import { getCashHoldingSummary } from '@/lib/cashHolding';
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

async function getValuesWithAccessToken(spreadsheetId: string, range: string, accessToken: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to read from sheet');
  }
  const data = (await res.json()) as SheetsValuesResponse;
  return data.values || [];
}

export async function readSheetRange(spreadsheetId: string, range: string) {
  const accessToken = await getAccessToken();
  return getValuesWithAccessToken(spreadsheetId, range, accessToken);
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

type UpsertSheetConfig = {
  sheetTitle: string;
  header: string[];
  monthName: string;
  rows: Array<string[]>;
};

async function ensureHeaderRow(
  spreadsheetId: string,
  sheetTitle: string,
  header: string[],
  accessToken: string
) {
  const existing = await getValuesWithAccessToken(spreadsheetId, `${sheetTitle}!A1:Z1`, accessToken);
  const existingHeader = existing[0] || [];
  const matches =
    existingHeader.length === header.length &&
    header.every((col, idx) => existingHeader[idx] === col);
  if (!matches) {
    await putValuesWithAccessToken(spreadsheetId, `${sheetTitle}!A1`, [header], accessToken);
  }
}

function padRow(row: string[], length: number) {
  if (row.length >= length) return row.slice(0, length);
  return [...row, ...Array.from({ length: length - row.length }, () => '')];
}

async function upsertSheetById(
  spreadsheetId: string,
  config: UpsertSheetConfig,
  accessToken: string
) {
  const { sheetTitle, header, monthName, rows } = config;
  await ensureHeaderRow(spreadsheetId, sheetTitle, header, accessToken);

  const values = await getValuesWithAccessToken(spreadsheetId, `${sheetTitle}!A1:Z`, accessToken);
  const idIdx = header.indexOf('ID');
  const monthIdx = header.indexOf('Month');
  if (idIdx < 0) throw new Error(`Missing ID column in ${sheetTitle}`);
  if (monthIdx < 0) throw new Error(`Missing Month column in ${sheetTitle}`);

  const existingById = new Map<string, number>();
  const rowsToDelete: number[] = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i] || [];
    const id = row[idIdx];
    if (id) existingById.set(id, i + 1); // sheet rows are 1-based
    const rowMonth = row[monthIdx];
    if (rowMonth === monthName) {
      rowsToDelete.push(i + 1);
    }
  }

  const desiredIds = new Set<string>();
  const preparedRows = rows.map(r => padRow(r, header.length));
  preparedRows.forEach(r => {
    const id = r[idIdx];
    if (id) desiredIds.add(id);
  });

  // Delete only rows for this month that are no longer present
  const deleteTargets = rowsToDelete.filter(rowIndex => {
    const row = values[rowIndex - 1] || [];
    const id = row[idIdx];
    return !id || !desiredIds.has(id);
  });

  if (deleteTargets.length) {
    const sheetId = await getSheetId(spreadsheetId, sheetTitle, accessToken);
    const deleteRanges = buildDeleteRanges(deleteTargets).sort((a, b) => b.startIndex - a.startIndex);
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
      throw new Error(txt || `Failed to delete rows from ${sheetTitle}`);
    }
  }

  for (const row of preparedRows) {
    const id = row[idIdx];
    if (!id) continue;
    const existingRow = existingById.get(id);
    if (existingRow) {
      await putValuesWithAccessToken(spreadsheetId, `${sheetTitle}!A${existingRow}`, [row], accessToken);
    } else {
      await appendValuesWithAccessToken(spreadsheetId, `${sheetTitle}!A1`, [row], accessToken);
    }
  }
}

// Server-side sync implementations (used by /api/google/sync)
export async function serverSyncAll(spreadsheetId: string, sales: DailySales[], transactions: Transaction[], month: number, year: number) {
  const accessToken = await getAccessToken();

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const inMonth = (date: Date) => date >= monthStart && date <= monthEnd;

  const monthSales = sales.filter(s => inMonth(new Date(s.date)));
  const monthTransactions = transactions.filter(t => inMonth(new Date(t.date)));

  const sortedSales = [...monthSales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const salesHeader = ['ID', 'Month', 'Date', 'Square Sales', 'Cash Collected', 'Total', 'Notes', 'Cash Holder'];
  const salesRows = sortedSales.map(s => [
    s.id,
    monthName,
    new Date(s.date).toLocaleDateString(),
    String(s.squareSales),
    String(s.cashCollected),
    String(s.squareSales + s.cashCollected),
    s.notes || '',
    s.cashHolder || '',
  ]);

  const sortedExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const expensesHeader = ['ID', 'Month', 'Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Spent By', 'Notes'];
  const expenseRows = sortedExpenses.map(e => [
    e.id,
    monthName,
    new Date(e.date).toLocaleDateString(),
    e.category || '',
    String(e.amount),
    e.paymentMethod || '',
    e.description || '',
    e.spentBy || '',
    e.notes || '',
  ]);

  const sortedPayouts = monthTransactions
    .filter(t => t.type === 'payout')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const payoutsHeader = ['ID', 'Month', 'Date', 'Payee', 'Amount', 'Purpose', 'Payment Method', 'Notes'];
  const payoutsRows = sortedPayouts.map(p => [
    p.id,
    monthName,
    new Date(p.date).toLocaleDateString(),
    p.payeeName || '',
    String(p.amount),
    p.purpose || '',
    p.paymentMethod || '',
    p.notes || '',
  ]);

  const totalSales = monthSales.reduce((s, v) => s + (v.squareSales + v.cashCollected), 0);
  const totalExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalPayouts = monthTransactions.filter(t => t.type === 'payout').reduce((s, p) => s + p.amount, 0);
  const summaryValues = [
    ['Month', 'Total Sales', 'Total Expenses', 'Total Payouts', 'Net Profit'],
    [monthName, totalSales, totalExpenses, totalPayouts, totalSales - totalExpenses - totalPayouts],
  ];

  const cashHolding = getCashHoldingSummary(sales, transactions, month, year);
  const cashHolderValues = [
    ['Cash Holder', 'Opening Balance', 'Cash Collected', 'Cash Expenses', 'Closing Balance'],
    ...cashHolding.rows.map(row => [row.name, row.opening, row.collected, row.expenses, row.closing]),
    ['Total', cashHolding.totals.opening, cashHolding.totals.collected, cashHolding.totals.expenses, cashHolding.totals.closing],
  ];

  const sid = spreadsheetId || process.env.GOOGLE_SHEET_ID || process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  if (!sid) throw new Error('Spreadsheet ID not configured');

  await upsertSheetById(
    sid,
    { sheetTitle: 'Sales', header: salesHeader, monthName, rows: salesRows },
    accessToken
  );
  await upsertSheetById(
    sid,
    { sheetTitle: 'Expenses', header: expensesHeader, monthName, rows: expenseRows },
    accessToken
  );
  await upsertSheetById(
    sid,
    { sheetTitle: 'Payouts', header: payoutsHeader, monthName, rows: payoutsRows },
    accessToken
  );

  await deleteMonthRows(sid, 'Summary', monthName, accessToken);
  await putValuesWithAccessToken(sid, 'Summary!A1', [summaryValues[0]], accessToken);
  await putValuesWithAccessToken(sid, 'Summary!G1', cashHolderValues, accessToken);

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

'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DailySales, Transaction } from '@/types';
import { formatDate } from '@/lib/utils';

type GoogleTokenResponse = {
  access_token?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleAccounts = {
  oauth2?: {
    initTokenClient?: (options: {
      client_id: string;
      scope: string;
      callback: (resp: GoogleTokenResponse) => void;
    }) => GoogleTokenClient;
  };
};

type GoogleWindow = Window & {
  google?: {
    accounts?: GoogleAccounts;
  };
};

type SheetValue = string | number | boolean | null;
type SheetValues = SheetValue[][];

interface Props {
  sales: DailySales[];
  transactions: Transaction[];
  month: number;
  year: number;
}

export function GoogleSheetsControls({ sales, transactions, month, year }: Props) {
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);

  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const openServerOAuth = () => {
    window.open('/api/google/oauth', '_blank');
  };

  const serverSync = async () => {
    try {
      toast.loading('Triggering server sync...');
      const res = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales, transactions, month, year }),
      });

      if (!res.ok) throw new Error(await res.text());
      toast.dismiss();
      toast.success('Server sync queued/succeeded');
    } catch (e) {
      console.error(e);
      toast.dismiss();
      toast.error(`Server sync failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  };

  useEffect(() => {
    if (!clientId) return;
    if (typeof window === 'undefined') return;

    // Load GIS script if not already present
    if (!((window as GoogleWindow).google)) {
      setIsLoadingScript(true);
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => setIsLoadingScript(false);
      script.onerror = () => {
        setIsLoadingScript(false);
        toast.error('Failed to load Google Identity Services script');
      };
      document.body.appendChild(script);
    }
  }, [clientId]);

  const ensureTokenClient = () => {
    if (tokenClientRef.current) return tokenClientRef.current;
    const client = (window as GoogleWindow).google?.accounts?.oauth2?.initTokenClient?.({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (resp: GoogleTokenResponse) => {
        if (resp && resp.access_token) {
          setAccessToken(resp.access_token);
          toast.success('Connected to Google');
        } else {
          toast.error('Failed to obtain access token');
        }
      },
    });
    tokenClientRef.current = client || null;
    return client;
  };

  const connect = () => {
    if (!clientId) {
      toast.error('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
      return;
    }
    const client = ensureTokenClient();
    if (!client) {
      toast.error('Google OAuth client not available yet');
      return;
    }
    try {
      client.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Token request error', error);
      toast.error('Token request failed');
    }
  };

  const disconnect = () => {
    setAccessToken(null);
    toast('Disconnected from Google');
  };

  const buildValuesFromSales = (salesData: DailySales[]) => {
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
    const header = ['Month', 'Date', 'Square Sales', 'Cash Collected', 'Total', 'Notes', 'Cash Holder'];
    const sortedSales = [...salesData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const rows = sortedSales.map(s => [monthName, formatDate(s.date), s.squareSales, s.cashCollected, (s.squareSales + s.cashCollected), s.notes || '', s.cashHolder || '']);
    return [header, ...rows];
  };

  const buildValuesFromTransactions = (txs: Transaction[], type: 'expense' | 'payout') => {
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
    const sorted = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (type === 'expense') {
      const header = ['Month', 'Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Spent By', 'Notes'];
      const rows = sorted.filter(t => t.type === 'expense').map(e => [monthName, formatDate(e.date), e.category || '', e.amount, e.paymentMethod || '', e.description || '', e.spentBy || '', e.notes || '']);
      return [header, ...rows];
    }

    const header = ['Month', 'Date', 'Payee', 'Amount', 'Purpose', 'Payment Method', 'Notes'];
    const rows = sorted.filter(t => t.type === 'payout').map(p => [monthName, formatDate(p.date), p.payeeName || '', p.amount, p.purpose || '', p.paymentMethod || '', p.notes || '']);
    return [header, ...rows];
  };

  const putValuesToSheet = async (range: string, values: SheetValues) => {
    if (!sheetId) throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID');
    if (!accessToken) throw new Error('Not connected to Google');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

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
  };

  const appendValuesToSheet = async (range: string, values: SheetValues) => {
    if (!sheetId) throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID');
    if (!accessToken) throw new Error('Not connected to Google');
    if (!values.length) return null;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
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
  };

  const getSheetId = async (sheetTitle: string) => {
    if (!sheetId) throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID');
    if (!accessToken) throw new Error('Not connected to Google');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Failed to load spreadsheet metadata');
    }
    const data = (await res.json()) as { sheets?: Array<{ properties?: { title?: string; sheetId?: number } }> };
    const match = data?.sheets?.find(s => s?.properties?.title === sheetTitle);
    if (!match) throw new Error(`Sheet not found: ${sheetTitle}`);
    const id = match.properties?.sheetId;
    if (typeof id !== 'number') throw new Error(`Invalid sheet id for ${sheetTitle}`);
    return id;
  };

  const getColumnValues = async (range: string) => {
    if (!sheetId) throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID');
    if (!accessToken) throw new Error('Not connected to Google');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Failed to read sheet values');
    }
    const data = (await res.json()) as { values?: string[][] };
    return data.values || [];
  };

  const buildDeleteRanges = (rowIndices: number[]) => {
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
  };

  const deleteMonthRows = async (sheetTitle: string, monthName: string) => {
    if (!sheetId) throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID');
    if (!accessToken) throw new Error('Not connected to Google');
    const values = await getColumnValues(`${sheetTitle}!A:A`);
    const rowsToDelete: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i]?.[0] === monthName) rowsToDelete.push(i + 1);
    }
    if (!rowsToDelete.length) return;
    const sheetIdNum = await getSheetId(sheetTitle);
    const deleteRanges = buildDeleteRanges(rowsToDelete).sort((a, b) => b.startIndex - a.startIndex);
    const requests = deleteRanges.map(range => ({
      deleteDimension: {
        range: {
          sheetId: sheetIdNum,
          dimension: 'ROWS',
          startIndex: range.startIndex,
          endIndex: range.endIndex,
        },
      },
    }));

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
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
  };

  const getValuesFromSheet = async (range: string) => {
    if (!sheetId) throw new Error('Missing NEXT_PUBLIC_GOOGLE_SHEET_ID');
    if (!accessToken) throw new Error('Not connected to Google');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Failed to read from sheet');
    }

    return res.json();
  };

  const handleSaveAll = async () => {
    if (!accessToken) {
      toast.error('Connect to Google first');
      return;
    }

    try {
      toast.loading('Saving to Google Sheets...');
      const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
      await deleteMonthRows('Sales', monthName);
      await deleteMonthRows('Expenses', monthName);
      await deleteMonthRows('Payouts', monthName);
      await deleteMonthRows('Summary', monthName);

      const salesValues = buildValuesFromSales(sales);
      await putValuesToSheet('Sales!A1', [salesValues[0]]);
      await appendValuesToSheet('Sales!A2', salesValues.slice(1));

      const expenseValues = buildValuesFromTransactions(transactions, 'expense');
      await putValuesToSheet('Expenses!A1', [expenseValues[0]]);
      await appendValuesToSheet('Expenses!A2', expenseValues.slice(1));

      const payoutsValues = buildValuesFromTransactions(transactions, 'payout');
      await putValuesToSheet('Payouts!A1', [payoutsValues[0]]);
      await appendValuesToSheet('Payouts!A2', payoutsValues.slice(1));

      // Summary sheet
      const summaryHeader = ['Month', 'Total Sales', 'Total Expenses', 'Total Payouts', 'Net Profit'];
      const totalSales = sales.reduce((s, v) => s + (v.squareSales + v.cashCollected), 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, e) => s + e.amount, 0);
      const totalPayouts = transactions.filter(t => t.type === 'payout').reduce((s, p) => s + p.amount, 0);
      const summaryValues = [summaryHeader, [monthName, totalSales, totalExpenses, totalPayouts, totalSales - totalExpenses - totalPayouts]];
      await putValuesToSheet('Summary!A1', [summaryValues[0]]);
      await appendValuesToSheet('Summary!A2', summaryValues.slice(1));

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
      await putValuesToSheet('Summary!G1', cashHolderValues);

      toast.dismiss();
      toast.success('Saved to Google Sheets');
    } catch (error) {
      console.error('Save to Sheets error', error);
      toast.dismiss();
      toast.error(`Save failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const handleLoadAll = async () => {
    if (!accessToken) {
      toast.error('Connect to Google first');
      return;
    }

    try {
      toast.loading('Loading from Google Sheets...');
      const salesRes = await getValuesFromSheet('Sales!A1:Z');
      const expensesRes = await getValuesFromSheet('Expenses!A1:Z');
      const payoutsRes = await getValuesFromSheet('Payouts!A1:Z');

      console.log('Sales sheet:', salesRes);
      console.log('Expenses sheet:', expensesRes);
      console.log('Payouts sheet:', payoutsRes);

      toast.dismiss();
      toast.success('Loaded sheets data (see console). You can implement parsing into app storage if desired.');
    } catch (error) {
      console.error('Load from Sheets error', error);
      toast.dismiss();
      toast.error(`Load failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  return (
    <>
      {isLoadingScript ? (
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Loading Google SDK...</span>
        </button>
      ) : accessToken ? (
        <>
          <button onClick={handleSaveAll} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
            <span className="text-sm">Save to Sheets</span>
          </button>
          <button onClick={handleLoadAll} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
            <span className="text-sm">Load from Sheets</span>
          </button>
          <button onClick={disconnect} className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100">
            <span className="text-sm">Disconnect</span>
          </button>
        </>
      ) : (
        <>
          <button onClick={connect} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <span className="text-sm">Connect Google (Client-side)</span>
          </button>

          <button onClick={openServerOAuth} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <span className="text-sm">Connect (Server-side OAuth)</span>
          </button>

          <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${sheetId}`, '_blank')} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
            <span className="text-sm">Open Sheet</span>
          </button>

          <button onClick={serverSync} className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">
            <span className="text-sm">Server Sync (use stored refresh token)</span>
          </button>
        </>
      )}
    </>
  );
}

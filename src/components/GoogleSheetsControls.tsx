'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DailySales, Transaction } from '@/types';
import { formatDate } from '@/lib/utils';

interface Props {
  sales: DailySales[];
  transactions: Transaction[];
  month: number;
  year: number;
}

export function GoogleSheetsControls({ sales, transactions, month, year }: Props) {
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const tokenClientRef = useRef<any>(null);

  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const serverOauthAvailable = typeof window !== 'undefined';

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

  const checkServerStatus = async () => {
    try {
      const res = await fetch('/api/google/status');
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      return null;
    }
  };


  useEffect(() => {
    if (!clientId) return;
    if (typeof window === 'undefined') return;

    // Load GIS script if not already present
    if (!(window as any).google) {
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
    const client = (window as any).google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (resp: any) => {
        if (resp && resp.access_token) {
          setAccessToken(resp.access_token);
          toast.success('Connected to Google');
        } else {
          toast.error('Failed to obtain access token');
        }
      },
    });
    tokenClientRef.current = client;
    return client;
  };

  const connect = () => {
    if (!clientId) {
      toast.error('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
      return;
    }
    const client = ensureTokenClient();
    try {
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      console.error('Token request error', e);
      toast.error('Token request failed');
    }
  };

  const disconnect = () => {
    setAccessToken(null);
    toast('Disconnected from Google');
  };

  const buildValuesFromSales = (salesData: DailySales[]) => {
    const header = ['Date', 'Square Sales', 'Cash Collected', 'Total', 'Notes'];
    const rows = salesData.map(s => [formatDate(s.date), s.squareSales, s.cashCollected, (s.squareSales + s.cashCollected), s.notes || '']);
    return [header, ...rows];
  };

  const buildValuesFromTransactions = (txs: Transaction[], type: 'expense' | 'payout') => {
    if (type === 'expense') {
      const header = ['Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Spent By', 'Notes'];
      const rows = txs.filter(t => t.type === 'expense').map(e => [formatDate(e.date), e.category || '', e.amount, e.paymentMethod || '', e.description || '', e.spentBy || '', e.notes || '']);
      return [header, ...rows];
    }

    const header = ['Date', 'Payee', 'Amount', 'Purpose', 'Payment Method', 'Notes'];
    const rows = txs.filter(t => t.type === 'payout').map(p => [formatDate(p.date), p.payeeName || '', p.amount, p.purpose || '', p.paymentMethod || '', p.notes || '']);
    return [header, ...rows];
  };

  const putValuesToSheet = async (range: string, values: any[][]) => {
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
      const salesValues = buildValuesFromSales(sales);
      await putValuesToSheet('Sales!A1', salesValues);

      const expenseValues = buildValuesFromTransactions(transactions, 'expense');
      await putValuesToSheet('Expenses!A1', expenseValues);

      const payoutsValues = buildValuesFromTransactions(transactions, 'payout');
      await putValuesToSheet('Payouts!A1', payoutsValues);

      // Summary sheet
      const summaryHeader = ['Month', 'Total Sales', 'Total Expenses', 'Total Payouts', 'Net Profit'];
      const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
      const totalSales = sales.reduce((s, v) => s + (v.squareSales + v.cashCollected), 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, e) => s + e.amount, 0);
      const totalPayouts = transactions.filter(t => t.type === 'payout').reduce((s, p) => s + p.amount, 0);
      const summaryValues = [summaryHeader, [monthName, totalSales, totalExpenses, totalPayouts, totalSales - totalExpenses - totalPayouts]];
      await putValuesToSheet('Summary!A1', summaryValues);

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

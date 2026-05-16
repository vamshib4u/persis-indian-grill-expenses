import { DailySales, Transaction, MonthlyReport } from '@/types';
import { endOfMonth, isWithinInterval } from 'date-fns';

export const generateMonthlyReport = (
  sales: DailySales[],
  transactions: Transaction[],
  month: number,
  year: number
): MonthlyReport => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);

  const monthSales = sales.filter(s =>
    isWithinInterval(parseDateOnly(s.date), { start: monthStart, end: monthEnd })
  );

  const monthTransactions = transactions.filter(t =>
    isWithinInterval(parseDateOnly(t.date), { start: monthStart, end: monthEnd })
  );

  const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
  const monthPayouts = monthTransactions.filter(t => t.type === 'payout');

  const totalSquareSales = monthSales.reduce((sum, s) => sum + s.squareSales, 0);
  const totalUnreportedCash = monthSales.reduce((sum, s) => sum + s.cashCollected, 0);
  const totalIncome = totalSquareSales + totalUnreportedCash;
  const totalExpensesAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPayoutsAmount = monthPayouts.reduce((sum, p) => sum + p.amount, 0);
  const netCash = totalIncome - totalExpensesAmount - totalPayoutsAmount;

  return {
    month: new Date(year, month).toLocaleString('default', { month: 'long' }),
    year,
    totalIncome,
    totalExpenses: totalExpensesAmount,
    totalPayouts: totalPayoutsAmount,
    netCash,
    squareSales: totalSquareSales,
    unreportedCash: totalUnreportedCash,
  };
};

type CsvValue = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvValue>;

export const exportToCSV = (data: CsvRow[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportToJSON = (data: unknown, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const toDateInputValue = (value?: Date | string): string => {
  if (!value) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateOnly = (value: Date | string): Date => {
  if (value instanceof Date) return value;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00)/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return new Date(value);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = parseDateOnly(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const exportSalesToJSON = (sales: DailySales[]) => {
  return sales.map(s => ({
    date: formatDate(s.date),
    squareSales: s.squareSales,
    cashCollected: s.cashCollected,
    total: s.squareSales + s.cashCollected,
    cashHolder: s.cashHolder,
    notes: s.notes,
  }));
};

export const exportTransactionsToJSON = (transactions: Transaction[], type?: 'expense' | 'payout') => {
  const filtered = type ? transactions.filter(t => t.type === type) : transactions;
  return filtered.map(t => ({
    date: formatDate(t.date),
    type: t.type,
    category: t.category,
    description: t.description,
    payeeName: t.payeeName,
    purpose: t.purpose,
    amount: t.amount,
    paymentMethod: t.paymentMethod,
    spentBy: t.spentBy,
    notes: t.notes,
  }));
};

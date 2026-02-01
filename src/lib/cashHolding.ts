import { DailySales, Transaction } from '@/types';

export const CASH_HOLDERS = ['Vamshi', 'Raghu', 'Naresh', 'Nikki', 'Meenu', 'Pradeep'];

export type CashHoldingRow = {
  name: string;
  opening: number;
  collected: number;
  expenses: number;
  closing: number;
};

export type CashHoldingSummary = {
  rows: CashHoldingRow[];
  totals: CashHoldingRow;
};

const normalizeHolder = (value: string | undefined | null) => {
  const trimmed = (value || '').trim();
  return trimmed ? trimmed : 'Unassigned';
};

const toMonthKey = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
};

const buildMonthStart = (year: number, month: number) => new Date(year, month, 1);

const addMonths = (date: Date, count: number) => new Date(date.getFullYear(), date.getMonth() + count, 1);

const addToBucket = (map: Map<string, Map<string, number>>, monthKey: string, holder: string, amount: number) => {
  const byHolder = map.get(monthKey) || new Map<string, number>();
  byHolder.set(holder, (byHolder.get(holder) || 0) + amount);
  map.set(monthKey, byHolder);
};

const sortHolders = (holders: Set<string>) => {
  const ordered: string[] = [];
  CASH_HOLDERS.forEach(h => {
    if (holders.has(h)) ordered.push(h);
  });
  const remaining = Array.from(holders).filter(h => !ordered.includes(h)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...remaining];
};

export const getCashHoldingSummary = (
  sales: DailySales[],
  transactions: Transaction[],
  month: number,
  year: number
): CashHoldingSummary => {
  const holders = new Set<string>(CASH_HOLDERS);
  sales.forEach(s => holders.add(normalizeHolder(s.cashHolder)));
  transactions.forEach(t => {
    if (t.type === 'expense' && t.paymentMethod === 'cash') {
      holders.add(normalizeHolder(t.spentBy));
    }
  });

  const salesByMonth = new Map<string, Map<string, number>>();
  const expensesByMonth = new Map<string, Map<string, number>>();

  sales.forEach(s => {
    const monthKey = toMonthKey(new Date(s.date));
    const holder = normalizeHolder(s.cashHolder);
    addToBucket(salesByMonth, monthKey, holder, s.cashCollected || 0);
  });

  transactions.forEach(t => {
    if (t.type !== 'expense' || t.paymentMethod !== 'cash') return;
    const monthKey = toMonthKey(new Date(t.date));
    const holder = normalizeHolder(t.spentBy);
    addToBucket(expensesByMonth, monthKey, holder, t.amount || 0);
  });

  const allDates = [
    ...sales.map(s => new Date(s.date)),
    ...transactions.map(t => new Date(t.date)),
  ].filter(d => !Number.isNaN(d.getTime()));

  const targetMonthStart = buildMonthStart(year, month);
  if (!allDates.length) {
    const emptyRows = sortHolders(holders).map(name => ({
      name,
      opening: 0,
      collected: 0,
      expenses: 0,
      closing: 0,
    }));
    return {
      rows: emptyRows,
      totals: {
        name: 'Total',
        opening: 0,
        collected: 0,
        expenses: 0,
        closing: 0,
      },
    };
  }

  const minDate = allDates.reduce((min, d) => (d < min ? d : min), allDates[0]);
  const startMonth = buildMonthStart(minDate.getFullYear(), minDate.getMonth());

  const orderedHolders = sortHolders(holders);
  const running = new Map<string, number>();
  orderedHolders.forEach(h => running.set(h, 0));

  let current = startMonth;
  let targetRows: CashHoldingRow[] = [];

  while (current <= targetMonthStart) {
    const monthKey = toMonthKey(current);
    const salesForMonth = salesByMonth.get(monthKey) || new Map<string, number>();
    const expensesForMonth = expensesByMonth.get(monthKey) || new Map<string, number>();

    const rows = orderedHolders.map(name => {
      const opening = running.get(name) || 0;
      const collected = salesForMonth.get(name) || 0;
      const expenses = expensesForMonth.get(name) || 0;
      const closing = opening + collected - expenses;
      running.set(name, closing);
      return { name, opening, collected, expenses, closing };
    });

    if (current.getTime() === targetMonthStart.getTime()) {
      targetRows = rows;
      break;
    }

    current = addMonths(current, 1);
  }

  const totals = targetRows.reduce(
    (acc, row) => {
      acc.opening += row.opening;
      acc.collected += row.collected;
      acc.expenses += row.expenses;
      acc.closing += row.closing;
      return acc;
    },
    { name: 'Total', opening: 0, collected: 0, expenses: 0, closing: 0 }
  );

  return { rows: targetRows, totals };
};

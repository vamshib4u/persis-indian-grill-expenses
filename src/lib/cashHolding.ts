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

export const getCashHoldingYearSnapshot = (
  sales: DailySales[],
  transactions: Transaction[],
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

  const orderedHolders = sortHolders(holders);
  const emptyRows = orderedHolders.map(name => ({
    name,
    opening: 0,
    collected: 0,
    expenses: 0,
    closing: 0,
  }));

  if (!allDates.length) {
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
  const targetStart = buildMonthStart(year, 0);
  const targetEnd = buildMonthStart(year, 11);
  const startMonth = minDate < targetStart ? buildMonthStart(minDate.getFullYear(), minDate.getMonth()) : targetStart;

  const running = new Map<string, number>();
  orderedHolders.forEach(h => running.set(h, 0));

  const openingMap = new Map<string, number>();
  const closingMap = new Map<string, number>();
  const collectedTotals = new Map<string, number>();
  const expenseTotals = new Map<string, number>();
  orderedHolders.forEach(h => {
    collectedTotals.set(h, 0);
    expenseTotals.set(h, 0);
  });

  let current = startMonth;
  while (current <= targetEnd) {
    const monthKey = toMonthKey(current);
    const salesForMonth = salesByMonth.get(monthKey) || new Map<string, number>();
    const expensesForMonth = expensesByMonth.get(monthKey) || new Map<string, number>();

    if (current.getTime() === targetStart.getTime()) {
      orderedHolders.forEach(name => {
        openingMap.set(name, running.get(name) || 0);
      });
    }

    orderedHolders.forEach(name => {
      const opening = running.get(name) || 0;
      const collected = salesForMonth.get(name) || 0;
      const expenses = expensesForMonth.get(name) || 0;
      const closing = opening + collected - expenses;
      running.set(name, closing);
      if (current.getFullYear() === year) {
        collectedTotals.set(name, (collectedTotals.get(name) || 0) + collected);
        expenseTotals.set(name, (expenseTotals.get(name) || 0) + expenses);
      }
    });

    if (current.getTime() === targetEnd.getTime()) {
      orderedHolders.forEach(name => {
        closingMap.set(name, running.get(name) || 0);
      });
      break;
    }

    current = addMonths(current, 1);
  }

  const rows = orderedHolders.map(name => ({
    name,
    opening: openingMap.get(name) || 0,
    collected: collectedTotals.get(name) || 0,
    expenses: expenseTotals.get(name) || 0,
    closing: closingMap.get(name) || 0,
  }));

  const totals = rows.reduce(
    (acc, row) => {
      acc.opening += row.opening;
      acc.collected += row.collected;
      acc.expenses += row.expenses;
      acc.closing += row.closing;
      return acc;
    },
    { name: 'Total', opening: 0, collected: 0, expenses: 0, closing: 0 }
  );

  return { rows, totals };
};

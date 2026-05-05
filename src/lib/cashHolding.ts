import { CashHolderConfig, CateringOrder, DailySales, Transaction } from '@/types';

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

const buildOrderedHolders = (
  cashHolders: CashHolderConfig[],
  sales: DailySales[],
  transactions: Transaction[],
  cateringOrders: CateringOrder[]
) => {
  const orderedFromAdmin = cashHolders.filter((holder) => holder.active).map((holder) => holder.name);
  const holderSet = new Set<string>(orderedFromAdmin);

  sales.forEach((sale) => holderSet.add(normalizeHolder(sale.cashHolder)));
  transactions.forEach((transaction) => {
    if (transaction.type === 'expense' && transaction.paymentMethod === 'cash') {
      holderSet.add(normalizeHolder(transaction.spentBy));
    }
  });
  cateringOrders.forEach((order) => {
    if (order.depositAmount > 0) holderSet.add(normalizeHolder(order.depositCashHolder));
    if (order.finalPaymentAmount > 0) holderSet.add(normalizeHolder(order.finalPaymentCashHolder));
  });

  const remaining = Array.from(holderSet)
    .filter((holder) => !orderedFromAdmin.includes(holder))
    .sort((a, b) => a.localeCompare(b));

  return [...orderedFromAdmin, ...remaining];
};

const buildStartingAmounts = (cashHolders: CashHolderConfig[]) => {
  const map = new Map<string, number>();
  cashHolders.forEach((holder) => {
    map.set(holder.name, holder.startingAmount);
  });
  return map;
};

export const getCashHoldingSummary = (
  cashHolders: CashHolderConfig[],
  sales: DailySales[],
  transactions: Transaction[],
  cateringOrders: CateringOrder[],
  month: number,
  year: number
): CashHoldingSummary => {
  const orderedHolders = buildOrderedHolders(cashHolders, sales, transactions, cateringOrders);
  const configuredStartingAmounts = buildStartingAmounts(cashHolders);
  const salesByMonth = new Map<string, Map<string, number>>();
  const expensesByMonth = new Map<string, Map<string, number>>();
  const cateringByMonth = new Map<string, Map<string, number>>();

  sales.forEach((sale) => {
    addToBucket(salesByMonth, toMonthKey(new Date(sale.date)), normalizeHolder(sale.cashHolder), sale.cashCollected || 0);
  });

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense' || transaction.paymentMethod !== 'cash') return;
    addToBucket(
      expensesByMonth,
      toMonthKey(new Date(transaction.date)),
      normalizeHolder(transaction.spentBy),
      transaction.amount || 0
    );
  });

  cateringOrders.forEach((order) => {
    if (order.depositAmount > 0 && order.depositCashHolder) {
      addToBucket(
        cateringByMonth,
        toMonthKey(new Date(order.depositPaidDate || order.readyAt)),
        normalizeHolder(order.depositCashHolder),
        order.depositAmount || 0
      );
    }
    if (order.finalPaymentAmount > 0 && order.finalPaymentCashHolder) {
      addToBucket(
        cateringByMonth,
        toMonthKey(new Date(order.finalPaymentDate || order.readyAt)),
        normalizeHolder(order.finalPaymentCashHolder),
        order.finalPaymentAmount || 0
      );
    }
  });

  const allDates = [
    ...sales.map((sale) => new Date(sale.date)),
    ...transactions.map((transaction) => new Date(transaction.date)),
    ...cateringOrders.map((order) => new Date(order.readyAt)),
    ...cateringOrders
      .flatMap((order) => [order.depositPaidDate, order.finalPaymentDate])
      .filter(Boolean)
      .map((value) => new Date(value as Date | string)),
  ].filter((date) => !Number.isNaN(date.getTime()));

  const targetMonthStart = buildMonthStart(year, month);
  if (!allDates.length) {
    const rows = orderedHolders.map((name) => {
      const opening = configuredStartingAmounts.get(name) || 0;
      return { name, opening, collected: 0, expenses: 0, closing: opening };
    });
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
  }

  const minDate = allDates.reduce((min, date) => (date < min ? date : min), allDates[0]);
  const startMonth = buildMonthStart(minDate.getFullYear(), minDate.getMonth());
  const running = new Map<string, number>();
  orderedHolders.forEach((holder) => running.set(holder, configuredStartingAmounts.get(holder) || 0));

  let current = startMonth;
  let targetRows: CashHoldingRow[] = [];
  while (current <= targetMonthStart) {
    const monthKey = toMonthKey(current);
    const salesForMonth = salesByMonth.get(monthKey) || new Map<string, number>();
    const expensesForMonth = expensesByMonth.get(monthKey) || new Map<string, number>();
    const cateringForMonth = cateringByMonth.get(monthKey) || new Map<string, number>();

    const rows = orderedHolders.map((name) => {
      const opening = running.get(name) || 0;
      const collected = (salesForMonth.get(name) || 0) + (cateringForMonth.get(name) || 0);
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
  cashHolders: CashHolderConfig[],
  sales: DailySales[],
  transactions: Transaction[],
  cateringOrders: CateringOrder[],
  year: number
): CashHoldingSummary => {
  const orderedHolders = buildOrderedHolders(cashHolders, sales, transactions, cateringOrders);
  const configuredStartingAmounts = buildStartingAmounts(cashHolders);
  const summary = getCashHoldingSummary(cashHolders, sales, transactions, cateringOrders, 11, year);

  const salesByYear = new Map<string, number>();
  const expensesByYear = new Map<string, number>();
  const cateringByYear = new Map<string, number>();

  sales.forEach((sale) => {
    if (new Date(sale.date).getFullYear() !== year) return;
    const holder = normalizeHolder(sale.cashHolder);
    salesByYear.set(holder, (salesByYear.get(holder) || 0) + (sale.cashCollected || 0));
  });

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense' || transaction.paymentMethod !== 'cash') return;
    if (new Date(transaction.date).getFullYear() !== year) return;
    const holder = normalizeHolder(transaction.spentBy);
    expensesByYear.set(holder, (expensesByYear.get(holder) || 0) + (transaction.amount || 0));
  });

  cateringOrders.forEach((order) => {
    if (order.depositAmount > 0 && order.depositCashHolder) {
      const paidYear = new Date(order.depositPaidDate || order.readyAt).getFullYear();
      if (paidYear === year) {
        const holder = normalizeHolder(order.depositCashHolder);
        cateringByYear.set(holder, (cateringByYear.get(holder) || 0) + (order.depositAmount || 0));
      }
    }
    if (order.finalPaymentAmount > 0 && order.finalPaymentCashHolder) {
      const paidYear = new Date(order.finalPaymentDate || order.readyAt).getFullYear();
      if (paidYear === year) {
        const holder = normalizeHolder(order.finalPaymentCashHolder);
        cateringByYear.set(holder, (cateringByYear.get(holder) || 0) + (order.finalPaymentAmount || 0));
      }
    }
  });

  const rows = orderedHolders.map((name) => ({
    name,
    opening: configuredStartingAmounts.get(name) || 0,
    collected: (salesByYear.get(name) || 0) + (cateringByYear.get(name) || 0),
    expenses: expensesByYear.get(name) || 0,
    closing: summary.rows.find((row) => row.name === name)?.closing ?? (configuredStartingAmounts.get(name) || 0),
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

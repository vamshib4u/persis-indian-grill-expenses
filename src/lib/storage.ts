import { DailySales, Transaction } from '@/types';

const STORAGE_KEYS = {
  SALES: 'persis_sales_data',
  TRANSACTIONS: 'persis_transactions_data',
};

const STORAGE_EVENT = 'persis-storage-change';
let storageVersion = 0;

export const getStorageVersion = () => storageVersion;

export const subscribeToStorage = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

const notifyChange = () => {
  if (typeof window === 'undefined') return;
  storageVersion += 1;
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

export const storage = {
  // Sales operations
  getSales: (): DailySales[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },

  setSales: (sales: DailySales[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    notifyChange();
  },

  addSale: (sale: DailySales): void => {
    if (typeof window === 'undefined') return;
    const sales = storage.getSales();
    sales.push(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    notifyChange();
  },

  updateSale: (id: string, updates: Partial<DailySales>): void => {
    if (typeof window === 'undefined') return;
    const sales = storage.getSales();
    const index = sales.findIndex(s => s.id === id);
    if (index !== -1) {
      sales[index] = { ...sales[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      notifyChange();
    }
  },

  deleteSale: (id: string): void => {
    if (typeof window === 'undefined') return;
    const sales = storage.getSales().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    notifyChange();
  },

  // Transactions operations (combined expenses and payouts)
  getTransactions: (): Transaction[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  setTransactions: (transactions: Transaction[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    notifyChange();
  },

  addTransaction: (transaction: Transaction): void => {
    if (typeof window === 'undefined') return;
    const transactions = storage.getTransactions();
    transactions.push(transaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    notifyChange();
  },

  updateTransaction: (id: string, updates: Partial<Transaction>): void => {
    if (typeof window === 'undefined') return;
    const transactions = storage.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      notifyChange();
    }
  },

  deleteTransaction: (id: string): void => {
    if (typeof window === 'undefined') return;
    const transactions = storage.getTransactions().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    notifyChange();
  },

  // Backward compatibility - keep old methods pointing to new unified system
  getExpenses: (): Transaction[] => {
    return storage.getTransactions().filter(t => t.type === 'expense');
  },

  addExpense: (expense: Transaction): void => {
    const transaction: Transaction = {
      ...expense,
      type: 'expense',
    };
    storage.addTransaction(transaction);
  },

  updateExpense: (id: string, updates: Partial<Transaction>): void => {
    storage.updateTransaction(id, updates);
  },

  deleteExpense: (id: string): void => {
    storage.deleteTransaction(id);
  },

  getPayouts: (): Transaction[] => {
    return storage.getTransactions().filter(t => t.type === 'payout');
  },

  addPayout: (payout: Transaction): void => {
    const transaction: Transaction = {
      id: payout.id,
      date: payout.date,
      type: 'payout',
      category: 'Payout',
      amount: payout.amount,
      description: payout.purpose || '',
      paymentMethod: 'cash',
      payeeName: payout.payeeName,
      purpose: payout.purpose,
      notes: payout.notes,
      createdAt: payout.createdAt,
    };
    storage.addTransaction(transaction);
  },

  updatePayout: (id: string, updates: Partial<Transaction>): void => {
    storage.updateTransaction(id, updates);
  },

  deletePayout: (id: string): void => {
    storage.deleteTransaction(id);
  },

  // Clear all data
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    notifyChange();
  },
};

import {
  CashHolderConfig,
  CateringOrder,
  DailySales,
  SessionData,
  Transaction,
} from '@/types';
import { setPostgresStatus } from '@/lib/persistenceStatus';

type BootstrapPayload = {
  sales: DailySales[];
  transactions: Transaction[];
  cateringOrders: CateringOrder[];
  cashHolders: CashHolderConfig[];
  session: SessionData;
};

const STORAGE_EVENT = 'persis-storage-change';

let salesCache: DailySales[] = [];
let transactionsCache: Transaction[] = [];
let cateringOrdersCache: CateringOrder[] = [];
let cashHoldersCache: CashHolderConfig[] = [];
let sessionCache: SessionData | null = null;
let storageVersion = 0;
let initialized = false;
let loading = false;
let loadPromise: Promise<void> | null = null;

export const getStorageVersion = () => storageVersion;
export const isStorageLoaded = () => initialized;
export const isStorageLoading = () => loading;

export const subscribeToStorage = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(STORAGE_EVENT, handler);
  return () => window.removeEventListener(STORAGE_EVENT, handler);
};

const notifyChange = () => {
  if (typeof window === 'undefined') return;
  storageVersion += 1;
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

const request = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {
      // ignore invalid json
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const replaceCache = (payload: BootstrapPayload) => {
  salesCache = payload.sales;
  transactionsCache = payload.transactions;
  cateringOrdersCache = payload.cateringOrders;
  cashHoldersCache = payload.cashHolders;
  sessionCache = payload.session;
  initialized = true;
  notifyChange();
};

const getActiveRestaurantId = () => {
  if (!sessionCache) {
    throw new Error('Session is not loaded');
  }
  return sessionCache.activeRestaurantId;
};

export const storage = {
  async load(force = false) {
    if (typeof window === 'undefined') return;
    if (loadPromise && !force) return loadPromise;
    if (initialized && !force) return;

    loading = true;
    setPostgresStatus('loading', 'Loading from Postgres');
    notifyChange();

    loadPromise = request<BootstrapPayload>('/api/bootstrap')
      .then((payload) => {
        replaceCache(payload);
        setPostgresStatus('saved', 'Connected to Postgres');
      })
      .finally(() => {
        loading = false;
        loadPromise = null;
        notifyChange();
      });

    return loadPromise;
  },

  getSales: () => salesCache,
  getTransactions: () => transactionsCache,
  getCateringOrders: () => cateringOrdersCache,
  getCashHolders: () => cashHoldersCache,
  getSession: () => sessionCache,
  getActiveRestaurant: () => {
    const session = sessionCache;
    if (!session) return null;
    return session.restaurants.find((restaurant) => restaurant.id === session.activeRestaurantId) || null;
  },

  async switchRestaurant(restaurantId: string) {
    const payload = await request<{ session: SessionData }>('/api/auth/session', {
      method: 'PATCH',
      body: JSON.stringify({ restaurantId }),
    });
    sessionCache = payload.session;
    notifyChange();
    await storage.load(true);
  },

  async addSale(sale: DailySales) {
    const snapshot = salesCache;
    const nextSale = { ...sale, restaurantId: getActiveRestaurantId() };
    salesCache = [...salesCache, nextSale];
    notifyChange();

    try {
      setPostgresStatus('loading', 'Saving to Postgres');
      const payload = await request<{ sale: DailySales }>('/api/sales', {
        method: 'POST',
        body: JSON.stringify(nextSale),
      });
      salesCache = salesCache.map((entry) => (entry.id === nextSale.id ? payload.sale : entry));
      initialized = true;
      setPostgresStatus('saved', 'Saved to Postgres');
      notifyChange();
    } catch (error) {
      salesCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to save to Postgres');
      notifyChange();
      throw error;
    }
  },

  async updateSale(id: string, updates: DailySales) {
    const snapshot = salesCache;
    const nextSale = { ...updates, restaurantId: getActiveRestaurantId() };
    salesCache = salesCache.map((sale) => (sale.id === id ? nextSale : sale));
    notifyChange();

    try {
      setPostgresStatus('loading', 'Saving to Postgres');
      const payload = await request<{ sale: DailySales }>('/api/sales', {
        method: 'PUT',
        body: JSON.stringify(nextSale),
      });
      salesCache = salesCache.map((sale) => (sale.id === id ? payload.sale : sale));
      setPostgresStatus('saved', 'Saved to Postgres');
      notifyChange();
    } catch (error) {
      salesCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to save to Postgres');
      notifyChange();
      throw error;
    }
  },

  async deleteSale(id: string) {
    const snapshot = salesCache;
    salesCache = salesCache.filter((sale) => sale.id !== id);
    notifyChange();

    try {
      setPostgresStatus('loading', 'Deleting from Postgres');
      await request(
        `/api/sales?id=${encodeURIComponent(id)}&restaurantId=${encodeURIComponent(getActiveRestaurantId())}`,
        { method: 'DELETE' }
      );
      setPostgresStatus('saved', 'Saved to Postgres');
    } catch (error) {
      salesCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to delete from Postgres');
      notifyChange();
      throw error;
    }
  },

  async addTransaction(transaction: Transaction) {
    const snapshot = transactionsCache;
    const nextTransaction = { ...transaction, restaurantId: getActiveRestaurantId() };
    transactionsCache = [...transactionsCache, nextTransaction];
    notifyChange();

    try {
      setPostgresStatus('loading', 'Saving to Postgres');
      const payload = await request<{ transaction: Transaction }>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(nextTransaction),
      });
      transactionsCache = transactionsCache.map((entry) =>
        entry.id === nextTransaction.id ? payload.transaction : entry
      );
      initialized = true;
      setPostgresStatus('saved', 'Saved to Postgres');
      notifyChange();
    } catch (error) {
      transactionsCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to save to Postgres');
      notifyChange();
      throw error;
    }
  },

  async updateTransaction(id: string, updates: Transaction) {
    const snapshot = transactionsCache;
    const nextTransaction = { ...updates, restaurantId: getActiveRestaurantId() };
    transactionsCache = transactionsCache.map((transaction) =>
      transaction.id === id ? nextTransaction : transaction
    );
    notifyChange();

    try {
      setPostgresStatus('loading', 'Saving to Postgres');
      const payload = await request<{ transaction: Transaction }>('/api/transactions', {
        method: 'PUT',
        body: JSON.stringify(nextTransaction),
      });
      transactionsCache = transactionsCache.map((transaction) =>
        transaction.id === id ? payload.transaction : transaction
      );
      setPostgresStatus('saved', 'Saved to Postgres');
      notifyChange();
    } catch (error) {
      transactionsCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to save to Postgres');
      notifyChange();
      throw error;
    }
  },

  async deleteTransaction(id: string) {
    const snapshot = transactionsCache;
    transactionsCache = transactionsCache.filter((transaction) => transaction.id !== id);
    notifyChange();

    try {
      setPostgresStatus('loading', 'Deleting from Postgres');
      await request(
        `/api/transactions?id=${encodeURIComponent(id)}&restaurantId=${encodeURIComponent(getActiveRestaurantId())}`,
        { method: 'DELETE' }
      );
      setPostgresStatus('saved', 'Saved to Postgres');
    } catch (error) {
      transactionsCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to delete from Postgres');
      notifyChange();
      throw error;
    }
  },

  getExpenses: () => transactionsCache.filter((transaction) => transaction.type === 'expense'),

  addExpense: async (expense: Transaction) => {
    await storage.addTransaction({ ...expense, type: 'expense' });
  },

  updateExpense: async (id: string, updates: Transaction) => {
    await storage.updateTransaction(id, { ...updates, type: 'expense' });
  },

  deleteExpense: async (id: string) => {
    await storage.deleteTransaction(id);
  },

  getPayouts: () => transactionsCache.filter((transaction) => transaction.type === 'payout'),

  addPayout: async (payout: Transaction) => {
    await storage.addTransaction({
      ...payout,
      type: 'payout',
      category: payout.category || 'Payout',
      paymentMethod: payout.paymentMethod || 'cash',
      description: payout.description || '',
    });
  },

  updatePayout: async (id: string, updates: Transaction) => {
    await storage.updateTransaction(id, {
      ...updates,
      type: 'payout',
      category: updates.category || 'Payout',
      paymentMethod: updates.paymentMethod || 'cash',
      description: updates.description || '',
    });
  },

  deletePayout: async (id: string) => {
    await storage.deleteTransaction(id);
  },

  async addCateringOrder(cateringOrder: CateringOrder) {
    const snapshot = cateringOrdersCache;
    const nextOrder = { ...cateringOrder, restaurantId: getActiveRestaurantId() };
    cateringOrdersCache = [...cateringOrdersCache, nextOrder];
    notifyChange();

    try {
      setPostgresStatus('loading', 'Saving to Postgres');
      const payload = await request<{ cateringOrder: CateringOrder }>('/api/catering', {
        method: 'POST',
        body: JSON.stringify(nextOrder),
      });
      cateringOrdersCache = cateringOrdersCache.map((entry) =>
        entry.id === nextOrder.id ? payload.cateringOrder : entry
      );
      initialized = true;
      setPostgresStatus('saved', 'Saved to Postgres');
      notifyChange();
    } catch (error) {
      cateringOrdersCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to save to Postgres');
      notifyChange();
      throw error;
    }
  },

  async updateCateringOrder(id: string, updates: CateringOrder) {
    const snapshot = cateringOrdersCache;
    const nextOrder = { ...updates, restaurantId: getActiveRestaurantId() };
    cateringOrdersCache = cateringOrdersCache.map((order) => (order.id === id ? nextOrder : order));
    notifyChange();

    try {
      setPostgresStatus('loading', 'Saving to Postgres');
      const payload = await request<{ cateringOrder: CateringOrder }>('/api/catering', {
        method: 'PUT',
        body: JSON.stringify(nextOrder),
      });
      cateringOrdersCache = cateringOrdersCache.map((order) =>
        order.id === id ? payload.cateringOrder : order
      );
      setPostgresStatus('saved', 'Saved to Postgres');
      notifyChange();
    } catch (error) {
      cateringOrdersCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to save to Postgres');
      notifyChange();
      throw error;
    }
  },

  async deleteCateringOrder(id: string) {
    const snapshot = cateringOrdersCache;
    cateringOrdersCache = cateringOrdersCache.filter((order) => order.id !== id);
    notifyChange();

    try {
      setPostgresStatus('loading', 'Deleting from Postgres');
      await request(
        `/api/catering?id=${encodeURIComponent(id)}&restaurantId=${encodeURIComponent(getActiveRestaurantId())}`,
        { method: 'DELETE' }
      );
      setPostgresStatus('saved', 'Saved to Postgres');
    } catch (error) {
      cateringOrdersCache = snapshot;
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to delete from Postgres');
      notifyChange();
      throw error;
    }
  },

  async replaceAll(payload: {
    sales: DailySales[];
    transactions: Transaction[];
    cateringOrders: CateringOrder[];
  }) {
    const snapshot = {
      sales: salesCache,
      transactions: transactionsCache,
      cateringOrders: cateringOrdersCache,
      cashHolders: cashHoldersCache,
      session: sessionCache,
    };

    salesCache = payload.sales;
    transactionsCache = payload.transactions;
    cateringOrdersCache = payload.cateringOrders;
    notifyChange();

    try {
      setPostgresStatus('loading', 'Replacing Postgres data');
      const result = await request<BootstrapPayload>('/api/bootstrap', {
        method: 'PUT',
        body: JSON.stringify({
          ...payload,
          restaurantId: getActiveRestaurantId(),
        }),
      });
      replaceCache(result);
      setPostgresStatus('saved', 'Saved to Postgres');
    } catch (error) {
      salesCache = snapshot.sales;
      transactionsCache = snapshot.transactions;
      cateringOrdersCache = snapshot.cateringOrders;
      cashHoldersCache = snapshot.cashHolders;
      sessionCache = snapshot.session;
      notifyChange();
      setPostgresStatus('error', error instanceof Error ? error.message : 'Failed to replace Postgres data');
      throw error;
    }
  },

  clearAll: async () => {
    await storage.replaceAll({ sales: [], transactions: [], cateringOrders: [] });
  },
};

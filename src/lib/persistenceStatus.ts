export type PostgresStatus = 'idle' | 'loading' | 'saved' | 'error';
export type SheetsStatus = 'unknown' | 'disabled' | 'connected' | 'synced' | 'not_connected' | 'error';

export type PersistenceStatusState = {
  postgres: PostgresStatus;
  sheets: SheetsStatus;
  postgresMessage: string;
  sheetsMessage: string;
};

const STATUS_EVENT = 'persis-persistence-status-change';

let state: PersistenceStatusState = {
  postgres: 'idle',
  sheets: 'unknown',
  postgresMessage: 'Waiting for database activity',
  sheetsMessage: 'Checking Google Sheets status',
};

const notify = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(STATUS_EVENT));
};

export const getPersistenceStatus = () => state;

export const subscribeToPersistenceStatus = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STATUS_EVENT, callback);
  return () => window.removeEventListener(STATUS_EVENT, callback);
};

export const setPostgresStatus = (postgres: PostgresStatus, postgresMessage: string) => {
  state = { ...state, postgres, postgresMessage };
  notify();
};

export const setSheetsStatus = (sheets: SheetsStatus, sheetsMessage: string) => {
  state = { ...state, sheets, sheetsMessage };
  notify();
};

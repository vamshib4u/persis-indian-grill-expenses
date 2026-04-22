'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Database, CheckCircle2, AlertTriangle, Link2, RefreshCw } from 'lucide-react';
import {
  getPersistenceStatus,
  setSheetsStatus,
  subscribeToPersistenceStatus,
} from '@/lib/persistenceStatus';

type GoogleStatusResponse = {
  authorized: boolean;
};

const badgeClasses = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  neutral: 'bg-slate-50 text-slate-800 border-slate-200',
};

export const PersistenceStatusCard = () => {
  const status = useSyncExternalStore(
    subscribeToPersistenceStatus,
    getPersistenceStatus,
    getPersistenceStatus
  );

  useEffect(() => {
    const checkSheetsStatus = async () => {
      if (!process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID) {
        setSheetsStatus('disabled', 'Google Sheets not configured');
        return;
      }

      try {
        const response = await fetch('/api/google/status', { cache: 'no-store' });
        if (!response.ok) {
          setSheetsStatus('error', 'Could not verify Google Sheets connection');
          return;
        }

        const payload = (await response.json()) as GoogleStatusResponse;
        if (payload.authorized) {
          setSheetsStatus('connected', 'Google Sheets connected and ready');
          return;
        }

        setSheetsStatus('not_connected', 'Postgres saved, Sheets not linked');
      } catch {
        setSheetsStatus('error', 'Could not verify Google Sheets connection');
      }
    };

    void checkSheetsStatus();
  }, []);

  const postgresTone =
    status.postgres === 'saved'
      ? badgeClasses.success
      : status.postgres === 'error'
        ? badgeClasses.error
        : badgeClasses.neutral;

  const sheetsTone =
    status.sheets === 'synced' || status.sheets === 'connected'
      ? badgeClasses.success
      : status.sheets === 'error'
        ? badgeClasses.error
        : status.sheets === 'not_connected' || status.sheets === 'disabled'
          ? badgeClasses.warning
          : badgeClasses.neutral;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">
            Persistence Status
          </p>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">Save and Sync Health</h3>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${postgresTone}`}>
            {status.postgres === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
            <span>{status.postgresMessage}</span>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${sheetsTone}`}>
            {status.sheets === 'synced' || status.sheets === 'connected' ? (
              <CheckCircle2 size={16} />
            ) : status.sheets === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <Link2 size={16} />
            )}
            <span>{status.sheetsMessage}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

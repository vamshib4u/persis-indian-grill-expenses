'use client';

import { useSyncExternalStore } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { getPersistenceStatus, subscribeToPersistenceStatus } from '@/lib/persistenceStatus';

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

  const postgresTone =
    status.postgres === 'saved'
      ? badgeClasses.success
      : status.postgres === 'error'
        ? badgeClasses.error
        : badgeClasses.neutral;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">
            Persistence Status
          </p>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">Database Health</h3>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${postgresTone}`}>
          {status.postgres === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
          <span>{status.postgresMessage}</span>
        </div>
      </div>
    </div>
  );
};

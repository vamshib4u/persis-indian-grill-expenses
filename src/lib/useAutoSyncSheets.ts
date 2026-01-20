'use client';

import { useEffect, useRef } from 'react';
import { DailySales, Transaction } from '@/types';

type SyncState = {
  inFlight: boolean;
  pending: boolean;
};

export const useAutoSyncSheets = (
  sales: DailySales[],
  transactions: Transaction[],
  month: number,
  year: number
) => {
  const syncState = useRef<SyncState>({ inFlight: false, pending: false });

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID) return;

    const runSync = async () => {
      const state = syncState.current;
      if (state.inFlight) {
        state.pending = true;
        return;
      }

      state.inFlight = true;
      do {
        state.pending = false;
        try {
          await fetch('/api/google/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sales, transactions, month, year }),
          });
        } catch {
          // Ignore auto-sync failures to avoid blocking UI
        }
      } while (state.pending);
      state.inFlight = false;
    };

    void runSync();
  }, [sales, transactions, month, year]);
};

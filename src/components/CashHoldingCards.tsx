'use client';

import { useMemo } from 'react';
import { DailySales, Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getCashHoldingSummary } from '@/lib/cashHolding';

interface CashHoldingCardsProps {
  sales: DailySales[];
  transactions: Transaction[];
  month: number;
  year: number;
  title?: string;
}

export const CashHoldingCards = ({
  sales,
  transactions,
  month,
  year,
  title = 'Cash Holding By Person',
}: CashHoldingCardsProps) => {
  const summary = useMemo(
    () => getCashHoldingSummary(sales, transactions, month, year),
    [sales, transactions, month, year]
  );

  if (!summary.rows.length) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summary.rows.map(row => (
          <div key={row.name} className="border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-gray-600">{row.name}</p>
            <p className="text-xl font-bold text-gray-900 mt-2">
              {formatCurrency(row.closing)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Carry-forward included</p>
          </div>
        ))}
      </div>
    </div>
  );
};

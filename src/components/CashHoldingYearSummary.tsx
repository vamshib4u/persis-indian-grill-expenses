'use client';

import { useMemo } from 'react';
import { DailySales, Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getCashHoldingYearSnapshot } from '@/lib/cashHolding';

interface CashHoldingYearSummaryProps {
  sales: DailySales[];
  transactions: Transaction[];
  year: number;
  title?: string;
}

export const CashHoldingYearSummary = ({
  sales,
  transactions,
  year,
  title = 'Cash Holding Summary (Year)',
}: CashHoldingYearSummaryProps) => {
  const summary = useMemo(
    () => getCashHoldingYearSnapshot(sales, transactions, year),
    [sales, transactions, year]
  );

  if (!summary.rows.length) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">Opening is Jan carry-in; closing is Dec ending balance.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-800">Person</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Opening (Jan)</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Collected (Year)</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Expenses (Year)</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Closing (Dec)</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map(row => (
              <tr key={row.name} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900 font-medium">{row.name}</td>
                <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(row.opening)}</td>
                <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(row.collected)}</td>
                <td className="px-4 py-2 text-right text-red-600">{formatCurrency(row.expenses)}</td>
                <td className="px-4 py-2 text-right font-semibold text-gray-900">
                  {formatCurrency(row.closing)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">Total</td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(summary.totals.opening)}</td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(summary.totals.collected)}</td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(summary.totals.expenses)}</td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(summary.totals.closing)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

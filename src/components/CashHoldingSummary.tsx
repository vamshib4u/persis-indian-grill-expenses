'use client';

import { useMemo } from 'react';
import { DailySales, Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getCashHoldingSummary } from '@/lib/cashHolding';

interface CashHoldingSummaryProps {
  sales: DailySales[];
  transactions: Transaction[];
  month: number;
  year: number;
  title?: string;
}

export const CashHoldingSummary = ({
  sales,
  transactions,
  month,
  year,
  title = 'Cash Holding Summary',
}: CashHoldingSummaryProps) => {
  const summary = useMemo(
    () => getCashHoldingSummary(sales, transactions, month, year),
    [sales, transactions, month, year]
  );

  if (!summary.rows.length) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">Opening balance is carried forward from the previous month.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-800">Person</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Opening</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Cash Collected</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Cash Expenses</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-800">Closing</th>
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

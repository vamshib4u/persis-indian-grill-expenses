'use client';

import { Transaction } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Trash2, Edit2 } from 'lucide-react';

interface PayoutsListProps {
  payouts: Transaction[];
  onEdit: (payout: Transaction) => void;
  onDelete: (id: string) => void;
}

export const PayoutsList = ({ payouts, onEdit, onDelete }: PayoutsListProps) => {
  if (payouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No payouts recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Date</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Payee</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Purpose</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Amount</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Notes</th>
            <th className="px-4 py-2 text-center font-semibold text-gray-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map(payout => (
            <tr key={payout.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-900">{formatDate(payout.date)}</td>
              <td className="px-4 py-2 text-gray-900">{payout.payeeName}</td>
              <td className="px-4 py-2 text-gray-700">{payout.purpose}</td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(payout.amount)}</td>
              <td className="px-4 py-2 text-gray-700 text-sm">{payout.notes || '-'}</td>
              <td className="px-4 py-2 text-center space-x-2 flex justify-center">
                <button
                  onClick={() => onEdit(payout)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(payout.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 border-t-2 border-gray-300">
          <tr>
            <td colSpan={3} className="px-4 py-3 font-bold text-gray-900 text-right">
              TOTAL
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {formatCurrency(payouts.reduce((sum, p) => sum + p.amount, 0))}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

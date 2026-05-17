'use client';

import { Transaction } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowRightLeft, Trash2, Edit2 } from 'lucide-react';

interface TransactionsListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionsList = ({ transactions, onEdit, onDelete }: TransactionsListProps) => {
  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalTransfers = transactions
    .filter((transaction) => transaction.type === 'transfer')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Date</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Type</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Category/Payee</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Description</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Method</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Spent By</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Amount</th>
            <th className="px-4 py-2 text-center font-semibold text-gray-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-900">{formatDate(transaction.date)}</td>
              <td className="px-4 py-2">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                  transaction.type === 'expense'
                    ? 'bg-red-100 text-red-800'
                    : transaction.type === 'transfer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                }`}>
                  {transaction.type === 'expense' ? 'Expense' : transaction.type === 'transfer' ? 'Transfer' : 'Payout'}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-900 font-medium">
                {transaction.type === 'expense'
                  ? transaction.category
                  : transaction.type === 'transfer'
                    ? `${transaction.spentBy || '-'} to ${transaction.payeeName || '-'}`
                    : transaction.payeeName}
              </td>
              <td className="px-4 py-2 text-gray-700">
                {transaction.type === 'expense' ? transaction.description : transaction.purpose}
              </td>
              <td className="px-4 py-2 text-sm capitalize text-gray-800">
                {transaction.paymentMethod.replace('_', ' ')}
              </td>
              <td className="px-4 py-2 text-gray-900 font-medium">
                {transaction.type === 'transfer' ? (
                  <span className="inline-flex items-center gap-1">
                    {transaction.spentBy || '-'} <ArrowRightLeft size={14} /> {transaction.payeeName || '-'}
                  </span>
                ) : (
                  transaction.spentBy || '-'
                )}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                {formatCurrency(transaction.amount)}
              </td>
              <td className="px-4 py-2 text-center space-x-2 flex justify-center">
                <button
                  onClick={() => onEdit(transaction)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(transaction.id)}
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
            <td colSpan={6} className="px-4 py-3 font-bold text-gray-900 text-right">
              TOTAL EXPENSES
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {formatCurrency(totalExpenses)}
            </td>
            <td></td>
          </tr>
          {totalTransfers > 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-3 font-bold text-gray-900 text-right">
                TOTAL TRANSFERS
              </td>
              <td className="px-4 py-3 text-right font-bold text-blue-700">
                {formatCurrency(totalTransfers)}
              </td>
              <td></td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
};

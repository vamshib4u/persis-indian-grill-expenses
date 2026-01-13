'use client';

import { Transaction } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Trash2, Edit2 } from 'lucide-react';

interface ExpensesListProps {
  expenses: Transaction[];
  onEdit: (expense: Transaction) => void;
  onDelete: (id: string) => void;
}

export const ExpensesList = ({ expenses, onEdit, onDelete }: ExpensesListProps) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No expenses recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Date</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Category</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Description</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Method</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Spent By</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Amount</th>
            <th className="px-4 py-2 text-center font-semibold text-gray-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => (
            <tr key={expense.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-900">{formatDate(expense.date)}</td>
              <td className="px-4 py-2 text-gray-900">{expense.category}</td>
              <td className="px-4 py-2 text-gray-700">{expense.description}</td>
              <td className="px-4 py-2 text-sm capitalize text-gray-800">{expense.paymentMethod.replace('_', ' ')}</td>
              <td className="px-4 py-2 text-gray-900 font-medium">{expense.spentBy || '-'}</td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(expense.amount)}</td>
              <td className="px-4 py-2 text-center space-x-2 flex justify-center">
                <button
                  onClick={() => onEdit(expense)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
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
            <td colSpan={5} className="px-4 py-3 font-bold text-gray-900 text-right">
              TOTAL
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

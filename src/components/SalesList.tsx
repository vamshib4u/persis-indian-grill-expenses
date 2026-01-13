'use client';

import { DailySales } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Trash2, Edit2 } from 'lucide-react';

interface SalesListProps {
  sales: DailySales[];
  onEdit: (sale: DailySales) => void;
  onDelete: (id: string) => void;
}

export const SalesList = ({ sales, onEdit, onDelete }: SalesListProps) => {
  if (sales.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No sales recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Date</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Net Sales</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Cash Collected</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Total Income</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Cash Holder</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Notes</th>
            <th className="px-4 py-2 text-center font-semibold text-gray-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-900">{formatDate(sale.date)}</td>
              <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(sale.squareSales)}</td>
              <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(sale.cashCollected)}</td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                {formatCurrency(sale.squareSales + sale.cashCollected)}
              </td>
              <td className="px-4 py-2 text-gray-900 font-medium">{sale.cashHolder || '-'}</td>
              <td className="px-4 py-2 text-gray-700 text-sm">{sale.notes || '-'}</td>
              <td className="px-4 py-2 text-center space-x-2 flex justify-center">
                <button
                  onClick={() => onEdit(sale)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(sale.id)}
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
          <tr className="font-bold">
            <td className="px-4 py-3 text-gray-900">TOTAL</td>
            <td className="px-4 py-3 text-right text-gray-900">
              {formatCurrency(sales.reduce((sum, s) => sum + s.squareSales, 0))}
            </td>
            <td className="px-4 py-3 text-right text-gray-900">
              {formatCurrency(sales.reduce((sum, s) => sum + s.cashCollected, 0))}
            </td>
            <td className="px-4 py-3 text-right text-blue-600 text-lg">
              {formatCurrency(sales.reduce((sum, s) => sum + s.squareSales + s.cashCollected, 0))}
            </td>
            <td className="px-4 py-3"></td>
            <td className="px-4 py-3"></td>
            <td className="px-4 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

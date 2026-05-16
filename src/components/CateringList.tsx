'use client';

import { CateringOrder } from '@/types';
import { formatCurrency, parseDateOnly } from '@/lib/utils';
import { Edit2, Trash2 } from 'lucide-react';

interface CateringListProps {
  cateringOrders: CateringOrder[];
  onEdit: (order: CateringOrder) => void;
  onDelete: (id: string) => void;
}

const formatDateTime = (value: Date | string) =>
  new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatDateOnly = (value?: Date | string) => {
  if (!value) return '-';
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatFulfillment = (value: CateringOrder['fulfillmentType']) =>
  value === 'banquet_hall' ? 'Banquet Hall' : value.charAt(0).toUpperCase() + value.slice(1);

export const CateringList = ({ cateringOrders, onEdit, onDelete }: CateringListProps) => {
  if (cateringOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No catering orders recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Ready At</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Type</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Deposit</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Deposit Date</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Deposit Holder</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-800">Final Payment</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Final Pay Date</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Final Pay Holder</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-800">Notes</th>
            <th className="px-4 py-2 text-center font-semibold text-gray-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cateringOrders.map(order => (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-900">{formatDateTime(order.readyAt)}</td>
              <td className="px-4 py-2 text-gray-900">{formatFulfillment(order.fulfillmentType)}</td>
              <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(order.depositAmount)}</td>
              <td className="px-4 py-2 text-gray-900">{formatDateOnly(order.depositPaidDate)}</td>
              <td className="px-4 py-2 text-gray-900">{order.depositCashHolder || '-'}</td>
              <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(order.finalPaymentAmount)}</td>
              <td className="px-4 py-2 text-gray-900">{formatDateOnly(order.finalPaymentDate)}</td>
              <td className="px-4 py-2 text-gray-900">{order.finalPaymentCashHolder || '-'}</td>
              <td className="px-4 py-2 text-gray-700">{order.notes || '-'}</td>
              <td className="px-4 py-2 text-center space-x-2 flex justify-center">
                <button onClick={() => onEdit(order)} className="text-blue-600 hover:text-blue-800" title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDelete(order.id)} className="text-red-600 hover:text-red-800" title="Delete">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 border-t-2 border-gray-300">
          <tr>
            <td colSpan={2} className="px-4 py-3 font-bold text-gray-900 text-right">TOTAL</td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {formatCurrency(cateringOrders.reduce((sum, order) => sum + order.depositAmount, 0))}
            </td>
            <td colSpan={2}></td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {formatCurrency(cateringOrders.reduce((sum, order) => sum + order.finalPaymentAmount, 0))}
            </td>
            <td colSpan={4}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

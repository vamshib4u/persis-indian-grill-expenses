'use client';

import { useState } from 'react';
import { CateringOrder } from '@/types';
import { generateId, toDateInputValue } from '@/lib/utils';
import { X } from 'lucide-react';

const toLocalDateTimeInput = (value?: Date | string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface CateringFormProps {
  cateringOrder?: CateringOrder | null;
  restaurantId: string;
  cashHolders: string[];
  onSubmit: (cateringOrder: CateringOrder) => Promise<void>;
  onClose: () => void;
}

export const CateringForm = ({
  cateringOrder,
  restaurantId,
  cashHolders,
  onSubmit,
  onClose,
}: CateringFormProps) => {
  const [formData, setFormData] = useState({
    readyAt: cateringOrder ? toLocalDateTimeInput(cateringOrder.readyAt) : toLocalDateTimeInput(new Date()),
    fulfillmentType: cateringOrder?.fulfillmentType || 'pickup',
    depositAmount: cateringOrder?.depositAmount || 0,
    depositPaidDate: cateringOrder?.depositPaidDate ? toDateInputValue(cateringOrder.depositPaidDate) : '',
    depositCashHolder: cateringOrder?.depositCashHolder || '',
    finalPaymentAmount: cateringOrder?.finalPaymentAmount || 0,
    finalPaymentDate: cateringOrder?.finalPaymentDate ? toDateInputValue(cateringOrder.finalPaymentDate) : '',
    finalPaymentCashHolder: cateringOrder?.finalPaymentCashHolder || '',
    notes: cateringOrder?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newOrder: CateringOrder = {
      id: cateringOrder?.id || generateId(),
      restaurantId: cateringOrder?.restaurantId || restaurantId,
      readyAt: new Date(formData.readyAt),
      fulfillmentType: formData.fulfillmentType as CateringOrder['fulfillmentType'],
      depositAmount: parseFloat(formData.depositAmount.toString()) || 0,
      depositPaidDate: formData.depositPaidDate || '',
      depositCashHolder: formData.depositCashHolder || '',
      finalPaymentAmount: parseFloat(formData.finalPaymentAmount.toString()) || 0,
      finalPaymentDate: formData.finalPaymentDate || '',
      finalPaymentCashHolder: formData.finalPaymentCashHolder || '',
      notes: formData.notes || '',
      createdAt: cateringOrder?.createdAt || new Date(),
    };

    setSubmitting(true);
    try {
      await onSubmit(newOrder);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {cateringOrder ? 'Edit Catering Order' : 'Add Catering Order'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Ready Date & Time</label>
            <input
              type="datetime-local"
              value={formData.readyAt}
              onChange={e => setFormData({ ...formData, readyAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Order Type</label>
            <select
              value={formData.fulfillmentType}
              onChange={e =>
                setFormData({
                  ...formData,
                  fulfillmentType: e.target.value as CateringOrder['fulfillmentType'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            >
              <option value="pickup">Pick Up</option>
              <option value="delivery">Delivery</option>
              <option value="banquet_hall">Banquet Hall</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Deposit Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.depositAmount}
              onChange={e => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Deposit Paid Date</label>
            <input
              type="date"
              value={formData.depositPaidDate}
              onChange={e => setFormData({ ...formData, depositPaidDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Deposit Cash Holder</label>
            <select
              value={formData.depositCashHolder}
              onChange={e => setFormData({ ...formData, depositCashHolder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">Select person</option>
              {cashHolders.map(holder => (
                <option key={holder} value={holder}>{holder}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Final Payment Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.finalPaymentAmount}
              onChange={e => setFormData({ ...formData, finalPaymentAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Final Payment Date</label>
            <input
              type="date"
              value={formData.finalPaymentDate}
              onChange={e => setFormData({ ...formData, finalPaymentDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Final Payment Cash Holder</label>
            <select
              value={formData.finalPaymentCashHolder}
              onChange={e => setFormData({ ...formData, finalPaymentCashHolder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">Select person</option>
              {cashHolders.map(holder => (
                <option key={holder} value={holder}>{holder}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {submitting ? 'Saving...' : `${cateringOrder ? 'Update' : 'Save'} Catering Order`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

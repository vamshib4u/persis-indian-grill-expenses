'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { generateId, toDateInputValue } from '@/lib/utils';
import { X } from 'lucide-react';

interface TransferFormProps {
  transaction?: Transaction | null;
  restaurantId: string;
  cashHolders: string[];
  onSubmit: (transaction: Transaction) => Promise<void>;
  onClose: () => void;
}

export const TransferForm = ({
  transaction,
  restaurantId,
  cashHolders,
  onSubmit,
  onClose,
}: TransferFormProps) => {
  const [formData, setFormData] = useState({
    date: toDateInputValue(transaction?.date),
    fromHolder: transaction?.spentBy || '',
    toHolder: transaction?.payeeName || '',
    amount: transaction?.amount || 0,
    notes: transaction?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.fromHolder === formData.toHolder) {
      setError('Choose two different people for a transfer');
      return;
    }
    setError('');

    const transfer: Transaction = {
      id: transaction?.id || generateId(),
      restaurantId: transaction?.restaurantId || restaurantId,
      date: formData.date,
      type: 'transfer',
      category: 'Transfer',
      amount: Number(formData.amount) || 0,
      paymentMethod: 'cash',
      description: `Transfer from ${formData.fromHolder} to ${formData.toHolder}`,
      spentBy: formData.fromHolder,
      payeeName: formData.toHolder,
      purpose: 'Cash transfer',
      notes: formData.notes || undefined,
      createdAt: transaction?.createdAt || new Date(),
    };

    setSubmitting(true);
    try {
      await onSubmit(transfer);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{transaction ? 'Edit Transfer' : 'Transfer Cash'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(event) => setFormData({ ...formData, date: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">From</label>
            <select
              value={formData.fromHolder}
              onChange={(event) => setFormData({ ...formData, fromHolder: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            >
              <option value="">Select person</option>
              {cashHolders.map((holder) => (
                <option key={holder} value={holder}>{holder}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">To</label>
            <select
              value={formData.toHolder}
              onChange={(event) => setFormData({ ...formData, toHolder: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            >
              <option value="">Select person</option>
              {cashHolders.map((holder) => (
                <option key={holder} value={holder}>{holder}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Amount ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(event) => setFormData({ ...formData, amount: Number(event.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
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
              {submitting ? 'Saving...' : 'Save Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { generateId } from '@/lib/utils';
import { X } from 'lucide-react';

interface PayoutFormProps {
  payout?: Transaction | null;
  onSubmit: (payout: Transaction) => void;
  onClose: () => void;
}

export const PayoutForm = ({ payout, onSubmit, onClose }: PayoutFormProps) => {
  const [formData, setFormData] = useState({
    date: payout ? new Date(payout.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    amount: payout?.amount || 0,
    payeeName: payout?.payeeName || '',
    purpose: payout?.purpose || '',
    notes: payout?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse date string to avoid timezone issues
    const [year, month, day] = formData.date.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const newPayout: Transaction = {
      id: payout?.id || generateId(),
      date: dateObj,
      type: 'payout',
      category: 'Payout',
      amount: parseFloat(formData.amount.toString()),
      paymentMethod: 'cash',
      description: '',
      payeeName: formData.payeeName,
      purpose: formData.purpose,
      notes: formData.notes,
      createdAt: payout?.createdAt || new Date(),
    };

    onSubmit(newPayout);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {payout ? 'Edit Payout' : 'Record Cash Payout'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Payee Name</label>
            <input
              type="text"
              value={formData.payeeName}
              onChange={e => setFormData({ ...formData, payeeName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Purpose</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={e => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {payout ? 'Update' : 'Save'} Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

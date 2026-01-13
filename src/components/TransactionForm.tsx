'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { generateId } from '@/lib/utils';
import { X } from 'lucide-react';

const CASH_HOLDERS = ['Vamshi', 'Raghu', 'Naresh', 'Nikki', 'Meenu', 'Pradeep'];

const EXPENSE_CATEGORIES = [
  'Supplies',
  'Utilities',
  'Rent',
  'Labor',
  'Equipment',
  'Maintenance',
  'Marketing',
  'Insurance',
  'Student Pay',
  'Amigos Pay',
  'Chef Pay',
  'Other',
];

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSubmit: (transaction: Transaction) => void;
  onClose: () => void;
}

export const TransactionForm = ({ transaction, onSubmit, onClose }: TransactionFormProps) => {
  const [formData, setFormData] = useState({
    date: transaction ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: transaction?.type || 'expense',
    category: transaction?.category || '',
    amount: transaction?.amount || 0,
    paymentMethod: transaction?.paymentMethod || 'cash',
    description: transaction?.description || '',
    payeeName: transaction?.payeeName || '',
    purpose: transaction?.purpose || '',
    spentBy: transaction?.spentBy || '',
    notes: transaction?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = formData.date.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const newTransaction: Transaction = {
      id: transaction?.id || generateId(),
      date: dateObj,
      type: formData.type as 'expense' | 'payout',
      category: formData.category,
      amount: parseFloat(formData.amount.toString()),
      paymentMethod: formData.paymentMethod as 'cash' | 'card' | 'bank_transfer',
      description: formData.description,
      payeeName: formData.payeeName || undefined,
      purpose: formData.purpose || undefined,
      spentBy: formData.spentBy || undefined,
      notes: formData.notes || undefined,
      createdAt: transaction?.createdAt || new Date(),
    };

    onSubmit(newTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {transaction ? 'Edit Transaction' : 'Record Transaction'}
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
            <label className="block text-sm font-medium text-gray-900 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as 'expense' | 'payout', category: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            >
              <option value="expense">Expense</option>
              <option value="payout">Payout</option>
            </select>
          </div>

          {formData.type === 'expense' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}

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
            <label className="block text-sm font-medium text-gray-900 mb-1">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as 'cash' | 'card' | 'bank_transfer' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {formData.paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Spent By (if Cash)</label>
              <select
                value={formData.spentBy}
                onChange={e => setFormData({ ...formData, spentBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Select person</option>
                {CASH_HOLDERS.map(holder => (
                  <option key={holder} value={holder}>{holder}</option>
                ))}
              </select>
            </div>
          )}

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
              {transaction ? 'Update' : 'Save'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

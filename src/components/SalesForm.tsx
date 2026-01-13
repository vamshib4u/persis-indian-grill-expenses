'use client';

import { useState } from 'react';
import { DailySales } from '@/types';
import { generateId } from '@/lib/utils';
import { X } from 'lucide-react';

const CASH_HOLDERS = ['Vamshi', 'Raghu', 'Naresh', 'Nikki', 'Meenu', 'Pradeep'];

interface SalesFormProps {
  sale?: DailySales | null;
  onSubmit: (sale: DailySales) => void;
  onClose: () => void;
}

export const SalesForm = ({ sale, onSubmit, onClose }: SalesFormProps) => {
  const [formData, setFormData] = useState({
    date: sale ? new Date(sale.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    squareSales: sale?.squareSales || 0,
    cashCollected: sale?.cashCollected || 0,
    cashHolder: sale?.cashHolder || '',
    notes: sale?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse date string to avoid timezone issues
    const [year, month, day] = formData.date.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const newSale: DailySales = {
      id: sale?.id || generateId(),
      date: dateObj,
      squareSales: parseFloat(formData.squareSales.toString()),
      cashCollected: parseFloat(formData.cashCollected.toString()),
      cashHolder: formData.cashHolder,
      notes: formData.notes,
      createdAt: sale?.createdAt || new Date(),
    };

    onSubmit(newSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {sale ? 'Edit Sale' : 'Record Daily Sale'}
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
            <label className="block text-sm font-medium text-gray-900 mb-1">Net Sales ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.squareSales}
              onChange={e => setFormData({ ...formData, squareSales: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
            <p className="text-xs text-gray-600 mt-1">After discounts and returns</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Cash Collected ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.cashCollected}
              onChange={e => setFormData({ ...formData, cashCollected: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Cash Holder</label>
            <select
              value={formData.cashHolder}
              onChange={e => setFormData({ ...formData, cashHolder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            >
              <option value="">Select cash holder</option>
              {CASH_HOLDERS.map(holder => (
                <option key={holder} value={holder}>{holder}</option>
              ))}
            </select>
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
              {sale ? 'Update' : 'Save'} Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

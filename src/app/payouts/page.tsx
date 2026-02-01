'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { Transaction } from '@/types';
import { PayoutsList } from '@/components/PayoutsList';
import { PayoutForm } from '@/components/PayoutForm';
import { CashHoldingSummary } from '@/components/CashHoldingSummary';
import { storage, getStorageVersion, subscribeToStorage } from '@/lib/storage';
import { Plus, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { syncSheetsNow } from '@/lib/sheetsSync';
import { endOfMonth, isWithinInterval } from 'date-fns';

export default function PayoutsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPayout, setEditingPayout] = useState<Transaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const storageVersion = useSyncExternalStore(subscribeToStorage, getStorageVersion, getStorageVersion);

  const { payouts, allSales, allTransactions } = useMemo(() => {
    void storageVersion;
    const allTransactions = storage.getTransactions();
    const allSales = storage.getSales();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = endOfMonth(monthStart);

    const monthlyTransactions = allTransactions.filter(transaction =>
      isWithinInterval(new Date(transaction.date), { start: monthStart, end: monthEnd })
    );
    const monthlyPayouts = monthlyTransactions.filter(t => t.type === 'payout');
    return {
      payouts: monthlyPayouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      allSales,
      allTransactions,
    };
  }, [currentMonth, currentYear, storageVersion]);

  const runSync = () => {
    const latestSales = storage.getSales();
    const latestTransactions = storage.getTransactions();
    void syncSheetsNow(latestSales, latestTransactions, currentMonth, currentYear);
  };

  const handleAddPayout = (payout: Transaction) => {
    if (editingPayout) {
      storage.updatePayout(payout.id, payout);
      setEditingPayout(null);
      toast.success('Payout updated successfully');
    } else {
      storage.addPayout(payout);
      toast.success('Payout recorded successfully');
    }
    runSync();
    setShowForm(false);
  };

  const handleEditPayout = (payout: Transaction) => {
    setEditingPayout(payout);
    setShowForm(true);
  };

  const handleDeletePayout = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payout?')) {
      storage.deletePayout(id);
    toast.success('Payout deleted');
    runSync();
  }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Cash Payouts</h1>
            <p className="text-gray-600">Manage cash disbursements</p>
          </div>
          <button
            onClick={() => {
              setEditingPayout(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Record Payout
          </button>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousMonth}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <h2 className="text-2xl font-semibold text-gray-900">
              {monthName} {currentYear}
            </h2>
            <button
              onClick={handleNextMonth}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Summary Card */}
        {payouts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Payouts</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalPayouts)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <DollarSign size={32} className="text-red-600" />
              </div>
            </div>
          </div>
        )}

        <CashHoldingSummary
          sales={allSales}
          transactions={allTransactions}
          month={currentMonth}
          year={currentYear}
        />

        <div className="bg-white rounded-lg shadow">
          {payouts.length > 0 ? (
            <PayoutsList
              payouts={payouts}
              onEdit={handleEditPayout}
              onDelete={handleDeletePayout}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No payouts recorded for {monthName} {currentYear}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add First Payout
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <PayoutForm
          payout={editingPayout}
          onSubmit={handleAddPayout}
          onClose={() => {
            setShowForm(false);
            setEditingPayout(null);
          }}
        />
      )}
    </div>
  );
}

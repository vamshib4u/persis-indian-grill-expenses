'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Transaction } from '@/types';
import { ExpensesList } from '@/components/ExpensesList';
import { TransactionForm } from '@/components/TransactionForm';
import { ExportButtons } from '@/components/ExportButtons';
import { CashHoldingCards } from '@/components/CashHoldingCards';
import { PersistenceStatusCard } from '@/components/PersistenceStatusCard';
import { isStorageLoaded, isStorageLoading, storage, getStorageVersion, subscribeToStorage } from '@/lib/storage';
import { Plus, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { endOfMonth, isWithinInterval } from 'date-fns';

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const storageVersion = useSyncExternalStore(subscribeToStorage, getStorageVersion, getStorageVersion);

  useEffect(() => {
    void storage.load().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to load transactions';
      toast.error(message);
    });
  }, []);

  const { transactions, sales, allSales, allTransactions } = useMemo(() => {
    void storageVersion;
    const allTransactions = storage.getTransactions();
    const allSales = storage.getSales();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = endOfMonth(monthStart);

    const monthlyTransactions = allTransactions
      .filter(transaction =>
        isWithinInterval(new Date(transaction.date), { start: monthStart, end: monthEnd })
      )
      .filter(transaction => transaction.type === 'expense');
    const monthlySales = allSales.filter(sale =>
      isWithinInterval(new Date(sale.date), { start: monthStart, end: monthEnd })
    );

    return {
      transactions: monthlyTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      sales: monthlySales,
      allSales,
      allTransactions,
    };
  }, [currentMonth, currentYear, storageVersion]);

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      if (editingTransaction) {
        await storage.updateTransaction(transaction.id, transaction);
        setEditingTransaction(null);
        toast.success('Expense updated successfully');
      } else {
        await storage.addTransaction(transaction);
        toast.success('Expense recorded successfully');
      }
      setShowForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save expense';
      toast.error(message);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await storage.deleteTransaction(id);
        toast.success('Expense deleted');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete expense';
        toast.error(message);
      }
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
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">Track expense transactions</p>
          </div>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>

        {/* Month Selector */}
        <PersistenceStatusCard />

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

        {/* Export Buttons */}
        <ExportButtons 
          sales={sales} 
          transactions={transactions} 
          month={currentMonth} 
          year={currentYear} 
        />

        {/* Summary Cards */}
        {!isStorageLoaded() && isStorageLoading() && (
          <div className="bg-white rounded-lg shadow p-6 mb-8 text-gray-600">
            Loading expenses from Neon...
          </div>
        )}

        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingDown size={24} className="text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Outflow</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <TrendingDown size={24} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <CashHoldingCards
          sales={allSales}
          transactions={allTransactions}
          month={currentMonth}
          year={currentYear}
        />

        <div className="bg-white rounded-lg shadow">
          {transactions.length > 0 ? (
            <ExpensesList
              expenses={transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No expenses recorded for {monthName} {currentYear}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add First Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          fixedType="expense"
          onSubmit={handleAddTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}

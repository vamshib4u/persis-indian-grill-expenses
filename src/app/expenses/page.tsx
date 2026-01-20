'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { Transaction } from '@/types';
import { ExpensesList } from '@/components/ExpensesList';
import { ExpenseForm } from '@/components/ExpenseForm';
import { storage, getStorageVersion, subscribeToStorage } from '@/lib/storage';
import { Plus, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { endOfMonth, isWithinInterval } from 'date-fns';

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const storageVersion = useSyncExternalStore(subscribeToStorage, getStorageVersion, getStorageVersion);

  const expenses = useMemo(() => {
    void storageVersion;
    const allExpenses = storage.getExpenses();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = endOfMonth(monthStart);

    const monthlyExpenses = allExpenses.filter(expense =>
      isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
    );
    return monthlyExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentMonth, currentYear, storageVersion]);

  const handleAddExpense = (expense: Transaction) => {
    if (editingExpense) {
      storage.updateExpense(expense.id, expense);
      setEditingExpense(null);
      toast.success('Expense updated successfully');
    } else {
      storage.addExpense(expense);
      toast.success('Expense recorded successfully');
    }
    setShowForm(false);
  };

  const handleEditExpense = (expense: Transaction) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      storage.deleteExpense(id);
    toast.success('Expense deleted');
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
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const cat = expense.category;
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600">Track all business expenses</p>
          </div>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Expense
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
        {expenses.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-600 text-sm">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown size={32} className="text-red-600" />
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Breakdown by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">{category}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(amount as number)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expense Breakdown by Person */}
        {expenses.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Spent By Each Person</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {['Vamshi', 'Raghu', 'Naresh', 'Nikki', 'Meenu', 'Pradeep'].map(person => {
                const personExpenses = expenses
                  .filter(e => e.spentBy === person && e.paymentMethod === 'cash')
                  .reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div key={person} className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-gray-600">{person}</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      {formatCurrency(personExpenses)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {expenses.length > 0 ? (
            <ExpensesList
              expenses={expenses}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
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
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleAddExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
}

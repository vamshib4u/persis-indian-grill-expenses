'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { DailySales } from '@/types';
import { SalesList } from '@/components/SalesList';
import { SalesForm } from '@/components/SalesForm';
import { ExportButtons } from '@/components/ExportButtons';
import { storage, getStorageVersion, subscribeToStorage } from '@/lib/storage';
import { Plus, DollarSign, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { useAutoSyncSheets } from '@/lib/useAutoSyncSheets';
import { endOfMonth, isWithinInterval } from 'date-fns';

export default function SalesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<DailySales | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const storageVersion = useSyncExternalStore(subscribeToStorage, getStorageVersion, getStorageVersion);

  const { sales, transactions, allSales, allTransactions } = useMemo(() => {
    void storageVersion;
    const allSales = storage.getSales();
    const allTransactions = storage.getTransactions();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = endOfMonth(monthStart);

    const monthlySales = allSales.filter(sale =>
      isWithinInterval(new Date(sale.date), { start: monthStart, end: monthEnd })
    );
    const monthlyTransactions = allTransactions.filter(transaction =>
      isWithinInterval(new Date(transaction.date), { start: monthStart, end: monthEnd })
    );

    return {
      sales: monthlySales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      transactions: monthlyTransactions,
      allSales,
      allTransactions,
    };
  }, [currentMonth, currentYear, storageVersion]);

  useAutoSyncSheets(allSales, allTransactions, currentMonth, currentYear);

  const handleAddSale = (sale: DailySales) => {
    if (editingSale) {
      storage.updateSale(sale.id, sale);
      setEditingSale(null);
      toast.success('Sale updated successfully');
    } else {
      storage.addSale(sale);
      toast.success('Sale recorded successfully');
    }
    setShowForm(false);
  };

  const handleEditSale = (sale: DailySales) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDeleteSale = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      storage.deleteSale(id);
    toast.success('Sale deleted');
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
  const totalNetSales = sales.reduce((sum, s) => sum + s.squareSales, 0);
  const totalCashCollected = sales.reduce((sum, s) => sum + s.cashCollected, 0);
  const totalIncome = totalNetSales + totalCashCollected;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Daily Sales</h1>
            <p className="text-gray-600">Track net sales and cash collections</p>
          </div>
          <button
            onClick={() => {
              setEditingSale(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Record Sale
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

        {/* Export Buttons */}
        <ExportButtons 
          sales={sales} 
          transactions={transactions} 
          month={currentMonth} 
          year={currentYear} 
        />

        {/* Summary Cards */}
        {sales.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Net Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalNetSales)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Cash Collected</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalCashCollected)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign size={24} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {sales.length > 0 ? (
            <SalesList
              sales={sales}
              onEdit={handleEditSale}
              onDelete={handleDeleteSale}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sales recorded for {monthName} {currentYear}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add First Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SalesForm
          sale={editingSale}
          onSubmit={handleAddSale}
          onClose={() => {
            setShowForm(false);
            setEditingSale(null);
          }}
        />
      )}
    </div>
  );
}

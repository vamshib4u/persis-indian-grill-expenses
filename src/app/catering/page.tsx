'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { CateringOrder } from '@/types';
import { CateringForm } from '@/components/CateringForm';
import { CateringList } from '@/components/CateringList';
import { CashHoldingCards } from '@/components/CashHoldingCards';
import { PersistenceStatusCard } from '@/components/PersistenceStatusCard';
import { getStorageVersion, isStorageLoaded, isStorageLoading, storage, subscribeToStorage } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { endOfMonth, isWithinInterval } from 'date-fns';
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CateringPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CateringOrder | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const storageVersion = useSyncExternalStore(subscribeToStorage, getStorageVersion, getStorageVersion);

  useEffect(() => {
    void storage.load().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to load catering orders';
      toast.error(message);
    });
  }, []);

  const { cateringOrders, allOrders, allSales, allTransactions, cashHolders, activeRestaurantId } = useMemo(() => {
    void storageVersion;
    const allOrders = storage.getCateringOrders();
    const allSales = storage.getSales();
    const allTransactions = storage.getTransactions();
    const cashHolders = storage.getCashHolders();
    const activeRestaurantId = storage.getSession()?.activeRestaurantId || '';
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = endOfMonth(monthStart);

    const monthlyOrders = allOrders.filter(order =>
      isWithinInterval(new Date(order.readyAt), { start: monthStart, end: monthEnd })
    );

    return {
      cateringOrders: monthlyOrders.sort(
        (a, b) => new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime()
      ),
      allOrders,
      allSales,
      allTransactions,
      cashHolders,
      activeRestaurantId,
    };
  }, [currentMonth, currentYear, storageVersion]);

  const handleSaveOrder = async (order: CateringOrder) => {
    try {
      if (editingOrder) {
        await storage.updateCateringOrder(order.id, order);
        setEditingOrder(null);
        toast.success('Catering order updated successfully');
      } else {
        await storage.addCateringOrder(order);
        toast.success('Catering order saved successfully');
      }
      setShowForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save catering order';
      toast.error(message);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this catering order?')) {
      try {
        await storage.deleteCateringOrder(id);
        toast.success('Catering order deleted');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete catering order';
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
  const totalDeposits = cateringOrders.reduce((sum, order) => sum + order.depositAmount, 0);
  const totalFinalPayments = cateringOrders.reduce((sum, order) => sum + order.finalPaymentAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Catering</h1>
            <p className="text-gray-600">Track ready times, deposits, and final payments</p>
          </div>
          <button
            onClick={() => {
              setEditingOrder(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Catering Order
          </button>
        </div>

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

        {!isStorageLoaded() && isStorageLoading() && (
          <div className="bg-white rounded-lg shadow p-6 mb-8 text-gray-600">
            Loading catering orders from Neon...
          </div>
        )}

        {cateringOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Orders This Month</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{cateringOrders.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CalendarClock size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Deposits Received</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalDeposits)}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <Wallet size={24} className="text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Final Payments</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(totalFinalPayments)}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Wallet size={24} className="text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <CashHoldingCards
          cashHolders={cashHolders}
          sales={allSales}
          transactions={allTransactions}
          cateringOrders={allOrders}
          month={currentMonth}
          year={currentYear}
          title="Cash Holding After Catering Collections"
        />

        <div className="bg-white rounded-lg shadow">
          {cateringOrders.length > 0 ? (
            <CateringList
              cateringOrders={cateringOrders}
              onEdit={(order) => {
                setEditingOrder(order);
                setShowForm(true);
              }}
              onDelete={handleDeleteOrder}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No catering orders recorded for {monthName} {currentYear}</p>
              <p className="text-sm text-gray-500 mt-2">Total orders in system: {allOrders.length}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add First Catering Order
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <CateringForm
          cateringOrder={editingOrder}
          restaurantId={activeRestaurantId}
          cashHolders={cashHolders.filter(holder => holder.active).map(holder => holder.name)}
          onSubmit={handleSaveOrder}
          onClose={() => {
            setShowForm(false);
            setEditingOrder(null);
          }}
        />
      )}
    </div>
  );
}

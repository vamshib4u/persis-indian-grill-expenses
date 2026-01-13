'use client';

import { useState, useEffect } from 'react';
import { MonthlyReport } from '@/types';
import { generateMonthlyReport, formatCurrency } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const sales = storage.getSales();
    const transactions = storage.getTransactions();

    const monthlyReport = generateMonthlyReport(sales, transactions, month, year);
    setReport(monthlyReport);
  }, [month, year]);

  const handlePreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  if (!report) {
    return <div className="p-8">Loading...</div>;
  }

  const stats = [
    {
      label: 'Total Income',
      value: report.totalIncome,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Expenses',
      value: report.totalExpenses,
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Cash Payouts',
      value: report.totalPayouts,
      icon: DollarSign,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Net Cash',
      value: report.netCash,
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Monthly Revenue & Expense Overview</p>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousMonth}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Previous
            </button>
            <h2 className="text-2xl font-semibold">
              {report.month} {report.year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                <div className={`inline-block p-3 rounded-lg ${stat.color} mb-4`}>
                  <Icon size={24} />
                </div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stat.value)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Income Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Square Sales</span>
                <span className="font-semibold">{formatCurrency(report.squareSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unreported Cash</span>
                <span className="font-semibold">{formatCurrency(report.unreportedCash)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total Income</span>
                <span className="font-bold text-lg">{formatCurrency(report.totalIncome)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Outflow Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-semibold">{formatCurrency(report.totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Payouts</span>
                <span className="font-semibold">{formatCurrency(report.totalPayouts)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total Outflow</span>
                <span className="font-bold text-lg">
                  {formatCurrency(report.totalExpenses + report.totalPayouts)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

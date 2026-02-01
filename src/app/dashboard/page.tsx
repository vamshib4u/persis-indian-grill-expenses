'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { generateMonthlyReport, formatCurrency } from '@/lib/utils';
import { CashHoldingYearSummary } from '@/components/CashHoldingYearSummary';
import { storage, getStorageVersion, subscribeToStorage } from '@/lib/storage';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

type TrendPoint = {
  label: string;
  netSales: number;
  cashFlow: number;
  month: number;
  year: number;
};

export default function Dashboard() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const storageVersion = useSyncExternalStore(subscribeToStorage, getStorageVersion, getStorageVersion);

  const { report, trend, allSales, allTransactions } = useMemo(() => {
    void storageVersion;
    const sales = storage.getSales();
    const transactions = storage.getTransactions();
    const monthlyReport = generateMonthlyReport(sales, transactions, month, year);

    const points: TrendPoint[] = [];
    for (let m = 0; m <= month; m++) {
      const d = new Date(year, m, 1);
      const r = generateMonthlyReport(sales, transactions, m, year);
      const label = d.toLocaleString('default', { month: 'short' });
      points.push({
        label,
        netSales: r.squareSales,
        cashFlow: r.netCash,
        month: m,
        year,
      });
    }

    return { report: monthlyReport, trend: points, allSales: sales, allTransactions: transactions };
  }, [month, year, storageVersion]);

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

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Monthly Trends</h3>
              <p className="text-sm text-gray-600">Net sales vs cash flow (this year)</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                Net Sales
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                Cash Flow
              </div>
            </div>
          </div>

          {trend.length === 0 ? (
            <div className="text-sm text-gray-500">No data yet.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 800 240" className="w-full h-64">
                {(() => {
                  const padding = { left: 48, right: 24, top: 16, bottom: 40 };
                  const width = 800 - padding.left - padding.right;
                  const height = 240 - padding.top - padding.bottom;
                  const values = trend.flatMap(p => [p.netSales, p.cashFlow]);
                  const min = Math.min(...values, 0);
                  const max = Math.max(...values, 1);
                  const scaleX = (idx: number) => {
                    if (trend.length <= 1) return padding.left + width / 2;
                    return padding.left + (idx / (trend.length - 1)) * width;
                  };
                  const scaleY = (val: number) => {
                    const denom = max - min || 1;
                    return padding.top + (1 - (val - min) / denom) * height;
                  };
                  const toPath = (key: 'netSales' | 'cashFlow') =>
                    trend
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p[key])}`)
                      .join(' ');

                  return (
                    <>
                      <line
                        x1={padding.left}
                        y1={padding.top + height}
                        x2={padding.left + width}
                        y2={padding.top + height}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={padding.top + height}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />

                      <path d={toPath('netSales')} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                      <path d={toPath('cashFlow')} fill="none" stroke="#10b981" strokeWidth="2.5" />

                      {trend.map((p, i) => (
                        <g key={`${p.label}-${i}`}>
                          <circle cx={scaleX(i)} cy={scaleY(p.netSales)} r="3" fill="#3b82f6" />
                          <circle cx={scaleX(i)} cy={scaleY(p.cashFlow)} r="3" fill="#10b981" />
                          <text
                            x={scaleX(i)}
                            y={padding.top + height + 18}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#6b7280"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          )}
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

        <CashHoldingYearSummary
          sales={allSales}
          transactions={allTransactions}
          year={year}
        />
      </div>
    </div>
  );
}

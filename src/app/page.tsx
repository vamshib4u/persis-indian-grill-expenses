'use client';

import Link from 'next/link';
import { BarChart3, DollarSign, CreditCard, TrendingDown, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'View monthly revenue & expense overview at a glance',
      href: '/dashboard',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: DollarSign,
      title: 'Daily Sales',
      description: 'Track Square sales and unreported cash collections',
      href: '/sales',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: CreditCard,
      title: 'Expenses',
      description: 'Manage business expenses from bank statements',
      href: '/expenses',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      icon: TrendingDown,
      title: 'Cash Payouts',
      description: 'Track cash disbursements and payouts',
      href: '/payouts',
      color: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Persis Indian Grill
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Monthly Revenue & Expense Management
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Streamline your financial tracking with daily sales recording, expense management, 
            and seamless Google Sheets integration for comprehensive monthly reporting.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <div className="group h-full bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 cursor-pointer hover:scale-105">
                  <div className={`inline-block p-3 rounded-lg ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium">Get started</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Local Storage</h3>
              <p className="text-gray-600 text-sm">
                All data is stored locally in your browser for quick access and privacy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Google Sheets Sync</h3>
              <p className="text-gray-600 text-sm">
                Sync your data with Google Sheets for backup and additional analysis.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Export Reports</h3>
              <p className="text-gray-600 text-sm">
                Export monthly reports as CSV or JSON for accounting and record-keeping.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Managing Your Revenue Today</h2>
          <p className="text-blue-100 mb-6">
            Navigate to any section above to begin tracking your business finances.
          </p>
          <Link href="/dashboard" className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}

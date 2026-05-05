'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CreditCard, DollarSign, LogOut, Menu, Settings, Truck, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getStorageVersion, storage, subscribeToStorage } from '@/lib/storage';

export const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const storageVersion = useSyncExternalStore(subscribeToStorage, getStorageVersion, getStorageVersion);

  if (pathname === '/login') {
    return null;
  }

  useEffect(() => {
    void storage.load().catch(() => {});
  }, []);

  void storageVersion;
  const session = storage.getSession();
  const activeRestaurant = storage.getActiveRestaurant();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/sales', label: 'Sales', icon: DollarSign },
    { href: '/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/catering', label: 'Catering', icon: Truck },
  ];

  const isActive = (href: string) => pathname === href;
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  const handleRestaurantChange = async (restaurantId: string) => {
    await storage.switchRestaurant(restaurantId);
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <BarChart3 size={24} className="text-blue-600" />
            <span>{activeRestaurant?.name || 'Persis Grill'}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {session && session.restaurants.length > 1 && (
              <select
                value={session.activeRestaurantId}
                onChange={(event) => void handleRestaurantChange(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              >
                {session.restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            )}
            {links.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {session?.user.role === 'super_admin' && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/admin')
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings size={18} />
                <span>Admin</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {session && session.restaurants.length > 1 && (
              <div className="px-3">
                <select
                  value={session.activeRestaurantId}
                  onChange={(event) => void handleRestaurantChange(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                >
                  {session.restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {links.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full ${
                    isActive(link.href)
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {session?.user.role === 'super_admin' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full ${
                  isActive('/admin')
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings size={18} />
                <span>Admin</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

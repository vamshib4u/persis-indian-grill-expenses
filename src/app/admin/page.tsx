'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppUser, CashHolderConfig, Restaurant } from '@/types';
import { generateId } from '@/lib/utils';
import { toast } from 'react-hot-toast';

type AdminStatePayload = {
  restaurants: Restaurant[];
  users: AppUser[];
  cashHoldersByRestaurant: Record<string, CashHolderConfig[]>;
};

const defaultUserForm = {
  id: '',
  username: '',
  password: '',
  role: 'restaurant_admin' as AppUser['role'],
  restaurantId: '',
  active: true,
};

const defaultCashHolderForm = {
  id: '',
  restaurantId: '',
  name: '',
  startingAmount: '0',
  active: true,
};

export default function AdminPage() {
  const [state, setState] = useState<AdminStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [cashHolderForm, setCashHolderForm] = useState(defaultCashHolderForm);

  const loadState = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/state', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load admin data');
      }
      setState(payload);
      setSelectedRestaurantId((current) => current || payload.restaurants[0]?.id || '');
      setCashHolderForm((current) => ({
        ...current,
        restaurantId: current.restaurantId || payload.restaurants[0]?.id || '',
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, []);

  const usersForSelectedRestaurant = useMemo(() => {
    if (!state) return [];
    return state.users.filter((user) =>
      user.role === 'super_admin' ? true : user.restaurantId === selectedRestaurantId
    );
  }, [selectedRestaurantId, state]);

  const cashHolders = state?.cashHoldersByRestaurant[selectedRestaurantId] || [];

  const handleUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isEditing = Boolean(userForm.id);

    try {
      const response = await fetch('/api/admin/users', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userForm,
          id: userForm.id || generateId(),
          restaurantId: userForm.role === 'super_admin' ? '' : userForm.restaurantId,
          password: userForm.password || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save user');
      }

      toast.success(isEditing ? 'User updated' : 'User created');
      setUserForm(defaultUserForm);
      await loadState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
    }
  };

  const handleCashHolderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isEditing = Boolean(cashHolderForm.id);

    try {
      const response = await fetch('/api/admin/cash-holders', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cashHolderForm,
          id: cashHolderForm.id || generateId(),
          startingAmount: Number(cashHolderForm.startingAmount) || 0,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save cash holder');
      }

      toast.success(isEditing ? 'Cash holder updated' : 'Cash holder created');
      setCashHolderForm({
        ...defaultCashHolderForm,
        restaurantId: selectedRestaurantId,
      });
      await loadState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save cash holder');
    }
  };

  if (loading && !state) {
    return <main className="min-h-screen bg-gray-50 p-8 text-gray-600">Loading admin data...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-gray-600">Manage restaurant users and starting cash balances.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Restaurant</label>
          <select
            value={selectedRestaurantId}
            onChange={(event) => {
              setSelectedRestaurantId(event.target.value);
              setCashHolderForm((current) => ({ ...current, restaurantId: event.target.value }));
            }}
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            {state?.restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Users</h2>
            <form onSubmit={handleUserSubmit} className="space-y-4 mb-6">
              <input
                value={userForm.username}
                onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="Username"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                required
              />
              <input
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={userForm.id ? 'New password (optional)' : 'Password'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                required={!userForm.id}
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      role: event.target.value as AppUser['role'],
                    }))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                >
                  <option value="restaurant_admin">Restaurant Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <select
                  value={userForm.role === 'super_admin' ? '' : userForm.restaurantId}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, restaurantId: event.target.value }))
                  }
                  disabled={userForm.role === 'super_admin'}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 disabled:bg-gray-100"
                >
                  <option value="">Select restaurant</option>
                  {state?.restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={userForm.active}
                  onChange={(event) => setUserForm((current) => ({ ...current, active: event.target.checked }))}
                />
                Active user
              </label>
              <div className="flex gap-2">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
                  {userForm.id ? 'Update User' : 'Create User'}
                </button>
                {userForm.id && (
                  <button
                    type="button"
                    onClick={() => setUserForm(defaultUserForm)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {usersForSelectedRestaurant.map((user) => (
                <div key={user.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-600">
                        {user.role === 'super_admin'
                          ? 'Super admin'
                          : state?.restaurants.find((restaurant) => restaurant.id === user.restaurantId)?.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setUserForm({
                          id: user.id,
                          username: user.username,
                          password: '',
                          role: user.role,
                          restaurantId: user.restaurantId || '',
                          active: user.active,
                        })
                      }
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cash Holders</h2>
            <form onSubmit={handleCashHolderSubmit} className="space-y-4 mb-6">
              <input
                value={cashHolderForm.name}
                onChange={(event) => setCashHolderForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                required
              />
              <input
                type="number"
                step="0.01"
                value={cashHolderForm.startingAmount}
                onChange={(event) =>
                  setCashHolderForm((current) => ({ ...current, startingAmount: event.target.value }))
                }
                placeholder="Starting amount"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                required
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={cashHolderForm.active}
                  onChange={(event) =>
                    setCashHolderForm((current) => ({ ...current, active: event.target.checked }))
                  }
                />
                Active cash holder
              </label>
              <div className="flex gap-2">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
                  {cashHolderForm.id ? 'Update Cash Holder' : 'Add Cash Holder'}
                </button>
                {cashHolderForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setCashHolderForm({
                        ...defaultCashHolderForm,
                        restaurantId: selectedRestaurantId,
                      })
                    }
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {cashHolders.map((cashHolder) => (
                <div key={cashHolder.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{cashHolder.name}</p>
                      <p className="text-sm text-gray-600">
                        Starting amount: ${cashHolder.startingAmount.toFixed(2)} •{' '}
                        {cashHolder.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCashHolderForm({
                          id: cashHolder.id,
                          restaurantId: cashHolder.restaurantId,
                          name: cashHolder.name,
                          startingAmount: String(cashHolder.startingAmount),
                          active: cashHolder.active,
                        })
                      }
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

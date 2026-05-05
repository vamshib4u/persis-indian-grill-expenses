'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppUser, CashHolderAdminConfig, Restaurant } from '@/types';
import { generateId } from '@/lib/utils';
import { toast } from 'react-hot-toast';

type AdminStatePayload = {
  restaurants: Restaurant[];
  users: AppUser[];
  cashHolders: CashHolderAdminConfig[];
};

const defaultUserForm = {
  id: '',
  username: '',
  password: '',
  role: 'restaurant_admin' as AppUser['role'],
  restaurantIds: [] as string[],
  active: true,
};

const defaultCashHolderForm = {
  id: '',
  name: '',
  restaurantIds: [] as string[],
  startingAmountsByRestaurant: {} as Record<string, string>,
  active: true,
};

export default function AdminPage() {
  const [state, setState] = useState<AdminStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, []);

  const restaurants = state?.restaurants || [];
  const users = useMemo(() => state?.users || [], [state]);
  const cashHolders = useMemo(() => state?.cashHolders || [], [state]);

  const toggleRestaurantSelection = (
    restaurantId: string,
    values: string[],
    onChange: (next: string[]) => void
  ) => {
    onChange(
      values.includes(restaurantId)
        ? values.filter((value) => value !== restaurantId)
        : [...values, restaurantId]
    );
  };

  const handleUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isEditing = Boolean(userForm.id);

    if (userForm.role !== 'super_admin' && userForm.restaurantIds.length === 0) {
      toast.error('Choose at least one restaurant for this user');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userForm,
          id: userForm.id || generateId(),
          restaurantIds: userForm.role === 'super_admin' ? [] : userForm.restaurantIds,
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

    if (cashHolderForm.restaurantIds.length === 0) {
      toast.error('Choose at least one restaurant for this cash holder');
      return;
    }

    try {
      const startingAmountsByRestaurant = Object.fromEntries(
        cashHolderForm.restaurantIds.map((restaurantId) => [
          restaurantId,
          Number(cashHolderForm.startingAmountsByRestaurant[restaurantId] || '0') || 0,
        ])
      );

      const response = await fetch('/api/admin/cash-holders', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cashHolderForm.id || generateId(),
          name: cashHolderForm.name,
          restaurantIds: cashHolderForm.restaurantIds,
          startingAmountsByRestaurant,
          startingAmount: 0,
          active: cashHolderForm.active,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save cash holder');
      }

      toast.success(isEditing ? 'Cash holder updated' : 'Cash holder created');
      setCashHolderForm(defaultCashHolderForm);
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
          <p className="text-gray-600">Manage logins and choose which users and cash holders belong to each restaurant.</p>
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
              <select
                value={userForm.role}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    role: event.target.value as AppUser['role'],
                    restaurantIds: event.target.value === 'super_admin' ? [] : current.restaurantIds,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              >
                <option value="restaurant_admin">Restaurant User</option>
                <option value="super_admin">Super Admin</option>
              </select>

              {userForm.role !== 'super_admin' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Restaurant Access</p>
                  {restaurants.map((restaurant) => (
                    <label key={restaurant.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={userForm.restaurantIds.includes(restaurant.id)}
                        onChange={() =>
                          toggleRestaurantSelection(restaurant.id, userForm.restaurantIds, (next) =>
                            setUserForm((current) => ({ ...current, restaurantIds: next }))
                          )
                        }
                      />
                      {restaurant.name}
                    </label>
                  ))}
                  <p className="text-xs text-gray-500">Choose one restaurant or both.</p>
                </div>
              )}

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
              {users.map((user) => (
                <div key={user.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-600">
                        {user.role === 'super_admin'
                          ? 'Super admin'
                          : user.restaurantIds
                              .map((restaurantId) => restaurants.find((restaurant) => restaurant.id === restaurantId)?.name)
                              .filter(Boolean)
                              .join(', ')}
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
                          restaurantIds: user.restaurantIds,
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
                placeholder="Cash holder name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                required
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Show In Restaurants</p>
                {restaurants.map((restaurant) => {
                  const isSelected = cashHolderForm.restaurantIds.includes(restaurant.id);
                  return (
                    <div key={restaurant.id} className="rounded-lg border border-gray-200 p-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleRestaurantSelection(restaurant.id, cashHolderForm.restaurantIds, (next) =>
                              setCashHolderForm((current) => ({
                                ...current,
                                restaurantIds: next,
                                startingAmountsByRestaurant: {
                                  ...current.startingAmountsByRestaurant,
                                  [restaurant.id]: current.startingAmountsByRestaurant[restaurant.id] || '0',
                                },
                              }))
                            )
                          }
                        />
                        {restaurant.name}
                      </label>
                      {isSelected && (
                        <input
                          type="number"
                          step="0.01"
                          value={cashHolderForm.startingAmountsByRestaurant[restaurant.id] || '0'}
                          onChange={(event) =>
                            setCashHolderForm((current) => ({
                              ...current,
                              startingAmountsByRestaurant: {
                                ...current.startingAmountsByRestaurant,
                                [restaurant.id]: event.target.value,
                              },
                            }))
                          }
                          placeholder={`Starting amount for ${restaurant.name}`}
                          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

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
                  {cashHolderForm.id ? 'Update Cash Holder' : 'Create Cash Holder'}
                </button>
                {cashHolderForm.id && (
                  <button
                    type="button"
                    onClick={() => setCashHolderForm(defaultCashHolderForm)}
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
                        Visible in:{' '}
                        {cashHolder.visibleRestaurantIds
                          .map((restaurantId) => restaurants.find((restaurant) => restaurant.id === restaurantId)?.name)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {cashHolder.visibleRestaurantIds
                          .map((restaurantId) => {
                            const restaurantName = restaurants.find((restaurant) => restaurant.id === restaurantId)?.name;
                            const amount = cashHolder.startingAmountsByRestaurant[restaurantId] ?? 0;
                            return `${restaurantName}: $${amount.toFixed(2)}`;
                          })
                          .join(' • ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCashHolderForm({
                          id: cashHolder.id,
                          name: cashHolder.name,
                          restaurantIds: cashHolder.visibleRestaurantIds,
                          startingAmountsByRestaurant: Object.fromEntries(
                            Object.entries(cashHolder.startingAmountsByRestaurant).map(([restaurantId, amount]) => [
                              restaurantId,
                              String(amount),
                            ])
                          ),
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

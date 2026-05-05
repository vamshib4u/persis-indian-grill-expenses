import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { AppUser, Restaurant, SessionData, UserRole } from '@/types';
import { getUserById, getUserByUsername, listRestaurants } from '@/lib/db';
import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  verifySessionToken,
} from '@/lib/authToken';

const normalizeUser = (user: {
  id: string;
  username: string;
  role: UserRole;
  restaurantIds: string[];
  active: boolean;
  createdAt: Date | string;
}): AppUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  restaurantIds: user.restaurantIds,
  active: user.active,
  createdAt: user.createdAt,
});

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');

const getDefaultSuperAdminCredentials = () => ({
  username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
});

export const getPasswordHash = hashPassword;
export const getDefaultRestaurantCredentials = () => {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) {
    throw new Error('APP_USERNAME and APP_PASSWORD must be configured');
  }

  return { username, password };
};
export const getSuperAdminSeedCredentials = () => getDefaultSuperAdminCredentials();

export const verifyPassword = (password: string, passwordHash: string) => hashPassword(password) === passwordHash;

const resolveRestaurantsForUser = (user: AppUser, restaurants: Restaurant[]) => {
  if (user.role === 'super_admin') return restaurants;
  return restaurants.filter((restaurant) => user.restaurantIds.includes(restaurant.id));
};

const buildSessionData = async (
  userRecord: Awaited<ReturnType<typeof getUserById>>,
  activeRestaurantId?: string
): Promise<SessionData | null> => {
  if (!userRecord || !userRecord.active) return null;

  const user = normalizeUser(userRecord);
  const restaurants = resolveRestaurantsForUser(user, await listRestaurants());
  if (!restaurants.length) return null;

  const allowedRestaurantIds = new Set(restaurants.map((restaurant) => restaurant.id));
  const resolvedRestaurantId =
    activeRestaurantId && allowedRestaurantIds.has(activeRestaurantId)
      ? activeRestaurantId
      : restaurants[0].id;

  return {
    user,
    activeRestaurantId: resolvedRestaurantId,
    restaurants,
  };
};

export const authenticateUser = async (username: string, password: string) => {
  const user = await getUserByUsername(username);
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  return buildSessionData(user, user.restaurantIds[0] || undefined);
};

export const getSessionFromToken = async (token: string | undefined) => {
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  return buildSessionData(await getUserById(payload.userId), payload.activeRestaurantId);
};

export const getSessionFromRequest = async (request: NextRequest) => {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return getSessionFromToken(token);
};

export const getServerSession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  return getSessionFromToken(token);
};

export const canAccessRestaurant = (session: SessionData, restaurantId: string) =>
  session.restaurants.some((restaurant) => restaurant.id === restaurantId);

export const getDefaultRestaurantIdForUser = (user: AppUser) => user.restaurantIds[0] || '';

export { createSessionToken, getSessionCookieName, getSessionMaxAge };

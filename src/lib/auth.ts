import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { AppUser, Restaurant, SessionData, UserRole } from '@/types';
import { getUserById, getUserByUsername, listRestaurants } from '@/lib/db';

const SESSION_COOKIE = 'persis_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

const textEncoder = new TextEncoder();

type SessionTokenPayload = {
  userId: string;
  activeRestaurantId: string;
  expiresAt: number;
};

const base64UrlEncode = (input: string) =>
  Buffer.from(input, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
};

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return secret;
};

const sign = async (payload: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload));
  return Buffer.from(signature).toString('base64url');
};

const normalizeUser = (user: {
  id: string;
  username: string;
  role: UserRole;
  restaurantId?: string;
  active: boolean;
  createdAt: Date | string;
}): AppUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  restaurantId: user.restaurantId || undefined,
  active: user.active,
  createdAt: user.createdAt,
});

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');

const getDefaultSuperAdminCredentials = () => ({
  username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
});

export const getSessionCookieName = () => SESSION_COOKIE;
export const getSessionMaxAge = () => Math.floor(SESSION_DURATION_MS / 1000);
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

export const createSessionToken = async (payload: {
  userId: string;
  activeRestaurantId: string;
}) => {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const tokenPayload: SessionTokenPayload = { ...payload, expiresAt };
  const serialized = JSON.stringify(tokenPayload);
  const signature = await sign(serialized);
  return `${base64UrlEncode(serialized)}.${signature}`;
};

export const verifySessionToken = async (token: string | undefined) => {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const payload = base64UrlDecode(encodedPayload);
  const expectedSignature = await sign(payload);
  if (signature !== expectedSignature) return null;

  let parsed: SessionTokenPayload;
  try {
    parsed = JSON.parse(payload) as SessionTokenPayload;
  } catch {
    return null;
  }

  if (
    !parsed.userId ||
    !parsed.activeRestaurantId ||
    Number.isNaN(parsed.expiresAt) ||
    Date.now() > parsed.expiresAt
  ) {
    return null;
  }

  return parsed;
};

const resolveRestaurantsForUser = (user: AppUser, restaurants: Restaurant[]) => {
  if (user.role === 'super_admin') return restaurants;
  return restaurants.filter((restaurant) => restaurant.id === user.restaurantId);
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

  return buildSessionData(user, user.restaurantId || undefined);
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

export const getDefaultRestaurantIdForUser = (user: AppUser) => user.restaurantId || '';

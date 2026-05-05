import { NextRequest } from 'next/server';
import { UserRole } from '@/types';

const SESSION_COOKIE = 'persis_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type SessionTokenPayload = {
  userId: string;
  role: UserRole;
  activeRestaurantId: string;
  expiresAt: number;
};

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return secret;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (base64: string) => {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const base64UrlEncodeText = (input: string) =>
  bytesToBase64(textEncoder.encode(input)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecodeText = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return textDecoder.decode(base64ToBytes(`${normalized}${padding}`));
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
  return bytesToBase64(new Uint8Array(signature)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const getSessionCookieName = () => SESSION_COOKIE;
export const getSessionMaxAge = () => Math.floor(SESSION_DURATION_MS / 1000);

export const createSessionToken = async (payload: {
  userId: string;
  role: UserRole;
  activeRestaurantId: string;
}) => {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const tokenPayload: SessionTokenPayload = { ...payload, expiresAt };
  const serialized = JSON.stringify(tokenPayload);
  const signature = await sign(serialized);
  return `${base64UrlEncodeText(serialized)}.${signature}`;
};

export const verifySessionToken = async (token: string | undefined) => {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const payload = base64UrlDecodeText(encodedPayload);
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
    !parsed.role ||
    !parsed.activeRestaurantId ||
    Number.isNaN(parsed.expiresAt) ||
    Date.now() > parsed.expiresAt
  ) {
    return null;
  }

  return parsed;
};

export const getTokenPayloadFromRequest = async (request: NextRequest) => {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return verifySessionToken(token);
};

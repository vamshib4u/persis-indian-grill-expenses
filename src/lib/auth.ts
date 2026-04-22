const SESSION_COOKIE = 'persis_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

const textEncoder = new TextEncoder();

const base64UrlEncode = (input: string) =>
  btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
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
  const bytes = Array.from(new Uint8Array(signature), (byte) => String.fromCharCode(byte)).join('');
  return base64UrlEncode(bytes);
};

export const getSessionCookieName = () => SESSION_COOKIE;

export const getAuthCredentials = () => {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) {
    throw new Error('APP_USERNAME and APP_PASSWORD must be configured');
  }

  return { username, password };
};

export const createSessionToken = async (username: string) => {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}.${expiresAt}`;
  const signature = await sign(payload);
  return `${base64UrlEncode(payload)}.${signature}`;
};

export const verifySessionToken = async (token: string | undefined) => {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const payload = base64UrlDecode(encodedPayload);
  const expectedSignature = await sign(payload);
  if (signature !== expectedSignature) return null;

  const [username, expiresAtRaw] = payload.split('.');
  const expiresAt = Number(expiresAtRaw);
  if (!username || Number.isNaN(expiresAt) || Date.now() > expiresAt) return null;

  return { username, expiresAt };
};

export const getSessionMaxAge = () => Math.floor(SESSION_DURATION_MS / 1000);

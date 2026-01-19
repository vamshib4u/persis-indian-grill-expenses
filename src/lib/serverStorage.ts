import fs from 'fs/promises';
import path from 'path';
import { kv } from '@vercel/kv';

const STORAGE_DIR = path.resolve(process.cwd(), '.persist');
const TOKENS_FILE = path.join(STORAGE_DIR, 'google_tokens.json');
const TOKENS_KEY = 'google_tokens';

const hasKvConfig = () =>
  !!(process.env.KV_URL || process.env.VERCEL_KV_REST_API_URL);

export async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function saveTokens(tokens: Record<string, unknown>) {
  if (hasKvConfig()) {
    await kv.set(TOKENS_KEY, tokens);
    return;
  }
  await ensureStorageDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), { encoding: 'utf-8' });
}

export async function loadTokens(): Promise<Record<string, unknown> | null> {
  if (hasKvConfig()) {
    const stored = await kv.get<Record<string, unknown>>(TOKENS_KEY);
    return stored || null;
  }
  try {
    const raw = await fs.readFile(TOKENS_FILE, { encoding: 'utf-8' });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearTokens() {
  if (hasKvConfig()) {
    await kv.del(TOKENS_KEY);
    return;
  }
  try {
    await fs.unlink(TOKENS_FILE);
  } catch {
    // ignore
  }
}

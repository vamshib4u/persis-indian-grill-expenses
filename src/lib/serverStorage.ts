import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.resolve(process.cwd(), '.persist');
const TOKENS_FILE = path.join(STORAGE_DIR, 'google_tokens.json');

export async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function saveTokens(tokens: Record<string, unknown>) {
  await ensureStorageDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), { encoding: 'utf-8' });
}

export async function loadTokens(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(TOKENS_FILE, { encoding: 'utf-8' });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearTokens() {
  try {
    await fs.unlink(TOKENS_FILE);
  } catch {
    // ignore
  }
}

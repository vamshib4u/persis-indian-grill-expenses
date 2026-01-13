import { NextResponse } from 'next/server';
import { loadTokens } from '@/lib/serverStorage';

export async function GET() {
  const tokens = await loadTokens();
  if (!tokens) return NextResponse.json({ authorized: false });
  return NextResponse.json({ authorized: true, hasRefreshToken: !!tokens.refresh_token, tokens: { expires_in: tokens.expires_in ? true : false } });
}

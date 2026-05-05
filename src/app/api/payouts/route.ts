import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { listTransactions } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await listTransactions(session.activeRestaurantId);
    const payouts = transactions.filter((transaction) => transaction.type === 'payout');
    return NextResponse.json({ payouts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load payouts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const expenses = transactions.filter((transaction) => transaction.type === 'expense');
    return NextResponse.json({ expenses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load expenses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

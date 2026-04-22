import { NextResponse } from 'next/server';
import { listTransactions } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const transactions = await listTransactions();
    const payouts = transactions.filter((transaction) => transaction.type === 'payout');
    return NextResponse.json({ payouts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load payouts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

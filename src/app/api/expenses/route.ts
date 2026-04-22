import { NextResponse } from 'next/server';
import { listTransactions } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const transactions = await listTransactions();
    const expenses = transactions.filter((transaction) => transaction.type === 'expense');
    return NextResponse.json({ expenses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load expenses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

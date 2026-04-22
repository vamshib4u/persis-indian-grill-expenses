import { NextRequest, NextResponse } from 'next/server';
import { listSales, listTransactions, replaceAllData } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [sales, transactions] = await Promise.all([listSales(), listTransactions()]);
    return NextResponse.json({ sales, transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await replaceAllData({
      sales: Array.isArray(body.sales) ? body.sales : [],
      transactions: Array.isArray(body.transactions) ? body.transactions : [],
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to replace data';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

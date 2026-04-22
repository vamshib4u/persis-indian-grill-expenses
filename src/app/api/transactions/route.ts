import { NextRequest, NextResponse } from 'next/server';
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const transactions = await listTransactions();
    return NextResponse.json({ transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load transactions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transaction = await createTransaction(body);
    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const transaction = await updateTransaction(body);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const deleted = await deleteTransaction(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete transaction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

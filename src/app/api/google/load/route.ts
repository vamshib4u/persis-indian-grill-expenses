import { NextRequest, NextResponse } from 'next/server';
import { readSheetRange } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const spreadsheetId =
      url.searchParams.get('spreadsheetId') ||
      process.env.GOOGLE_SHEET_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID not configured' }, { status: 400 });
    }

    const sales = await readSheetRange(spreadsheetId, 'Sales!A1:Z');
    const expenses = await readSheetRange(spreadsheetId, 'Expenses!A1:Z');
    const payouts = await readSheetRange(spreadsheetId, 'Payouts!A1:Z');

    return NextResponse.json({ sales, expenses, payouts });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('Not authorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

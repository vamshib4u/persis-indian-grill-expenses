import { NextRequest, NextResponse } from 'next/server';
import { serverSyncAll } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const { sales, transactions, month, year, spreadsheetId } = await request.json();

    await serverSyncAll(spreadsheetId, sales, transactions, month, year);

    return NextResponse.json({
      success: true,
      message: 'Synced to Google Sheets',
      spreadsheetId: spreadsheetId || process.env.GOOGLE_SHEET_ID || process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID,
    });
  } catch (error) {
    console.error('Server sync error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

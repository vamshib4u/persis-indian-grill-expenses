import { NextRequest, NextResponse } from 'next/server';
import { DailySales, Transaction } from '@/types';
import { generateMonthlyReport, formatDate } from '@/lib/utils';
import { getCashHoldingSummary } from '@/lib/cashHolding';

export async function POST(request: NextRequest) {
  try {
    const { sales, transactions, month, year } = (await request.json()) as {
      sales: DailySales[];
      transactions: Transaction[];
      month: number;
      year: number;
    };

    if (!process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID) {
      return NextResponse.json(
        { error: 'Google Sheets ID not configured. See DEPLOYMENT_GUIDE.md for setup.' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    // Prepare data (formatted for manual copy-paste or API call)
    const expenses = transactions.filter((t: Transaction) => t.type === 'expense');
    const payouts = transactions.filter((t: Transaction) => t.type === 'payout');
    const summary = generateMonthlyReport(sales, transactions, month, year);

    // Format data as structured objects
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const salesData = sortedSales.map((s: DailySales) => ({
      Month: monthName,
      Date: formatDate(s.date),
      'Square Sales': s.squareSales,
      'Cash Collected': s.cashCollected,
      Total: s.squareSales + s.cashCollected,
      Notes: s.notes || '',
      'Cash Holder': s.cashHolder || '',
    }));

    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const expensesData = sortedExpenses.map((e: Transaction) => ({
      Month: monthName,
      Date: formatDate(e.date),
      Category: e.category || '',
      Description: e.description || '',
      Amount: e.amount,
      'Payment Method': e.paymentMethod,
      'Spent By': e.spentBy || '',
      Notes: e.notes || '',
    }));

    const sortedPayouts = [...payouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const payoutsData = sortedPayouts.map((p: Transaction) => ({
      Month: monthName,
      Date: formatDate(p.date),
      Payee: p.payeeName || '',
      Purpose: p.purpose || '',
      Amount: p.amount,
      'Payment Method': p.paymentMethod,
      Notes: p.notes || '',
    }));

    const summaryData = {
      Month: monthName,
      'Total Sales': summary.totalIncome,
      'Total Expenses': summary.totalExpenses,
      'Total Payouts': summary.totalPayouts,
      'Net Profit': summary.netCash,
      'Square Sales': summary.squareSales,
      'Cash Collected': summary.unreportedCash,
    };

    const cashHolding = getCashHoldingSummary(sales, transactions, month, year);
    const cashHolderSummary = cashHolding.rows.map(row => ({
      'Cash Holder': row.name,
      'Opening Balance': row.opening,
      'Cash Collected': row.collected,
      'Cash Expenses': row.expenses,
      'Closing Balance': row.closing,
    }));
    cashHolderSummary.push({
      'Cash Holder': 'Total',
      'Opening Balance': cashHolding.totals.opening,
      'Cash Collected': cashHolding.totals.collected,
      'Cash Expenses': cashHolding.totals.expenses,
      'Closing Balance': cashHolding.totals.closing,
    });

    // TODO: Implement actual Google Sheets API sync when OAuth is configured
    // For now, return the formatted data for manual entry or future integration
    
    console.log('Data prepared for Google Sheets sync:', {
      sales: salesData,
      expenses: expensesData,
      payouts: payoutsData,
      summary: summaryData,
      cashHolders: cashHolderSummary,
    });

    return NextResponse.json({
      success: true,
      message: `Data prepared for ${monthName}. Download the JSON file from the app and import it to Google Sheets using File → Import.`,
      sheetsUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      importGuide: 'See IMPORT_JSON_TO_SHEETS.md for instructions on how to import downloaded JSON to your Google Sheet.',
      data: {
        sales: salesData,
        expenses: expensesData,
        payouts: payoutsData,
        summary: summaryData,
        cashHolders: cashHolderSummary,
      },
    });
  } catch (error) {
    console.error('Sync to Google Sheets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

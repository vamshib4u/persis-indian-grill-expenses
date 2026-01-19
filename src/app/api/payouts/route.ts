import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  return NextResponse.json({
    message: 'Payouts API endpoint',
    action,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.date || !body.payeeName || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: body,
      message: 'Payout recorded successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: body,
      message: 'Payout updated successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Payout deleted successfully',
  });
}

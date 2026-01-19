import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // This is a placeholder - in production, read from database
  return NextResponse.json({
    message: 'Sales API endpoint',
    action,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate data structure
    if (!body.date || body.squareSales === undefined || body.cashCollected === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, save to database
    return NextResponse.json({
      success: true,
      data: body,
      message: 'Sale recorded successfully',
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

    // In production, update in database
    return NextResponse.json({
      success: true,
      data: body,
      message: 'Sale updated successfully',
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

  // In production, delete from database
  return NextResponse.json({
    success: true,
    message: 'Sale deleted successfully',
  });
}

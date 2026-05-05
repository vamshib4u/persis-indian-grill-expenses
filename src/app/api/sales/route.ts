import { NextRequest, NextResponse } from 'next/server';
import { canAccessRestaurant, getSessionFromRequest } from '@/lib/auth';
import { createSale, deleteSale, listSales, updateSale } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sales = await listSales(session.activeRestaurantId);
    return NextResponse.json({ sales });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load sales';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const restaurantId =
      typeof body.restaurantId === 'string' && canAccessRestaurant(session, body.restaurantId)
        ? body.restaurantId
        : session.activeRestaurantId;
    const sale = await createSale({ ...body, restaurantId });
    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const restaurantId =
      typeof body.restaurantId === 'string' && canAccessRestaurant(session, body.restaurantId)
        ? body.restaurantId
        : session.activeRestaurantId;
    const sale = await updateSale({ ...body, restaurantId });
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, sale });
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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restaurantId =
      searchParams.get('restaurantId') && canAccessRestaurant(session, searchParams.get('restaurantId')!)
        ? searchParams.get('restaurantId')!
        : session.activeRestaurantId;

    const deleted = await deleteSale(id, restaurantId);
    if (!deleted) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete sale';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

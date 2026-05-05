import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createCashHolder, updateCashHolder } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const cashHolder = await createCashHolder({
      id: body.id,
      name: body.name,
      restaurantIds: Array.isArray(body.restaurantIds) ? body.restaurantIds : [],
      startingAmountsByRestaurant:
        typeof body.startingAmountsByRestaurant === 'object' && body.startingAmountsByRestaurant
          ? body.startingAmountsByRestaurant
          : {},
      startingAmount: body.startingAmount,
      active: body.active,
    });
    return NextResponse.json({ cashHolder }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create cash holder';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const cashHolder = await updateCashHolder({
      id: body.id,
      name: body.name,
      restaurantIds: Array.isArray(body.restaurantIds) ? body.restaurantIds : [],
      startingAmountsByRestaurant:
        typeof body.startingAmountsByRestaurant === 'object' && body.startingAmountsByRestaurant
          ? body.startingAmountsByRestaurant
          : {},
      active: body.active,
    });
    if (!cashHolder) {
      return NextResponse.json({ error: 'Cash holder not found' }, { status: 404 });
    }
    return NextResponse.json({ cashHolder });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update cash holder';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

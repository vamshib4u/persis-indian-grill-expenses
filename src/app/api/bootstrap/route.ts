import { NextRequest, NextResponse } from 'next/server';
import { canAccessRestaurant, getSessionFromRequest } from '@/lib/auth';
import {
  listCashHolders,
  listCateringOrders,
  listSales,
  listTransactions,
  replaceRestaurantData,
} from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restaurantId = session.activeRestaurantId;
    const [sales, transactions, cateringOrders, cashHolders] = await Promise.all([
      listSales(restaurantId),
      listTransactions(restaurantId),
      listCateringOrders(restaurantId),
      listCashHolders(restaurantId),
    ]);

    return NextResponse.json({
      sales,
      transactions,
      cateringOrders,
      cashHolders,
      session,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const result = await replaceRestaurantData({
      restaurantId,
      sales: Array.isArray(body.sales) ? body.sales : [],
      transactions: Array.isArray(body.transactions) ? body.transactions : [],
      cateringOrders: Array.isArray(body.cateringOrders) ? body.cateringOrders : [],
    });

    const cashHolders = await listCashHolders(restaurantId);

    return NextResponse.json({
      ...result,
      cashHolders,
      session: {
        ...session,
        activeRestaurantId: restaurantId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to replace data';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

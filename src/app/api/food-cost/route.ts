import { NextRequest, NextResponse } from 'next/server';
import { canAccessRestaurant, getSessionFromRequest } from '@/lib/auth';
import {
  deleteIngredientPrice,
  deleteMenuItemCost,
  deleteOperatingCost,
  listIngredientPrices,
  listMenuItemCosts,
  listOperatingCosts,
  upsertIngredientPrice,
  upsertMenuItemCost,
  upsertOperatingCost,
} from '@/lib/db';
import { FoodCostRecordType } from '@/types';

export const runtime = 'nodejs';

const isSuperAdmin = async (request: NextRequest) => {
  const session = await getSessionFromRequest(request);
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (session.user.role !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
};

const resolveRestaurantId = (
  session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>,
  restaurantId: unknown
) => {
  if (typeof restaurantId === 'string' && canAccessRestaurant(session, restaurantId)) {
    return restaurantId;
  }
  return session.activeRestaurantId;
};

export async function GET(request: NextRequest) {
  try {
    const auth = await isSuperAdmin(request);
    if (auth.error) return auth.error;

    const restaurantId = resolveRestaurantId(auth.session, request.nextUrl.searchParams.get('restaurantId'));
    const [ingredientPrices, operatingCosts, menuItems] = await Promise.all([
      listIngredientPrices(restaurantId),
      listOperatingCosts(restaurantId),
      listMenuItemCosts(restaurantId),
    ]);

    return NextResponse.json({
      restaurantId,
      ingredientPrices,
      operatingCosts,
      menuItems,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load food cost data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await isSuperAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const recordType = body.recordType as FoodCostRecordType | undefined;
    const restaurantId = resolveRestaurantId(auth.session, body.restaurantId);

    if (recordType === 'ingredient') {
      const ingredientPrice = await upsertIngredientPrice({ ...body, restaurantId });
      return NextResponse.json({ ingredientPrice }, { status: 201 });
    }

    if (recordType === 'operating_cost') {
      const operatingCost = await upsertOperatingCost({ ...body, restaurantId });
      return NextResponse.json({ operatingCost }, { status: 201 });
    }

    if (recordType === 'menu_item') {
      const menuItem = await upsertMenuItemCost({ ...body, restaurantId });
      return NextResponse.json({ menuItem }, { status: 201 });
    }

    return NextResponse.json({ error: 'recordType is required' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid food cost request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await isSuperAdmin(request);
    if (auth.error) return auth.error;

    const id = request.nextUrl.searchParams.get('id');
    const recordType = request.nextUrl.searchParams.get('recordType') as FoodCostRecordType | null;
    if (!id || !recordType) {
      return NextResponse.json({ error: 'id and recordType are required' }, { status: 400 });
    }

    const restaurantId = resolveRestaurantId(auth.session, request.nextUrl.searchParams.get('restaurantId'));
    const deleted =
      recordType === 'ingredient'
        ? await deleteIngredientPrice(id, restaurantId)
        : recordType === 'operating_cost'
          ? await deleteOperatingCost(id, restaurantId)
          : recordType === 'menu_item'
            ? await deleteMenuItemCost(id, restaurantId)
            : false;

    if (!deleted) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete food cost record';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { listCashHoldersForAdmin, listRestaurants, listUsers } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const restaurants = await listRestaurants();
  const users = await listUsers();
  const cashHolders = await listCashHoldersForAdmin();

  return NextResponse.json({
    session,
    restaurants,
    users,
    cashHolders,
  });
}

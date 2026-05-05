import { NextRequest, NextResponse } from 'next/server';
import {
  canAccessRestaurant,
  createSessionToken,
  getSessionCookieName,
  getSessionFromRequest,
  getSessionMaxAge,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ session });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const restaurantId = typeof body.restaurantId === 'string' ? body.restaurantId : '';
  if (!restaurantId || !canAccessRestaurant(session, restaurantId)) {
    return NextResponse.json({ error: 'Invalid restaurant selection' }, { status: 400 });
  }

  const token = await createSessionToken({
    userId: session.user.id,
    role: session.user.role,
    activeRestaurantId: restaurantId,
  });
  const response = NextResponse.json({
    session: {
      ...session,
      activeRestaurantId: restaurantId,
    },
  });

  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionMaxAge(),
  });

  return response;
}

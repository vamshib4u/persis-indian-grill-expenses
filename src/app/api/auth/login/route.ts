import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser,
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const session = await authenticateUser(username, password);

    if (!session) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: session.user.id,
      role: session.user.role,
      activeRestaurantId: session.activeRestaurantId,
    });
    const response = NextResponse.json({ success: true, session });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: getSessionMaxAge(),
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

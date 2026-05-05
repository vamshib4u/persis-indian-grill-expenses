import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createUser, updateUser } from '@/lib/db';

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
    const user = await createUser({
      id: body.id,
      username: body.username,
      password: body.password,
      role: body.role,
      restaurantId: body.restaurantId,
      active: body.active,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
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
    const user = await updateUser({
      id: body.id,
      username: body.username,
      password: body.password,
      role: body.role,
      restaurantId: body.restaurantId,
      active: body.active,
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

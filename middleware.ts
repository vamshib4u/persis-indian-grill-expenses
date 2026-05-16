import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayloadFromRequest } from '@/lib/authToken';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  const session = await getTokenPayloadFromRequest(request);

  if (PUBLIC_PATHS.includes(pathname)) {
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/food-cost') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/food-cost')
  ) {
    if (session.role !== 'super_admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};

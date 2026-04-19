import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // If trying to access the dashboard without a token, redirect to login
  if (request.nextUrl.pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login/register while ALREADY logged in, redirect to dashboard
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    // Expiration check
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getDesignatedPortal(role: string): string {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin' || r === 'super admin') return '/dashboard';
  if (r === 'staff' || r === 'faculty') return '/staff';
  if (r === 'office' || r === 'accountant') return '/office';
  if (r === 'library' || r === 'librarian') return '/library';
  if (r === 'lab' || r === 'lab assistant') return '/lab';
  if (r === 'student') return '/student';
  return '/dashboard';
}

function isPortalAllowed(role: string, pathname: string): boolean {
  const r = (role || '').toLowerCase().trim();
  const isAdmin = r === 'admin' || r === 'super admin';

  // Admins can access all portals
  if (isAdmin) return true;

  if (pathname.startsWith('/dashboard')) {
    return false; // Only Admin can access main dashboard & user management
  }

  if (pathname.startsWith('/staff')) {
    return r === 'staff' || r === 'faculty';
  }

  if (pathname.startsWith('/library')) {
    return r === 'library' || r === 'librarian';
  }

  if (pathname.startsWith('/lab')) {
    return r === 'lab' || r === 'lab assistant';
  }

  if (pathname.startsWith('/office')) {
    return r === 'office' || r === 'accountant';
  }

  if (pathname.startsWith('/student')) {
    return r === 'student';
  }

  return true;
}

function getLoginRoleForPath(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Admin';
  if (pathname.startsWith('/staff')) return 'Staff';
  if (pathname.startsWith('/library')) return 'Librarian';
  if (pathname.startsWith('/lab')) return 'Lab';
  if (pathname.startsWith('/office')) return 'Office';
  if (pathname.startsWith('/student')) return 'Student';
  return 'Admin';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get('auth_token')?.value;
  const userPayload = authToken ? parseJwtPayload(authToken) : null;

  // If not logged in or token is invalid/expired
  if (!userPayload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('role', getLoginRoleForPath(pathname));
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if role is authorized to access the requested portal
  if (!isPortalAllowed(userPayload.role, pathname)) {
    // Redirect user to their own portal
    const targetPortal = getDesignatedPortal(userPayload.role);
    const redirectUrl = new URL(targetPortal, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/staff/:path*',
    '/library/:path*',
    '/lab/:path*',
    '/office/:path*',
    '/student/:path*',
  ],
};

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { query as pgQuery } from '@/lib/postgres';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function getPortalForRole(role: string): string {
  const rLower = (role || '').toLowerCase();
  if (rLower.includes('staff') || rLower.includes('faculty') || rLower.includes('teacher') || rLower.includes('hod')) {
    return '/staff';
  }
  if (rLower.includes('librar')) {
    return '/library';
  }
  if (rLower.includes('lab')) {
    return '/lab';
  }
  if (rLower.includes('office') || rLower.includes('accountant')) {
    return '/office';
  }
  if (rLower.includes('student')) {
    return '/student';
  }
  return '/dashboard';
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string, email?: string, role?: string };
    
    let userObj: any = null;

    // 1. Check MongoDB
    try {
      await connectToDatabase();
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        userObj = user.toObject();
      }
    } catch (_) {}

    // 2. Fallback to PostgreSQL
    if (!userObj) {
      try {
        const pgRes = await pgQuery(
          `SELECT id, email, role, first_name as "firstName", last_name as "lastName", phone, address, dob, gender, employee_id as "employeeId", status, profile_photo as "profilePhoto", department, designation FROM users WHERE id = $1 OR email = $2 LIMIT 1`,
          [decoded.id, decoded.email || '']
        );
        if (pgRes.rows.length > 0) {
          userObj = pgRes.rows[0];
        }
      } catch (_) {}
    }

    if (!userObj) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const portal = getPortalForRole(userObj.role);
    const fullName = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || userObj.name || "User";

    return NextResponse.json({
      ...userObj,
      name: fullName,
      portal
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
  }
}


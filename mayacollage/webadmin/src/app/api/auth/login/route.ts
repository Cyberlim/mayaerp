import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { query as pgQuery } from '@/lib/postgres';

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

function isRoleAllowed(userRole: string, requestedRole: string | null | undefined): boolean {
  if (!requestedRole || requestedRole === 'All') return true;
  const uRole = (userRole || '').toLowerCase();
  const req = (requestedRole || '').toLowerCase();

  if (req === 'staff' || req === 'faculty') {
    return uRole.includes('staff') || uRole.includes('faculty') || uRole.includes('teacher') || uRole.includes('hod');
  }
  if (req === 'admin' || req === 'super admin') {
    return uRole.includes('admin') || uRole.includes('principal');
  }
  if (req === 'library' || req === 'librarian') {
    return uRole.includes('librar');
  }
  if (req === 'lab' || req === 'lab assistant') {
    return uRole.includes('lab');
  }
  if (req === 'office') {
    return uRole.includes('office') || uRole.includes('accountant');
  }
  if (req === 'student') {
    return uRole.includes('student');
  }
  return uRole === req;
}

export async function POST(request: Request) {
  try {
    const { email, password, role: requestedRole } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    const cleanInput = (email || '').trim();
    const cleanLower = cleanInput.toLowerCase();

    let user: any = null;

    // 1. Try finding in MongoDB
    try {
      await connectToDatabase();
      user = await User.findOne({
        $or: [
          { email: cleanLower },
          { email: cleanInput },
          { employeeId: cleanInput }
        ]
      });
    } catch (mongoErr) {
      console.warn("Mongo find error in login:", mongoErr);
    }

    // 2. If not found in MongoDB, check PostgreSQL users table
    if (!user) {
      try {
        const pgRes = await pgQuery(
          `SELECT * FROM users WHERE LOWER(email) = $1 OR employee_id = $2 LIMIT 1`,
          [cleanLower, cleanInput]
        );
        if (pgRes.rows.length > 0) {
          const row = pgRes.rows[0];
          user = {
            _id: row.id,
            id: row.id,
            email: row.email,
            password: row.password,
            role: row.role,
            firstName: row.first_name,
            lastName: row.last_name,
            phone: row.phone,
            address: row.address,
            dob: row.dob,
            gender: row.gender,
            employeeId: row.employee_id,
            status: row.status,
            profilePhoto: row.profile_photo,
            department: row.department,
            designation: row.designation
          };
        }
      } catch (pgErr) {
        console.warn("PostgreSQL find error in login:", pgErr);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials. User not found.' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return NextResponse.json(
        { error: 'Your account is deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Role Enforcement: check if user's role permits access to the requested role portal
    if (requestedRole && !isRoleAllowed(user.role, requestedRole)) {
      return NextResponse.json(
        { error: `Access denied: Your account is designated as '${user.role}' and cannot access the '${requestedRole}' gateway.` },
        { status: 403 }
      );
    }

    // Password verification
    let isMatch = await bcrypt.compare(password, user.password);

    // Fallback for plaintext passwords
    if (!isMatch && password === user.password) {
      isMatch = true;
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      try {
        await User.findByIdAndUpdate(user._id, { password: hashed });
        await pgQuery('UPDATE users SET password = $2 WHERE email = $1', [user.email, hashed]);
      } catch (_) {}
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your credentials.' },
        { status: 401 }
      );
    }

    const portal = getPortalForRole(user.role);
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || "User";

    // Sign JWT
    const token = jwt.sign(
      { 
        id: user._id || user.id, 
        email: user.email, 
        role: user.role,
        portal,
        name: fullName,
        employeeId: user.employeeId || ''
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const userDetails = {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      portal,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: fullName,
      phone: user.phone || '',
      employeeId: user.employeeId || '',
      profilePhoto: user.profilePhoto || '',
      department: user.department || '',
      status: user.status || 'Active'
    };

    const response = NextResponse.json(
      { 
        message: 'Login successful', 
        user: userDetails 
      },
      { status: 200 }
    );

    // Set HTTP-only auth_token cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


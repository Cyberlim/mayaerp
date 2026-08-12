import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    const { email, password, role: requestedRole } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    console.log("Login attempt:", email);
    console.log("User found:", user ? user.role : "null");

    if (!user) {
      console.log("User not found in DB");
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Role Enforcement: Ensure the user is actually logging into their allowed role type
    if (requestedRole) {
      if ((requestedRole === 'Staff' || requestedRole === 'Faculty') && (user.role !== 'Staff' && user.role !== 'Faculty')) {
        return NextResponse.json({ error: 'Access denied: You do not have Staff privileges.' }, { status: 403 });
      }
      if ((requestedRole === 'Admin' || requestedRole === 'Super Admin' || requestedRole === 'Business Administrator') && (user.role !== 'Admin' && user.role !== 'Super Admin' && user.role !== 'Business Administrator')) {
        return NextResponse.json({ error: 'Access denied: You do not have Admin privileges.' }, { status: 403 });
      }
      if (requestedRole === 'Student' && user.role !== 'Student') {
        return NextResponse.json({ error: 'Access denied: You do not have Student privileges.' }, { status: 403 });
      }
      if (requestedRole === 'Office' && user.role !== 'Office') {
        return NextResponse.json({ error: 'Access denied: You do not have Office privileges.' }, { status: 403 });
      }
      if ((requestedRole === 'Librarian' || requestedRole === 'Library') && (user.role !== 'Librarian' && user.role !== 'Library')) {
        return NextResponse.json({ error: 'Access denied: You are not a Librarian.' }, { status: 403 });
      }
      if (requestedRole === 'Lab' && user.role !== 'Lab') {
        return NextResponse.json({ error: 'Access denied: You do not have Lab privileges.' }, { status: 403 });
      }
    }

    let isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    // Fallback for unhashed seeded passwords
    if (!isMatch && password === user.password) {
      isMatch = true;
      console.log("Matched plaintext password. Hashing and updating...");
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    const response = NextResponse.json(
      { message: 'Login successful', user: { email: user.email, role: user.role, name: `${user.firstName} ${user.lastName}` } },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

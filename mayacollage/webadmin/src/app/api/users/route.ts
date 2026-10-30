import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { query as pgQuery } from "@/lib/postgres";
import bcrypt from "bcryptjs";
import { delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Try PostgreSQL first for speed
    try {
      const pgRes = await pgQuery(`
        SELECT id as _id, id, email, role, first_name as "firstName", last_name as "lastName", 
               phone, address, dob, gender, employee_id as "employeeId", status, 
               profile_photo as "profilePhoto", department, designation, created_at as "createdAt"
        FROM users
        ORDER BY created_at DESC
      `);
      if (pgRes.rows.length > 0) {
        return NextResponse.json(pgRes.rows);
      }
    } catch (pgErr) {
      console.warn("PostgreSQL users GET fallback to MongoDB:", pgErr);
    }

    // 2. Fallback to MongoDB
    await connectDB();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Users GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const role = (body.role || "Staff").trim();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const phone = (body.phone || body.mobile || "").trim();
    const address = (body.address || "").trim();
    const dob = (body.dob || "").trim();
    const gender = (body.gender || "").trim();
    const employeeId = (body.employeeId || "").trim();
    const status = body.status || "Active";
    const profilePhoto = body.profilePhoto || "";
    const department = (body.department || "").trim();
    const designation = (body.designation || role).trim();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    await connectDB();

    // Check if email already exists in MongoDB
    const existingMongo = await User.findOne({ email });
    if (existingMongo) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Save in MongoDB
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
      dob,
      gender,
      employeeId,
      status,
      profilePhoto,
      department,
      designation
    });
    await newUser.save();

    const userId = newUser._id.toString();

    // 2. Dual-save in PostgreSQL
    try {
      await pgQuery(`
        INSERT INTO users (
          id, email, password, role, first_name, last_name, phone, address, dob, gender, 
          employee_id, status, profile_photo, department, designation, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          dob = EXCLUDED.dob,
          gender = EXCLUDED.gender,
          employee_id = EXCLUDED.employee_id,
          status = EXCLUDED.status,
          profile_photo = EXCLUDED.profile_photo,
          department = EXCLUDED.department,
          designation = EXCLUDED.designation,
          updated_at = NOW()
      `, [
        userId, email, hashedPassword, role, firstName, lastName, phone, address, dob, gender,
        employeeId, status, profilePhoto, department, designation
      ]);
    } catch (pgError) {
      console.warn("PostgreSQL user insert warning:", pgError);
    }

    // Invalidate caches
    await delCachePattern("users:*").catch(() => {});

    // Return user without password
    const userSafe = newUser.toObject();
    delete userSafe.password;

    return NextResponse.json(userSafe, { status: 201 });
  } catch (error: any) {
    console.error("Users POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { query as pgQuery } from "@/lib/postgres";
import bcrypt from "bcryptjs";
import { delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Try PostgreSQL
    try {
      const pgRes = await pgQuery(`
        SELECT id as _id, id, email, role, first_name as "firstName", last_name as "lastName", 
               phone, address, dob, gender, employee_id as "employeeId", status, 
               profile_photo as "profilePhoto", department, designation, created_at as "createdAt"
        FROM users WHERE id = $1 OR email = $1 LIMIT 1
      `, [id]);
      if (pgRes.rows.length > 0) {
        return NextResponse.json(pgRes.rows[0]);
      }
    } catch (pgErr) {
      console.warn("PG user GET error, falling back to Mongo:", pgErr);
    }

    // 2. Fallback to MongoDB
    await connectDB();
    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("User GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    // Hash password if provided
    let hashedPassword = undefined;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
      body.password = hashedPassword;
    } else {
      delete body.password; // Don't override existing password if not provided
    }

    const updatedUser = await User.findByIdAndUpdate(id, body, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Dual-update in PostgreSQL
    try {
      const email = (body.email || updatedUser.email).trim().toLowerCase();
      const role = body.role || updatedUser.role;
      const firstName = body.firstName !== undefined ? body.firstName : updatedUser.firstName;
      const lastName = body.lastName !== undefined ? body.lastName : updatedUser.lastName;
      const phone = body.phone !== undefined ? body.phone : updatedUser.phone;
      const address = body.address !== undefined ? body.address : updatedUser.address;
      const dob = body.dob !== undefined ? body.dob : updatedUser.dob;
      const gender = body.gender !== undefined ? body.gender : updatedUser.gender;
      const employeeId = body.employeeId !== undefined ? body.employeeId : updatedUser.employeeId;
      const status = body.status !== undefined ? body.status : updatedUser.status;
      const profilePhoto = body.profilePhoto !== undefined ? body.profilePhoto : updatedUser.profilePhoto;
      const department = body.department !== undefined ? body.department : updatedUser.department;
      const designation = body.designation !== undefined ? body.designation : updatedUser.designation;

      let updatePgSql = `
        UPDATE users SET
          email = $2, role = $3, first_name = $4, last_name = $5, phone = $6,
          address = $7, dob = $8, gender = $9, employee_id = $10, status = $11,
          profile_photo = $12, department = $13, designation = $14, updated_at = NOW()
      `;
      const updatePgParams: any[] = [
        id, email, role, firstName, lastName, phone, address, dob, gender, employeeId, status, profilePhoto, department, designation
      ];

      if (hashedPassword) {
        updatePgSql += `, password = $15 WHERE id = $1`;
        updatePgParams.push(hashedPassword);
      } else {
        updatePgSql += ` WHERE id = $1`;
      }

      await pgQuery(updatePgSql, updatePgParams);
    } catch (pgErr) {
      console.warn("PostgreSQL user PUT warning:", pgErr);
    }

    await delCachePattern("users:*").catch(() => {});

    const userSafe = updatedUser.toObject();
    delete userSafe.password;
    return NextResponse.json(userSafe);
  } catch (error: any) {
    console.error("User PUT Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const deletedUser = await User.findByIdAndDelete(id);

    // Delete in PostgreSQL
    try {
      await pgQuery('DELETE FROM users WHERE id = $1 OR email = $2', [id, deletedUser?.email || '']);
    } catch (pgErr) {
      console.warn("PostgreSQL user DELETE warning:", pgErr);
    }

    await delCachePattern("users:*").catch(() => {});

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("User DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


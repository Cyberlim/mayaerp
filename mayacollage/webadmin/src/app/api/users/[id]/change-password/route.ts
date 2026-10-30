import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const body = await req.json();
    
    if (!body.newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      resolvedParams.id, 
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
      const { query: pgQuery } = await import("@/lib/postgres");
      await pgQuery('UPDATE users SET password = $2, updated_at = NOW() WHERE id = $1 OR email = $3', [
        resolvedParams.id, hashedPassword, updatedUser.email
      ]);
    } catch (pgErr) {
      console.warn("PostgreSQL change password warning:", pgErr);
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";
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
    const updatedStudent = await Student.findByIdAndUpdate(
      resolvedParams.id, 
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

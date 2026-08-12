import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// We can just define a minimal User schema if not already globally available
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Fetch users who are Faculty or Staff
    const faculty = await User.find({ role: { $in: ['Faculty', 'Staff'] } }).select("firstName lastName email _id").lean();
    
    return NextResponse.json(faculty);
  } catch (error) {
    console.error("GET /api/faculty error:", error);
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
  }
}

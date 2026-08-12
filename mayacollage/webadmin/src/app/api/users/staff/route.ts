import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const staff = await User.find({
      role: { $in: ['Staff', 'Faculty', 'Accountant', 'Librarian', 'HOD', 'Principal'] },
      status: 'Active'
    }).select('firstName lastName email role employeeId');
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Staff GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

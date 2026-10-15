import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCache, setCache, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

const CACHE_KEY = "users:staff:list";

export async function GET() {
  try {
    // 1. Try Redis cache
    const cachedStaff = await getCache(CACHE_KEY);
    if (cachedStaff && Array.isArray(cachedStaff) && cachedStaff.length > 0) {
      return NextResponse.json(cachedStaff, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    await connectDB();
    const staff = await User.find({
      role: { $in: ['Staff', 'Faculty', 'Accountant', 'Librarian', 'HOD', 'Principal'] },
      status: 'Active'
    }).select('firstName lastName email role employeeId').lean();

    const formattedStaff = (staff || []).map((u: any) => ({
      _id: u._id?.toString() || u.id,
      id: u._id?.toString() || u.id,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      role: u.role || 'Staff',
      employeeId: u.employeeId || ''
    }));

    await setCache(CACHE_KEY, formattedStaff, DEFAULT_CACHE_TTL);

    return NextResponse.json(formattedStaff, {
      headers: { "X-Cache-Source": "MongoDB" }
    });
  } catch (error) {
    console.error("Staff GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


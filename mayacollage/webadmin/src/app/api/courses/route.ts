import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { Branch } from "@/models/Branch";
import { getCache, setCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "all";
    const cacheKey = `master:courses:${branchId}`;

    // 1. Try Redis cache (30 min TTL)
    const cachedCourses = await getCache(cacheKey);
    if (cachedCourses) {
      return NextResponse.json(cachedCourses);
    }

    await connectDB();
    let query = {};
    if (branchId !== "all") {
      query = { branchId };
    }

    const courses = await Course.find(query).populate("branchId").sort({ createdAt: -1 });

    // 2. Cache in Redis for 30 minutes
    await setCache(cacheKey, courses, DEFAULT_CACHE_TTL);

    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const course = await Course.create(body);

    // Invalidate courses cache
    await delCachePattern("master:courses:*");

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Branch } from "@/models/Branch";
import { getCache, setCache, delCache, DEFAULT_CACHE_TTL } from "@/lib/redis";

const CACHE_KEY = "master:branches";

export async function GET(request: Request) {
  try {
    // 1. Try Redis cache (30 min TTL)
    const cachedBranches = await getCache(CACHE_KEY);
    if (cachedBranches) {
      return NextResponse.json(cachedBranches);
    }

    await connectDB();
    const branches = await Branch.find({}).sort({ createdAt: -1 });

    // 2. Cache in Redis for 30 minutes
    await setCache(CACHE_KEY, branches, DEFAULT_CACHE_TTL);

    return NextResponse.json(branches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const branch = await Branch.create(body);

    // Invalidate branches cache
    await delCache(CACHE_KEY);

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

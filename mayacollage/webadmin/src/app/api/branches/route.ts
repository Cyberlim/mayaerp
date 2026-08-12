import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Branch } from "@/models/Branch";

export async function GET(request: Request) {
  try {
    await connectDB();
    const branches = await Branch.find({}).sort({ createdAt: -1 });
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
    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

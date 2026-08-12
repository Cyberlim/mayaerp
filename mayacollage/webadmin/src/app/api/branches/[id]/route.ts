import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Branch } from "@/models/Branch";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    return NextResponse.json(branch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const body = await request.json();
    const { id } = await params;
    const branch = await Branch.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    return NextResponse.json(branch);
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

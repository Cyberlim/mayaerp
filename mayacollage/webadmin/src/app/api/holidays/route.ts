import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Holiday } from "@/models/Holiday";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const branchId = searchParams.get("branchId");

    let query: any = {};
    if (branchId) {
      query.branchId = branchId;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Holidays GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { date, name, type, branchId } = body;

    if (!date || !name || !branchId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Normalize to midnight

    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Upsert holiday
    const holiday = await Holiday.findOneAndUpdate(
      { date: targetDate, branchId: branchId },
      { 
        branchId,
        date: targetDate,
        day: dayName,
        name,
        type: type || 'Other'
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(holiday, { status: 201 });
  } catch (error: any) {
    console.error("Holidays POST Error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "A holiday already exists on this date." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing holiday ID" }, { status: 400 });
    }

    await Holiday.findByIdAndDelete(id);
    return NextResponse.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Holidays DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

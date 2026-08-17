import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { sessionYear, selectedProgram, selectedBranch, newSemester } = body;

    let query: any = {};
    if (sessionYear) {
      query.$or = [
        { sessionYear: { $regex: sessionYear, $options: "i" } },
        { batch: sessionYear }
      ];
    }
    if (selectedProgram) query.selectedProgram = selectedProgram;
    if (selectedBranch) query.selectedBranch = selectedBranch;

    // We only update students who match the query
    if (Object.keys(query).length === 0) {
      return NextResponse.json({ error: "No filters applied for batch update to prevent mass accidental override." }, { status: 400 });
    }

    const result = await Student.updateMany(query, {
      $set: { selectedSemester: newSemester }
    });

    return NextResponse.json({
      message: "Batch update successful",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error: any) {
    console.error("Batch update error:", error);
    return NextResponse.json({ error: error.message || "Failed to perform batch update" }, { status: 500 });
  }
}

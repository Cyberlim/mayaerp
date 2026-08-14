import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { DeletedAttendance } from "@/models/DeletedAttendance";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Parse the request body for branch, course, and dates (optional, for safety)
    const body = await req.json();
    const { branchId, courseId, startDate, endDate } = body;

    let query: any = {};
    
    // If specific parameters are provided, we can filter the restore
    if (branchId && courseId) {
       // Note: We don't have branch/course directly in DeletedAttendance, 
       // but we could look up the students first. 
       // Alternatively, since the user just wants a 1-time undo for their recent action,
       // we can just restore ALL records currently in DeletedAttendance.
       // Let's keep it simple and just restore everything in DeletedAttendance.
    }

    const recordsToRestore = await DeletedAttendance.find(query).lean();

    if (recordsToRestore.length === 0) {
      return NextResponse.json({ success: false, message: "No deleted attendance records found to restore." }, { status: 404 });
    }

    // Prepare records for insertion back into Attendance
    const restoreData = recordsToRestore.map((record: any) => {
      const { _id, deletedAt, resetReason, createdAt, updatedAt, __v, ...originalData } = record;
      return originalData;
    });

    // Insert back into Attendance
    await Attendance.insertMany(restoreData);

    // Clear the DeletedAttendance collection so it's a "one time only" restore
    await DeletedAttendance.deleteMany(query);

    return NextResponse.json({ success: true, count: restoreData.length, message: "Attendance restored successfully!" });

  } catch (error: any) {
    console.error("Attendance Restore Error:", error);
    // If there's a duplicate key error (11000), it means the records were already restored or existing records overlap.
    if (error.code === 11000) {
        return NextResponse.json({ error: "Some records already exist and cannot be duplicated." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

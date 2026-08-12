import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const courseId = searchParams.get("courseId");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");
    const dateStr = searchParams.get("date");
    const studentIdsStr = searchParams.get("studentIds"); // Comma-separated student IDs
    const subject = searchParams.get("subject");

    if (!dateStr || !studentIdsStr) {
      return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
    }

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const actualSubject = subject || 'General Attendance';
    const subjCode = actualSubject.substring(0, 3).toUpperCase();

    const studentIds = studentIdsStr.split(',');

    // 1. Fetch Students
    const students = await Student.find({
      _id: { $in: studentIds }
    }).select('_id studentId firstName lastName applicantPhoto');

    // 2. Fetch existing attendance for these students on this date
    // We check records from midnight to next midnight to be safe
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      student: { $in: studentIds },
      subjectCode: subjCode,
      date: {
        $gte: targetDate,
        $lte: endOfDay
      }
    });

    // 3. Merge data
    const result = students.map((student: any) => {
      const record = attendanceRecords.find((r: any) => r.student.toString() === student._id.toString());
      return {
        _id: student._id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`.trim(),
        photo: student.applicantPhoto,
        status: record ? record.status : null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { date, subject, records } = body;

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const actualSubject = subject || 'General Attendance';
    const subjCode = actualSubject.substring(0, 3).toUpperCase();

    // We will use bulkWrite to upsert records
    const bulkOps = records.map((rec: any) => ({
      updateOne: {
        filter: { 
          student: rec.student, 
          subjectCode: subjCode,
          date: targetDate 
        },
        update: {
          $set: {
            student: rec.student,
            studentId: rec.studentId,
            studentName: rec.studentName,
            date: targetDate,
            status: rec.status,
            isLate: rec.status === 'Late',
            department: 'Admin Manual',
            course: 'Admin Manual',
            section: 'N/A',
            subject: actualSubject,
            subjectCode: subjCode
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    return NextResponse.json({ success: true, count: bulkOps.length });
  } catch (error) {
    console.error("Attendance POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

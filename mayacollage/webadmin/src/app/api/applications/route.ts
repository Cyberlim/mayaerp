import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Application } from "@/models/Application";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';



export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const selectedProgram = searchParams.get("selectedProgram");

    let query: any = {};
    if (status && status !== "All") {
      query.status = status;
    }
    if (selectedProgram) {
      query.selectedProgram = selectedProgram;
    }

    // Sort by newest first
    const applications = await Application.find(query).sort({ createdAt: -1 }).lean();

    // Ensure models are registered for populate
    Student.init();
    Course.init();

    // Get total students course-wise
    const studentCourseStatsRaw = await Student.aggregate([
      {
          $group: {
              _id: "$selectedProgram",
              total: { $sum: 1 }
          }
      },
      {
          $lookup: {
              from: "courses", 
              localField: "_id",
              foreignField: "_id",
              as: "courseInfo"
          }
      },
      {
          $project: {
              courseName: { $arrayElemAt: ["$courseInfo.name", 0] },
              intakeCapacity: { $arrayElemAt: ["$courseInfo.intakeCapacity", 0] },
              total: 1
          }
      }
    ]);

    const studentCourseStats = studentCourseStatsRaw.map(stat => ({
        name: stat.courseName || "Unassigned",
        total: stat.intakeCapacity || 60, // Fallback if no intake capacity
        filled: stat.total
    }));

    // Get general student stats
    const totalStudents = await Student.countDocuments();
    
    // Calculate new admissions this year (assuming academic year starts around July, or just 2024-25)
    // For simplicity, let's just count students with sessionYear including "2024" or createdAt in 2024
    const newAdmissions = await Student.countDocuments({ 
        $or: [
            { sessionYear: { $regex: "2024", $options: "i" } },
            { createdAt: { $gte: new Date("2024-01-01") } }
        ]
    });

    return NextResponse.json({
        applications,
        studentCourseStats,
        stats: {
            totalStudents,
            newAdmissions
        }
    });
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const application = new Application({
      ...body,
      status: "Pending", // Always force new applications to pending
    });

    await application.save();

    return NextResponse.json({ message: "Application created successfully", id: application._id }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json({ error: error.message || "Failed to create application" }, { status: 500 });
  }
}

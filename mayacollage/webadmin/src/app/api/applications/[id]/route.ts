import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Application } from "@/models/Application";
import { Student } from "@/models/Student";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const application = await Application.findById(id).lean();

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Only allow updating status for now (Approve/Reject)
    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );

    if (application && body.status === "Approved") {
      const existingStudent = await Student.findOne({ applicationId: application._id });
      if (!existingStudent) {
        let password = application.dob ? application.dob.replace(/-/g, '') : "password123";
        
        // Map frontend fees array to backend schema
        const feesData = {
          isConfigured: true,
          years: (body.feesYears || []).map((fy: any) => ({
            year: fy.year,
            tuition: { total: fy.tuition || 0, paid: 0 },
            exam: { total: fy.exam || 0, paid: 0 },
            transport: { total: fy.transport || 0, paid: 0 },
            other: { total: fy.other || 0, paid: 0 }
          }))
        };

        const newStudent = new Student({
          applicationId: application._id,
          studentId: body.studentId || undefined,
          admissionNumber: body.admissionNumber || undefined,
          password: password,
          firstName: application.firstName,
          lastName: application.lastName,
          dob: application.dob,
          gender: application.gender || "Male",
          email: application.email,
          mobile: application.mobile || "N/A",
          alternateMobile: application.alternateMobile,
          address: application.address,
          city: application.city,
          state: application.state,
          pinCode: application.pinCode,
          applicantPhoto: application.applicantPhoto,
          selectedProgram: mongoose.Types.ObjectId.isValid(application.selectedProgram) ? application.selectedProgram : null,
          selectedBranch: mongoose.Types.ObjectId.isValid(application.selectedBranch) ? application.selectedBranch : null,
          sessionYear: application.sessionYear,
          status: "Active",
          fees: feesData
        });
        await newStudent.save();
      }
    }

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("PATCH /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

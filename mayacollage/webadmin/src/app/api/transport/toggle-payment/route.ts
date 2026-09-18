import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Bus } from "@/models/Bus";
import { Student } from "@/models/Student";
import { FeeTransaction } from "@/models/FeeTransaction";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { busId, studentId, markPaid, paymentMode = 'Cash' } = body;

        if (!busId || !studentId) {
            return NextResponse.json({ message: "Bus ID and Student ID are required" }, { status: 400 });
        }

        const bus = await Bus.findById(busId);
        if (!bus) {
            return NextResponse.json({ message: "Bus not found" }, { status: 404 });
        }

        const studentEntry = bus.students.find((s: any) => {
            const sid = s.student?._id ? s.student._id.toString() : s.student?.toString();
            return sid === studentId;
        });

        if (!studentEntry) {
            return NextResponse.json({ message: "Student is not assigned to this bus" }, { status: 404 });
        }

        const fare = Number(studentEntry.fare) || 0;
        const willBePaid = Boolean(markPaid);

        // 1. Update Bus record
        studentEntry.paymentStatus = willBePaid ? 'Paid' : 'Pending';
        studentEntry.paymentDate = willBePaid ? new Date() : undefined;
        if (willBePaid && !studentEntry.transactionId) {
            studentEntry.transactionId = `TRN-BUS-${Date.now().toString().slice(-6)}`;
        }
        await bus.save();

        // 2. Update Student document in MongoDB
        const student = await Student.findById(studentId);
        if (student) {
            const currentYearNum = Number(student.courseYear) || 1;
            if (!student.fees) {
                student.fees = { isConfigured: true, years: [] };
            }
            if (!Array.isArray(student.fees.years) || student.fees.years.length === 0) {
                student.fees.years = [{
                    year: currentYearNum,
                    tuition: { total: 0, paid: 0 },
                    exam: { total: 0, paid: 0 },
                    transport: { total: fare, paid: willBePaid ? fare : 0 },
                    other: { total: 0, paid: 0 }
                }];
            } else {
                let yearObj = student.fees.years.find((y: any) => y.year === currentYearNum);
                if (!yearObj) {
                    yearObj = {
                        year: currentYearNum,
                        tuition: { total: 0, paid: 0 },
                        exam: { total: 0, paid: 0 },
                        transport: { total: fare, paid: willBePaid ? fare : 0 },
                        other: { total: 0, paid: 0 }
                    };
                    student.fees.years.push(yearObj);
                } else {
                    if (!yearObj.transport) {
                        yearObj.transport = { total: fare, paid: willBePaid ? fare : 0 };
                    } else {
                        if (!yearObj.transport.total || yearObj.transport.total === 0) {
                            yearObj.transport.total = fare;
                        }
                        yearObj.transport.paid = willBePaid ? (yearObj.transport.total || fare) : 0;
                    }
                }
            }

            student.fees.isConfigured = true;
            student.markModified('fees');
            await student.save();

            // 3. Record transaction if paid
            if (willBePaid && fare > 0) {
                try {
                    await FeeTransaction.create({
                        transactionId: `TXN-TRN-${Date.now().toString().slice(-8)}`,
                        student: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        studentId: student.studentId || student.admissionNumber || 'N/A',
                        amount: fare,
                        type: 'Credit',
                        category: 'Transport Fee',
                        paymentMode: paymentMode,
                        description: `Transport Fee for Bus ${bus.busNo} (${studentEntry.stopName || 'Route Stop'})`,
                        date: new Date()
                    });
                } catch (txErr) {
                    console.error("FeeTransaction record error:", txErr);
                }
            }
        }

        const updatedBus = await Bus.findById(busId).populate({
            path: 'students.student',
            select: 'firstName lastName email mobile studentId admissionNumber selectedBranch selectedProgram fees courseYear'
        });

        return NextResponse.json({
            success: true,
            message: willBePaid ? `Transport fee marked as PAID for student!` : `Transport fee marked as UNPAID (Pending).`,
            bus: updatedBus
        }, { status: 200 });

    } catch (error: any) {
        console.error("Transport Toggle Payment Error:", error);
        return NextResponse.json({ message: "Error updating transport payment", error: error.message }, { status: 500 });
    }
}

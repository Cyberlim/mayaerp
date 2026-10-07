import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { FeeTransaction } from "@/models/FeeTransaction";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course";
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString() || 'all';
    const cacheKey = `fee:transactions:${queryString}`;

    // 1. Try Redis cache (30 min TTL)
    const cachedTxns = await getCache(cacheKey);
    if (cachedTxns) {
      return NextResponse.json(cachedTxns);
    }

    await connectDB();
    const studentId = searchParams.get("studentId");
    const semester = searchParams.get("semester");
    const academicYear = searchParams.get("academicYear");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (semester && semester !== "all") query.semester = Number(semester);
    if (academicYear && academicYear !== "all") query.academicYear = academicYear;
    if (category && category !== "all") query.category = category;

    let transactions = await FeeTransaction.find(query)
      .populate({ 
        path: 'studentId', 
        model: Student, 
        select: 'firstName middleName lastName studentId enrollmentNumber admissionNumber mobile email selectedBranch selectedProgram' 
      })
      .populate({ 
        path: 'courseId', 
        model: Course, 
        select: 'name code duration' 
      })
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(limit);

    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      transactions = transactions.filter((t: any) => {
        const student = t.studentId;
        const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase() : '';
        const enroll = student?.enrollmentNumber?.toLowerCase() || '';
        const adm = student?.admissionNumber?.toLowerCase() || '';
        const txnId = t.transactionId?.toLowerCase() || '';
        const rcpt = t.receiptNumber?.toLowerCase() || '';
        return name.includes(s) || enroll.includes(s) || adm.includes(s) || txnId.includes(s) || rcpt.includes(s);
      });
    }

    // 2. Store in Redis cache for 30 minutes
    await setCache(cacheKey, transactions, DEFAULT_CACHE_TTL);

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error("Finance Transactions Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      studentId,
      amount,
      paymentDate,
      paymentMethod = "Cash",
      transactionId,
      year = 1,
      category = "tuition",
      categoryName,
      semester = 1,
      academicYear,
      notes,
      collectedBy = "Admin Finance"
    } = body;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Student ID and amount are required" }, { status: 400 });
    }

    const payNum = Number(amount);
    if (isNaN(payNum) || payNum <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    let targetCourseId = body.courseId || (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram);
    if (!targetCourseId) {
      const fallbackCourse = await Course.findOne({});
      if (fallbackCourse) targetCourseId = fallbackCourse._id;
    }

    const yrNum = Number(year) || 1;
    const catCode = category || 'tuition';

    // Update student's internal fee ledger
    if (!student.fees) {
      student.fees = { isConfigured: true, years: [] };
    }
    student.fees.isConfigured = true;
    if (!Array.isArray(student.fees.years)) {
      student.fees.years = [];
    }

    let yearItem = student.fees.years.find((y: any) => y.year === yrNum);
    if (!yearItem) {
      student.fees.years.push({
        year: yrNum,
        tuition: { total: 0, paid: 0 },
        exam: { total: 0, paid: 0 },
        transport: { total: 0, paid: 0 },
        other: { total: 0, paid: 0 }
      });
      yearItem = student.fees.years[student.fees.years.length - 1];
    }

    // If standard category, update student schema bucket
    if (['tuition', 'exam', 'transport', 'other'].includes(catCode)) {
      if (!yearItem[catCode]) {
        yearItem[catCode] = { total: 0, paid: 0 };
      }
      yearItem[catCode].paid = (Number(yearItem[catCode].paid) || 0) + payNum;
      if ((Number(yearItem[catCode].total) || 0) < yearItem[catCode].paid) {
        yearItem[catCode].total = yearItem[catCode].paid;
      }
    } else {
      // Custom / specific category (books, blazer, uniform, t-shirt, fine, etc.)
      if (!yearItem.other) {
        yearItem.other = { total: 0, paid: 0 };
      }
      yearItem.other.paid = (Number(yearItem.other.paid) || 0) + payNum;
      if ((Number(yearItem.other.total) || 0) < yearItem.other.paid) {
        yearItem.other.total = yearItem.other.paid;
      }
    }

    student.markModified('fees');
    await student.save();

    // Generate readable receipt number & transaction ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const finalReceiptNo = `RCP-STU-${dateStr}-${randomSuffix}`;
    const txnId = transactionId && transactionId.trim() !== ""
      ? transactionId.trim()
      : `TXN-${Date.now()}-${randomSuffix}`;

    const newTxn = await FeeTransaction.create({
      studentId: student._id,
      courseId: targetCourseId,
      receiptNumber: finalReceiptNo,
      amount: payNum,
      category: catCode,
      categoryName: categoryName || catCode.toUpperCase(),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'Cash',
      transactionId: txnId,
      status: 'Completed',
      semester: Number(semester) || 1,
      academicYear: academicYear || `Year ${yrNum}`,
      notes: notes || '',
      collectedBy
    });

    const populatedTxn = await FeeTransaction.findById(newTxn._id)
      .populate({ path: 'studentId', model: Student })
      .populate({ path: 'courseId', model: Course });

    // Invalidate related caches immediately
    await Promise.all([
      delCache(`student:${student._id}`),
      delCache(`fee:student-account:${student._id}`),
      delCachePattern("fee:transactions:*"),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("fee:receipts:*"),
      delCachePattern("fee:alerts:*")
    ]);

    return NextResponse.json({
      success: true,
      message: "Fee payment recorded & Receipt generated successfully",
      student,
      transaction: populatedTxn,
      receiptNumber: finalReceiptNo
    });

  } catch (error: any) {
    console.error("POST /api/finance/transactions error:", error);
    return NextResponse.json({ error: error.message || "Failed to record transaction" }, { status: 500 });
  }
}

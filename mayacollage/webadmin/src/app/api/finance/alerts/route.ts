import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FeeAlert } from '@/models/FeeAlert';
import { Student } from '@/models/Student';
import { Course } from '@/models/Course';
import { FeeTransaction } from '@/models/FeeTransaction';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const status = searchParams.get('status') || 'Active';

    const [alerts, students, transactions] = await Promise.all([
      FeeAlert.find(status !== 'all' ? { status } : {})
        .populate({ path: 'studentId', model: Student, select: 'firstName lastName enrollmentNumber admissionNumber mobile parentMobile email selectedProgram' })
        .sort({ sentAt: -1 })
        .limit(100)
        .lean(),
      Student.find({ studentStatus: 'Active' })
        .populate('selectedProgram', 'name code tuitionFee')
        .lean(),
      FeeTransaction.find({ status: 'Completed' }).lean()
    ]);

    // Calculate OS defaulters
    const txnMap = new Map<string, number>();
    for (const t of transactions) {
      const sid = t.studentId?.toString();
      if (!sid) continue;
      txnMap.set(sid, (txnMap.get(sid) || 0) + (Number(t.amount) || 0));
    }

    const pendingDefaulters = [];
    for (const studentItem of students) {
      const s: any = studentItem;
      const courseTuition = (s.selectedProgram as any)?.tuitionFee || 0;
      let assessed = courseTuition;
      let paid = txnMap.get(s._id.toString()) || 0;

      if (s.fees?.isConfigured && Array.isArray(s.fees.years)) {
        let scAssessed = 0;
        let scPaid = 0;
        s.fees.years.forEach((y: any) => {
          scAssessed += (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
          scPaid += (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
        });
        if (scAssessed > 0) assessed = scAssessed;
        if (scPaid > paid) paid = scPaid;
      }

      const os = Math.max(0, assessed - paid);
      if (os > 0) {
        pendingDefaulters.push({
          studentId: s._id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          enrollmentNumber: s.enrollmentNumber || 'N/A',
          mobile: s.mobile || s.parentMobile,
          course: (s.selectedProgram as any)?.name || 'Course',
          outstandingAmount: os,
          paidAmount: paid,
          totalFee: assessed
        });
      }
    }

    return NextResponse.json({
      summary: {
        totalAlerts: alerts.length,
        totalDefaultersCount: pendingDefaulters.length,
        totalOutstandingSum: pendingDefaulters.reduce((acc, curr) => acc + curr.outstandingAmount, 0),
        highRiskCount: pendingDefaulters.filter(d => d.outstandingAmount >= 25000).length
      },
      alerts,
      defaulters: pendingDefaulters
    });

  } catch (error: any) {
    console.error('Error in GET /api/finance/alerts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch fee alerts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, alertType, title, message, outstandingAmount, channel = 'In-App' } = body;

    if (!studentId || !title || !message) {
      return NextResponse.json({ error: 'studentId, title, and message are required' }, { status: 400 });
    }

    const newAlert = await FeeAlert.create({
      studentId,
      alertType: alertType || 'Outstanding_Dues',
      title,
      message,
      outstandingAmount: Number(outstandingAmount) || 0,
      channel,
      status: 'Active',
      sentAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Fee alert dispatched and logged successfully',
      alert: newAlert
    });

  } catch (error: any) {
    console.error('Error in POST /api/finance/alerts:', error);
    return NextResponse.json({ error: error.message || 'Failed to trigger fee alert' }, { status: 500 });
  }
}

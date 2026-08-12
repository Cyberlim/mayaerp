import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payout } from "@/models/Payout";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const payouts = await Payout.find({})
      .populate({ path: 'payeeId', model: User, select: 'firstName lastName email role' })
      .sort({ paymentDate: -1 })
      .limit(50);
    return NextResponse.json(payouts);
  } catch (error) {
    console.error("Finance Payouts GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { payeeId, amount, paymentDate, paymentMethod, notes } = body;

    if (!payeeId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payee = await User.findById(payeeId);
    if (!payee) {
      return NextResponse.json({ error: "Payee not found" }, { status: 404 });
    }

    const transactionId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newPayout = new Payout({
      payeeId,
      payeeName: `${payee.firstName} ${payee.lastName}`.trim(),
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      transactionId,
      status: 'Completed',
      notes
    });

    await newPayout.save();

    return NextResponse.json(newPayout, { status: 201 });
  } catch (error) {
    console.error("Finance Payouts POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

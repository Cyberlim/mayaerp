import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Leave } from "@/models/Leave";
import { User } from "@/models/User";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        
        // Fetch leaves
        const leaves = await Leave.find().sort({ createdAt: -1 });

        return NextResponse.json({ leaves });
    } catch (error) {
        console.error("Leave API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth_token');
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'fallback_secret') as any;
        const userId = decoded.id;

        const body = await req.json();

        const newLeave = await Leave.create({
            userId,
            leaveType: body.leaveType,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            reason: body.reason,
            status: 'Pending'
        });

        return NextResponse.json(newLeave, { status: 201 });
    } catch (error) {
        console.error("Leave Create Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

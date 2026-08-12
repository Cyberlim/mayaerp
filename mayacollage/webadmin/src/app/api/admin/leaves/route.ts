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
        
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth_token');
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Ensure User model is loaded for populate
        const _user = User; 

        const leaves = await Leave.find()
            .populate('userId', 'firstName lastName email role profilePhoto')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ leaves });
    } catch (error) {
        console.error("Admin Leaves API GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth_token');
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await req.json();
        const { leaveId, status } = body;

        if (!leaveId || !['Approved', 'Rejected', 'Pending'].includes(status)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const leave = await Leave.findByIdAndUpdate(leaveId, { status }, { new: true });
        
        if (!leave) {
            return NextResponse.json({ error: "Leave not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, leave });
    } catch (error) {
        console.error("Admin Leaves API PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

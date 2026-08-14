import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Notice } from "@/models/Notice";
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
        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'fallback_secret') as any;
        const staffId = decoded.id;

        // Ensure User model is loaded for populate
        const _user = User; 

        const allNotices = await Notice.find()
            .populate('author', 'firstName lastName profilePhoto role')
            .sort({ createdAt: -1 })
            .lean();
        
        const inboxNotices: any[] = [];
        const sentNotices: any[] = [];

        for (const n of allNotices) {
            // Only put it in 'sentNotices' if the user actually sent it AS a Staff member
            // (If an Admin tests the staff page, their Admin notices should appear in the inbox, not sent)
            if (n.author?._id?.toString() === staffId && n.author?.role !== 'Admin' && n.author?.role !== 'Super Admin' && n.author?.role !== 'Office') {
                sentNotices.push(n);
            } else {
                // If it's sent by admin, office, super admin, or targeted to Staff/All
                if (n.author?.role === 'Admin' || n.author?.role === 'Super Admin' || n.author?.role === 'Office' || ['Staff', 'All Staff', 'All'].includes(n.targetClass || 'All')) {
                    inboxNotices.push(n);
                }
            }
        }

        return NextResponse.json({ inboxNotices, sentNotices });
    } catch (error) {
        console.error("Notices API GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth_token');
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'fallback_secret') as any;
        const staffId = decoded.id;

        const body = await req.json();
        const { title, description, targetClass, courseId, branchId } = body;

        // Proxy to Node.js backend where Socket.io is running
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mayaerp.onrender.com/api";
        const response = await fetch(`${backendUrl}/notices/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                targetClass: targetClass || 'My Class',
                courseId: courseId || null,
                branchId: branchId || null,
                author: staffId,
            })
        });

        const data = await response.json();
        return NextResponse.json({ success: true, notice: data });
    } catch (error) {
        console.error("Notices API POST Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

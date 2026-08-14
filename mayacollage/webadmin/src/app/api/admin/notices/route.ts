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
        const adminId = decoded.id;

        // Ensure User model is loaded for populate
        const _user = User; 

        const notices = await Notice.find()
            .populate('author', 'firstName lastName profilePhoto role')
            .sort({ createdAt: -1 })
            .lean();

        const inboxNotices: any[] = [];
        const sentNotices: any[] = [];

        for (const n of notices) {
            if (n.author?._id?.toString() === adminId) {
                sentNotices.push(n);
            } else {
                inboxNotices.push(n);
            }
        }

        return NextResponse.json({ notices, inboxNotices, sentNotices });
    } catch (error) {
        console.error("Admin Notices API GET Error:", error);
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
        const authorId = decoded.id;

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
                targetClass: targetClass || 'All',
                courseId: courseId || null,
                branchId: branchId || null,
                author: authorId,
            })
        });

        const data = await response.json();
        return NextResponse.json({ success: true, notice: data });
    } catch (error) {
        console.error("Admin Notices API POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

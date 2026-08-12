import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Faculty } from "@/models/Faculty";
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
        const userId = decoded.id;

        let user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "No staff profile found" }, { status: 404 });
        }

        const facultyData = await Faculty.findOne({ userId: user._id });

        return NextResponse.json({
            profile: {
                name: user.name || `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone || 'N/A',
                department: user.department || 'General',
                designation: facultyData?.designation || 'Staff',
                joinedDate: facultyData?.joinedDate || user.createdAt,
                subjects: facultyData?.subjects || [],
                profilePhoto: user.profilePhoto || null
            }
        });
    } catch (error) {
        console.error("Profile API Error:", error);
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

        const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET || 'fallback_secret') as any;
        const userId = decoded.id;

        const body = await req.json();
        
        // Update User Model with new profile photo
        if (body.profilePhoto) {
            await User.findByIdAndUpdate(userId, { profilePhoto: body.profilePhoto });
        }

        return NextResponse.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Profile Update API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

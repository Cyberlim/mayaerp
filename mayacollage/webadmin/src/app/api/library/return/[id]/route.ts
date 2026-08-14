import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        // Proxy to Node.js backend where Socket.io is running
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";
        const response = await fetch(`${backendUrl}/library/return/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("Library Return Proxy Error:", error);
        return NextResponse.json({ message: "Error returning book", error: error.message }, { status: 500 });
    }
}

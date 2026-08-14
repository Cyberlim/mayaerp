import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";
import { IssueBook } from "@/models/IssueBook";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Proxy to Node.js backend where Socket.io is running
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";
        const response = await fetch(`${backendUrl}/library/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("Library Issue Proxy Error:", error);
        return NextResponse.json({ message: "Error issuing book", error: error.message }, { status: 500 });
    }
}

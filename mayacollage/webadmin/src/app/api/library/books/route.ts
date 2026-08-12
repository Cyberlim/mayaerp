import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const books = await Book.find().sort({ createdAt: -1 });
        return NextResponse.json(books);
    } catch (error: any) {
        console.error("Library GET Books Error:", error);
        return NextResponse.json({ message: "Error fetching books", error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        
        // Ensure new books start with available copies equal to total copies
        if (body.available === undefined) {
            body.available = body.total || 1;
        }
        
        const book = new Book(body);
        await book.save();
        return NextResponse.json(book, { status: 201 });
    } catch (error: any) {
        console.error("Library POST Book Error:", error);
        return NextResponse.json({ message: "Error adding book", error: error.message }, { status: 500 });
    }
}

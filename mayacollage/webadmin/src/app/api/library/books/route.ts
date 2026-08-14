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

export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        
        const { _id, ...updateData } = body;
        
        if (!_id) {
            return NextResponse.json({ message: "Book ID is required" }, { status: 400 });
        }
        
        // Ensure available copies don't exceed total
        if (updateData.total !== undefined && updateData.available !== undefined) {
            if (updateData.available > updateData.total) {
                updateData.available = updateData.total;
            }
        }
        
        const book = await Book.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (!book) {
            return NextResponse.json({ message: "Book not found" }, { status: 404 });
        }
        
        return NextResponse.json(book, { status: 200 });
    } catch (error: any) {
        console.error("Library PUT Book Error:", error);
        return NextResponse.json({ message: "Error updating book", error: error.message }, { status: 500 });
    }
}

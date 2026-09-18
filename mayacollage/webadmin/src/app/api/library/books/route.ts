import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");
        const category = searchParams.get("category");
        const availableOnly = searchParams.get("availableOnly") === "true";

        let filter: any = {};
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { author: { $regex: q, $options: "i" } },
                { isbn: { $regex: q, $options: "i" } },
                { shelf: { $regex: q, $options: "i" } },
                { publisher: { $regex: q, $options: "i" } }
            ];
        }

        if (category && category !== "All") {
            filter.category = category;
        }

        if (availableOnly) {
            filter.available = { $gt: 0 };
        }

        const books = await Book.find(filter).sort({ createdAt: -1 });
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
        
        // Ensure new books start with available copies equal to total copies if not specified
        const total = Number(body.total) || 1;
        const available = body.available !== undefined ? Number(body.available) : total;
        
        const bookData = {
            ...body,
            total,
            available: Math.min(total, available)
        };
        
        const book = new Book(bookData);
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
        
        if (updateData.total !== undefined) {
            updateData.total = Number(updateData.total);
        }
        if (updateData.available !== undefined) {
            updateData.available = Number(updateData.available);
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

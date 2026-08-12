import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        
        const book = await Book.findByIdAndUpdate(id, body, { new: true });
        if (!book) return NextResponse.json({ message: 'Book not found' }, { status: 404 });
        
        return NextResponse.json(book, { status: 200 });
    } catch (error: any) {
        console.error("Library PATCH Book Error:", error);
        return NextResponse.json({ message: "Error updating book", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const book = await Book.findByIdAndDelete(id);
        if (!book) return NextResponse.json({ message: 'Book not found' }, { status: 404 });
        
        return NextResponse.json({ message: 'Book deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error("Library DELETE Book Error:", error);
        return NextResponse.json({ message: "Error deleting book", error: error.message }, { status: 500 });
    }
}

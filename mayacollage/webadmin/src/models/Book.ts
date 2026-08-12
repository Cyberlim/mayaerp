import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, unique: true, sparse: true },
    category: { type: String, required: true },
    total: { type: Number, required: true, default: 1 },
    available: { type: Number, required: true, default: 1 },
    shelf: { type: String }, // Shelf location
    publisher: { type: String },
    price: { type: Number },
    cover: { type: String },
    remarks: { type: String },
    description: { type: String }
}, { timestamps: true });

export const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);

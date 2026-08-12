import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './models/bookModel.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const books = [
    {
      "cover": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "category": "Computer Science",
      "isbn": "978-0132350884",
      "total": 12,
      "available": 5,
      "shelf": "CS-A1",
    },
    {
      "cover": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=100",
      "title": "The Pragmatic Programmer",
      "author": "Andrew Hunt",
      "category": "Computer Science",
      "isbn": "978-0135957059",
      "total": 8,
      "available": 0,
      "shelf": "CS-A2",
    },
    {
      "cover": "https://images.unsplash.com/photo-1629906429381-874b35ef586d?w=100",
      "title": "Introduction to Algorithms",
      "author": "Thomas H. Cormen",
      "category": "Mathematics",
      "isbn": "978-0262033848",
      "total": 5,
      "available": 2,
      "shelf": "MA-B1",
    },
    {
      "cover": "https://images.unsplash.com/photo-1524311583145-d5594bd6ffbb?w=100",
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "category": "Literature",
      "isbn": "978-0061120084",
      "total": 20,
      "available": 18,
      "shelf": "LI-C3",
    },
    {
      "cover": "https://images.unsplash.com/photo-1589998059171-989d887dda6e?w=100",
      "title": "Sapiens",
      "author": "Yuval Noah Harari",
      "category": "History",
      "isbn": "978-0062316097",
      "total": 15,
      "available": 7,
      "shelf": "HI-D1",
    },
];

async function seedBooks() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB!");

        // Clear existing books to avoid ISBN errors
        await Book.deleteMany({});
        console.log("Existing books cleared.");

        await Book.insertMany(books);
        console.log("Books seeded successfully!");

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seedBooks();

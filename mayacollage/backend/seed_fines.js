import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Student } from './src/models/studentModel.js';
import Book from './src/models/bookModel.js';
import IssueBook from './src/models/issueBookModel.js';

dotenv.config();

const seedFines = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const student = await Student.findOne({ 
            $or: [{ studentId: '2024CSAI20' }, { admissionNumber: '2024CSAI20' }] 
        });

        if (!student) {
            console.log("Student 2024CSAI20 not found!");
            process.exit(1);
        }

        const books = await Book.find().limit(4);
        if (books.length < 4) {
             console.log("Not enough books in database to seed 4 issues.");
             process.exit(1);
        }

        // Cleanup
        await IssueBook.deleteMany({ student: student._id });

        // Create 4 late issues
        const issuesData = books.map((book, i) => ({
            student: student._id,
            book: book._id,
            issueDate: new Date(Date.now() - (20 + i) * 24 * 60 * 60 * 1000), // Issued 20+ days ago
            dueDate: new Date(Date.now() - (7 + i) * 24 * 60 * 60 * 1000),    // Due 7+ days ago
            isVerified: true,
            status: 'Overdue'
        }));

        await IssueBook.insertMany(issuesData);
        
        console.log(`Successfully seeded 4 overdue issues for ${student.firstName} ${student.lastName}`);
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedFines();

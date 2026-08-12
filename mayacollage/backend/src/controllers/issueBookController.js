import IssueBook from '../models/issueBookModel.js';
import Book from '../models/bookModel.js';
import { Student } from '../models/studentModel.js';

export const issueBook = async (req, res) => {
    try {
        const { student, book, dueDate } = req.body;
        console.log("Issuing book request (pre-verification):", { student, book, dueDate });
        
        // 1. Check if book exists and is available
        const bookDoc = await Book.findById(book);
        if (!bookDoc || bookDoc.available <= 0) {
            return res.status(400).json({ message: 'Book not available' });
        }
        
        // 2. Check if student already has 5 books (Policy)
        const activeIssues = await IssueBook.countDocuments({ student, isVerified: true, status: { $in: ['Active', 'Overdue'] } });
        if (activeIssues >= 5) {
            return res.status(400).json({ message: 'Student reached maximum limit of 5 books' });
        }
        
        // 3. Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Create issue record (Unverified)
        const issue = new IssueBook({
            student,
            book,
            dueDate,
            otp,
            isVerified: false,
            status: 'Active'
        });
        
        await issue.save();
        
        // --- Socket.io Real-time Notification ---
        const io = req.app.get('io');
        if (io) {
            io.to(student.toString()).emit('otp-received', {
                otp,
                bookTitle: bookDoc.title,
                issueId: issue._id
            });
            console.log(`Socket: OTP sent to student room ${student}`);
        }
        
        // Notice: We don't update book availability yet, only after verification
        res.status(201).json({ 
            issueId: issue._id, 
            message: 'OTP generated. Please verify to complete issue.',
            otp: otp 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error issuing book', error: error.message });
    }
};

export const verifyIssue = async (req, res) => {
    try {
        const { issueId, otp } = req.body;
        const issue = await IssueBook.findById(issueId);
        
        if (!issue) return res.status(404).json({ message: 'Issue record not found' });
        if (issue.isVerified) return res.status(400).json({ message: 'Already verified' });
        
        if (issue.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        
        issue.isVerified = true;
        await issue.save();
        
        // Update book availability
        await Book.findByIdAndUpdate(issue.book, { $inc: { available: -1 } });
        
        // --- Socket.io Real-time Verification Notification ---
        const io = req.app.get('io');
        if (io) {
            io.to(issue.student.toString()).emit('issue-verified', {
                issueId: issue._id,
                message: 'Book issuance verified successfully.'
            });
            console.log(`Socket: Issue verified notification sent to student room ${issue.student}`);
        }
        
        res.status(200).json({ message: 'Book issued successfully and verified' });
    } catch (error) {
        res.status(500).json({ message: 'Verification error', error: error.message });
    }
};

import LibrarySettings from '../models/librarySettingsModel.js';

const calculateFine = async (issue) => {
    if (issue.status === 'Returned' || !issue.dueDate) return 0;
    
    const now = new Date();
    const due = new Date(issue.dueDate);
    
    if (now > due) {
        const diffTime = Math.abs(now.getTime() - due.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 10) {
            const settings = await LibrarySettings.findOne() || { fineRatePerDay: 5 };
            return (diffDays - 10) * settings.fineRatePerDay;
        }
    }
    return 0;
};

export const getIssuedBooks = async (req, res) => {
    try {
        const issues = await IssueBook.find({ isVerified: true })
            .populate('student', 'firstName lastName studentId')
            .populate('book', 'title author')
            .sort({ createdAt: -1 });
            
        const issuesWithFines = await Promise.all(issues.map(async (i) => {
            const fine = await calculateFine(i);
            const obj = i.toObject();
            return { ...obj, fine };
        }));
            
        res.status(200).json(issuesWithFines);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching issued books', error: error.message });
    }
};

export const returnBook = async (req, res) => {
    try {
        const issue = await IssueBook.findById(req.params.id);
        if (!issue || issue.status === 'Returned') {
            return res.status(400).json({ message: 'Invalid issue record' });
        }
        
        issue.status = 'Returned';
        issue.returnDate = new Date();
        await issue.save();
        
        // Update book availability
        await Book.findByIdAndUpdate(issue.book, { $inc: { available: 1 } });
        
        // --- Socket.io Real-time Return Notification ---
        const io = req.app.get('io');
        if (io) {
            io.to(issue.student.toString()).emit('issue-verified', { // Student listener already handles issue-verified by refreshing all
                status: 'Returned',
                message: 'Your book has been successfully returned.'
            });
        }
        
        res.status(200).json({ message: 'Book returned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error returning book', error: error.message });
    }
};

export const getLibraryStats = async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const activeIssues = await IssueBook.find({ isVerified: true, status: { $in: ['Active', 'Overdue'] } });
        const overdueBooksCount = await IssueBook.countDocuments({ isVerified: true, status: 'Overdue' });
        const totalStock = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);

        // Unique students with active books
        const uniqueConsumers = await IssueBook.distinct('student', { isVerified: true, status: { $in: ['Active', 'Overdue'] } });

        // Calculate total pending fine
        let totalFineDues = 0;
        await Promise.all(activeIssues.map(async (i) => {
            const fine = await calculateFine(i);
            totalFineDues += fine;
        }));
        
        res.status(200).json({
            totalUniqueBooks: totalBooks,
            totalStock: totalStock[0]?.total || 0,
            activeIssues: activeIssues.length,
            overdue: overdueBooksCount,
            uniqueActiveConsumers: uniqueConsumers.length,
            totalFineDues: totalFineDues
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching library stats', error: error.message });
    }
};

export const getIssuedBooksByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const issues = await IssueBook.find({ 
            student: studentId, 
            isVerified: true, 
            status: { $in: ['Active', 'Overdue'] } 
        })
            .populate('book', 'title author isbn cover publisher pages description')
            .sort({ createdAt: -1 });
            
        const issuesWithFines = await Promise.all(issues.map(async (i) => {
            const fine = await calculateFine(i);
            const obj = i.toObject();
            return { ...obj, fine };
        }));
            
        res.status(200).json(issuesWithFines);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your books', error: error.message });
    }
};

export const getReturnedBooksByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const issues = await IssueBook.find({ 
            student: studentId, 
            isVerified: true, 
            status: 'Returned' 
        })
            .populate('book', 'title author isbn cover publisher pages description')
            .sort({ returnDate: -1 });
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your history', error: error.message });
    }
};

export const payFine = async (req, res) => {
    try {
        const issue = await IssueBook.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Loan record not found' });
        
        const settings = await LibrarySettings.findOne() || { issueDurationDays: 14 };
        
        // When fine is paid, we effectively renew the book to clear the overdue status
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + settings.issueDurationDays);
        
        issue.dueDate = newDueDate;
        issue.status = 'Active';
        await issue.save();
        
        res.status(200).json({ message: 'Fine paid and book loan renewed successfully', newDueDate });
    } catch (error) {
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
};

export const seedOverdue = async (req, res) => {
    try {
        const { Student } = await import('../models/studentModel.js');
        const student = await Student.findOne({ 
            $or: [{ studentId: '2024CSAI20' }, { admissionNumber: '2024CSAI20' }] 
        });

        if (!student) return res.status(404).json({ message: 'Student not found' });

        const books = await Book.find().limit(4);
        
        await IssueBook.deleteMany({ student: student._id });

        const issuesData = books.map((book, i) => ({
            student: student._id,
            book: book._id,
            issueDate: new Date(Date.now() - (20 + i) * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() - (7 + i) * 24 * 60 * 60 * 1000),
            isVerified: true,
            status: 'Overdue'
        }));

        await IssueBook.insertMany(issuesData);
        res.status(200).json({ message: 'Seeded 4 overdue books for 2024CSAI20' });
    } catch (error) {
        res.status(500).json({ message: 'Seeding failed', error: error.message });
    }
};

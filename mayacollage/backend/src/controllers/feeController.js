import FeeTransaction from '../models/feeTransactionModel.js';
import Course from '../models/courseModel.js';
import { Student } from '../models/studentModel.js';

export const getStudentFeeStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const course = await Course.findById(student.selectedProgram);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const history = await FeeTransaction.find({ studentId }).sort({ createdAt: -1 });
        
        const totalPaid = history.reduce((sum, t) => sum + t.amount, 0);
        const totalDue = course.tuitionFee - totalPaid;

        res.status(200).json({
            courseName: course.name,
            totalTuitionFee: course.tuitionFee,
            totalPaid,
            currentDue: totalDue > 0 ? totalDue : 0,
            semesterFees: course.semesterFees || [],
            history
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const submitPayment = async (req, res) => {
    try {
        const { studentId, amount, semester, academicYear, paymentMethod, transactionId } = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const newTransaction = new FeeTransaction({
            studentId,
            courseId: student.selectedProgram,
            amount,
            semester,
            academicYear,
            paymentMethod,
            transactionId,
            status: 'Completed'
        });

        await newTransaction.save();

        // Emit socket event for admin real-time update
        if (req.io) {
            req.io.emit('new_fee_payment', {
                studentName: `${student.firstName} ${student.lastName}`,
                amount,
                course: student.selectedProgramName,
                transactionId,
                paymentDate: newTransaction.paymentDate
            });
        }

        res.status(201).json({ message: 'Payment successful', transaction: newTransaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFeeTransactions = async (req, res) => {
    try {
        const transactions = await FeeTransaction.find().populate('studentId', 'firstName lastName studentId').sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import { Student } from '../models/studentModel.js';
import Faculty from '../models/facultyModel.js';
import Book from '../models/bookModel.js';
import FeeTransaction from '../models/feeTransactionModel.js';
import { Application } from '../models/applicationModel.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Count total students, faculty, books, etc.
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalBooks = await Book.countDocuments();

    // Sum fee transactions
    const feeTransactions = await FeeTransaction.find({ status: 'Completed' });
    const totalRevenue = feeTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    // Applications (Admissions)
    const totalAdmissions = await Application.countDocuments({ status: 'Approved' });

    res.status(200).json({
      kpis: {
        admissions: totalAdmissions,
        faculty: totalFaculty,
        revenue: totalRevenue,
        inventory: totalBooks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

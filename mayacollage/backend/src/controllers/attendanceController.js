import { Attendance } from '../models/attendanceModel.js';
import { Student } from '../models/studentModel.js';
import moment from 'moment';

export const getAttendanceByDateAndFilters = async (req, res) => {
    try {
        const { date, department, course, subject, subjectCode } = req.query;
        
        const queryDate = moment(date).startOf('day').toDate();
        const nextDay = moment(date).endOf('day').toDate();

        const attendance = await Attendance.find({
            date: { $gte: queryDate, $lte: nextDay },
            department,
            course,
            subject,
            subjectCode
        }).select('student studentId status isLate');
        
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

export const submitAttendanceBulk = async (req, res) => {
    try {
        // One-time safety: Attempt to drop outdated unique index if it exists
        try {
            await Attendance.collection.dropIndex('student_1_date_1');
        } catch (e) {
            // Index might not exist or already dropped
        }

        const { date, attendanceList, department, course, section, subject, subjectCode } = req.body;
        const normalizedDate = moment(date).startOf('day').toDate();

        const operations = attendanceList.map((entry) => ({
            updateOne: {
                filter: { 
                    student: entry.student, 
                    date: normalizedDate, 
                    subject: subject,
                    subjectCode: subjectCode || subject 
                },
                update: { 
                    $set: { 
                        ...entry, 
                        date: normalizedDate,
                        department,
                        course,
                        section,
                        subject,
                        subjectCode: subjectCode || subject
                    } 
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(operations);
        res.status(200).json({ message: 'Attendance updated successfully' });
    } catch (error) {
        console.error('Bulk attendance error:', error);
        res.status(500).json({ message: 'Error bulk submitting attendance', error: error.message });
    }
};

export const getStudentsForAttendance = async (req, res) => {
    try {
        const { branchId, courseId, semester, section } = req.query;
        
        const query = {};
        if (branchId) query.selectedBranch = branchId;
        if (courseId) query.selectedProgram = courseId;
        if (semester) query.selectedSemester = Number(semester);
        if (section) query.selectedSection = section;

        const students = await Student.find(query)
            .select('firstName lastName studentId applicantPhoto selectedSemester selectedSection')
            .sort({ studentId: 1 });
            
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students for attendance', error: error.message });
    }
};

export const getAttendanceStats = async (req, res) => {
    try {
        const today = moment().startOf('day').toDate();
        const nextDay = moment().endOf('day').toDate();

        const present = await Attendance.countDocuments({ date: { $gte: today, $lte: nextDay }, status: 'Present' });
        const late = await Attendance.countDocuments({ date: { $gte: today, $lte: nextDay }, status: 'Late' });
        const totalToday = await Attendance.countDocuments({ date: { $gte: today, $lte: nextDay } });

        const studentsCount = await Student.countDocuments();

        res.status(200).json({
            presentToday: present + late,
            lateToday: late,
            totalStudents: studentsCount,
            absentToday: studentsCount - (present + late)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};

export const getStudentAttendanceSummary = async (req, res) => {
    try {
        const { studentId, startDate, endDate } = req.query;
        if (!studentId) return res.status(400).json({ message: 'Student ID is required' });

        const query = { student: studentId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = moment(startDate).startOf('day').toDate();
            if (endDate) query.date.$lte = moment(endDate).endOf('day').toDate();
        }

        const attendance = await Attendance.find(query).sort({ date: -1 });
        
        // Calculate stats
        const subjectStats = {};
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalRecords = 0;

        attendance.forEach(a => {
            const sub = a.subject || 'Unknown';
            if (!subjectStats[sub]) {
                subjectStats[sub] = { total: 0, present: 0, percent: 0, teacher: '' };
            }
            subjectStats[sub].total++;
            totalRecords++;
            if (a.status === 'Present' || a.status === 'Late') {
                subjectStats[sub].present++;
                totalPresent++;
            } else if (a.status === 'Absent') {
                totalAbsent++;
            }
        });

        const overallPercent = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
        const subjects = Object.keys(subjectStats).map(sub => ({
            name: sub,
            total: subjectStats[sub].total,
            present: subjectStats[sub].present,
            percent: (subjectStats[sub].present / subjectStats[sub].total) * 100
        }));

        res.status(200).json({
            overallPercent,
            totalPresent,
            totalAbsent,
            totalRecords,
            subjects
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student summary', error: error.message });
    }
};

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { Student } from "@/models/Student";
import { Holiday } from "@/models/Holiday";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId"); // ObjectId of the student
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!studentId || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // 1. Fetch Student
    const student = await Student.findById(studentId).select('_id studentId firstName lastName');
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 2. Fetch Attendance Records
    const attendanceRecords = await Attendance.find({
      student: studentId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1, subjectCode: 1 });

    // 3. Fetch Holidays
    const holidays = await Holiday.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // 4. Compute Metrics
    // Calculate total days in range (inclusive)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate working days (Total Days - Sundays - Holidays)
    let workingDays = 0;
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const isSunday = currentDay.getDay() === 0;
      const isHoliday = holidays.some(h => new Date(h.date).getTime() === currentDay.getTime());
      
      if (!isSunday && !isHoliday) {
        workingDays++;
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }

    let totalLectures = attendanceRecords.length;
    let attended = 0;
    let absent = 0;

    attendanceRecords.forEach((record: any) => {
      if (record.status === 'Present' || record.status === 'Late') attended++;
      if (record.status === 'Absent') absent++;
    });

    const attendancePercentage = totalLectures > 0 ? ((attended / totalLectures) * 100).toFixed(2) : 0;

    // 5. Structure data for Calendar & Lecture Wise Table
    // Calendar format: { "YYYY-MM-DD": { status: 'P', records: [...] } }
    const calendarData: Record<string, any> = {};
    const lectureWiseData: any[] = [];

    // Map holidays to calendar
    holidays.forEach((holiday: any) => {
        const dateStr = new Date(holiday.date).toISOString().split('T')[0];
        calendarData[dateStr] = { status: 'Holiday', label: holiday.name };
        lectureWiseData.push({
            date: dateStr,
            day: holiday.day,
            lecture: '-',
            subject: holiday.name,
            status: 'Holiday',
            type: 'Holiday'
        });
    });

    // Map attendance records
    let lectureCounterMap: Record<string, number> = {};

    attendanceRecords.forEach((record: any) => {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      const dayName = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!lectureCounterMap[dateStr]) lectureCounterMap[dateStr] = 0;
      lectureCounterMap[dateStr]++;

      // Update calendar (take the worst status of the day for overview)
      if (!calendarData[dateStr] || calendarData[dateStr].status === 'Holiday') {
        calendarData[dateStr] = { status: record.status };
      } else if (calendarData[dateStr].status === 'Present' && record.status === 'Absent') {
        calendarData[dateStr].status = 'Absent'; // Absent trumps present for day summary
      }

      lectureWiseData.push({
        date: dateStr,
        day: dayName,
        lecture: lectureCounterMap[dateStr],
        subject: record.subject,
        status: record.status,
        type: 'Regular'
      });
    });

    // Sort lectureWiseData by date descending
    lectureWiseData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Group for chart (daily attendance %)
    const chartData = Object.keys(lectureCounterMap).sort().map(dateStr => {
        const recordsOnDate = attendanceRecords.filter(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
        const presentCount = recordsOnDate.filter(r => r.status === 'Present' || r.status === 'Late').length;
        const total = recordsOnDate.length;
        return {
            date: dateStr,
            percentage: total > 0 ? (presentCount / total) * 100 : 0
        };
    });

    return NextResponse.json({
      student,
      metrics: {
        totalLectures,
        attended,
        absent,
        attendancePercentage,
        workingDays,
        holidaysCount: holidays.length
      },
      lectureWiseData,
      calendarData,
      chartData,
      holidays
    });
  } catch (error) {
    console.error("Attendance Analytics GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

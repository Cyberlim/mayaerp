import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, DEFAULT_CACHE_TTL } from "@/lib/redis";
import connectDB from "@/lib/mongodb";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        if (!q || !q.trim()) {
            return NextResponse.json({ message: "Search query 'q' is required" }, { status: 400 });
        }

        const cacheKey = `students:search:${q.trim().toLowerCase()}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            return NextResponse.json(cached, { status: 200 });
        }

        // 1. Query PostgreSQL
        const searchPattern = `%${q.trim()}%`;
        const res = await pgQuery(`
            SELECT id as "_id", id, student_id as "studentId", admission_number as "admissionNumber",
                   first_name as "firstName", last_name as "lastName", email, selected_program as "selectedProgram",
                   selected_branch as "selectedBranch", branch_name as "branchName", course_name as "courseName"
            FROM students
            WHERE admission_number ILIKE $1 OR student_id ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
            LIMIT 12
        `, [searchPattern]);

        let students = res.rows;

        // Fallback to MongoDB if empty
        if (students.length === 0) {
            try {
                await connectDB();
                students = await Student.find({
                    $or: [
                        { admissionNumber: { $regex: q, $options: 'i' } },
                        { studentId: { $regex: q, $options: 'i' } },
                        { firstName: { $regex: q, $options: 'i' } },
                        { lastName: { $regex: q, $options: 'i' } }
                    ]
                }).select('firstName lastName studentId admissionNumber email selectedProgram').limit(10).lean();
            } catch (_) {}
        }

        // Cache search query for 10 minutes
        await setCache(cacheKey, students, 600);

        return NextResponse.json(students, { status: 200 });
    } catch (error: any) {
        console.error("Library Student Search Error:", error);
        return NextResponse.json({ message: "Error searching students", error: error.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/datafiles
    const uploadDir = path.join(process.cwd(), "public", "datafiles");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._\- ()]/g, '_');
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);

    // Parse Excel content
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const rawRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

    let headers: string[] = [];
    let rowCount = 0;
    let sampleStudentName = "";
    let detectedCourse = "";
    let detectedSession = "";

    if (rawRows.length > 0) {
      headers = rawRows[0].map((h: any) => String(h || '').trim());
      rowCount = Math.max(0, rawRows.length - 1);

      if (rawRows.length > 1) {
        const firstRow = rawRows[1];
        // Try to detect student name, course, session
        const upperHeaders = headers.map(h => h.toUpperCase());
        const nameIdx = upperHeaders.findIndex(h => h.includes("STUDENT") || h.includes("NAME"));
        const courseIdx = upperHeaders.findIndex(h => h.includes("COURSE"));
        const sessionIdx = upperHeaders.findIndex(h => h.includes("SESSION"));

        if (nameIdx !== -1 && firstRow[nameIdx]) sampleStudentName = String(firstRow[nameIdx]).trim();
        if (courseIdx !== -1 && firstRow[courseIdx]) detectedCourse = String(firstRow[courseIdx]).trim();
        if (sessionIdx !== -1 && firstRow[sessionIdx]) detectedSession = String(firstRow[sessionIdx]).trim();
      }
    }

    return NextResponse.json({
      success: true,
      message: `File "${safeName}" uploaded and scanned successfully! (${rowCount} student rows found)`,
      file: {
        fileName: safeName,
        sizeBytes: buffer.length,
        rowCount,
        headers,
        sampleStudentName,
        detectedCourse,
        detectedSession,
        preset: {
          courseCode: detectedCourse.slice(0, 5).toUpperCase(),
          courseNameHint: detectedCourse || 'Uploaded Course',
          sessionYear: detectedSession || '2025-2029',
          admissionYear: new Date().getFullYear().toString(),
          batch: new Date().getFullYear().toString(),
          idPrefix: (detectedCourse.slice(0, 3) || 'STU').toUpperCase() + '25',
          enrollmentPrefix: 'ENR' + (detectedCourse.slice(0, 3) || 'STU').toUpperCase() + '25'
        }
      }
    });

  } catch (error: any) {
    console.error("POST /api/seed/upload error:", error);
    return NextResponse.json({ error: error.message || "File upload and parse failed" }, { status: 500 });
  }
}

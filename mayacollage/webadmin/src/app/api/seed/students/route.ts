import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { query as pgQuery } from "@/lib/postgres";
import { delCachePattern } from "@/lib/redis";

export const dynamic = 'force-dynamic';

function cleanStr(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function cleanMobile(val: any): string {
  if (!val) return '';
  const str = String(val).replace(/[^0-9]/g, '');
  if (str.length > 10) return str.slice(-10);
  return str;
}

function cleanAadhar(val: any): string {
  if (!val) return '';
  return String(val).replace(/[^0-9]/g, '');
}

function cleanEmail(val: any): string {
  if (!val) return '';
  const email = String(val).trim().toLowerCase();
  if (email.includes('@')) return email;
  return '';
}

function parseExcelDate(val: any, fallback = '2005-01-01'): string {
  if (!val) return fallback;
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const y = String(d.y).padStart(4, '0');
      const m = String(d.m).padStart(2, '0');
      const day = String(d.d).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  const str = String(val).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const p0 = parts[0].padStart(2, '0');
      const p1 = parts[1].padStart(2, '0');
      let p2 = parts[2];
      if (p2.length === 2) p2 = `20${p2}`;
      if (parts[0].length === 4) {
        return `${parts[0]}-${p1}-${parts[2].padStart(2, '0')}`;
      } else {
        return `${p2}-${p1}-${p0}`;
      }
    }
  }
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return str;
      const p0 = parts[0].padStart(2, '0');
      const p1 = parts[1].padStart(2, '0');
      let p2 = parts[2];
      if (p2.length === 2) p2 = `20${p2}`;
      return `${p2}-${p1}-${p0}`;
    }
  }
  return fallback;
}

function splitName(fullName: string): { firstName: string; middleName: string; lastName: string } {
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: 'Student' };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1]
  };
}

function normalizeGender(val: any): "Male" | "Female" | "Other" {
  const g = cleanStr(val).toUpperCase();
  if (g.startsWith("F")) return "Female";
  if (g.startsWith("M")) return "Male";
  return "Male";
}

// Recommended mapping configuration for standard datafiles
const FILE_PRESETS: Record<string, {
  courseCode: string;
  courseNameHint: string;
  sessionYear: string;
  admissionYear: string;
  batch: string;
  idPrefix: string;
  enrollmentPrefix: string;
}> = {
  'B.Pharm 2025-29 C.xlsx': {
    courseCode: 'BPH',
    courseNameHint: 'B.Pharma',
    sessionYear: '2025-2029',
    admissionYear: '2025',
    batch: '2025',
    idPrefix: 'BPH25',
    enrollmentPrefix: 'ENRBPH25'
  },
  'B.Tech 2024-28 C.xlsx': {
    courseCode: 'B.tech',
    courseNameHint: 'B.tech',
    sessionYear: '2024-2028',
    admissionYear: '2024',
    batch: '2024',
    idPrefix: 'BTE24',
    enrollmentPrefix: 'ENRBTE24'
  },
  'D.Pharm 2024-26 C.xlsx': {
    courseCode: 'DPH',
    courseNameHint: 'D.Pharma',
    sessionYear: '2024-2026',
    admissionYear: '2024',
    batch: '2024',
    idPrefix: 'DPH24',
    enrollmentPrefix: 'ENRDPH24'
  },
  'M.Pharm 2025-27 C.xlsx': {
    courseCode: 'Mpharma',
    courseNameHint: 'Mpharma',
    sessionYear: '2025-2027',
    admissionYear: '2025',
    batch: '2025',
    idPrefix: 'MPH25',
    enrollmentPrefix: 'ENRMPH25'
  },
  'BCA 2024-27 C (1).xlsx': {
    courseCode: 'BCA',
    courseNameHint: 'BCA',
    sessionYear: '2024-2027',
    admissionYear: '2024',
    batch: '2024',
    idPrefix: 'BCA24',
    enrollmentPrefix: 'ENRBCA24'
  },
  'BCA 2024-27 C.xlsx': {
    courseCode: 'BCA',
    courseNameHint: 'BCA',
    sessionYear: '2024-2027',
    admissionYear: '2024',
    batch: '2024',
    idPrefix: 'BCA24',
    enrollmentPrefix: 'ENRBCA24'
  }
};

function getFilePreset(file: string, courseNameInSheet?: string, sessionInSheet?: string) {
  if (FILE_PRESETS[file]) return FILE_PRESETS[file];
  const upper = file.toUpperCase();
  const cHint = courseNameInSheet || (
    upper.includes('BCA') ? 'BCA' :
    upper.includes('BBA') ? 'BBA' :
    upper.includes('MBA') ? 'MBA' :
    upper.includes('B.TECH') || upper.includes('BTECH') ? 'B.tech' :
    upper.includes('D.PHARM') || upper.includes('DPHARM') ? 'D.Pharma' :
    upper.includes('B.PHARM') || upper.includes('BPHARM') ? 'B.Pharma' :
    upper.includes('M.PHARM') || upper.includes('MPHARM') ? 'Mpharma' :
    'Student'
  );
  const sess = sessionInSheet || '2024-2027';
  const admYr = sess.split('-')[0] || '2024';
  const yrShort = admYr.slice(-2);
  const prefix = (cHint.replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'STU').toUpperCase() + yrShort;

  return {
    courseCode: cHint,
    courseNameHint: cHint,
    sessionYear: sess,
    admissionYear: admYr,
    batch: admYr,
    idPrefix: prefix,
    enrollmentPrefix: 'ENR' + prefix
  };
}

function getStandardCourseCodePrefix(courseObj: any, yearStr: string): { idPrefix: string; enrollmentPrefix: string } {
  const yr = String(yearStr || '2024').slice(-2);
  const rawCode = (courseObj?.code || courseObj?.name || 'STU').toUpperCase();

  let prefix = 'STU';
  if (rawCode.includes('DPH') || rawCode.includes('D.PHARM')) {
    prefix = 'DPH';
  } else if (rawCode.includes('MPH') || rawCode.includes('M.PHARM') || rawCode.includes('MPHARMA')) {
    prefix = 'MPH';
  } else if (rawCode.includes('BPH') || rawCode.includes('B.PHARM') || rawCode.includes('BPHARMA')) {
    prefix = 'BPH';
  } else if (rawCode.includes('BCA')) {
    prefix = 'BCA';
  } else if (rawCode.includes('BBA')) {
    prefix = 'BBA';
  } else if (rawCode.includes('MBA')) {
    prefix = 'MBA';
  } else if (rawCode.includes('TECH') || rawCode.includes('CSE') || rawCode.includes('AI') || rawCode.includes('ECE') || rawCode.includes('IT')) {
    prefix = 'BTE';
  } else {
    const clean = rawCode.replace(/[^A-Z0-9]/g, '');
    prefix = clean.slice(0, 3) || 'STU';
  }

  return {
    idPrefix: `${prefix}${yr}`,
    enrollmentPrefix: `ENR${prefix}${yr}`
  };
}

/**
 * GET: Returns list of available Excel datafiles in public/datafiles,
 * PostgreSQL courses & branches, and database student count statistics.
 */
export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'datafiles');
    let filesInDir: string[] = [];
    if (fs.existsSync(dir)) {
      filesInDir = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));
    }

    // 1. Fetch courses & branches from PostgreSQL
    const [coursesRes, branchesRes, studentsCountRes, studentsByCourseRes] = await Promise.all([
      pgQuery('SELECT id, name, code, duration, tuition_fee, fee_structure_template, branch_id FROM courses ORDER BY name ASC'),
      pgQuery('SELECT id, name, code, dean_name, location FROM branches ORDER BY name ASC'),
      pgQuery('SELECT count(*) as total FROM students'),
      pgQuery('SELECT course_name, session_year, count(*) as count FROM students GROUP BY course_name, session_year ORDER BY count DESC')
    ]);

    const courses = coursesRes.rows;
    const branches = branchesRes.rows;
    const totalStudents = Number(studentsCountRes.rows[0]?.total) || 0;
    const studentDistribution = studentsByCourseRes.rows;

    // 2. Scan file details
    const fileSummaries = filesInDir.map(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      let rowCount = 0;
      let headers: string[] = [];
      let sampleRow: any = null;
      let sampleCourseInSheet = '';
      let sampleSessionInSheet = '';

      try {
        const fileBuffer = fs.readFileSync(filePath);
        const wb = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if (sheet) {
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (rows.length > 0) {
            headers = rows[0].map((h: any) => cleanStr(h));
            rowCount = Math.max(0, rows.length - 1);
            sampleRow = rows[1] || null;
            if (sampleRow) {
              const upH = headers.map(h => h.toUpperCase());
              const cIdx = upH.findIndex(h => h.includes("COURSE"));
              const sIdx = upH.findIndex(h => h.includes("SESSION"));
              if (cIdx !== -1 && sampleRow[cIdx]) sampleCourseInSheet = cleanStr(sampleRow[cIdx]);
              if (sIdx !== -1 && sampleRow[sIdx]) sampleSessionInSheet = cleanStr(sampleRow[sIdx]);
            }
          }
        }
      } catch (err) {
        console.error(`Error reading ${file}:`, err);
      }

      const preset = getFilePreset(file, sampleCourseInSheet, sampleSessionInSheet);

      // Match preset to actual course
      const matchedCourse = courses.find(c => 
        (sampleCourseInSheet && (c.code.toLowerCase() === sampleCourseInSheet.toLowerCase() || c.name.toLowerCase().includes(sampleCourseInSheet.toLowerCase()) || sampleCourseInSheet.toLowerCase().includes(c.code.toLowerCase()))) ||
        c.code.toLowerCase() === preset.courseCode.toLowerCase() ||
        c.name.toLowerCase() === preset.courseNameHint.toLowerCase() ||
        c.name.toLowerCase().includes(preset.courseNameHint.toLowerCase())
      );

      return {
        fileName: file,
        sizeBytes: stat.size,
        rowCount,
        headers,
        preset,
        suggestedCourseId: matchedCourse?.id || '',
        suggestedBranchId: matchedCourse?.branch_id || ''
      };
    });

    // 3. PostgreSQL columns definition for UI display
    const dbColumnsRes = await pgQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      success: true,
      files: fileSummaries,
      courses,
      branches,
      dbStats: {
        totalStudents,
        distribution: studentDistribution
      },
      dbColumns: dbColumnsRes.rows
    });
  } catch (error: any) {
    console.error("GET /api/seed/students error:", error);
    return NextResponse.json({ error: error.message || "Failed to load seed status" }, { status: 500 });
  }
}

/**
 * POST: Handles "preview", "seed", or "seed_courses" actions.
 */
export async function POST(request: Request) {
  try {
    let body: any = {};
    let uploadedFileBuffer: Buffer | null = null;
    let uploadedFileName: string = '';

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const act = (formData.get("action") as string) || "preview";
      body = {
        action: act,
        courseId: (formData.get("courseId") as string) || "",
        branchId: (formData.get("branchId") as string) || "",
        sessionYear: (formData.get("sessionYear") as string) || "",
        admissionYear: (formData.get("admissionYear") as string) || "",
        batch: (formData.get("batch") as string) || "",
        idPrefix: (formData.get("idPrefix") as string) || "",
        enrollmentPrefix: (formData.get("enrollmentPrefix") as string) || "",
        fileName: file ? file.name : ((formData.get("fileName") as string) || "")
      };

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        uploadedFileBuffer = Buffer.from(bytes);
        uploadedFileName = file.name;

        // Persist copy in public/datafiles if directory exists or can be created
        try {
          const uploadDir = path.join(process.cwd(), "public", "datafiles");
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          const safeName = file.name.replace(/[^a-zA-Z0-9._\- ()]/g, '_');
          fs.writeFileSync(path.join(uploadDir, safeName), uploadedFileBuffer);
          uploadedFileName = safeName;
        } catch (_) {}
      }
    } else {
      body = await request.json();
      if (body.fileBase64) {
        uploadedFileBuffer = Buffer.from(body.fileBase64, 'base64');
        uploadedFileName = body.fileName || 'uploaded.xlsx';
      }
    }

    const action = body.action || 'preview'; // 'preview' | 'seed' | 'seed_courses'

    // ACTION: SEED COURSES IF NEEDED
    if (action === 'seed_courses') {
      const defaultBranches = [
        { id: '6a7ec4921085b99d53b36cf2', name: 'Pharmacy', code: 'Pharmacy', dean: 'Dr. R. Sharma' },
        { id: '6a7ed55b1085b99d53b373d9', name: 'Business Administration', code: 'Business Administration', dean: 'Dr. V. Gupta' },
        { id: '6a7ed9551085b99d53b37509', name: 'Computer Science', code: 'Computer Science', dean: 'Dr. A. Verma' },
        { id: '6aaa797393fc29470975546b', name: 'Engineering', code: 'Engineering', dean: 'Dr. K. Singh' }
      ];

      for (const b of defaultBranches) {
        await pgQuery(`
          INSERT INTO branches (id, name, code, dean_name, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, updated_at = NOW()
        `, [b.id, b.name, b.code, b.dean]);
      }

      const defaultCourses = [
        { id: '6a7ec7ec7a12ae56bf12a472', name: 'B.Pharma', code: 'BPH', duration: 4, branch_id: '6a7ec4921085b99d53b36cf2', tuition: 65000 },
        { id: '6a7ecf3bd8841653bfaca179', name: 'D.Pharma', code: 'DPH', duration: 2, branch_id: '6a7ec4921085b99d53b36cf2', tuition: 45000 },
        { id: '6a7ed0bb1085b99d53b3705c', name: 'Mpharma', code: 'Mpharma', duration: 2, branch_id: '6a7ec4921085b99d53b36cf2', tuition: 55000 },
        { id: '6a7ed9731085b99d53b3753b', name: 'B.tech', code: 'B.tech', duration: 4, branch_id: '6a7ed9551085b99d53b37509', tuition: 75000 },
        { id: '6aaa7cacdc7b3facb443784b', name: 'B.Tech – Computer Science & Engineering (CSE)', code: 'B.TECH(CSE)', duration: 4, branch_id: '6aaa797393fc29470975546b', tuition: 85000 },
        { id: '6a7edac81085b99d53b37601', name: 'BCA', code: 'BCA', duration: 3, branch_id: '6a7ed9551085b99d53b37509', tuition: 40000 },
        { id: '6a7ed5fa1085b99d53b373f7', name: 'BBA', code: 'BBA', duration: 3, branch_id: '6a7ed55b1085b99d53b373d9', tuition: 40000 },
        { id: '6a7ed8311085b99d53b374a6', name: 'MBA', code: 'MBA', duration: 2, branch_id: '6a7ed55b1085b99d53b373d9', tuition: 60000 }
      ];

      for (const c of defaultCourses) {
        const template = Array.from({ length: c.duration }).map((_, idx) => ({
          year: idx + 1,
          totalYearlyFee: c.tuition,
          components: [
            { category: "Tuition Fee", amount: c.tuition, isMandatory: true, frequency: "Annual" },
            { category: "Exam Fee", amount: 2500, isMandatory: true, frequency: "Annual" }
          ]
        }));

        await pgQuery(`
          INSERT INTO courses (id, name, code, duration, branch_id, tuition_fee, fee_structure_template, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name, 
            code = EXCLUDED.code, 
            duration = EXCLUDED.duration, 
            branch_id = EXCLUDED.branch_id, 
            fee_structure_template = EXCLUDED.fee_structure_template,
            updated_at = NOW()
        `, [c.id, c.name, c.code, c.duration, c.branch_id, c.tuition, JSON.stringify(template)]);
      }

      await delCachePattern("master:*");
      return NextResponse.json({ success: true, message: "Standard courses and branches verified & synced in PostgreSQL." });
    }

    // ACTION: CREATE SINGLE COURSE
    if (action === 'create_course') {
      const { name, code, duration, branchId, tuitionFee } = body;
      if (!name || !code) {
        return NextResponse.json({ error: "Course name and code are required." }, { status: 400 });
      }
      const courseId = body.id || crypto.randomBytes(12).toString('hex');
      const courseDuration = Number(duration) || 4;
      const annualTuition = Number(tuitionFee) || 50000;

      const template = Array.from({ length: courseDuration }).map((_, idx) => ({
        year: idx + 1,
        totalYearlyFee: annualTuition,
        components: [
          { category: "Tuition Fee", amount: annualTuition, isMandatory: true, frequency: "Annual" },
          { category: "Exam Fee", amount: 2500, isMandatory: true, frequency: "Annual" }
        ]
      }));

      await pgQuery(`
        INSERT INTO courses (id, name, code, duration, branch_id, tuition_fee, fee_structure_template, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          duration = EXCLUDED.duration,
          branch_id = EXCLUDED.branch_id,
          tuition_fee = EXCLUDED.tuition_fee,
          fee_structure_template = EXCLUDED.fee_structure_template,
          updated_at = NOW()
      `, [courseId, name, code, courseDuration, branchId || null, annualTuition, JSON.stringify(template)]);

      await delCachePattern("master:*");
      return NextResponse.json({ success: true, message: `Course "${name} (${code})" seeded successfully!`, courseId });
    }

    // ACTION: CREATE SINGLE BRANCH
    if (action === 'create_branch') {
      const { name, code, deanName, location } = body;
      if (!name || !code) {
        return NextResponse.json({ error: "Branch name and code are required." }, { status: 400 });
      }
      const branchId = body.id || crypto.randomBytes(12).toString('hex');

      await pgQuery(`
        INSERT INTO branches (id, name, code, dean_name, location, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          dean_name = EXCLUDED.dean_name,
          location = EXCLUDED.location,
          updated_at = NOW()
      `, [branchId, name, code, deanName || '', location || '']);

      await delCachePattern("master:*");
      return NextResponse.json({ success: true, message: `Branch "${name} (${code})" seeded successfully!`, branchId });
    }

    // ACTION: PREVIEW OR SEED STUDENTS
    const dir = path.join(process.cwd(), 'public', 'datafiles');
    const selectedFile = body.fileName || (uploadedFileName ? uploadedFileName : 'all');

    interface TargetSheetItem {
      fileName: string;
      buffer: Buffer;
    }
    const targetSheets: TargetSheetItem[] = [];

    if (uploadedFileBuffer) {
      targetSheets.push({
        fileName: uploadedFileName || selectedFile || 'uploaded.xlsx',
        buffer: uploadedFileBuffer
      });
    } else if (selectedFile === 'all') {
      if (fs.existsSync(dir)) {
        const diskFiles = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));
        for (const df of diskFiles) {
          try {
            targetSheets.push({ fileName: df, buffer: fs.readFileSync(path.join(dir, df)) });
          } catch (_) {}
        }
      }
    } else {
      const filePath = path.join(dir, selectedFile);
      if (fs.existsSync(filePath)) {
        try {
          targetSheets.push({ fileName: selectedFile, buffer: fs.readFileSync(filePath) });
        } catch (_) {}
      }
    }

    if (targetSheets.length === 0) {
      return NextResponse.json({ 
        error: uploadedFileName 
          ? `Could not parse uploaded file "${uploadedFileName}".` 
          : `File "${selectedFile}" not found. Please choose an Excel file to upload directly.`
      }, { status: 400 });
    }

    // 1. Fetch courses and branches for mapping
    const coursesRes = await pgQuery("SELECT id, name, code, duration, tuition_fee, fee_structure_template, branch_id FROM courses");
    const courses = coursesRes.rows;
    const coursesMap = new Map<string, any>();
    for (const c of courses) {
      coursesMap.set(c.id, c);
      coursesMap.set(c.code.toLowerCase(), c);
      coursesMap.set(c.name.toLowerCase(), c);
    }

    const branchesRes = await pgQuery("SELECT id, name, code FROM branches");
    const branches = branchesRes.rows;
    const branchesMap = new Map<string, any>();
    for (const b of branches) {
      branchesMap.set(b.id, b);
      branchesMap.set(b.code.toLowerCase(), b);
    }

    // 2. Fetch existing students from PostgreSQL to check duplicates
    const existingRes = await pgQuery(`
      SELECT id, enrollment_number, student_id, first_name, middle_name, last_name, 
             email, mobile, aadhar_number, selected_program, course_name, 
             session_year, batch
      FROM students
    `);
    const existingStudents = existingRes.rows;

    const existingAadhars = new Set<string>();
    const existingEmails = new Set<string>();
    const existingMobiles = new Set<string>();
    const existingStudentIds = new Set<string>();
    const existingEnrollments = new Set<string>();

    for (const s of existingStudents) {
      if (s.aadhar_number) existingAadhars.add(cleanAadhar(s.aadhar_number));
      if (s.email && cleanEmail(s.email)) existingEmails.add(cleanEmail(s.email));
      if (s.mobile) existingMobiles.add(cleanMobile(s.mobile));
      if (s.student_id) existingStudentIds.add(cleanStr(s.student_id).toUpperCase());
      if (s.enrollment_number) existingEnrollments.add(cleanStr(s.enrollment_number).toUpperCase());
    }

    let defaultPasswordHash = '';
    if (action === 'seed') {
      defaultPasswordHash = await bcrypt.hash("Maya@123", 10);
    }

    const previewStudents: any[] = [];
    const duplicateStudents: any[] = [];
    let totalScanned = 0;

    for (const item of targetSheets) {
      const file = item.fileName;
      let wb: any;
      try {
        wb = XLSX.read(item.buffer, { type: "buffer" });
      } catch (readErr: any) {
        console.error(`Error reading ${file}:`, readErr);
        continue;
      }

      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) continue;

      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rawRows.length < 2) continue;

      const headers = rawRows[0].map((h: any) => cleanStr(h).toUpperCase());
      const getColIdx = (names: string[]) => {
        for (const n of names) {
          const idx = headers.findIndex((h: string) => h.includes(n));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const courseColIdx = getColIdx(["COURSE"]);
      const sessionColIdx = getColIdx(["SESSION"]);
      let sampleCourseInSheet = '';
      let sampleSessionInSheet = '';
      if (rawRows[1]) {
        if (courseColIdx !== -1 && rawRows[1][courseColIdx]) sampleCourseInSheet = cleanStr(rawRows[1][courseColIdx]);
        if (sessionColIdx !== -1 && rawRows[1][sessionColIdx]) sampleSessionInSheet = cleanStr(rawRows[1][sessionColIdx]);
      }

      const preset = getFilePreset(file, sampleCourseInSheet, sampleSessionInSheet);

      // Determine course config: user custom inputs override defaults
      let targetCourseId = body.courseId || '';
      if (!targetCourseId) {
        const courseSearch = sampleCourseInSheet || preset.courseCode || preset.courseNameHint;
        const matched = courses.find((c: any) => 
          c.code.toLowerCase() === courseSearch.toLowerCase() ||
          c.name.toLowerCase() === courseSearch.toLowerCase() ||
          c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
          courseSearch.toLowerCase().includes(c.code.toLowerCase())
        );
        targetCourseId = matched?.id || courses[0]?.id || '';
      }

      const courseObj = courses.find((c: any) => c.id === targetCourseId);
      const branchId = body.branchId || courseObj?.branch_id || branches[0]?.id || '';
      const branchObj = branches.find((b: any) => b.id === branchId);

      const admissionYear = body.admissionYear || preset.admissionYear || '2024';
      const courseDuration = Number(courseObj?.duration) || 4;
      const sessionYear = body.sessionYear || sampleSessionInSheet || preset.sessionYear || `${admissionYear}-${Number(admissionYear) + courseDuration}`;
      const batch = body.batch || admissionYear;

      // Determine student ID prefixes: Strictly match course code + admission year!
      const stdCoursePrefixes = getStandardCourseCodePrefix(courseObj, admissionYear || sessionYear);
      let idPrefix = stdCoursePrefixes.idPrefix;
      let enrollmentPrefix = stdCoursePrefixes.enrollmentPrefix;

      if (body.idPrefix) {
        const userPrefUpper = body.idPrefix.toUpperCase();
        const stdCourseCode = stdCoursePrefixes.idPrefix.slice(0, 3);
        const otherCoursePrefixes = ['BPH', 'DPH', 'MPH', 'BCA', 'BBA', 'MBA', 'BTE'].filter(p => p !== stdCourseCode);
        const hasWrongCourseConflict = otherCoursePrefixes.some(p => userPrefUpper.startsWith(p));
        if (!hasWrongCourseConflict) {
          idPrefix = body.idPrefix;
        }
      }

      if (body.enrollmentPrefix) {
        const userEnrUpper = body.enrollmentPrefix.toUpperCase();
        const stdCourseCode = stdCoursePrefixes.idPrefix.slice(0, 3);
        const otherCoursePrefixes = ['BPH', 'DPH', 'MPH', 'BCA', 'BBA', 'MBA', 'BTE'].filter(p => p !== stdCourseCode);
        const hasWrongCourseConflict = otherCoursePrefixes.some(p => userEnrUpper.includes(p));
        if (!hasWrongCourseConflict) {
          enrollmentPrefix = body.enrollmentPrefix;
        } else {
          enrollmentPrefix = `ENR${idPrefix}`;
        }
      }

      const nameIdx = getColIdx(["STUDENT NAME", "NAME"]);
      const addr1Idx = getColIdx(["ADDRESS 1", "ADDRESS"]);
      const addr2Idx = getColIdx(["ADDRESS 2"]);
      const stateIdx = getColIdx(["STATE"]);
      const cityIdx = getColIdx(["CITY"]);
      const zipIdx = getColIdx(["ZIPCODE", "ZIP", "PIN"]);
      const mobileIdx = getColIdx(["APPLICANTS MOBILE", "APPLICANT MOBILE", "MOBILE"]);
      const emailIdx = getColIdx(["EMAIL"]);
      const genderIdx = getColIdx(["GENDER"]);
      const dobIdx = getColIdx(["DOB"]);
      const parentMobileIdx = getColIdx(["PARENT MOBILE", "FATHER MOBILE"]);
      const categoryIdx = getColIdx(["CASTE CATEGORY", "CATEGORY"]);
      const religionIdx = getColIdx(["RELEGION", "RELIGION"]);
      const fatherIdx = getColIdx(["FATHER NAME", "FATHER"]);
      const motherIdx = getColIdx(["MOTHER NAME", "MOTHER"]);
      const admDateIdx = getColIdx(["ADMISSION FORM DATE", "FORM DATE"]);
      const enrDateIdx = getColIdx(["ENROLLMENT DATE"]);
      const aadharIdx = getColIdx(["AADHAR", "AADHAR NUMBER"]);
      const panIdx = getColIdx(["PAN"]);
      const grnIdx = getColIdx(["GRN"]);
      const certIdx = getColIdx(["CASTE CERTIFICATE"]);

      // Fee template
      let feeTemplate = courseObj?.fee_structure_template;
      if (typeof feeTemplate === 'string') {
        try { feeTemplate = JSON.parse(feeTemplate); } catch (e) {}
      }
      if (!Array.isArray(feeTemplate) || feeTemplate.length === 0) {
        feeTemplate = Array.from({ length: courseDuration }).map((_, idx) => ({
          year: idx + 1,
          totalYearlyFee: Number(courseObj?.tuition_fee) || 45000,
          components: [
            { category: "Tuition Fee", amount: Number(courseObj?.tuition_fee) || 45000, isMandatory: true, frequency: "Annual" }
          ]
        }));
      }

      let currentIdSeq = 1;

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || !row[nameIdx]) continue;

        const rawName = cleanStr(row[nameIdx]);
        if (!rawName) continue;

        totalScanned++;

        const mobile = cleanMobile(row[mobileIdx]);
        const email = cleanEmail(row[emailIdx]);
        const aadhar = cleanAadhar(row[aadharIdx]);
        const pan = cleanStr(row[panIdx]);
        const grn = cleanStr(row[grnIdx]);
        const casteCategory = cleanStr(row[categoryIdx]);
        const religion = cleanStr(row[religionIdx]) || "Hindu";
        const fatherName = cleanStr(row[fatherIdx]);
        const motherName = cleanStr(row[motherIdx]);
        const casteCertificateNumber = cleanStr(row[certIdx]);
        const admFormDate = parseExcelDate(row[admDateIdx], `${admissionYear}-07-15`);
        const enrollmentDate = parseExcelDate(row[enrDateIdx], `${admissionYear}-08-01`);

        const normFullName = rawName.replace(/\s+/g, ' ').trim().toLowerCase();

        // Duplicate checks against database
        let isDuplicate = false;
        let dupReason = '';

        if (aadhar && aadhar.length >= 12 && existingAadhars.has(aadhar)) {
          isDuplicate = true;
          dupReason = `Aadhar (${aadhar}) already exists in PostgreSQL`;
        } else if (email && existingEmails.has(email)) {
          isDuplicate = true;
          dupReason = `Email (${email}) already registered`;
        } else {
          // Check matching student in same course and session
          const foundInDb = existingStudents.find(s => {
            if (s.selected_program !== targetCourseId) return false;
            if (s.session_year !== sessionYear && s.batch !== batch) return false;

            const sFirst = cleanStr(s.first_name).toLowerCase();
            const sLast = cleanStr(s.last_name).toLowerCase();
            const sFull = `${sFirst} ${cleanStr(s.middle_name).toLowerCase()} ${sLast}`.replace(/\s+/g, ' ').trim();

            if (sFull === normFullName || sFirst === normFullName) return true;
            if (mobile && mobile.length === 10 && cleanMobile(s.mobile) === mobile) return true;
            return false;
          });

          if (foundInDb) {
            isDuplicate = true;
            dupReason = `Student "${rawName}" already registered in ${courseObj?.name || 'course'} (${sessionYear}) as [${foundInDb.student_id}]`;
          }
        }

        if (isDuplicate) {
          duplicateStudents.push({
            fileName: file,
            rowNumber: r + 1,
            name: rawName,
            mobile,
            email,
            aadhar,
            fatherName,
            courseName: courseObj?.name || preset.courseNameHint,
            sessionYear,
            dupReason
          });
          continue;
        }

        // Generate next ID
        let studentId = "";
        let enrollmentNumber = "";
        while (true) {
          studentId = `${idPrefix}${String(currentIdSeq).padStart(3, '0')}`;
          enrollmentNumber = `${enrollmentPrefix}${String(currentIdSeq).padStart(3, '0')}`;
          currentIdSeq++;
          if (!existingStudentIds.has(studentId) && !existingEnrollments.has(enrollmentNumber)) {
            break;
          }
        }

        // Reserve to prevent collision in subsequent rows
        existingStudentIds.add(studentId);
        existingEnrollments.add(enrollmentNumber);
        if (aadhar && aadhar.length >= 12) existingAadhars.add(aadhar);
        if (email) existingEmails.add(email);

        const { firstName, middleName, lastName } = splitName(rawName);
        const studentEmail = email || `${studentId.toLowerCase()}@mayaerp.com`;
        const dobStr = parseExcelDate(row[dobIdx], '2005-01-01');
        const gender = normalizeGender(row[genderIdx]);
        const fullAddress = [cleanStr(row[addr1Idx]), cleanStr(row[addr2Idx])].filter(Boolean).join(', ');
        const parentMobile = cleanMobile(row[parentMobileIdx]) || mobile;

        // Build Fees
        let grandTotal = 0;
        let totalTuition = 0;
        let totalExam = 0;

        const feeYears = feeTemplate.map((yt: any, idx: number) => {
          let yrGross = 0;
          const comps = (yt.components || []).map((c: any) => {
            const amt = Number(c.amount) || 0;
            yrGross += amt;
            grandTotal += amt;
            const cName = cleanStr(c.category).toLowerCase();
            if (cName.includes('tuition')) totalTuition += amt;
            else if (cName.includes('exam')) totalExam += amt;
            return {
              category: c.category || "Tuition Fee",
              amount: amt,
              paid: 0,
              isMandatory: c.isMandatory !== false,
              frequency: c.frequency || "Annual",
              months: []
            };
          });

          return {
            year: yt.year || idx + 1,
            yearTotal: yrGross,
            yearPaid: 0,
            discount: 0,
            discountReason: "",
            tuition: { total: yt.totalYearlyFee || yrGross, paid: 0 },
            exam: { total: 0, paid: 0 },
            transport: { total: 0, paid: 0 },
            other: { total: 0, paid: 0 },
            components: comps
          };
        });

        const feesObj = {
          isConfigured: true,
          grandTotal,
          totalPaid: 0,
          years: feeYears
        };

        const mongoId = crypto.randomBytes(12).toString('hex');

        const docsObj = {
          studentPhoto: "",
          marksheet10: "",
          marksheet12: "",
          aadharCard: "",
          casteCertificate: "",
          fatherName,
          motherName,
          casteCategory,
          panNumber: pan,
          grnNumber: grn,
          admissionFormDate: admFormDate,
          enrollmentDate,
          casteCertificateNumber
        };

        const studentRecord = {
          id: mongoId,
          student_id: studentId,
          enrollment_number: enrollmentNumber,
          admission_number: grn || studentId,
          password: defaultPasswordHash || '$2b$10$defaultHashPlaceholder',
          library_pin: studentId.slice(-4),
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          dob: dobStr,
          gender,
          email: studentEmail,
          mobile: mobile || "9876543210",
          parent_mobile: parentMobile,
          alternate_mobile: "",
          address: fullAddress,
          city: cleanStr(row[cityIdx]) || "Hathras",
          state: cleanStr(row[stateIdx]) || "Uttar Pradesh",
          pin_code: cleanStr(row[zipIdx]) || "204101",
          aadhar_number: aadhar || null,
          religion,
          entry_type: "Direct",
          selected_branch: branchId,
          branch_name: branchObj?.name || "",
          branch_code: branchObj?.code || "",
          selected_program: targetCourseId,
          course_name: courseObj?.name || preset.courseNameHint,
          course_code: courseObj?.code || preset.courseCode,
          course_duration: courseDuration,
          selected_semester: 1,
          selected_section: "A",
          session_year: sessionYear,
          admission_year: admissionYear,
          batch,
          course_year: 1,
          fees: JSON.stringify(feesObj),
          total_fee: grandTotal,
          paid_fee: 0,
          fee_balance: grandTotal,
          fee_status: "unpaid",
          tuition_fee: totalTuition,
          tuition_paid: 0,
          exam_fee: totalExam,
          exam_paid: 0,
          transport_fee: 0,
          transport_paid: 0,
          other_fee: 0,
          other_paid: 0,
          documents: JSON.stringify(docsObj),
          status: "Approved",
          student_status: "Active",
          father_name: fatherName,
          mother_name: motherName,
          caste_category: casteCategory,
          pan_number: pan,
          grn_number: grn,
          admission_form_date: admFormDate,
          enrollment_date: enrollmentDate,
          caste_certificate_number: casteCertificateNumber,
          rawFileName: file,
          rowNumber: r + 1
        };

        previewStudents.push(studentRecord);
      }
    }

    // IF ACTION IS PREVIEW: Return the preview analysis without inserting
    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        action: 'preview',
        totalScanned,
        duplicatesCount: duplicateStudents.length,
        newStudentsCount: previewStudents.length,
        duplicateStudents,
        previewStudents: previewStudents.slice(0, 100), // First 100 for fast preview
        summary: {
          scanned: totalScanned,
          duplicates: duplicateStudents.length,
          readyToSeed: previewStudents.length
        }
      });
    }

    // IF ACTION IS SEED: Perform PostgreSQL Inserts
    if (action === 'seed') {
      let insertedCount = 0;

      const insertSql = `
        INSERT INTO students (
          id, student_id, enrollment_number, admission_number, password, library_pin,
          first_name, middle_name, last_name, dob, gender, email, mobile, parent_mobile, alternate_mobile,
          address, city, state, pin_code, aadhar_number, religion, entry_type,
          selected_branch, branch_name, branch_code, selected_program, course_name, course_code, course_duration,
          selected_semester, selected_section, session_year, admission_year, batch, course_year,
          fees, total_fee, paid_fee, fee_balance, fee_status,
          tuition_fee, tuition_paid, exam_fee, exam_paid, transport_fee, transport_paid, other_fee, other_paid,
          documents, status, student_status,
          father_name, mother_name, caste_category, pan_number, grn_number,
          admission_form_date, enrollment_date, caste_certificate_number,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28, $29,
          $30, $31, $32, $33, $34, $35,
          $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, $46, $47, $48,
          $49, $50, $51,
          $52, $53, $54, $55, $56,
          $57, $58, $59,
          NOW(), NOW()
        )
      `;

      for (const s of previewStudents) {
        await pgQuery(insertSql, [
          s.id, s.student_id, s.enrollment_number, s.admission_number, s.password, s.library_pin,
          s.first_name, s.middle_name, s.last_name, s.dob, s.gender, s.email, s.mobile, s.parent_mobile, s.alternate_mobile,
          s.address, s.city, s.state, s.pin_code, s.aadhar_number, s.religion, s.entry_type,
          s.selected_branch, s.branch_name, s.branch_code, s.selected_program, s.course_name, s.course_code, s.course_duration,
          s.selected_semester, s.selected_section, s.session_year, s.admission_year, s.batch, s.course_year,
          s.fees, s.total_fee, s.paid_fee, s.fee_balance, s.fee_status,
          s.tuition_fee, s.tuition_paid, s.exam_fee, s.exam_paid, s.transport_fee, s.transport_paid, s.other_fee, s.other_paid,
          s.documents, s.status, s.student_status,
          s.father_name, s.mother_name, s.caste_category, s.pan_number, s.grn_number,
          s.admission_form_date, s.enrollment_date, s.caste_certificate_number
        ]);
        insertedCount++;
      }

      // Invalidate Redis caches
      await Promise.all([
        delCachePattern("students:*"),
        delCachePattern("fee:*"),
        delCachePattern("master:*")
      ]);

      return NextResponse.json({
        success: true,
        action: 'seed',
        insertedCount,
        skippedCount: duplicateStudents.length,
        message: `Successfully seeded ${insertedCount} new students into PostgreSQL! ${duplicateStudents.length} duplicates safely skipped.`
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/seed/students error:", error);
    return NextResponse.json({ error: error.message || "Failed to process seed action" }, { status: 500 });
  }
}

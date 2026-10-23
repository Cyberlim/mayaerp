import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, delCache, delCachePattern, DEFAULT_CACHE_TTL } from "@/lib/redis";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cacheKey = `course:${id}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    // 2. Query Neon PostgreSQL
    const sql = `
      SELECT 
        c.*,
        b.name as branch_name,
        b.code as branch_code,
        b.dean_name,
        b.color_hex,
        b.icon_name
      FROM courses c
      LEFT JOIN branches b ON c.branch_id = b.id
      WHERE c.id = $1
    `;
    const res = await pgQuery(sql, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const c = res.rows[0];
    const branchObj = c.branch_id ? {
      _id: c.branch_id,
      id: c.branch_id,
      name: c.branch_name || "",
      code: c.branch_code || "",
      deanName: c.dean_name || "",
      colorHex: c.color_hex || "#4F46E5",
      iconName: c.icon_name || "business_center_rounded"
    } : null;

    const course = {
      _id: c.id,
      id: c.id,
      branchId: branchObj || c.branch_id,
      code: c.code,
      name: c.name,
      duration: Number(c.duration) || 4,
      intakeCapacity: Number(c.intake_capacity) || 60,
      coordinator: c.coordinator,
      tuitionFee: Number(c.tuition_fee) || 0,
      labIndex: c.lab_index,
      totalSemesters: Number(c.total_semesters) || 8,
      semesterFees: typeof c.semester_fees === 'string' ? JSON.parse(c.semester_fees) : (c.semester_fees || []),
      feeStructureTemplate: typeof c.fee_structure_template === 'string' ? JSON.parse(c.fee_structure_template) : (c.fee_structure_template || []),
      curriculum: typeof c.curriculum === 'string' ? JSON.parse(c.curriculum) : (c.curriculum || []),
      createdAt: c.created_at,
      updatedAt: c.updated_at
    };

    // Cache in Redis
    await setCache(cacheKey, course, DEFAULT_CACHE_TTL);

    return NextResponse.json(course, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { applyToStudents, updateStudents, ...courseData } = body;
    const shouldSync = Boolean(applyToStudents || updateStudents);

    // Check if course exists in PostgreSQL
    const existingRes = await pgQuery('SELECT * FROM courses WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    const branchId = courseData.branchId !== undefined 
      ? (typeof courseData.branchId === 'object' ? courseData.branchId?._id : courseData.branchId)
      : existing.branch_id;

    const code = courseData.code !== undefined ? courseData.code : existing.code;
    const name = courseData.name !== undefined ? courseData.name : existing.name;
    const duration = courseData.duration !== undefined ? Number(courseData.duration) : existing.duration;
    const intakeCapacity = courseData.intakeCapacity !== undefined ? Number(courseData.intakeCapacity) : existing.intake_capacity;
    const coordinator = courseData.coordinator !== undefined ? courseData.coordinator : existing.coordinator;
    const tuitionFee = courseData.tuitionFee !== undefined ? Number(courseData.tuitionFee) : existing.tuition_fee;
    const labIndex = courseData.labIndex !== undefined ? courseData.labIndex : existing.lab_index;
    const totalSemesters = courseData.totalSemesters !== undefined ? Number(courseData.totalSemesters) : existing.total_semesters;
    const semesterFees = courseData.semesterFees !== undefined 
      ? JSON.stringify(courseData.semesterFees) 
      : (typeof existing.semester_fees === 'string' ? existing.semester_fees : JSON.stringify(existing.semester_fees || []));
    const feeStructureTemplate = courseData.feeStructureTemplate !== undefined 
      ? JSON.stringify(courseData.feeStructureTemplate) 
      : (typeof existing.fee_structure_template === 'string' ? existing.fee_structure_template : JSON.stringify(existing.fee_structure_template || []));
    const curriculum = courseData.curriculum !== undefined 
      ? JSON.stringify(courseData.curriculum) 
      : (typeof existing.curriculum === 'string' ? existing.curriculum : JSON.stringify(existing.curriculum || []));

    const updateSQL = `
      UPDATE courses SET
        branch_id = $1,
        code = $2,
        name = $3,
        duration = $4,
        intake_capacity = $5,
        coordinator = $6,
        tuition_fee = $7,
        lab_index = $8,
        total_semesters = $9,
        semester_fees = $10,
        fee_structure_template = $11,
        curriculum = $12,
        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const updateRes = await pgQuery(updateSQL, [
      branchId,
      code,
      name,
      duration,
      intakeCapacity,
      coordinator,
      tuitionFee,
      labIndex,
      totalSemesters,
      semesterFees,
      feeStructureTemplate,
      curriculum,
      id
    ]);

    const updated = updateRes.rows[0];

    // Also sync to MongoDB Course model for consistency
    try {
      await connectDB();
      const mgUpdate: any = {
        name,
        code,
        duration,
        intakeCapacity,
        coordinator,
        tuitionFee: Number(tuitionFee) || 0
      };
      if (courseData.feeStructureTemplate) {
        mgUpdate.feeStructureTemplate = courseData.feeStructureTemplate;
      }
      await Course.findByIdAndUpdate(id, { $set: mgUpdate });
    } catch (mgErr) {
      console.warn("MongoDB course sync warning:", mgErr);
    }

    // Sync feeStructureTemplate to all enrolled students in PostgreSQL for real-time consistency
    let parsedFeeTemplate: any[] = [];
    if (courseData.feeStructureTemplate) {
      parsedFeeTemplate = Array.isArray(courseData.feeStructureTemplate)
        ? courseData.feeStructureTemplate
        : (typeof courseData.feeStructureTemplate === 'string' ? JSON.parse(courseData.feeStructureTemplate) : []);
    } else if (updated.fee_structure_template) {
      parsedFeeTemplate = typeof updated.fee_structure_template === 'string'
        ? JSON.parse(updated.fee_structure_template)
        : (updated.fee_structure_template || []);
    }

    if (parsedFeeTemplate.length > 0 || shouldSync) {
      try {
        const studentsRes = await pgQuery(
          'SELECT id, fees, paid_fee FROM students WHERE selected_program = $1 OR course_code = $2',
          [id, updated.code || '']
        );

        for (const st of studentsRes.rows) {
          const existingFees = typeof st.fees === 'string' ? JSON.parse(st.fees) : (st.fees || {});
          const existingYears = Array.isArray(existingFees.years) ? existingFees.years : [];

          let grandTotal = 0;
          let grandPaid = 0;

          const updatedYears = parsedFeeTemplate.map((yt: any, idx: number) => {
            const yrNum = Number(yt.year) || (idx + 1);
            const prevYr = existingYears.find((ey: any) => Number(ey.year) === yrNum) || existingYears[idx];
            const discount = Number(prevYr?.discount) || 0;
            const discountReason = prevYr?.discountReason || '';

            let yrGross = 0;
            let yrPaid = 0;

            const components = (yt.components || []).map((c: any) => {
              const amt = Number(c.amount) || 0;
              let compPaid = 0;

              if (prevYr?.components && Array.isArray(prevYr.components)) {
                const matchC = prevYr.components.find((ec: any) =>
                  (ec.category || '').toLowerCase().trim() === (c.category || '').toLowerCase().trim()
                );
                if (matchC) compPaid = Number(matchC.paid) || 0;
              } else if (prevYr) {
                const catLower = (c.category || '').toLowerCase();
                if (catLower.includes('tuition')) compPaid = Number(prevYr.tuition?.paid) || 0;
                else if (catLower.includes('exam')) compPaid = Number(prevYr.exam?.paid) || 0;
                else if (catLower.includes('transport')) compPaid = Number(prevYr.transport?.paid) || 0;
                else compPaid = Number(prevYr.other?.paid) || 0;
              }

              yrGross += amt;
              yrPaid += compPaid;

              return {
                category: c.category || 'Tuition Fee',
                amount: amt,
                paid: compPaid,
                isMandatory: c.isMandatory !== false,
                frequency: c.frequency || 'Annual'
              };
            });

            grandTotal += Math.max(0, yrGross - discount);
            grandPaid += yrPaid;

            return {
              year: yrNum,
              discount,
              discountReason,
              components,
              yearGross: yrGross,
              yearTotal: Math.max(0, yrGross - discount),
              yearPaid: yrPaid,
              tuition: { total: yrGross, paid: yrPaid }
            };
          });

          const updatedFees = {
            isConfigured: true,
            years: updatedYears
          };

          const newBalance = Math.max(0, grandTotal - grandPaid);
          const newStatus = grandPaid >= grandTotal && grandTotal > 0 ? 'paid' : (grandPaid > 0 ? 'partial' : 'unpaid');

          await pgQuery(
            'UPDATE students SET fees = $1, total_fee = $2, fee_balance = $3, fee_status = $4, updated_at = NOW() WHERE id = $5',
            [JSON.stringify(updatedFees), grandTotal, newBalance, newStatus, st.id]
          );
        }
      } catch (feeSyncErr) {
        console.error("Error syncing student fees:", feeSyncErr);
      }
    }

    // Invalidate Redis caches for real-time synchronization
    await delCachePattern("fee:student-account:*");
    await delCachePattern("students:*");
    await delCachePattern("master:courses:*");
    await delCache(`course:${id}`);

    // Fetch joined branch info for returning
    const branchRes = await pgQuery('SELECT * FROM branches WHERE id = $1', [updated.branch_id]);
    const b = branchRes.rows[0];
    const branchObj = b ? {
      _id: b.id,
      id: b.id,
      name: b.name || "",
      code: b.code || "",
      deanName: b.dean_name || "",
      colorHex: b.color_hex || "#4F46E5",
      iconName: b.icon_name || "business_center_rounded"
    } : null;

    const formatted = {
      _id: updated.id,
      id: updated.id,
      branchId: branchObj || updated.branch_id,
      code: updated.code,
      name: updated.name,
      duration: Number(updated.duration) || 4,
      intakeCapacity: Number(updated.intake_capacity) || 60,
      coordinator: updated.coordinator,
      tuitionFee: Number(updated.tuition_fee) || 0,
      labIndex: updated.lab_index,
      totalSemesters: Number(updated.total_semesters) || 8,
      semesterFees: typeof updated.semester_fees === 'string' ? JSON.parse(updated.semester_fees) : (updated.semester_fees || []),
      feeStructureTemplate: typeof updated.fee_structure_template === 'string' ? JSON.parse(updated.fee_structure_template) : (updated.fee_structure_template || []),
      curriculum: typeof updated.curriculum === 'string' ? JSON.parse(updated.curriculum) : (updated.curriculum || []),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("PATCH /api/courses/[id] error:", error);
    if (error.code === '23505') {
      return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await pgQuery('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Invalidate Redis caches
    await delCachePattern("master:courses:*");
    await delCache(`course:${id}`);

    return NextResponse.json({ message: "Course deleted successfully from PostgreSQL" });
  } catch (error: any) {
    console.error("DELETE /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

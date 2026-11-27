import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCache, delCachePattern } from "@/lib/redis";
import connectDB from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { Student } from "@/models/Student";

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { feeStructureTemplate, batchFeeTemplates, batch, applyToStudents } = body;

    // Check course existence in PostgreSQL
    const courseRes = await pgQuery('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseRes.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const currentCourse = courseRes.rows[0];

    let currentBatchTemplates = typeof currentCourse.batch_fee_templates === 'string'
      ? JSON.parse(currentCourse.batch_fee_templates)
      : (currentCourse.batch_fee_templates || {});

    // If batch is provided and feeStructureTemplate is given, store into batchFeeTemplates[batch]
    if (batch && String(batch).trim() && feeStructureTemplate) {
      const bKey = String(batch).trim();
      currentBatchTemplates[bKey] = feeStructureTemplate;
    } else if (batchFeeTemplates && typeof batchFeeTemplates === 'object') {
      currentBatchTemplates = { ...currentBatchTemplates, ...batchFeeTemplates };
    }

    // Update in PostgreSQL
    let updateSql = `
      UPDATE courses SET
        batch_fee_templates = $1,
        updated_at = NOW()
    `;
    const updateParams: any[] = [JSON.stringify(currentBatchTemplates)];

    // If global default feeStructureTemplate is also updated
    if (feeStructureTemplate && (!batch || batch === 'default' || batch === 'All')) {
      updateSql = `
        UPDATE courses SET
          fee_structure_template = $1,
          batch_fee_templates = $2,
          updated_at = NOW()
      `;
      updateParams.unshift(JSON.stringify(feeStructureTemplate));
    }

    updateSql += ` WHERE id = $${updateParams.length + 1} RETURNING *`;
    updateParams.push(id);

    const updatedPg = await pgQuery(updateSql, updateParams);

    // Sync to MongoDB
    try {
      await connectDB();
      const mgUpdate: any = { batchFeeTemplates: currentBatchTemplates };
      if (feeStructureTemplate && (!batch || batch === 'default' || batch === 'All')) {
        mgUpdate.feeStructureTemplate = feeStructureTemplate;
      }
      await Course.findByIdAndUpdate(id, { $set: mgUpdate });
    } catch (mgErr) {
      console.warn("MongoDB sync warning in courses/[id]/fees:", mgErr);
    }

    // Apply to students if requested
    if (applyToStudents && feeStructureTemplate && Array.isArray(feeStructureTemplate) && feeStructureTemplate.length > 0) {
      const templateToApply = feeStructureTemplate;
      
      // Determine student filter: if batch is specified, apply ONLY to students of that batch!
      let studentSql = 'SELECT id, fees, paid_fee, batch, session_year, admission_year FROM students WHERE selected_program = $1 OR course_code = $2';
      const studentParams: any[] = [id, currentCourse.code || ''];

      if (batch && String(batch).trim() && batch !== 'All' && batch !== 'default') {
        studentSql += ' AND (batch = $3 OR session_year = $3 OR batch LIKE $4 OR session_year LIKE $4)';
        studentParams.push(batch, `${batch.split('-')[0]}%`);
      }

      const studentsRes = await pgQuery(studentSql, studentParams);

      for (const st of studentsRes.rows) {
        const existingFees = typeof st.fees === 'string' ? JSON.parse(st.fees) : (st.fees || {});
        const existingYears = Array.isArray(existingFees.years) ? existingFees.years : [];

        let grandTotal = 0;
        let grandPaid = 0;

        const updatedYears = templateToApply.map((yt: any, idx: number) => {
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
    }

    // Invalidate Redis caches
    await Promise.all([
      delCachePattern("fee:student-account:*"),
      delCachePattern("students:*"),
      delCachePattern("master:courses:*"),
      delCache(`course:${id}`),
      delCache("fee:bundle:master")
    ]);

    return NextResponse.json({ 
      success: true, 
      message: batch ? `Fee structure for Batch ${batch} updated successfully!` : "Fee structure template updated successfully!",
      course: updatedPg.rows[0]
    });
  } catch (error: any) {
    console.error("Error updating course fees:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

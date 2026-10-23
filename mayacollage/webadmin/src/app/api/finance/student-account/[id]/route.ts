import { NextResponse } from 'next/server';
import { query as pgQuery } from '@/lib/postgres';
import { mapPgTransactions } from '@/lib/financeMapper';
import { getCache, setCache, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const cacheKey = `fee:student-account:${studentId}`;

    const url = new URL(request.url);
    const bypassCache = url.searchParams.has('t') || url.searchParams.get('nocache') === 'true';

    // 1. Try Redis cache (if not bypassing)
    if (!bypassCache) {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData, {
          headers: { "X-Cache-Source": "Upstash-Redis" }
        });
      }
    }

    // 2. Query Neon PostgreSQL for student with branch & course info
    const stuSql = `
      SELECT 
        s.*,
        b.name as branch_name,
        b.code as branch_code,
        c.name as course_name,
        c.code as course_code,
        c.duration as course_duration,
        c.tuition_fee as course_tuition_fee,
        c.total_semesters as course_total_semesters,
        c.semester_fees as course_semester_fees,
        c.fee_structure_template as course_fee_structure_template,
        c.coordinator as course_coordinator
      FROM students s
      LEFT JOIN branches b ON s.selected_branch = b.id
      LEFT JOIN courses c ON (s.selected_program = c.id OR (s.selected_program IS NULL AND s.course_code = c.code))
      WHERE s.id = $1
    `;
    const stuRes = await pgQuery(stuSql, [studentId]);
    if (stuRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentRow = stuRes.rows[0];

    // Fallback: If course fee structure template was not resolved via direct join
    if (!studentRow.course_fee_structure_template && (studentRow.selected_program || studentRow.course_code || studentRow.course_name)) {
      const crsFallback = await pgQuery(
        'SELECT * FROM courses WHERE id = $1 OR code = $2 OR name = $3 LIMIT 1',
        [studentRow.selected_program || '', studentRow.course_code || '', studentRow.course_name || '']
      );
      if (crsFallback.rows.length > 0) {
        const cf = crsFallback.rows[0];
        studentRow.course_name = cf.name || studentRow.course_name;
        studentRow.course_code = cf.code || studentRow.course_code;
        studentRow.course_duration = cf.duration || studentRow.course_duration;
        studentRow.course_tuition_fee = cf.tuition_fee || studentRow.course_tuition_fee;
        studentRow.course_total_semesters = cf.total_semesters || studentRow.course_total_semesters;
        studentRow.course_semester_fees = cf.semester_fees || studentRow.course_semester_fees;
        studentRow.course_fee_structure_template = cf.fee_structure_template;
      }
    }

    // 3. Query all transactions for this student
    const txnsSql = `
      SELECT 
        t.*,
        c.name as course_name,
        c.code as course_code,
        c.duration as course_duration
      FROM fee_transactions t
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE t.student_id = $1
      ORDER BY t.payment_date DESC, t.created_at DESC
    `;
    const txnsRes = await pgQuery(txnsSql, [studentId]);
    const transactions = mapPgTransactions(txnsRes.rows);

    const duration = Number(studentRow.course_duration) || 4;
    const totalSemesters = Number(studentRow.course_total_semesters) || (duration * 2);
    const courseTuition = Number(studentRow.course_tuition_fee) || 0;

    let feesObj: any = typeof studentRow.fees === 'string' ? JSON.parse(studentRow.fees) : (studentRow.fees || {});
    if (!feesObj || typeof feesObj !== 'object') {
      feesObj = { isConfigured: false, years: [] };
    }

    // Parse course fee template from PostgreSQL courses table
    let courseTemplate: any[] = [];
    if (studentRow.course_fee_structure_template) {
      try {
        courseTemplate = typeof studentRow.course_fee_structure_template === 'string'
          ? JSON.parse(studentRow.course_fee_structure_template)
          : studentRow.course_fee_structure_template;
      } catch (e) {
        courseTemplate = [];
      }
    }

    // Build years list
    let yearsData = [];
    let totalGross = 0;
    let totalDiscount = 0;
    let totalAssessed = 0;
    let totalPaid = 0;

    const studentYears = Array.isArray(feesObj.years) ? feesObj.years : [];

    // Authoritative fee template from course (Section 2: Fee Structure)
    if (Array.isArray(courseTemplate) && courseTemplate.length > 0) {
      yearsData = courseTemplate.map((yt: any, idx: number) => {
        const yNum = Number(yt.year) || (idx + 1);
        const studentYr = studentYears.find((sy: any) => Number(sy.year) === yNum) || studentYears[idx];
        const discount = Number(studentYr?.discount) || 0;
        const discountReason = studentYr?.discountReason || "";

        // Filter transactions for this academic year
        const yearTxns = transactions.filter((t: any) => {
          if (t.academicYear === `Year ${yNum}` || t.academicYear === String(yNum)) return true;
          if (t.semester === (yNum * 2 - 1) || t.semester === (yNum * 2)) return true;
          return false;
        });

        let yrGross = 0;
        let yrPaid = 0;
        const categories: any = {};

        const components = (yt.components || []).map((comp: any) => {
          const catName = comp.category || "Tuition Fee";
          const catCode = catName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const amt = Number(comp.amount) || 0;

          // 1. Check if student already has a recorded paid amount for this exact category
          let compPaid = 0;
          if (studentYr?.components && Array.isArray(studentYr.components)) {
            const matchExisting = studentYr.components.find((ec: any) => 
              (ec.category || '').toLowerCase().trim() === catName.toLowerCase().trim()
            );
            if (matchExisting) {
              compPaid = Number(matchExisting.paid) || 0;
            }
          }

          // 2. Check legacy categories if not found in components
          if (compPaid === 0 && studentYr) {
            const catLower = catName.toLowerCase();
            if (catLower.includes('tuition')) compPaid = Math.max(compPaid, Number(studentYr.tuition?.paid) || 0);
            else if (catLower.includes('exam')) compPaid = Math.max(compPaid, Number(studentYr.exam?.paid) || 0);
            else if (catLower.includes('transport') || catLower.includes('bus')) compPaid = Math.max(compPaid, Number(studentYr.transport?.paid) || 0);
            else if (catLower.includes('other')) compPaid = Math.max(compPaid, Number(studentYr.other?.paid) || 0);
          }

          // 3. Reconcile with transactions for this category
          const catTxns = yearTxns.filter((t: any) => {
            const tCat = (t.categoryName || t.category || '').toLowerCase().trim();
            const cLower = catName.toLowerCase().trim();
            return tCat === cLower || (tCat.includes(cLower) || cLower.includes(tCat));
          });
          const txnSumForCat = catTxns.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
          compPaid = Math.max(compPaid, txnSumForCat);

          const due = Math.max(0, amt - compPaid);
          const isPaid = due === 0 && amt > 0;
          const isPartial = compPaid > 0 && due > 0;
          const isUnpaid = compPaid === 0 && amt > 0;

          yrGross += amt;
          yrPaid += compPaid;

          categories[catCode] = {
            total: amt,
            paid: compPaid,
            os: due
          };

          return {
            category: catName,
            title: catName,
            code: catCode,
            amount: amt,
            total: amt,
            paid: compPaid,
            due,
            os: due,
            frequency: comp.frequency || "Annual",
            isMandatory: comp.isMandatory !== false,
            isPaid,
            isPartial,
            isUnpaid
          };
        });

        // Also check if any general transactions in year not captured by specific categories
        const yrTxnTotal = yearTxns.reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        if (yrTxnTotal > yrPaid) {
          yrPaid = Math.min(yrGross, yrTxnTotal);
        }

        const yearNet = Math.max(0, yrGross - discount);
        const yearOS = Math.max(0, yearNet - yrPaid);

        totalGross += yrGross;
        totalDiscount += discount;
        totalAssessed += yearNet;
        totalPaid += yrPaid;

        return {
          year: yNum,
          components,
          categories,
          yearGross: yrGross,
          discount,
          discountReason,
          yearTotal: yearNet,
          yearNet,
          yearPaid: yrPaid,
          yearOS,
          status: yearOS === 0 && yearNet > 0 ? 'Paid' : (yrPaid > 0 ? 'Partial' : 'Unpaid')
        };
      });
    } else if (feesObj.isConfigured && studentYears.length > 0) {
      // Fallback to student's own configured years if course template is completely empty
      yearsData = studentYears.map((y: any, idx: number) => {
        const yNum = y.year || idx + 1;
        let yearGross = 0;
        let yearPaid = 0;
        let categories: any = {};
        let components = [];
        const discount = Number(y.discount) || 0;
        const discountReason = y.discountReason || "";

        if (Array.isArray(y.components) && y.components.length > 0) {
          components = y.components.map((c: any) => {
            const amt = Number(c.amount) || 0;
            const pd = Number(c.paid) || 0;
            const due = Math.max(0, amt - pd);
            yearGross += amt;
            yearPaid += pd;
            return {
              category: c.category || "Tuition Fee",
              title: c.category || "Tuition Fee",
              code: (c.category || "tuition").toLowerCase().replace(/[^a-z0-9]/g, '_'),
              amount: amt,
              total: amt,
              paid: pd,
              due,
              os: due,
              frequency: c.frequency || "Annual",
              isMandatory: c.isMandatory !== false,
              isPaid: due === 0 && amt > 0,
              isPartial: pd > 0 && due > 0,
              isUnpaid: pd === 0 && amt > 0
            };
          });
        } else {
          const tuitionTot = Number(y.tuition?.total) || 0;
          const tuitionPaid = Number(y.tuition?.paid) || 0;
          const examTot = Number(y.exam?.total) || 0;
          const examPaid = Number(y.exam?.paid) || 0;
          const transportTot = Number(y.transport?.total) || 0;
          const transportPaid = Number(y.transport?.paid) || 0;
          const otherTot = Number(y.other?.total) || 0;
          const otherPaid = Number(y.other?.paid) || 0;

          yearGross = tuitionTot + examTot + transportTot + otherTot;
          yearPaid = tuitionPaid + examPaid + transportPaid + otherPaid;

          categories = {
            tuition: { total: tuitionTot, paid: tuitionPaid, os: Math.max(0, tuitionTot - tuitionPaid) },
            exam: { total: examTot, paid: examPaid, os: Math.max(0, examTot - examPaid) },
            transport: { total: transportTot, paid: transportPaid, os: Math.max(0, transportTot - transportPaid) },
            other: { total: otherTot, paid: otherPaid, os: Math.max(0, otherTot - otherPaid) }
          };

          components = [
            { category: "Tuition Fee", title: "Tuition Fee", code: "tuition", amount: tuitionTot, total: tuitionTot, paid: tuitionPaid, due: Math.max(0, tuitionTot - tuitionPaid), frequency: "Annual", isMandatory: true, isPaid: tuitionPaid >= tuitionTot && tuitionTot > 0, isPartial: tuitionPaid > 0 && tuitionPaid < tuitionTot, isUnpaid: tuitionPaid === 0 && tuitionTot > 0 },
            { category: "Exam Fee", title: "Exam Fee", code: "exam", amount: examTot, total: examTot, paid: examPaid, due: Math.max(0, examTot - examPaid), frequency: "Annual", isMandatory: true, isPaid: examPaid >= examTot && examTot > 0, isPartial: examPaid > 0 && examPaid < examTot, isUnpaid: examPaid === 0 && examTot > 0 }
          ];
        }

        const yearNet = Math.max(0, yearGross - discount);
        const yearOS = Math.max(0, yearNet - yearPaid);
        totalGross += yearGross;
        totalDiscount += discount;
        totalAssessed += yearNet;
        totalPaid += yearPaid;

        return {
          year: yNum,
          components,
          categories,
          yearGross,
          discount,
          discountReason,
          yearTotal: yearNet,
          yearNet,
          yearPaid,
          yearOS,
          status: yearOS === 0 && yearNet > 0 ? 'Paid' : (yearPaid > 0 ? 'Partial' : 'Unpaid')
        };
      });
    } else {
      // Default fallback if no template or student configuration exists
      const perYear = duration > 0 ? Math.round(courseTuition / duration) : courseTuition;
      for (let i = 1; i <= duration; i++) {
        const yearTxns = transactions.filter((t: any) => t.semester === (i * 2 - 1) || t.semester === (i * 2) || t.academicYear === `Year ${i}`);
        const yrPaid = yearTxns.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        const yrOS = Math.max(0, perYear - yrPaid);

        totalGross += perYear;
        totalAssessed += perYear;
        totalPaid += yrPaid;

        yearsData.push({
          year: i,
          components: [
            { category: 'Tuition Fee', title: 'Tuition Fee', code: 'tuition', amount: perYear, total: perYear, paid: yrPaid, due: yrOS, os: yrOS, frequency: 'Annual', isMandatory: true, isPaid: yrOS === 0 && perYear > 0, isPartial: yrPaid > 0 && yrOS > 0, isUnpaid: yrPaid === 0 && perYear > 0 }
          ],
          categories: {
            tuition: { total: perYear, paid: yrPaid, os: yrOS }
          },
          yearGross: perYear,
          discount: 0,
          discountReason: '',
          yearTotal: perYear,
          yearNet: perYear,
          yearPaid: yrPaid,
          yearOS: yrOS,
          status: yrOS === 0 && perYear > 0 ? 'Paid' : (yrPaid > 0 ? 'Partial' : 'Unpaid')
        });
      }
    }

    // Reconcile total transactions paid sum if higher
    const txnSum = transactions.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
    if (txnSum > totalPaid) {
      totalPaid = txnSum;
    }

    const totalOutstanding = Math.max(0, totalAssessed - totalPaid);
    let overallStatus = 'Cleared';
    if (totalPaid === 0 && totalAssessed > 0) overallStatus = 'Unpaid';
    else if (totalOutstanding > 0) overallStatus = 'Partial';
    else overallStatus = 'Paid';

    const result = {
      student: {
        _id: studentRow.id,
        id: studentRow.id,
        firstName: studentRow.first_name,
        middleName: studentRow.middle_name,
        lastName: studentRow.last_name,
        enrollmentNumber: studentRow.enrollment_number,
        admissionNumber: studentRow.admission_number,
        studentId: studentRow.student_id,
        mobile: studentRow.mobile,
        parentMobile: studentRow.parent_mobile,
        email: studentRow.email,
        applicantPhoto: studentRow.applicant_photo,
        studentStatus: studentRow.student_status,
        sessionYear: studentRow.session_year,
        courseYear: studentRow.course_year,
        selectedSemester: studentRow.selected_semester,
        selectedBranch: {
          _id: studentRow.selected_branch,
          name: studentRow.branch_name,
          code: studentRow.branch_code
        },
        selectedProgram: {
          _id: studentRow.selected_program,
          name: studentRow.course_name,
          code: studentRow.course_code,
          duration: duration,
          totalSemesters: totalSemesters,
          tuitionFee: courseTuition
        }
      },
      summary: {
        totalGross,
        totalDiscount,
        totalAssessed,
        totalPaid,
        totalOutstanding,
        status: overallStatus
      },
      years: yearsData,
      transactions
    };

    // 4. Cache in Redis for 30 minutes
    await setCache(cacheKey, result, DEFAULT_CACHE_TTL);

    return NextResponse.json(result, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });

  } catch (error: any) {
    console.error('Error in GET /api/finance/student-account/[id]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch student account statement' }, { status: 500 });
  }
}

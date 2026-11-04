/**
 * repair_fee_distribution.mjs
 *
 * ONE-TIME script to fix students whose fees JSONB has the entire paid amount
 * credited to a single component (Year 1 Tuition) instead of being distributed
 * across the correct year/component slots.
 *
 * HOW IT WORKS:
 *   For each student with fee_transactions, it reconstructs the correct `paid`
 *   values per year/component by sequentially distributing each transaction's
 *   amount starting from its declared year/category, overflowing to the next
 *   component/year as needed — matching the new backend logic exactly.
 *
 * USAGE:
 *   node repair_fee_distribution.mjs
 *
 * SAFE TO RE-RUN: Yes — it recalculates from scratch each time.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function normalizeStr(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Distribute a single transaction's amount into the fees object starting at
 * the specified year/category, overflowing sequentially to subsequent slots.
 */
function distributePayment(feesObj, payNum, yrNum, catCode, categoryName) {
  if (!feesObj || !Array.isArray(feesObj.years) || feesObj.years.length === 0) return;

  feesObj.years.sort((a, b) => a.year - b.year);

  const normalizedCat = normalizeStr(categoryName || catCode);
  let startYearIdx = feesObj.years.findIndex(y => y.year === yrNum);
  if (startYearIdx < 0) startYearIdx = 0;

  let remaining = payNum;

  for (let yi = startYearIdx; yi < feesObj.years.length && remaining > 0; yi++) {
    const yr = feesObj.years[yi];

    if (Array.isArray(yr.components) && yr.components.length > 0) {
      let startCI = 0;
      if (yi === startYearIdx) {
        const idx = yr.components.findIndex(c => {
          const cNorm = normalizeStr(c.category);
          return cNorm === normalizedCat || cNorm.includes(normalizedCat) || normalizedCat.includes(cNorm);
        });
        if (idx >= 0) startCI = idx;
      }
      for (let ci = startCI; ci < yr.components.length && remaining > 0; ci++) {
        const comp = yr.components[ci];
        const compDue = Math.max(0, (Number(comp.amount) || 0) - (Number(comp.paid) || 0));
        if (compDue > 0) {
          const toApply = Math.min(remaining, compDue);
          comp.paid = (Number(comp.paid) || 0) + toApply;
          remaining -= toApply;
        }
      }
    } else {
      const standardCats = ['tuition', 'exam', 'transport', 'other'];
      const orderedCats = yi === startYearIdx
        ? [catCode, ...standardCats.filter(c => c !== catCode)]
        : standardCats;

      for (const cat of orderedCats) {
        if (remaining <= 0) break;
        if (!yr[cat]) continue;
        const catDue = Math.max(0, (Number(yr[cat].total) || 0) - (Number(yr[cat].paid) || 0));
        if (catDue > 0) {
          const toApply = Math.min(remaining, catDue);
          yr[cat].paid = (Number(yr[cat].paid) || 0) + toApply;
          remaining -= toApply;
        }
      }
    }
  }

  // Edge case: remaining > 0 after all slots are filled — credit to target year/category
  if (remaining > 0) {
    const targetYr = feesObj.years.find(y => y.year === yrNum) || feesObj.years[0];
    if (targetYr) {
      if (Array.isArray(targetYr.components) && targetYr.components.length > 0) {
        const comp = targetYr.components.find(c => {
          const cNorm = normalizeStr(c.category);
          return cNorm === normalizedCat || cNorm.includes(normalizedCat) || normalizedCat.includes(cNorm);
        }) || targetYr.components[0];
        if (comp) comp.paid = (Number(comp.paid) || 0) + remaining;
      } else {
        const fallbackCat = ['tuition', 'exam', 'transport', 'other'].includes(catCode) ? catCode : 'other';
        if (!targetYr[fallbackCat]) targetYr[fallbackCat] = { total: 0, paid: 0 };
        targetYr[fallbackCat].paid = (Number(targetYr[fallbackCat].paid) || 0) + remaining;
      }
    }
  }
}

async function main() {
  const client = await pool.connect();
  try {
    // Get all students who have transactions AND a configured fees JSONB
    const studentsRes = await client.query(`
      SELECT DISTINCT s.id, s.first_name, s.last_name, s.fees, s.total_fee, s.paid_fee
      FROM students s
      INNER JOIN fee_transactions ft ON ft.student_id = s.id
      WHERE s.fees IS NOT NULL
        AND s.fees::text != 'null'
        AND s.fees::text != '{}'
      ORDER BY s.id
    `);

    console.log(`\nFound ${studentsRes.rows.length} students with fees + transactions to repair.\n`);

    let repaired = 0;
    let skipped = 0;

    for (const student of studentsRes.rows) {
      const studentId = student.id;
      const name = `${student.first_name} ${student.last_name}`.trim();

      // Parse fees JSONB
      let feesObj = typeof student.fees === 'string' ? JSON.parse(student.fees) : student.fees;
      if (!feesObj || !Array.isArray(feesObj.years) || feesObj.years.length === 0) {
        console.log(`  SKIP ${name} (${studentId}): no years configured`);
        skipped++;
        continue;
      }

      // Reset all paid values to 0 (we'll recompute from transactions)
      feesObj.years.forEach(yr => {
        if (Array.isArray(yr.components)) {
          yr.components.forEach(c => { c.paid = 0; });
        } else {
          ['tuition', 'exam', 'transport', 'other'].forEach(cat => {
            if (yr[cat]) yr[cat].paid = 0;
          });
        }
      });

      // Fetch all transactions for this student, oldest first
      const txnsRes = await client.query(`
        SELECT amount, category, category_name, academic_year, semester
        FROM fee_transactions
        WHERE student_id = $1
        ORDER BY payment_date ASC, created_at ASC
      `, [studentId]);

      if (txnsRes.rows.length === 0) {
        skipped++;
        continue;
      }

      // Replay each transaction with the correct distribution logic
      for (const txn of txnsRes.rows) {
        const payNum = Number(txn.amount) || 0;
        if (payNum <= 0) continue;

        // Derive year number from academic_year string (e.g. "Year 1" → 1)
        let yrNum = 1;
        const yrMatch = (txn.academic_year || '').match(/(\d+)/);
        if (yrMatch) yrNum = parseInt(yrMatch[1], 10);

        distributePayment(feesObj, payNum, yrNum, txn.category || 'tuition', txn.category_name);
      }

      // Recompute totals
      let newPaidFee = 0;
      let newTotalFee = 0;
      feesObj.years.forEach(yr => {
        let yGross = 0, yPaid = 0;
        if (Array.isArray(yr.components) && yr.components.length > 0) {
          yr.components.forEach(c => { yGross += Number(c.amount) || 0; yPaid += Number(c.paid) || 0; });
        } else {
          yGross = (Number(yr.tuition?.total) || 0) + (Number(yr.exam?.total) || 0) + (Number(yr.transport?.total) || 0) + (Number(yr.other?.total) || 0);
          yPaid  = (Number(yr.tuition?.paid)  || 0) + (Number(yr.exam?.paid)  || 0) + (Number(yr.transport?.paid)  || 0) + (Number(yr.other?.paid)  || 0);
        }
        newTotalFee += Math.max(0, yGross - (Number(yr.discount) || 0));
        newPaidFee  += yPaid;
      });

      const newBalance = Math.max(0, newTotalFee - newPaidFee);
      const newStatus = newPaidFee >= newTotalFee && newTotalFee > 0 ? 'paid' : (newPaidFee > 0 ? 'partial' : 'unpaid');

      // Save repaired fees back to PostgreSQL
      await client.query(`
        UPDATE students
        SET fees = $2, paid_fee = $3, fee_balance = $4, fee_status = $5, updated_at = NOW()
        WHERE id = $1
      `, [studentId, JSON.stringify(feesObj), newPaidFee, newBalance, newStatus]);

      console.log(`  ✅ REPAIRED ${name} (${studentId}): paid_fee=${newPaidFee}, balance=${newBalance}, status=${newStatus}`);
      repaired++;
    }

    console.log(`\n✅ Done. Repaired: ${repaired}  Skipped: ${skipped}\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error('Error:', err); process.exit(1); });


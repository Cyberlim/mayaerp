import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { delCache, delCachePattern } from "@/lib/redis";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch transaction
    const txnRes = await pgQuery('SELECT * FROM fee_transactions WHERE id = $1', [id]);
    if (txnRes.rows.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    const transaction = txnRes.rows[0];
    const studentId = transaction.student_id;
    const amount = Number(transaction.amount) || 0;

    // 2. Reverse fee in student record if student exists
    if (studentId) {
      const stuRes = await pgQuery('SELECT * FROM students WHERE id = $1', [studentId]);
      if (stuRes.rows.length > 0) {
        const student = stuRes.rows[0];
        let feesObj: any = typeof student.fees === 'string' ? JSON.parse(student.fees) : (student.fees || {});
        
        if (feesObj && Array.isArray(feesObj.years)) {
          let yrNum = 1;
          if (typeof transaction.academic_year === "string" && transaction.academic_year.includes("Year")) {
            const parsed = parseInt(transaction.academic_year.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(parsed)) yrNum = parsed;
          }

          const yearItem = feesObj.years.find((y: any) => y.year === yrNum);
          const catCode = transaction.category || "tuition";

          if (yearItem) {
            if (["tuition", "exam", "transport", "other"].includes(catCode)) {
              if (yearItem[catCode] && yearItem[catCode].paid !== undefined) {
                yearItem[catCode].paid = Math.max(0, (Number(yearItem[catCode].paid) || 0) - amount);
              }
            } else {
              // Custom category
              let foundComp = false;
              if (Array.isArray(yearItem.components)) {
                const comp = yearItem.components.find((c: any) => c.category === transaction.category_name || c.category === catCode);
                if (comp) {
                  comp.paid = Math.max(0, (Number(comp.paid) || 0) - amount);
                  foundComp = true;
                }
              }
              if (!foundComp) {
                if (!yearItem.other) yearItem.other = { total: 0, paid: 0 };
                yearItem.other.paid = Math.max(0, (Number(yearItem.other.paid) || 0) - amount);
              }
            }

            // Recalculate totals
            let newTotalFee = 0;
            let newPaidFee = 0;
            feesObj.years.forEach((y: any) => {
              const yGross = (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
              const yPaid = (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
              const yDisc = Number(y.discount) || 0;
              newTotalFee += Math.max(0, yGross - yDisc);
              newPaidFee += yPaid;
            });
            const newBalance = Math.max(0, newTotalFee - newPaidFee);
            const newStatus = newPaidFee >= newTotalFee && newTotalFee > 0 ? 'paid' : (newPaidFee > 0 ? 'partial' : 'unpaid');

            await pgQuery(`
              UPDATE students
              SET fees = $2,
                  total_fee = $3,
                  paid_fee = $4,
                  fee_balance = $5,
                  fee_status = $6,
                  updated_at = NOW()
              WHERE id = $1
            `, [studentId, JSON.stringify(feesObj), newTotalFee, newPaidFee, newBalance, newStatus]);
          }
        }
      }
    }

    // 3. Delete the transaction
    await pgQuery('DELETE FROM fee_transactions WHERE id = $1', [id]);

    // 4. Invalidate Redis caches
    await Promise.all([
      studentId ? delCache(`student:${studentId}`) : Promise.resolve(),
      studentId ? delCache(`fee:student-account:${studentId}`) : Promise.resolve(),
      delCache("fee:bundle:master"),
      delCachePattern("fee:transactions:*"),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("students:list:*"),
      delCachePattern("fee:receipts:*"),
      delCachePattern("fee:alerts:*"),
      delCache("fee:stats")
    ]);

    return NextResponse.json({ success: true, message: "Transaction deleted and fee reversed successfully" });

  } catch (error: any) {
    console.error("DELETE /api/finance/transactions/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete transaction" }, { status: 500 });
  }
}

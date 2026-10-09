import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { FeeTransaction } from "@/models/FeeTransaction";
import { Student } from "@/models/Student";
import { delCache, delCachePattern } from "@/lib/redis";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const transaction = await FeeTransaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const student = await Student.findById(transaction.studentId);
    if (student && student.fees && Array.isArray(student.fees.years)) {
      // Find the year matching the transaction's academic year or default to year 1
      let yrNum = 1;
      if (typeof transaction.academicYear === "string" && transaction.academicYear.includes("Year")) {
        const parsed = parseInt(transaction.academicYear.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) yrNum = parsed;
      }
      
      const yearItem = student.fees.years.find((y: any) => y.year === yrNum);
      const catCode = transaction.category || "tuition";

      if (yearItem) {
        if (["tuition", "exam", "transport", "other"].includes(catCode)) {
          if (yearItem[catCode] && yearItem[catCode].paid !== undefined) {
            yearItem[catCode].paid = Math.max(0, (Number(yearItem[catCode].paid) || 0) - transaction.amount);
          }
        } else {
          // Custom category
          let foundComp = false;
          if (Array.isArray(yearItem.components)) {
            const comp = yearItem.components.find((c: any) => c.category === transaction.categoryName || c.category === catCode);
            if (comp) {
              comp.paid = Math.max(0, (Number(comp.paid) || 0) - transaction.amount);
              foundComp = true;
            }
          }
          if (!foundComp) {
            if (!yearItem.other) yearItem.other = { total: 0, paid: 0 };
            yearItem.other.paid = Math.max(0, (Number(yearItem.other.paid) || 0) - transaction.amount);
          }
        }
        
        student.markModified("fees");
        await student.save();
      }
    }

    // Delete the transaction
    await FeeTransaction.findByIdAndDelete(id);

    // Invalidate caches
    await Promise.all([
      student ? delCache(`student:${student._id}`) : Promise.resolve(),
      student ? delCache(`fee:student-account:${student._id}`) : Promise.resolve(),
      delCachePattern("fee:transactions:*"),
      delCachePattern("fee:student-accounts:*"),
      delCachePattern("fee:receipts:*"),
      delCachePattern("fee:alerts:*")
    ]);

    return NextResponse.json({ success: true, message: "Transaction deleted and fee reversed successfully" });

  } catch (error: any) {
    console.error("DELETE /api/finance/transactions/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete transaction" }, { status: 500 });
  }
}

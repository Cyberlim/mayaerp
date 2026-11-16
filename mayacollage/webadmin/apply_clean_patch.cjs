const fs = require('fs');
const tempPath = process.env.TEMP + '/page_head.tsx';
let code = fs.readFileSync(tempPath, 'utf8');

// 1. Add state variables
const stateTarget = '  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);';
const stateAddition = `  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [selectedTransportMonth, setSelectedTransportMonth] = useState<any>(null);
  const [transportModalStatus, setTransportModalStatus] = useState<string>("Paid");
  const [transportModalPartialAmount, setTransportModalPartialAmount] = useState<string>("");
  const [isSavingTransportMonth, setIsSavingTransportMonth] = useState(false);
  const [isFeeReportModalOpen, setIsFeeReportModalOpen] = useState(false);`;

if (!code.includes(stateTarget)) {
  console.error("State target not found!");
  process.exit(1);
}
code = code.replace(stateTarget, stateAddition);

// 2. Add Download Fee Structure Report button in top header
const btnTarget = `<button 
                        onClick={() => handleOpenPayFeeModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                      >`;
const btnAddition = `<button 
                        onClick={() => setIsFeeReportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                        title="Download or Print Comprehensive Institutional Fee Structure Report"
                      >
                        <Download className="w-4 h-4" /> Download Fee Structure Report
                      </button>
                      <button 
                        onClick={() => handleOpenPayFeeModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                      >`;

if (!code.includes(btnTarget)) {
  console.error("Button target not found!");
  process.exit(1);
}
code = code.replace(btnTarget, btnAddition);

// 3. Replace transport matrix calculations & click handler
const oldMatrixCalcTarget = `                  const yrRecords = monthRecords[String(activeTransportYear)] || {};
                  const paidCount = academicMonths.filter(m => yrRecords[m]?.paid).length;
                  const totalPaidForYear = paidCount * monthlyRate;
                  const annualTransportAssessed = academicMonths.length * monthlyRate;
                  const pendingDue = Math.max(0, annualTransportAssessed - totalPaidForYear);

                  const handleToggleMonth = async (monthName: string, currentlyPaid: boolean) => {
                    const actionName = currentlyPaid ? "MARK AS UNPAID" : "MARK AS PAID";
                    if (!confirm(\`Confirm \${actionName} for \${monthName} (\${formatCurrency(monthlyRate)}) transport fee?\`)) return;

                    try {
                      const res = await fetch("/api/transport/month-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          busId: assignedBus.bus?.id || assignedBus.bus?._id,
                          studentId: studentData?.id || studentData?._id,
                          month: monthName,
                          year: activeTransportYear,
                          markPaid: !currentlyPaid,
                          customFare: monthlyRate
                        })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setAssignedBus((prev: any) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            assignment: {
                              ...prev.assignment,
                              monthRecords: data.assignment?.monthRecords || prev.assignment?.monthRecords
                            }
                          };
                        });
                        alert(\`\${monthName} transport fee updated!\`);
                      } else {
                        alert("Failed to update month transport fee.");
                      }
                    } catch (err: any) {
                      alert(err.message || "Network error updating month fee.");
                    }
                  };`;

const newMatrixCalcAddition = `                  const yrRecords = monthRecords[String(activeTransportYear)] || {};
                  const paidCount = academicMonths.filter(m => yrRecords[m]?.paid && yrRecords[m]?.status !== 'Absent').length;
                  const totalPaidForYear = academicMonths.reduce((sum, m) => {
                    const r = yrRecords[m];
                    if (!r) return sum;
                    if (r.status === 'Paid') return sum + monthlyRate;
                    if (r.status === 'Partial') return sum + (Number(r.amount) || 0);
                    if (r.paid && !r.status) return sum + monthlyRate;
                    return sum;
                  }, 0);
                  const activeMonthsCount = academicMonths.filter(m => yrRecords[m]?.status !== 'Absent').length;
                  const annualTransportAssessed = activeMonthsCount * monthlyRate;
                  const pendingDue = Math.max(0, annualTransportAssessed - totalPaidForYear);

                  const handleOpenMonthModal = (monthName: string, rec: any) => {
                    const status = rec?.status || (rec?.paid ? "Paid" : "Due");
                    setSelectedTransportMonth({
                      month: monthName,
                      year: activeTransportYear,
                      currentRecord: rec,
                      monthlyFare: monthlyRate
                    });
                    setTransportModalStatus(status);
                    setTransportModalPartialAmount(rec?.status === "Partial" && rec?.amount ? String(rec.amount) : String(monthlyRate / 2));
                  };`;

if (!code.includes(oldMatrixCalcTarget)) {
  console.error("Matrix calc target not found!");
  process.exit(1);
}
code = code.replace(oldMatrixCalcTarget, newMatrixCalcAddition);

// 4. Replace Month tile rendering in the grid
const oldTileTarget = `                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {academicMonths.map((m, idx) => {
                            const rec = yrRecords[m];
                            const isMonthPaid = Boolean(rec?.paid);

                            return (
                              <div
                                key={m}
                                onClick={() => handleToggleMonth(m, isMonthPaid)}
                                className={\`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none relative \${
                                  isMonthPaid 
                                    ? 'bg-emerald-500/10 border-emerald-400/90 text-emerald-900 shadow-sm hover:border-emerald-500 hover:shadow-md' 
                                    : 'bg-white border-slate-200/90 hover:border-amber-400 text-slate-700 hover:shadow-md'
                                }\`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    M{idx + 1}
                                  </span>
                                  <span className={\`w-2 h-2 rounded-full \${isMonthPaid ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}\`} />
                                </div>

                                <div>
                                  <p className="font-black text-xs text-slate-900">{m}</p>
                                  <p className={\`text-xs font-bold mt-0.5 \${isMonthPaid ? 'text-emerald-700' : 'text-slate-600'}\`}>
                                    {formatCurrency(monthlyRate)}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className={\`text-[10px] font-black uppercase \${isMonthPaid ? 'text-emerald-700' : 'text-rose-600'}\`}>
                                    {isMonthPaid ? '✓ Paid' : '○ Due'}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {isMonthPaid ? 'Revert' : 'Pay'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>`;

const newTileAddition = `                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {academicMonths.map((m, idx) => {
                            const rec = yrRecords[m];
                            const status = rec?.status || (rec?.paid ? "Paid" : "Due");
                            const isPaid = status === "Paid";
                            const isPartial = status === "Partial";
                            const isAbsent = status === "Absent";
                            const partialAmt = Number(rec?.amount) || 0;

                            return (
                              <div
                                key={m}
                                onClick={() => handleOpenMonthModal(m, rec)}
                                className={\`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none relative group hover:shadow-md \${
                                  isPaid 
                                    ? 'bg-emerald-500/10 border-emerald-400/90 text-emerald-900 shadow-sm hover:border-emerald-500' 
                                    : isPartial
                                      ? 'bg-amber-500/10 border-amber-400 text-amber-900 shadow-sm hover:border-amber-500'
                                      : isAbsent
                                        ? 'bg-purple-500/10 border-purple-300 text-purple-900 shadow-sm hover:border-purple-400'
                                        : 'bg-white border-slate-200/90 hover:border-amber-400 text-slate-700'
                                }\`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    M{idx + 1}
                                  </span>
                                  <span className={\`w-2.5 h-2.5 rounded-full \${
                                    isPaid 
                                      ? 'bg-emerald-500 animate-pulse' 
                                      : isPartial
                                        ? 'bg-amber-500'
                                        : isAbsent
                                          ? 'bg-purple-500'
                                          : 'bg-slate-300'
                                  }\`} />
                                </div>

                                <div>
                                  <p className="font-black text-xs text-slate-900">{m}</p>
                                  <p className={\`text-xs font-bold mt-0.5 \${
                                    isPaid 
                                      ? 'text-emerald-700' 
                                      : isPartial
                                        ? 'text-amber-700'
                                        : isAbsent
                                          ? 'text-purple-700'
                                          : 'text-slate-600'
                                  }\`}>
                                    {isPartial ? \`\${formatCurrency(partialAmt)} / \${formatCurrency(monthlyRate)}\` : formatCurrency(monthlyRate)}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className={\`text-[10px] font-black uppercase \${
                                    isPaid 
                                      ? 'text-emerald-700' 
                                      : isPartial
                                        ? 'text-amber-700'
                                        : isAbsent
                                          ? 'text-purple-700'
                                          : 'text-rose-600'
                                  }\`}>
                                    {isPaid ? '✓ Paid' : isPartial ? '◑ Partial' : isAbsent ? '✈ Absent' : '○ Due'}
                                  </span>
                                  <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                                    Change
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>`;

if (!code.includes(oldTileTarget)) {
  console.error("Tile target not found!");
  process.exit(1);
}
code = code.replace(oldTileTarget, newTileAddition);

// 5. Append Modals before closing container
const endTarget = `      {/* Student Fee Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={selectedReceipt}
      />
    </div>
  );
}`;

const modalAdditions = `      {/* Student Fee Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={selectedReceipt}
      />

      {/* Month-Wise Transport Status Modal (Paid, Partial, Absent, Due) */}
      <AnimatePresence>
        {selectedTransportMonth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {selectedTransportMonth.month} Transport Fee
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold">
                      Academic Year {selectedTransportMonth.year} • Rate: {formatCurrency(selectedTransportMonth.monthlyFare)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTransportMonth(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Select Status for {selectedTransportMonth.month}
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTransportModalStatus("Paid")}
                    className={\`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between \${
                      transportModalStatus === "Paid"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Full Paid</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 mt-1">
                      {formatCurrency(selectedTransportMonth.monthlyFare)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransportModalStatus("Partial")}
                    className={\`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between \${
                      transportModalStatus === "Partial"
                        ? "bg-amber-50 border-amber-500 text-amber-950 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Pay Partial</span>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 mt-1">
                      Custom Amount
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransportModalStatus("Absent")}
                    className={\`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between \${
                      transportModalStatus === "Absent"
                        ? "bg-purple-50 border-purple-500 text-purple-950 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Mark Absent</span>
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                    </div>
                    <span className="text-[11px] font-bold text-purple-700 mt-1">
                      Bus Not Used
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransportModalStatus("Due")}
                    className={\`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between \${
                      transportModalStatus === "Due"
                        ? "bg-rose-50 border-rose-500 text-rose-950 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }\`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Mark Due</span>
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 mt-1">
                      Unpaid / Pending
                    </span>
                  </button>
                </div>

                {transportModalStatus === "Partial" && (
                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Enter Partial Amount Paid (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={selectedTransportMonth.monthlyFare}
                        value={transportModalPartialAmount}
                        onChange={(e) => setTransportModalPartialAmount(e.target.value)}
                        placeholder={\`Max \${selectedTransportMonth.monthlyFare}\`}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-slate-900 font-black text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Remaining {formatCurrency(Math.max(0, selectedTransportMonth.monthlyFare - (Number(transportModalPartialAmount) || 0)))} stays outstanding.
                    </p>
                  </div>
                )}

                {transportModalStatus === "Absent" && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900">
                    <strong className="block font-black mb-0.5">Absent Month Note:</strong>
                    The student did not utilize campus transport for {selectedTransportMonth.month}. This fee will be excluded from the pending balance.
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setSelectedTransportMonth(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSavingTransportMonth}
                  onClick={async () => {
                    setIsSavingTransportMonth(true);
                    try {
                      const res = await fetch("/api/transport/month-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          busId: assignedBus.bus?.id || assignedBus.bus?._id,
                          studentId: studentData?.id || studentData?._id,
                          month: selectedTransportMonth.month,
                          year: selectedTransportMonth.year,
                          status: transportModalStatus,
                          amount: Number(transportModalPartialAmount) || 0,
                          customFare: selectedTransportMonth.monthlyFare
                        })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setAssignedBus((prev: any) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            assignment: {
                              ...prev.assignment,
                              monthRecords: data.assignment?.monthRecords || prev.assignment?.monthRecords
                            }
                          };
                        });
                        showToast(\`\${selectedTransportMonth.month} transport fee updated to \${transportModalStatus}!\`);
                        setSelectedTransportMonth(null);
                      } else {
                        const err = await res.json();
                        alert(err.message || "Failed to update transport month.");
                      }
                    } catch (e: any) {
                      alert(e.message || "Network error updating transport month.");
                    } finally {
                      setIsSavingTransportMonth(false);
                    }
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingTransportMonth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Status
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Institutional Fee Structure Report Modal */}
      <AnimatePresence>
        {isFeeReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      Fee Structure & Status Report
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold">
                      Complete institutional breakdown of all academic fees, extra components & payment ledger
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setIsFeeReportModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="p-8 space-y-6 text-slate-800 bg-white" id="fee-structure-printable">
                {/* College Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                      MAYA GROUP OF INSTITUTIONS
                    </h1>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      Campus: NH-72, Chakrata Road, Selaqui, Dehradun, Uttarakhand
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      Office of Finance & Accounts • Institutional Fee Dossier
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-100 border border-slate-300 rounded-md text-[10px] font-black uppercase tracking-wider text-slate-800">
                      OFFICIAL STATEMENT
                    </span>
                    <p className="text-xs font-bold text-slate-600 mt-2">
                      Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Student Profile Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Student Name</span>
                    <span className="font-black text-slate-900 text-sm">
                      {[studentData?.firstName, studentData?.middleName, studentData?.lastName].filter(Boolean).join(" ") || "Student"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Roll / Reg Number</span>
                    <span className="font-black text-indigo-700 text-sm">
                      {studentData?.rollNumber || studentData?.enrollmentNumber || studentData?.studentId || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Course & Branch</span>
                    <span className="font-bold text-slate-800">
                      {selectedCourse?.name || studentData?.selected_program || "Course"} {selectedBranch?.name ? \`(\${selectedBranch.name})\` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Current Batch / Year</span>
                    <span className="font-bold text-slate-800">
                      Batch {studentData?.batch || "N/A"} • Year {studentData?.courseYear || 1} (Sem {studentData?.currentSemester || 1})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Father's Name</span>
                    <span className="font-bold text-slate-700">{studentData?.fatherName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Contact Mobile</span>
                    <span className="font-bold text-slate-700">{studentData?.mobile || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Admission Status</span>
                    <span className="font-bold text-emerald-700 uppercase">{studentData?.studentStatus || studentData?.status || "Active"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Transport Commuter</span>
                    <span className="font-bold text-amber-700">
                      {assignedBus ? \`\${assignedBus.bus?.busNo} (\${assignedBus.assignment?.stopName})\` : "Self Commute"}
                    </span>
                  </div>
                </div>

                {/* Overall Financial Summary Bar */}
                <div className="grid grid-cols-4 gap-3 text-center border-y border-slate-200 py-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Structured</span>
                    <span className="text-base font-black text-slate-900">{formatCurrency(feeSummary.gross || feeSummary.total)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Concession / Waiver</span>
                    <span className="text-base font-black text-emerald-700">- {formatCurrency(feeSummary.discount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Total Cleared</span>
                    <span className="text-base font-black text-indigo-700">{formatCurrency(feeSummary.paid)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Outstanding Balance</span>
                    <span className="text-base font-black text-rose-700">{formatCurrency(feeSummary.balance)}</span>
                  </div>
                </div>

                {/* Year-Wise Detailed Tables */}
                <div className="space-y-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1">
                    Academic Year Fee Structure & Component Status
                  </h3>

                  {feeSummary.years.map((fy: any) => {
                    const allComps = getYearComponents(fy);

                    return (
                      <div key={fy.year} className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 flex justify-between items-center text-xs font-black">
                          <span className="text-slate-900">Academic Year {fy.year}</span>
                          <span className="text-slate-600">
                            Net Assessed: {formatCurrency(fy.yearTotal)} • Paid: {formatCurrency(fy.yearPaid || 0)} • Due: {formatCurrency(fy.yearOS || 0)}
                          </span>
                        </div>

                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <th className="p-2.5">Component / Extra Charge</th>
                              <th className="p-2.5">Frequency</th>
                              <th className="p-2.5 text-right">Structured (₹)</th>
                              <th className="p-2.5 text-right">Paid (₹)</th>
                              <th className="p-2.5 text-right">Due (₹)</th>
                              <th className="p-2.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {allComps.map((c: any, cIdx: number) => (
                              <tr key={cIdx} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-bold text-slate-800">{c.title}</td>
                                <td className="p-2.5 text-slate-500 text-[11px]">{c.frequency || "Annual"}</td>
                                <td className="p-2.5 text-right font-semibold">{formatCurrency(c.total)}</td>
                                <td className="p-2.5 text-right font-bold text-emerald-700">{formatCurrency(c.paid)}</td>
                                <td className="p-2.5 text-right font-bold text-rose-600">{formatCurrency(c.due)}</td>
                                <td className="p-2.5 text-center">
                                  <span className={\`px-2 py-0.5 rounded-full text-[10px] font-black uppercase \${
                                    c.isPaid ? 'bg-emerald-100 text-emerald-800' : c.isPartial ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                  }\`}>
                                    {c.isPaid ? 'Paid' : c.isPartial ? 'Partial' : 'Due'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {fy.discount > 0 && (
                              <tr className="bg-emerald-50/50 font-bold text-emerald-800">
                                <td className="p-2.5" colSpan={2}>
                                  Fee Concession / Special Waiver ({fy.discountReason || "Approved Scholarship"})
                                </td>
                                <td className="p-2.5 text-right">- {formatCurrency(fy.discount)}</td>
                                <td className="p-2.5 text-right">-</td>
                                <td className="p-2.5 text-right">-</td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-200 text-emerald-900">
                                    Concession
                                  </span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                {/* Campus Transport Ledger if assigned */}
                {assignedBus && (
                  <div className="border border-amber-200 rounded-2xl overflow-hidden">
                    <div className="bg-amber-50 px-4 py-2 flex justify-between items-center text-xs font-black">
                      <span className="text-amber-900">
                        Campus Transport Route: {assignedBus.bus?.busNo} ({assignedBus.assignment?.stopName})
                      </span>
                      <span className="text-amber-800">
                        Rate: {formatCurrency(Number(assignedBus.assignment?.fare) || 0)} / month
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-4 sm:grid-cols-6 gap-2 text-xs">
                      {[
                        "July", "August", "September", "October", "November", "December",
                        "January", "February", "March", "April", "May", "June"
                      ].map(m => {
                        const rec = assignedBus.assignment?.monthRecords?.[String(studentData?.courseYear || 1)]?.[m];
                        const status = rec?.status || (rec?.paid ? "Paid" : "Due");
                        return (
                          <div key={m} className="p-2 rounded-xl border border-slate-200 text-center bg-slate-50">
                            <span className="text-[10px] font-bold text-slate-500 block">{m}</span>
                            <span className={\`text-[10px] font-black uppercase \${
                              status === 'Paid' ? 'text-emerald-700' : status === 'Partial' ? 'text-amber-700' : status === 'Absent' ? 'text-purple-700' : 'text-rose-600'
                            }\`}>
                              {status === 'Paid' ? '✓ Paid' : status === 'Partial' ? \`₹\${rec?.amount}\` : status === 'Absent' ? 'Absent' : 'Due'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Official Signatures */}
                <div className="pt-10 flex justify-between items-end text-xs font-bold text-slate-700">
                  <div className="text-center">
                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                    <span>Prepared By (Finance Office)</span>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                    <span>Dean / Director Approval & Seal</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}`;

if (!code.includes(endTarget)) {
  console.error("End target not found!");
  process.exit(1);
}
code = code.replace(endTarget, modalAdditions);

fs.writeFileSync(tempPath, code, 'utf8');
console.log('Successfully updated code in temp file! New length:', code.length);


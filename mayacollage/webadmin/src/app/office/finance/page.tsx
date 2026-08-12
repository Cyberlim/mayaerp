"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Landmark, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Clock, 
  CheckCircle2,
  Plus,
  X,
  Loader2,
  FileText,
  Search,
  Eye,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<"revenue" | "payouts" | "student_fees">("revenue");
  const [stats, setStats] = useState({ totalCollected: 0, totalReceivable: 0, activeStudentCount: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  
  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    payeeId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    notes: ""
  });

  const [toastMsg, setToastMsg] = useState("");

  // Student Fees Tab State
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, txnsRes, payoutsRes, staffRes, branchesRes, coursesRes] = await Promise.all([
        fetch("/api/finance/stats").then(res => res.json()),
        fetch("/api/finance/transactions").then(res => res.json()),
        fetch("/api/finance/payouts").then(res => res.json()),
        fetch("/api/users/staff").then(res => res.json()),
        fetch("/api/branches").then(res => res.json()),
        fetch("/api/courses").then(res => res.json())
      ]);

      setStats(statsRes);
      setTransactions(Array.isArray(txnsRes) ? txnsRes : []);
      setPayouts(Array.isArray(payoutsRes) ? payoutsRes : []);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "student_fees") {
      fetchStudents();
    }
  }, [searchQuery, selectedBranch, selectedCourse, activeTab]);

  const fetchStudents = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedBranch) params.append("selectedBranch", selectedBranch);
      if (selectedCourse) params.append("selectedProgram", selectedCourse);
      
      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (activeTab === "student_fees") {
      fetchStudents();
    }
  }, [activeTab, selectedBranch, selectedCourse]);

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.payeeId || !payoutForm.amount) return;

    setIsSubmittingPayout(true);
    try {
      const res = await fetch("/api/finance/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payoutForm)
      });
      if (res.ok) {
        setToastMsg("Payout initiated successfully!");
        setIsPayoutModalOpen(false);
        setPayoutForm({ ...payoutForm, payeeId: "", amount: "", notes: "" });
        fetchData(); // Refresh list
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        alert("Failed to initiate payout.");
      }
    } catch (err) {
      console.error(err);
      alert("Error initiating payout.");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans text-slate-800">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Landmark className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Ledger</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Control Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPayoutModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
            >
              <Wallet className="w-4 h-4" /> Initiate Payout
            </button>
          </div>
        </div>

        {/* Sub Header Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 flex gap-8">
          <button 
            onClick={() => setActiveTab("revenue")}
            className={`py-4 text-sm font-bold border-b-2 transition-all ${activeTab === "revenue" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Revenue & Fees
          </button>
          <button 
            onClick={() => setActiveTab("payouts")}
            className={`py-4 text-sm font-bold border-b-2 transition-all ${activeTab === "payouts" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Payouts & Payroll
          </button>
          <button 
            onClick={() => setActiveTab("student_fees")}
            className={`py-4 text-sm font-bold border-b-2 transition-all ${activeTab === "student_fees" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Student Fees
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 mt-10">
        
        {/* KPI Widgets for Revenue Tab */}
        {activeTab === "revenue" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">Collected</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalCollected)}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Total Collections</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full border border-orange-100">Receivable</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalReceivable)}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Total Projected Fees</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">Active</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.activeStudentCount}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Total Enrollments</p>
            </motion.div>
          </div>
        )}

        {/* Payouts KPI Widget */}
        {activeTab === "payouts" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6 text-rose-600" />
                </div>
                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-100">Disbursed</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {formatCurrency(payouts.reduce((sum, p) => sum + (p.amount || 0), 0))}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Total Paid Out</p>
            </motion.div>
          </div>
        )}

        {/* Lists Container */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "revenue" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-6">Transaction ID</th>
                        <th className="p-6">Date</th>
                        <th className="p-6">Student</th>
                        <th className="p-6">Course</th>
                        <th className="p-6 text-right">Amount</th>
                        <th className="p-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">No collections recorded yet.</td>
                        </tr>
                      ) : (
                        transactions.map((txn, i) => (
                          <tr key={txn._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="p-6 font-bold text-slate-600">{txn.transactionId}</td>
                            <td className="p-6 font-semibold text-slate-500">{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(txn.paymentDate))}</td>
                            <td className="p-6">
                              <div className="font-bold text-slate-800">{txn.studentId?.firstName} {txn.studentId?.lastName}</div>
                              <div className="text-xs text-slate-400">{txn.studentId?.studentId}</div>
                            </td>
                            <td className="p-6 font-semibold text-slate-500">{txn.courseId?.name}</td>
                            <td className="p-6 text-right font-black text-slate-800">{formatCurrency(txn.amount)}</td>
                            <td className="p-6 text-center">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                                {txn.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "payouts" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-6">Transaction ID</th>
                        <th className="p-6">Date</th>
                        <th className="p-6">Payee / Staff</th>
                        <th className="p-6">Method</th>
                        <th className="p-6 text-right">Amount</th>
                        <th className="p-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">No payouts recorded yet.</td>
                        </tr>
                      ) : (
                        payouts.map((payout, i) => (
                          <tr key={payout._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="p-6 font-bold text-slate-600">{payout.transactionId}</td>
                            <td className="p-6 font-semibold text-slate-500">{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(payout.paymentDate))}</td>
                            <td className="p-6">
                              <div className="font-bold text-slate-800">{payout.payeeName}</div>
                              <div className="text-xs text-slate-400">{payout.payeeId?.role}</div>
                            </td>
                            <td className="p-6 font-semibold text-slate-500">{payout.paymentMethod}</td>
                            <td className="p-6 text-right font-black text-rose-600">-{formatCurrency(payout.amount)}</td>
                            <td className="p-6 text-center">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                                {payout.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "student_fees" && (
                <div className="p-6">
                  {/* Search Bar & Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search by student name or admission number..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none">
                      <option value="">All Branches</option>
                      {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none">
                      <option value="">All Courses</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <button onClick={fetchStudents} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
                    </button>
                  </div>

                  {/* Students Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="p-4">Student</th>
                          <th className="p-4">Program</th>
                          <th className="p-4 text-right">Total Fees</th>
                          <th className="p-4 text-right">Paid</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {students.length === 0 ? (
                          <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-bold">No students found.</td></tr>
                        ) : (
                          students.map(student => {
                            const isConfigured = student.fees?.isConfigured;
                            const totalFees = isConfigured && student.fees?.years ? student.fees.years.reduce((sum: number, fy: any) => sum + (fy.tuition?.total || 0) + (fy.exam?.total || 0) + (fy.other?.total || 0), 0) : 0;
                            const paidFees = isConfigured && student.fees?.years ? student.fees.years.reduce((sum: number, fy: any) => sum + (fy.tuition?.paid || 0) + (fy.exam?.paid || 0) + (fy.other?.paid || 0), 0) : 0;
                            const balance = totalFees - paidFees;

                            return (
                              <tr key={student._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-slate-800">{student.firstName} {student.lastName}</div>
                                  <div className="text-xs text-slate-400">{student.admissionNumber || student.studentId}</div>
                                </td>
                                <td className="p-4 font-semibold text-slate-500">
                                  {courses.find(c => c._id === (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram))?.name || "N/A"}
                                </td>
                                <td className="p-4 text-right font-black text-slate-800">
                                  {isConfigured ? formatCurrency(totalFees) : "-"}
                                </td>
                                <td className="p-4 text-right font-black text-emerald-600">
                                  {isConfigured ? formatCurrency(paidFees) : "-"}
                                </td>
                                <td className="p-4 text-center">
                                  {!isConfigured ? (
                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center justify-center gap-1 mx-auto w-fit">
                                      <AlertTriangle className="w-3 h-3" /> Not Configured
                                    </span>
                                  ) : balance > 0 ? (
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center justify-center gap-1 mx-auto w-fit">
                                      Pending: {formatCurrency(balance)}
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center justify-center gap-1 mx-auto w-fit">
                                      <CheckCircle2 className="w-3 h-3" /> Cleared
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <Link href={`/office/students/${student._id}`}>
                                    <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors mx-auto flex">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Initiate Payout Modal */}
      <AnimatePresence>
        {isPayoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsPayoutModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Initiate Payout</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payroll & Disbursements</p>
                  </div>
                </div>
                <button onClick={() => setIsPayoutModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePayout} className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Select Payee (Faculty/Staff)</label>
                  <select 
                    required
                    value={payoutForm.payeeId}
                    onChange={e => setPayoutForm({...payoutForm, payeeId: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="">Select Employee...</option>
                    {staffList.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.firstName} {staff.lastName} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Amount (₹)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={payoutForm.amount}
                      onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})}
                      className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Payment Method</label>
                    <select 
                      value={payoutForm.paymentMethod}
                      onChange={e => setPayoutForm({...payoutForm, paymentMethod: e.target.value})}
                      className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Payment Date</label>
                  <input 
                    type="date"
                    required
                    value={payoutForm.paymentDate}
                    onChange={e => setPayoutForm({...payoutForm, paymentDate: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Notes (Optional)</label>
                  <textarea 
                    value={payoutForm.notes}
                    onChange={e => setPayoutForm({...payoutForm, notes: e.target.value})}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                    placeholder="e.g. November 2026 Salary"
                    rows={2}
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button 
                    type="submit"
                    disabled={isSubmittingPayout}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmittingPayout ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Confirm Payout
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

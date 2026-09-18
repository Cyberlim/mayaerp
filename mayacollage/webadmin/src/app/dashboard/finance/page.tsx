"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  AlertTriangle,
  Edit3,
  RefreshCw,
  Check,
  Receipt,
  GraduationCap,
  Building2,
  Phone,
  AlertCircle,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
  BookOpen,
  Layers,
  Settings,
  Undo2,
  Save
} from "lucide-react";

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<"branch_course" | "student_fees" | "revenue" | "payouts">("branch_course");
  const [stats, setStats] = useState({ totalCollected: 0, totalReceivable: 0, activeStudentCount: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Student Fees State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "unpaid">("all");
  const [students, setStudents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Expanded Courses in Branch-Course View
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    payeeId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    notes: ""
  });

  // Add Fee / Collect Payment Modal State
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState<any>(null);
  const [studentSearchForModal, setStudentSearchForModal] = useState("");
  const [isSubmittingFee, setIsSubmittingFee] = useState(false);
  const [feeForm, setFeeForm] = useState({
    studentId: "",
    year: 1,
    category: "tuition" as "tuition" | "exam" | "transport" | "other",
    amount: "",
    paymentMethod: "Cash",
    transactionId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  // Edit Student Fees Structure & Paid Modal State
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editFeeYears, setEditFeeYears] = useState<any[]>([]);
  const [isSavingFeeEdit, setIsSavingFeeEdit] = useState(false);

  // Course Fee Configuration Modal State
  const [isCourseFeeModalOpen, setIsCourseFeeModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseFeeForm, setCourseFeeForm] = useState({
    tuitionFee: "",
    semesterFee: "",
    applyToStudents: true
  });
  const [isSavingCourseFee, setIsSavingCourseFee] = useState(false);

  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, txnsRes, payoutsRes, staffRes, branchesRes, coursesRes, studentsRes] = await Promise.all([
        fetch("/api/finance/stats").then(res => res.json()).catch(() => ({})),
        fetch("/api/finance/transactions").then(res => res.json()).catch(() => []),
        fetch("/api/finance/payouts").then(res => res.json()).catch(() => []),
        fetch("/api/users/staff").then(res => res.json()).catch(() => []),
        fetch("/api/branches").then(res => res.json()).catch(() => []),
        fetch("/api/courses").then(res => res.json()).catch(() => []),
        fetch("/api/students").then(res => res.json()).catch(() => [])
      ]);

      setStats(statsRes || { totalCollected: 0, totalReceivable: 0, activeStudentCount: 0 });
      setTransactions(Array.isArray(txnsRes) ? txnsRes : []);
      setPayouts(Array.isArray(payoutsRes) ? payoutsRes : []);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setStudents(Array.isArray(studentsRes) ? studentsRes : []);
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setIsSearching(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery) query.append("search", searchQuery);
      if (selectedBranch) query.append("selectedBranch", selectedBranch);
      if (selectedCourse) query.append("selectedProgram", selectedCourse);

      const res = await fetch(`/api/students?${query.toString()}`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Helper to calculate student totals (defaults to Course Fee if not custom configured)
  const getStudentFeeSummary = (student: any) => {
    const courseObj = courses.find(c => c._id === (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram));

    // Calculate course base fee
    let courseBaseFee = Number(courseObj?.tuitionFee) || 0;
    if (Array.isArray(courseObj?.semesterFees) && courseObj.semesterFees.length > 0) {
      const sumSem = courseObj.semesterFees.reduce((acc: number, sf: any) => acc + (Number(sf.fee) || 0), 0);
      if (sumSem > 0) courseBaseFee = sumSem;
    }

    const isConfigured = Boolean(student?.fees?.isConfigured && student?.fees?.years?.length > 0);
    let total = 0;
    let paid = 0;

    if (isConfigured && student.fees.years) {
      student.fees.years.forEach((fy: any) => {
        total += (Number(fy.tuition?.total) || 0) + (Number(fy.exam?.total) || 0) + (Number(fy.transport?.total) || 0) + (Number(fy.other?.total) || 0);
        paid += (Number(fy.tuition?.paid) || 0) + (Number(fy.exam?.paid) || 0) + (Number(fy.transport?.paid) || 0) + (Number(fy.other?.paid) || 0);
      });
    }

    // If student has no custom configured fee or total is 0, default total to courseBaseFee!
    if (total === 0 && courseBaseFee > 0) {
      total = courseBaseFee;
    }

    const balance = Math.max(0, total - paid);
    let status: "paid" | "partial" | "unpaid" = "unpaid";

    if (total > 0) {
      if (paid >= total) status = "paid";
      else if (paid > 0) status = "partial";
      else status = "unpaid";
    }

    return { isConfigured, total, paid, balance, status, courseBaseFee, courseObj };
  };

  // Quick 1-Click Toggle: Mark student as Paid or Unpaid
  const handleToggleStudentPaid = async (student: any, markPaid: boolean) => {
    const summary = getStudentFeeSummary(student);
    const targetTotal = summary.total > 0 ? summary.total : (summary.courseBaseFee > 0 ? summary.courseBaseFee : 50000);
    const courseDuration = summary.courseObj?.duration || 4;
    const annualTotal = Math.round(targetTotal / courseDuration);

    const existingYears = (student.fees?.years && student.fees.years.length > 0)
      ? student.fees.years
      : Array.from({ length: courseDuration }).map((_, i) => ({
        year: i + 1,
        tuition: { total: annualTotal, paid: 0 },
        exam: { total: 0, paid: 0 },
        transport: { total: 0, paid: 0 },
        other: { total: 0, paid: 0 }
      }));

    const updatedYears = existingYears.map((yr: any) => {
      const yrTuitionTot = (Number(yr.tuition?.total) || annualTotal);
      if (markPaid) {
        return {
          ...yr,
          tuition: { total: yrTuitionTot, paid: yrTuitionTot },
          exam: { ...yr.exam, paid: yr.exam?.total || 0 },
          transport: { ...yr.transport, paid: yr.transport?.total || 0 },
          other: { ...yr.other, paid: yr.other?.total || 0 }
        };
      } else {
        return {
          ...yr,
          tuition: { total: yrTuitionTot, paid: 0 },
          exam: { ...yr.exam, paid: 0 },
          transport: { ...yr.transport, paid: 0 },
          other: { ...yr.other, paid: 0 }
        };
      }
    });

    try {
      const res = await fetch(`/api/students/${student._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fees: {
            isConfigured: true,
            years: updatedYears
          }
        })
      });

      const updated = await res.json();
      if (res.ok && !updated.error) {
        setStudents(prev => prev.map(s => s._id === student._id ? { ...s, ...updated } : s));
        showToast(markPaid ? `Marked ${student.firstName}'s fees as Fully Paid!` : `Marked ${student.firstName}'s fees as Unpaid.`);
      } else {
        alert(updated.error || "Failed to update fee status.");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating student fee status.");
    }
  };

  // Overall student fees aggregates
  const studentFeeAggregates = useMemo(() => {
    let totalAssessed = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    students.forEach(s => {
      const summary = getStudentFeeSummary(s);
      totalAssessed += summary.total;
      totalPaid += summary.paid;
      totalDue += summary.balance;
      if (summary.status === "paid") paidCount++;
      else if (summary.status === "partial") partialCount++;
      else unpaidCount++;
    });

    return { totalAssessed, totalPaid, totalDue, paidCount, partialCount, unpaidCount };
  }, [students, courses]);

  // Filtered students for display in All Students tab
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const summary = getStudentFeeSummary(student);

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
        const studentId = (student.studentId || "").toLowerCase();
        const admissionNum = (student.admissionNumber || "").toLowerCase();
        const phone = (student.mobileNumber || student.phone || "").toLowerCase();
        if (!fullName.includes(q) && !studentId.includes(q) && !admissionNum.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      if (selectedBranch) {
        const sBranch = typeof student.selectedBranch === "object" ? student.selectedBranch?._id : student.selectedBranch;
        if (sBranch !== selectedBranch) return false;
      }

      if (selectedCourse) {
        const sCourse = typeof student.selectedProgram === "object" ? student.selectedProgram?._id : student.selectedProgram;
        if (sCourse !== selectedCourse) return false;
      }

      if (statusFilter !== "all") {
        if (summary.status !== statusFilter) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedBranch, selectedCourse, statusFilter, courses]);

  // Grouped Branches and Courses for Branch-Course View
  const branchCourseHierarchy = useMemo(() => {
    return branches.map(branch => {
      const branchCourses = courses.filter(c => {
        const bId = typeof c.branchId === "object" ? c.branchId?._id : c.branchId;
        return bId === branch._id;
      });

      const coursesWithStudents = branchCourses.map(course => {
        const enrolledStudents = students.filter(s => {
          const cId = typeof s.selectedProgram === "object" ? s.selectedProgram?._id : s.selectedProgram;
          return cId === course._id;
        });

        const totalCourseFee = Number(course.tuitionFee) || 0;
        const totalSemesters = course.totalSemesters || ((course.duration || 4) * 2);
        const semesterFee = totalSemesters > 0 ? Math.round(totalCourseFee / totalSemesters) : 0;

        let courseCollected = 0;
        let courseProjected = 0;

        enrolledStudents.forEach(st => {
          const sum = getStudentFeeSummary(st);
          courseCollected += sum.paid;
          courseProjected += sum.total;
        });

        return {
          ...course,
          enrolledStudents,
          totalCourseFee,
          totalSemesters,
          semesterFee,
          courseCollected,
          courseProjected,
          courseDue: Math.max(0, courseProjected - courseCollected)
        };
      });

      return {
        ...branch,
        courses: coursesWithStudents
      };
    });
  }, [branches, courses, students]);

  // Handle open Add Fee Modal
  const handleOpenAddFeeModal = (student?: any) => {
    const targetStudent = student || (students.length > 0 ? students[0] : null);
    setSelectedStudentForFee(targetStudent);
    setStudentSearchForModal("");
    setFeeForm({
      studentId: targetStudent ? targetStudent._id : "",
      year: 1,
      category: "tuition",
      amount: "",
      paymentMethod: "Cash",
      transactionId: `FEE-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toISOString().split("T")[0],
      notes: ""
    });
    setIsAddFeeModalOpen(true);
  };

  // Submit Fee Payment
  const handleSubmitFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.studentId || !feeForm.amount || Number(feeForm.amount) <= 0) {
      alert("Please select a student and enter a valid amount.");
      return;
    }

    setIsSubmittingFee(true);
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: feeForm.studentId,
          amount: Number(feeForm.amount),
          paymentDate: feeForm.paymentDate,
          paymentMethod: feeForm.paymentMethod,
          transactionId: feeForm.transactionId,
          year: Number(feeForm.year),
          category: feeForm.category,
          notes: feeForm.notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Fee payment recorded successfully!");
        setIsAddFeeModalOpen(false);
        if (data.student) {
          setStudents(prev => prev.map(s => s._id === data.student._id ? { ...s, ...data.student } : s));
        }
        fetchData();
      } else {
        alert(data.error || "Failed to record payment.");
      }
    } catch (err) {
      console.error("Error submitting fee payment:", err);
      alert("Error recording fee payment.");
    } finally {
      setIsSubmittingFee(false);
    }
  };

  // Open Course Fee Config Modal
  const handleOpenCourseFeeModal = (course: any) => {
    setEditingCourse(course);
    const totalSemesters = course.totalSemesters || ((course.duration || 4) * 2);
    const semFee = totalSemesters > 0 && course.tuitionFee ? Math.round(course.tuitionFee / totalSemesters) : 0;

    setCourseFeeForm({
      tuitionFee: course.tuitionFee ? String(course.tuitionFee) : "",
      semesterFee: semFee ? String(semFee) : "",
      applyToStudents: true
    });
    setIsCourseFeeModalOpen(true);
  };

  // Save Course Fee & Semester Fee
  const handleSaveCourseFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setIsSavingCourseFee(true);
    try {
      const totalFee = Number(courseFeeForm.tuitionFee) || 0;
      const totalSemesters = editingCourse.totalSemesters || ((editingCourse.duration || 4) * 2);
      const semFee = Number(courseFeeForm.semesterFee) || (totalSemesters > 0 ? Math.round(totalFee / totalSemesters) : 0);

      // Construct semester fees array
      const semesterFees = Array.from({ length: totalSemesters }).map((_, i) => ({
        semester: i + 1,
        fee: semFee
      }));

      const payload = {
        tuitionFee: totalFee,
        semesterFees,
        applyToStudents: courseFeeForm.applyToStudents
      };

      const res = await fetch(`/api/courses/${editingCourse._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const updatedCourse = await res.json();
      if (res.ok && !updatedCourse.error) {
        showToast(`Course fee updated & applied to all enrolled students!`);
        setIsCourseFeeModalOpen(false);
        fetchData(); // reload courses & students
      } else {
        alert(updatedCourse.error || "Failed to update course fee.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating course fee.");
    } finally {
      setIsSavingCourseFee(false);
    }
  };

  // Handle Open Edit Fee Modal for student
  const handleOpenEditFeeModal = (student: any) => {
    setEditingStudent(student);
    const courseObj = courses.find(c => c._id === (typeof student.selectedProgram === "object" ? student.selectedProgram?._id : student.selectedProgram));
    const duration = courseObj?.durationYears || courseObj?.duration || 4;

    if (student.fees?.isConfigured && Array.isArray(student.fees?.years) && student.fees.years.length > 0) {
      const clonedYears = student.fees.years.map((y: any, idx: number) => ({
        year: y.year || idx + 1,
        tuition: { total: y.tuition?.total || 0, paid: y.tuition?.paid || 0 },
        exam: { total: y.exam?.total || 0, paid: y.exam?.paid || 0 },
        transport: { total: y.transport?.total || 0, paid: y.transport?.paid || 0 },
        other: { total: y.other?.total || 0, paid: y.other?.paid || 0 }
      }));
      setEditFeeYears(clonedYears);
    } else {
      const defaultTuition = courseObj?.tuitionFee ? Math.round(courseObj.tuitionFee / duration) : 0;
      const initialYears = Array.from({ length: duration }).map((_, idx) => ({
        year: idx + 1,
        tuition: { total: defaultTuition, paid: 0 },
        exam: { total: 0, paid: 0 },
        transport: { total: 0, paid: 0 },
        other: { total: 0, paid: 0 }
      }));
      setEditFeeYears(initialYears);
    }

    setIsEditFeeModalOpen(true);
  };

  const handleEditFeeChange = (yearIndex: number, category: "tuition" | "exam" | "transport" | "other", field: "total" | "paid", value: string) => {
    const numVal = Math.max(0, Number(value) || 0);
    const updated = [...editFeeYears];
    updated[yearIndex] = {
      ...updated[yearIndex],
      [category]: {
        ...updated[yearIndex][category],
        [field]: numVal
      }
    };
    setEditFeeYears(updated);
  };

  const handleQuickMarkCategoryPaid = (yearIndex: number, category: "tuition" | "exam" | "transport" | "other") => {
    const updated = [...editFeeYears];
    const totalVal = updated[yearIndex][category]?.total || 0;
    updated[yearIndex] = {
      ...updated[yearIndex],
      [category]: {
        ...updated[yearIndex][category],
        paid: totalVal
      }
    };
    setEditFeeYears(updated);
  };

  const handleQuickMarkYearPaid = (yearIndex: number) => {
    const updated = [...editFeeYears];
    const yr = updated[yearIndex];
    updated[yearIndex] = {
      ...yr,
      tuition: { ...yr.tuition, paid: yr.tuition.total },
      exam: { ...yr.exam, paid: yr.exam.total },
      transport: { ...yr.transport, paid: yr.transport.total },
      other: { ...yr.other, paid: yr.other.total }
    };
    setEditFeeYears(updated);
  };

  const handleMarkAllAsPaid = () => {
    const updated = editFeeYears.map(yr => ({
      ...yr,
      tuition: { ...yr.tuition, paid: yr.tuition.total },
      exam: { ...yr.exam, paid: yr.exam.total },
      transport: { ...yr.transport, paid: yr.transport.total },
      other: { ...yr.other, paid: yr.other.total }
    }));
    setEditFeeYears(updated);
  };

  const handleResetAllPaid = () => {
    const updated = editFeeYears.map(yr => ({
      ...yr,
      tuition: { ...yr.tuition, paid: 0 },
      exam: { ...yr.exam, paid: 0 },
      transport: { ...yr.transport, paid: 0 },
      other: { ...yr.other, paid: 0 }
    }));
    setEditFeeYears(updated);
  };

  const handleSaveStudentFeeStructure = async () => {
    if (!editingStudent) return;
    setIsSavingFeeEdit(true);
    try {
      const payload = {
        fees: {
          isConfigured: true,
          years: editFeeYears
        }
      };

      const res = await fetch(`/api/students/${editingStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const updatedStudent = await res.json();
      if (res.ok && !updatedStudent.error) {
        showToast("Student fee structure saved successfully!");
        setIsEditFeeModalOpen(false);
        setStudents(prev => prev.map(s => s._id === editingStudent._id ? { ...s, ...updatedStudent } : s));
      } else {
        alert(updatedStudent.error || "Failed to update fees.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving fee structure.");
    } finally {
      setIsSavingFeeEdit(false);
    }
  };

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
        showToast("Payout initiated successfully!");
        setIsPayoutModalOpen(false);
        setPayoutForm({ ...payoutForm, payeeId: "", amount: "", notes: "" });
        fetchData();
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

  const editModalTotals = useMemo(() => {
    let total = 0;
    let paid = 0;
    editFeeYears.forEach(y => {
      total += (Number(y.tuition?.total) || 0) + (Number(y.exam?.total) || 0) + (Number(y.transport?.total) || 0) + (Number(y.other?.total) || 0);
      paid += (Number(y.tuition?.paid) || 0) + (Number(y.exam?.paid) || 0) + (Number(y.transport?.paid) || 0) + (Number(y.other?.paid) || 0);
    });
    return { total, paid, balance: Math.max(0, total - paid) };
  }, [editFeeYears]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative font-sans text-slate-800">

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-2xl shadow-slate-900/30 flex items-center gap-3 border border-slate-700"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
              <Landmark className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Ledger & Fees</h1>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full border border-indigo-100">
                  ERP Finance
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Branch & Course Fee Matrices • Student Fee Accounts • Collections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => handleOpenAddFeeModal()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> Add Fee / Collect
            </button>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/15 hover:bg-slate-800 transition-all"
            >
              <Wallet className="w-4 h-4" /> Payout
            </button>
          </div>
        </div>

        {/* Header Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 flex gap-8">
          <button
            onClick={() => setActiveTab("branch_course")}
            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "branch_course"
                ? "border-indigo-600 text-indigo-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            <Layers className="w-4 h-4" /> Branch & Course Fees
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "branch_course" ? "bg-indigo-100 text-indigo-700 font-black" : "bg-slate-100 text-slate-500"
              }`}>
              {courses.length} Courses
            </span>
          </button>

          <button
            onClick={() => setActiveTab("student_fees")}
            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "student_fees"
                ? "border-indigo-600 text-indigo-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            <Users className="w-4 h-4" /> All Students Fee Ledger
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === "student_fees" ? "bg-indigo-100 text-indigo-700 font-black" : "bg-slate-100 text-slate-500"
              }`}>
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("revenue")}
            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "revenue"
                ? "border-indigo-600 text-indigo-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            <CreditCard className="w-4 h-4" /> Revenue & Collections
          </button>

          <button
            onClick={() => setActiveTab("payouts")}
            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "payouts"
                ? "border-indigo-600 text-indigo-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            <Wallet className="w-4 h-4" /> Payouts & Payroll
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 mt-8">

        {/* ========================================================================= */}
        {/* TAB 1: BRANCH & COURSE FEES (SEMESTER & TOTAL FEE CONFIG & STUDENTS)      */}
        {/* ========================================================================= */}
        {activeTab === "branch_course" && (
          <div className="space-y-8">

            {/* Top Info Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="px-3 py-1 bg-white/10 text-indigo-200 text-xs font-black uppercase rounded-full border border-white/10">
                  Institutional Fee Matrix
                </span>
                <h2 className="text-2xl font-black mt-3">Branch & Course Fee Management</h2>
                <p className="text-xs font-semibold text-slate-300 mt-1 max-w-xl">
                  Set Semester Fee and Total Course Fee per program. All enrolled students automatically inherit the total course fee, allowing you to quickly mark individual fees as Paid or Unpaid.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Total Projected</span>
                  <div className="text-2xl font-black text-white">{formatCurrency(studentFeeAggregates.totalAssessed)}</div>
                </div>
                <div className="h-8 w-px bg-white/20"></div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Total Collected</span>
                  <div className="text-2xl font-black text-emerald-400">{formatCurrency(studentFeeAggregates.totalPaid)}</div>
                </div>
              </div>
            </div>

            {/* Branches List with Courses */}
            <div className="space-y-8">
              {branchCourseHierarchy.map(branch => (
                <div key={branch._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">

                  {/* Branch Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{branch.name}</h3>
                        <p className="text-xs font-semibold text-slate-400">
                          {branch.code} • Dean: {branch.deanName || "N/A"} • Location: {branch.location || "Main Campus"}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
                      {branch.courses.length} Programs Configured
                    </span>
                  </div>

                  {/* Courses in this Branch */}
                  <div className="space-y-4">
                    {branch.courses.map((course: any) => {
                      const isExpanded = expandedCourses[course._id] ?? false;

                      return (
                        <div key={course._id} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 overflow-hidden transition-all">

                          {/* Course Fee Card Row */}
                          <div className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-base">{course.name}</span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-md border border-indigo-100">
                                  {course.code}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-400 mt-1">
                                Duration: {course.duration || 4} Years ({course.totalSemesters || 8} Semesters) • Intake: {course.intakeCapacity || 60} Seats
                              </p>
                            </div>

                            {/* Fee Badges & Stats */}
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-left">
                                <span className="text-[10px] font-black uppercase text-slate-400">Semester Fee</span>
                                <div className="text-sm font-black text-slate-900">{formatCurrency(course.semesterFee)} / sem</div>
                              </div>

                              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-left">
                                <span className="text-[10px] font-black uppercase text-indigo-600">Total Course Fee</span>
                                <div className="text-sm font-black text-indigo-700">{formatCurrency(course.totalCourseFee)}</div>
                              </div>

                              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-left">
                                <span className="text-[10px] font-black uppercase text-slate-400">Enrolled Students</span>
                                <div className="text-sm font-black text-slate-900">{course.enrolledStudents.length} Students</div>
                              </div>

                              {/* Configure Course Fee Button */}
                              <button
                                onClick={() => handleOpenCourseFeeModal(course)}
                                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                              >
                                <Settings className="w-3.5 h-3.5 text-indigo-600" /> Set Course Fee
                              </button>

                              {/* Toggle Students View */}
                              <button
                                onClick={() => setExpandedCourses(prev => ({ ...prev, [course._id]: !isExpanded }))}
                                className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${isExpanded
                                    ? "bg-slate-900 text-white"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                                  }`}
                              >
                                <span>{isExpanded ? "Hide Students" : `Manage Students (${course.enrolledStudents.length})`}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* EXPANDABLE STUDENTS TABLE UNDER THIS COURSE */}
                          {isExpanded && (
                            <div className="border-t border-slate-200 bg-white p-5 space-y-4">
                              <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-indigo-600" />
                                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                    Enrolled Students Fee Status for {course.name}
                                  </h4>
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                  Course Fee Applied: {formatCurrency(course.totalCourseFee)}
                                </span>
                              </div>

                              {course.enrolledStudents.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                                  No students currently enrolled in this program.
                                </div>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-100">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="py-3 px-4">Student</th>
                                        <th className="py-3 px-4">Semester</th>
                                        <th className="py-3 px-4 text-right">Total Fee</th>
                                        <th className="py-3 px-4 text-right">Amount Paid</th>
                                        <th className="py-3 px-4 text-right">Due Balance</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-center">Manage / Quick Update</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-xs divide-y divide-slate-100">
                                      {course.enrolledStudents.map((student: any) => {
                                        const summary = getStudentFeeSummary(student);
                                        const isPaid = summary.status === "paid";

                                        return (
                                          <tr key={student._id} className="hover:bg-slate-50 transition-colors">

                                            <td className="py-3 px-4">
                                              <div className="font-bold text-slate-900">{student.firstName} {student.lastName}</div>
                                              <div className="text-[11px] text-slate-400">{student.admissionNumber || student.studentId}</div>
                                            </td>

                                            <td className="py-3 px-4 font-semibold text-slate-600">
                                              Sem {student.selectedSemester || 1}
                                            </td>

                                            <td className="py-3 px-4 text-right font-black text-slate-900">
                                              {formatCurrency(summary.total)}
                                            </td>

                                            <td className="py-3 px-4 text-right font-black text-emerald-600">
                                              {formatCurrency(summary.paid)}
                                            </td>

                                            <td className="py-3 px-4 text-right font-black text-amber-600">
                                              {summary.balance > 0 ? formatCurrency(summary.balance) : "₹0"}
                                            </td>

                                            <td className="py-3 px-4 text-center">
                                              {isPaid ? (
                                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-full border border-emerald-100 inline-flex items-center gap-1">
                                                  <Check className="w-3 h-3 text-emerald-600" /> Fully Paid
                                                </span>
                                              ) : summary.status === "partial" ? (
                                                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-black text-[10px] rounded-full border border-amber-100">
                                                  Partial
                                                </span>
                                              ) : (
                                                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-black text-[10px] rounded-full border border-rose-100">
                                                  Unpaid
                                                </span>
                                              )}
                                            </td>

                                            <td className="py-3 px-4 text-center">
                                              <div className="flex items-center justify-center gap-2">

                                                {/* 1-CLICK QUICK TOGGLE: MARK AS PAID OR UNPAID */}
                                                {!isPaid ? (
                                                  <button
                                                    onClick={() => handleToggleStudentPaid(student, true)}
                                                    title="Mark this student fee as fully paid"
                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-sm"
                                                  >
                                                    <Check className="w-3 h-3" /> Mark Paid
                                                  </button>
                                                ) : (
                                                  <button
                                                    onClick={() => handleToggleStudentPaid(student, false)}
                                                    title="Mark this student fee as unpaid"
                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 border border-slate-200"
                                                  >
                                                    <Undo2 className="w-3 h-3" /> Mark Unpaid
                                                  </button>
                                                )}

                                                {/* Collect Payment */}
                                                <button
                                                  onClick={() => handleOpenAddFeeModal(student)}
                                                  title="Record installment payment"
                                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold rounded-lg text-[10px] transition-all border border-indigo-100"
                                                >
                                                  + Pay
                                                </button>

                                                {/* Edit Custom Fee */}
                                                <button
                                                  onClick={() => handleOpenEditFeeModal(student)}
                                                  title="Customize fee breakdown"
                                                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                                                >
                                                  <Edit3 className="w-3 h-3" />
                                                </button>

                                                {/* View Profile */}
                                                <Link href={`/dashboard/students/${student._id}`}>
                                                  <button title="View Profile" className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs">
                                                    <Eye className="w-3 h-3" />
                                                  </button>
                                                </Link>
                                              </div>
                                            </td>

                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALL STUDENTS FEE LEDGER                                            */}
        {/* ========================================================================= */}
        {activeTab === "student_fees" && (
          <div className="space-y-6">

            {/* Filter & Action Toolbar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">

              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name, student ID, admission number or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>

                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">All Fee Statuses</option>
                  <option value="paid">Cleared / Fully Paid</option>
                  <option value="partial">Partial Payment / Due</option>
                  <option value="unpaid">Completely Unpaid</option>
                </select>

                <button
                  onClick={fetchStudents}
                  className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Filter
                </button>

                <button
                  onClick={() => handleOpenAddFeeModal()}
                  className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Fee
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Students Fee Ledger</h2>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                    Showing {filteredStudents.length} of {students.length} Students
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  Total Fees automatically inherit Course / Semester Fee
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="py-4 px-5">Student</th>
                      <th className="py-4 px-5">Program & Branch</th>
                      <th className="py-4 px-5 text-right">Total Fees</th>
                      <th className="py-4 px-5 text-right">Paid Amount</th>
                      <th className="py-4 px-5 text-right">Due Balance</th>
                      <th className="py-4 px-5 text-center">Fee Status</th>
                      <th className="py-4 px-5 text-center">Manage Fee Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-50">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="font-bold text-slate-600">No students found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const summary = getStudentFeeSummary(student);
                        const isPaid = summary.status === "paid";
                        const courseName = courses.find(c => c._id === (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram))?.name || "N/A";
                        const branchName = branches.find(b => b._id === (typeof student.selectedBranch === 'object' ? student.selectedBranch?._id : student.selectedBranch))?.name || "";

                        return (
                          <tr key={student._id} className="hover:bg-slate-50/80 transition-colors group">

                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                                  {student.firstName?.[0]}{student.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 leading-snug">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span>{student.admissionNumber || student.studentId || "No ID"}</span>
                                    {student.mobileNumber && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span>{student.mobileNumber}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-5">
                              <div className="font-bold text-slate-700 text-xs">{courseName}</div>
                              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                {branchName ? `${branchName} • ` : ""}Sem {student.selectedSemester || 1}
                              </div>
                            </td>

                            <td className="py-4 px-5 text-right font-black text-slate-900">
                              {formatCurrency(summary.total)}
                            </td>

                            <td className="py-4 px-5 text-right font-black text-emerald-600">
                              {formatCurrency(summary.paid)}
                            </td>

                            <td className="py-4 px-5 text-right font-black">
                              {summary.balance > 0 ? (
                                <span className="text-amber-600">{formatCurrency(summary.balance)}</span>
                              ) : (
                                <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                                  <Check className="w-3.5 h-3.5" /> ₹0
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-5 text-center">
                              {isPaid ? (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full inline-flex items-center gap-1 border border-emerald-100">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Paid
                                </span>
                              ) : summary.status === "partial" ? (
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full inline-flex items-center gap-1 border border-amber-100">
                                  <Clock className="w-3 h-3 text-amber-600" /> Due: {formatCurrency(summary.balance)}
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-full inline-flex items-center gap-1 border border-rose-100">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Unpaid
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">

                                {/* 1-Click Toggle: Mark Paid / Unpaid */}
                                {!isPaid ? (
                                  <button
                                    onClick={() => handleToggleStudentPaid(student, true)}
                                    title="Mark fee as paid"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Mark Paid
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStudentPaid(student, false)}
                                    title="Mark fee as unpaid"
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold rounded-lg text-xs transition-all flex items-center gap-1 border border-slate-200"
                                  >
                                    <Undo2 className="w-3.5 h-3.5" /> Mark Unpaid
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenAddFeeModal(student)}
                                  title="Add Fee Payment"
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-all border border-indigo-100"
                                >
                                  <Plus className="w-3 h-3" /> Collect
                                </button>

                                <button
                                  onClick={() => handleOpenEditFeeModal(student)}
                                  title="Edit Fee Structure & Paid"
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <Link href={`/dashboard/students/${student._id}`} title="View Student Profile">
                                  <button className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REVENUE & TRANSACTIONS                                             */}
        {/* ========================================================================= */}
        {activeTab === "revenue" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Collected</span>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(stats.totalCollected)}</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">Direct fee collections recorded</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Total Receivable</span>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(studentFeeAggregates.totalAssessed)}</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">Based on Course / Student Matrices</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrolled Students</span>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{students.length}</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">Active institutional accounts</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Fee Collection Transactions</h2>
                <span className="text-xs font-bold text-slate-400">{transactions.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Course</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-center">Method</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {transactions.map(txn => (
                      <tr key={txn._id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-600">{txn.transactionId}</td>
                        <td className="p-4 text-slate-500">
                          {txn.paymentDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(txn.paymentDate)) : "-"}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{txn.studentId?.firstName} {txn.studentId?.lastName}</div>
                          <div className="text-xs text-slate-400">{txn.studentId?.studentId}</div>
                        </td>
                        <td className="p-4 text-slate-500">{txn.courseId?.name || "-"}</td>
                        <td className="p-4 text-right font-black text-slate-800">{formatCurrency(txn.amount)}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">{txn.paymentMethod || "Cash"}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full">
                            {txn.status || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PAYOUTS & PAYROLL                                                  */}
        {/* ========================================================================= */}
        {activeTab === "payouts" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Disbursed Funds</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  {formatCurrency(payouts.reduce((sum, p) => sum + (p.amount || 0), 0))}
                </h3>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" /> Initiate Payout
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Payee / Staff</th>
                      <th className="p-4">Method</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {payouts.map(payout => (
                      <tr key={payout._id} className="border-b border-slate-50">
                        <td className="p-4 font-bold text-slate-600">{payout.transactionId}</td>
                        <td className="p-4 text-slate-500">
                          {payout.paymentDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(payout.paymentDate)) : "-"}
                        </td>
                        <td className="p-4 font-bold text-slate-800">{payout.payeeName}</td>
                        <td className="p-4 text-slate-500">{payout.paymentMethod}</td>
                        <td className="p-4 text-right font-black text-rose-600">-{formatCurrency(payout.amount)}</td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full">{payout.status || "Completed"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE COURSE FEE & SEMESTER FEE                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCourseFeeModalOpen && editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsCourseFeeModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Set Course Fee Matrix</h3>
                    <p className="text-xs font-bold text-slate-400">{editingCourse.name} ({editingCourse.code})</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCourseFeeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCourseFee} className="p-7 space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Total Course Tuition Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 100000"
                    value={courseFeeForm.tuitionFee}
                    onChange={e => {
                      const totalVal = e.target.value;
                      const numTot = Number(totalVal) || 0;
                      const totalSems = editingCourse.totalSemesters || ((editingCourse.duration || 4) * 2);
                      const calculatedSemFee = totalSems > 0 ? Math.round(numTot / totalSems) : 0;
                      setCourseFeeForm({
                        ...courseFeeForm,
                        tuitionFee: totalVal,
                        semesterFee: String(calculatedSemFee)
                      });
                    }}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black text-slate-900 text-base focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                  <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
                    Duration: {editingCourse.duration || 4} Years ({editingCourse.totalSemesters || 8} Semesters)
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Semester Fee (₹ per semester)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 12500"
                    value={courseFeeForm.semesterFee}
                    onChange={e => setCourseFeeForm({ ...courseFeeForm, semesterFee: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="applyToStudentsCheck"
                    checked={courseFeeForm.applyToStudents}
                    onChange={e => setCourseFeeForm({ ...courseFeeForm, applyToStudents: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="applyToStudentsCheck" className="text-xs font-bold text-indigo-900 cursor-pointer">
                    Apply this fee structure to all enrolled students in {editingCourse.name}
                    <span className="block text-[11px] font-normal text-indigo-700/80 mt-0.5">
                      Automatically updates every enrolled student&apos;s total structured fee in the database.
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingCourseFee}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingCourseFee ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save & Update Course Fees
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD FEE PAYMENT                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddFeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsAddFeeModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Record Fee Payment</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Log collections & receipts</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddFeeModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-600 border border-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitFeePayment} className="p-8 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Student <span className="text-rose-500">*</span>
                  </label>

                  {selectedStudentForFee ? (
                    <div className="mt-1 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-black text-slate-900 text-sm">
                          {selectedStudentForFee.firstName} {selectedStudentForFee.lastName}
                        </div>
                        <div className="text-xs font-bold text-indigo-600 mt-0.5">
                          ID: {selectedStudentForFee.admissionNumber || selectedStudentForFee.studentId}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedStudentForFee(null); setFeeForm({ ...feeForm, studentId: "" }); }}
                        className="text-xs font-bold text-indigo-600 hover:underline px-2 py-1 bg-white rounded-lg border border-indigo-200"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-1">
                      <input
                        type="text"
                        placeholder="Search student by name or ID..."
                        value={studentSearchForModal}
                        onChange={e => setStudentSearchForModal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 outline-none"
                      />
                      <select
                        required
                        value={feeForm.studentId}
                        onChange={e => {
                          const sid = e.target.value;
                          setFeeForm({ ...feeForm, studentId: sid });
                          const st = students.find(s => s._id === sid);
                          if (st) setSelectedStudentForFee(st);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-800 text-sm outline-none"
                      >
                        <option value="">-- Select Student --</option>
                        {students
                          .filter(s => {
                            if (!studentSearchForModal.trim()) return true;
                            const term = studentSearchForModal.toLowerCase();
                            return `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) || (s.studentId || "").toLowerCase().includes(term);
                          })
                          .slice(0, 50)
                          .map(s => (
                            <option key={s._id} value={s._id}>
                              {s.firstName} {s.lastName} ({s.admissionNumber || s.studentId})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {selectedStudentForFee && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="text-slate-400">Total: </span>
                      <span className="font-black text-slate-800">{formatCurrency(getStudentFeeSummary(selectedStudentForFee).total)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Paid: </span>
                      <span className="font-black text-emerald-600">{formatCurrency(getStudentFeeSummary(selectedStudentForFee).paid)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Due: </span>
                      <span className="font-black text-amber-600">{formatCurrency(getStudentFeeSummary(selectedStudentForFee).balance)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Academic Year</label>
                    <select
                      value={feeForm.year}
                      onChange={e => setFeeForm({ ...feeForm, year: Number(e.target.value) })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-sm outline-none"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                      <option value={5}>Year 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Fee Category</label>
                    <select
                      value={feeForm.category}
                      onChange={e => setFeeForm({ ...feeForm, category: e.target.value as any })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-sm outline-none"
                    >
                      <option value="tuition">Tuition Fee</option>
                      <option value="exam">Examination Fee</option>
                      <option value="transport">Transport Fee</option>
                      <option value="other">Other / Misc Fee</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                      Amount (₹) *
                    </label>
                    {selectedStudentForFee && getStudentFeeSummary(selectedStudentForFee).balance > 0 && (
                      <button
                        type="button"
                        onClick={() => setFeeForm({ ...feeForm, amount: String(getStudentFeeSummary(selectedStudentForFee).balance) })}
                        className="text-[11px] font-black text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Fill Balance (₹{getStudentFeeSummary(selectedStudentForFee).balance})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25000"
                    value={feeForm.amount}
                    onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black text-slate-800 text-base outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Payment Mode</label>
                    <select
                      value={feeForm.paymentMethod}
                      onChange={e => setFeeForm({ ...feeForm, paymentMethod: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-sm outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online / UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={feeForm.paymentDate}
                      onChange={e => setFeeForm({ ...feeForm, paymentDate: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Receipt ID</label>
                  <input
                    type="text"
                    value={feeForm.transactionId}
                    onChange={e => setFeeForm({ ...feeForm, transactionId: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-sm outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingFee}
                    className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {isSubmittingFee ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Confirm & Record Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDIT STUDENT CUSTOM FEE STRUCTURE                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditFeeModalOpen && editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsEditFeeModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-600">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Edit Student Fee Structure</h2>
                    <p className="text-xs font-bold text-slate-400">
                      {editingStudent.firstName} {editingStudent.lastName} ({editingStudent.admissionNumber || editingStudent.studentId})
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsEditFeeModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 border border-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-8 py-3.5 bg-indigo-50/50 border-b border-indigo-100/50 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-6 text-xs font-bold">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Total: </span>
                    <span className="font-black text-slate-900 text-sm">{formatCurrency(editModalTotals.total)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Paid: </span>
                    <span className="font-black text-emerald-600 text-sm">{formatCurrency(editModalTotals.paid)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Due: </span>
                    <span className="font-black text-amber-600 text-sm">{formatCurrency(editModalTotals.balance)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAllAsPaid}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark All Paid
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAllPaid}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all"
                  >
                    Reset Paid
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {editFeeYears.map((yr, yIdx) => (
                  <div key={yIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs">
                          {yr.year}
                        </span>
                        <span className="font-black text-slate-800 text-sm">Academic Year {yr.year}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickMarkYearPaid(yIdx)}
                        className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark Year Paid
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {["tuition", "exam", "transport", "other"].map(cat => (
                        <div key={cat} className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 capitalize">{cat} Fee</span>
                            <button
                              type="button"
                              onClick={() => handleQuickMarkCategoryPaid(yIdx, cat as any)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline"
                            >
                              Set Paid = Total
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Total (₹)</span>
                              <input
                                type="number"
                                value={yr[cat]?.total ?? 0}
                                onChange={e => handleEditFeeChange(yIdx, cat as any, "total", e.target.value)}
                                className="w-full mt-0.5 bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-800 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">Paid (₹)</span>
                              <input
                                type="number"
                                value={yr[cat]?.paid ?? 0}
                                onChange={e => handleEditFeeChange(yIdx, cat as any, "paid", e.target.value)}
                                className="w-full mt-0.5 bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-emerald-700 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-8 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsEditFeeModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingFeeEdit}
                  onClick={handleSaveStudentFeeStructure}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {isSavingFeeEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Student Fee Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: INITIATE PAYOUT                                                    */}
      {/* ========================================================================= */}
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
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Initiate Payout</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payroll & Disbursements</p>
                  </div>
                </div>
                <button onClick={() => setIsPayoutModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 border border-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePayout} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Payee</label>
                  <select
                    required
                    value={payoutForm.payeeId}
                    onChange={e => setPayoutForm({ ...payoutForm, payeeId: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-800 text-sm outline-none"
                  >
                    <option value="">Select Employee...</option>
                    {staffList.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.firstName} {staff.lastName} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={payoutForm.amount}
                      onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black text-slate-800 text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Method</label>
                    <select
                      value={payoutForm.paymentMethod}
                      onChange={e => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-800 text-sm outline-none"
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
                    onChange={e => setPayoutForm({ ...payoutForm, paymentDate: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-800 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Notes</label>
                  <textarea
                    value={payoutForm.notes}
                    onChange={e => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-semibold text-slate-600 text-sm resize-none outline-none"
                    rows={2}
                  ></textarea>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingPayout}
                    className="w-full py-3.5 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 text-sm"
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

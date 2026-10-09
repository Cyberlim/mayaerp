"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CreditCard,
  Landmark,
  Users,
  User,
  ExternalLink,
  Wallet,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  FileText,
  Search,
  AlertTriangle,
  Edit3,
  RefreshCw,
  Printer,
  Bell,
  Send,
  ShoppingBag,
  Shirt,
  ShieldAlert,
  Phone,
  Calendar,
  Sparkles,
  Layers,
  Settings,
  Save,
  MessageSquare,
  Copy,
  BookOpen,
  Check,
  DollarSign,
  Briefcase,
  ChevronDown,
  LayoutGrid
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<
    "student_accounts" | "fee_records" | "categories" | "receipts" | "alerts" | "branch_course" | "payouts"
  >("student_accounts");

  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);

  const [stats, setStats] = useState({ totalCollected: 0, totalReceivable: 0, activeStudentCount: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<{ summary: any; alerts: any[]; defaulters: any[] }>({
    summary: { totalAlerts: 0, totalDefaultersCount: 0, totalOutstandingSum: 0, highRiskCount: 0 },
    alerts: [],
    defaulters: []
  });

  // Student Accounts Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [osFilter, setOsFilter] = useState<"all" | "os_due" | "cleared">("all");
  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Fee Records Filter State
  const [recordSemesterFilter, setRecordSemesterFilter] = useState("all");
  const [recordYearFilter, setRecordYearFilter] = useState("all");
  const [recordCategoryFilter, setRecordCategoryFilter] = useState("all");
  const [recordSearch, setRecordSearch] = useState("");

  // Receipt Hub State
  const [receiptFilterType, setReceiptFilterType] = useState<"all" | "student" | "employee">("all");
  const [receiptSearchQuery, setReceiptSearchQuery] = useState("");
  const [selectedReceiptForModal, setSelectedReceiptForModal] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Student Account Detailed Statement Modal State
  const [selectedStudentForStatement, setSelectedStudentForStatement] = useState<any>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [studentStatementData, setStudentStatementData] = useState<any>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);

  // Add Fee / Collect Payment Modal State
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState<any>(null);
  const [isSubmittingFee, setIsSubmittingFee] = useState(false);
  const [feeForm, setFeeForm] = useState({
    studentId: "",
    year: 1,
    category: "tuition",
    categoryName: "Tuition Fee",
    amount: "",
    paymentMethod: "Cash",
    transactionId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    semester: 1,
    notes: ""
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    code: "",
    type: "Kit/Uniform",
    defaultAmount: "",
    frequency: "One-Time",
    isMandatory: false,
    description: ""
  });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Send Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertTargetStudent, setAlertTargetStudent] = useState<any>(null);
  const [alertForm, setAlertForm] = useState({
    studentId: "",
    alertType: "Outstanding_Dues",
    title: "Fee Due Payment Reminder",
    message: "Dear Student/Parent, your institutional fee balance is currently pending. Please deposit it at the Accounts Office before the upcoming examinations.",
    outstandingAmount: 0,
    channel: "In-App"
  });
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    payeeId: "",
    amount: "",
    payoutType: "Salary",
    designation: "Faculty / Staff",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    notes: ""
  });

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
      const [statsRes, txnsRes, payoutsRes, staffRes, branchesRes, coursesRes, studentsRes, categoriesRes, alertsRes] =
        await Promise.all([
          fetch("/api/finance/stats").then(res => res.json()).catch(() => ({})),
          fetch("/api/finance/transactions?limit=250").then(res => res.json()).catch(() => []),
          fetch("/api/finance/payouts").then(res => res.json()).catch(() => []),
          fetch("/api/users/staff").then(res => res.json()).catch(() => []),
          fetch("/api/branches").then(res => res.json()).catch(() => []),
          fetch("/api/courses").then(res => res.json()).catch(() => []),
          fetch("/api/students").then(res => res.json()).catch(() => []),
          fetch("/api/finance/categories").then(res => res.json()).catch(() => []),
          fetch("/api/finance/alerts").then(res => res.json()).catch(() => ({ summary: {}, alerts: [], defaulters: [] }))
        ]);

      setStats(statsRes || { totalCollected: 0, totalReceivable: 0, activeStudentCount: 0 });
      setTransactions(Array.isArray(txnsRes) ? txnsRes : []);
      setPayouts(Array.isArray(payoutsRes) ? payoutsRes : []);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      setBranches(Array.isArray(branchesRes) ? branchesRes : []);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      if (alertsRes && alertsRes.summary) {
        setAlertsData(alertsRes);
      }
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Student Fee Summary Calculation
  const getStudentFeeSummary = (student: any) => {
    const courseObj = courses.find(
      c => c._id === (typeof student.selectedProgram === "object" ? student.selectedProgram?._id : student.selectedProgram)
    );

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

    if (total === 0 && courseBaseFee > 0) {
      total = courseBaseFee;
    }

    const studentTxns = transactions.filter(t => t.studentId?._id === student._id || t.studentId === student._id);
    const txnSum = studentTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    if (txnSum > paid) {
      paid = txnSum;
    }

    const balance = Math.max(0, total - paid);
    let status: "paid" | "partial" | "unpaid" = "unpaid";

    if (total > 0) {
      if (paid >= total) status = "paid";
      else if (paid > 0) status = "partial";
      else status = "unpaid";
    }

    return { isConfigured, total, paid, balance, status, courseBaseFee, courseObj, studentTxns };
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const summary = getStudentFeeSummary(s);
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const enroll = (s.enrollmentNumber || "").toLowerCase();
      const adm = (s.admissionNumber || "").toLowerCase();
      const phone = (s.mobile || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !query || name.includes(query) || enroll.includes(query) || adm.includes(query) || phone.includes(query);
      const sBranchId = typeof s.selectedBranch === "object" ? s.selectedBranch?._id : s.selectedBranch;
      const sCourseId = typeof s.selectedProgram === "object" ? s.selectedProgram?._id : s.selectedProgram;

      const matchesBranch = selectedBranch === "all" || sBranchId === selectedBranch;
      const matchesCourse = selectedCourse === "all" || sCourseId === selectedCourse;

      const matchesOS =
        osFilter === "all" ||
        (osFilter === "os_due" && summary.balance > 0) ||
        (osFilter === "cleared" && summary.balance === 0 && summary.total > 0);

      return matchesSearch && matchesBranch && matchesCourse && matchesOS;
    });
  }, [students, searchQuery, selectedBranch, selectedCourse, osFilter, courses, transactions]);

  // Aggregated Metrics
  const institutionalMetrics = useMemo(() => {
    let totalReceivable = 0;
    let totalCollected = 0;
    let defaultersCount = 0;

    students.forEach(s => {
      const summary = getStudentFeeSummary(s);
      totalReceivable += summary.total;
      totalCollected += summary.paid;
      if (summary.balance > 0) defaultersCount++;
    });

    const totalOS = Math.max(0, totalReceivable - totalCollected);
    const recoveryRate = totalReceivable > 0 ? Math.round((totalCollected / totalReceivable) * 100) : 100;

    return { totalReceivable, totalCollected, totalOS, defaultersCount, recoveryRate };
  }, [students, courses, transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const semMatch = recordSemesterFilter === "all" || String(t.semester) === String(recordSemesterFilter);
      const yrMatch = recordYearFilter === "all" || String(t.academicYear) === String(recordYearFilter);
      const catMatch = recordCategoryFilter === "all" || t.category === recordCategoryFilter;

      const student = t.studentId;
      const name = student ? `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase() : "";
      const enroll = (student?.enrollmentNumber || "").toLowerCase();
      const txnId = (t.transactionId || "").toLowerCase();
      const rcpt = (t.receiptNumber || "").toLowerCase();
      const q = recordSearch.toLowerCase();

      const searchMatch = !q || name.includes(q) || enroll.includes(q) || txnId.includes(q) || rcpt.includes(q);

      return semMatch && yrMatch && catMatch && searchMatch;
    });
  }, [transactions, recordSemesterFilter, recordYearFilter, recordCategoryFilter, recordSearch]);

  // Combined Receipts
  const combinedReceipts = useMemo(() => {
    const studentReceipts = transactions.map(t => {
      const student = t.studentId || {};
      const course = t.courseId || {};
      return {
        _id: t._id,
        type: "student",
        receiptType: "Student Fee Receipt",
        receiptNumber: t.receiptNumber || `RCP-STU-${t._id?.slice(-8).toUpperCase()}`,
        transactionId: t.transactionId || `TXN-${t._id?.slice(-6)}`,
        date: t.paymentDate || t.createdAt,
        name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
        idNumber: student.enrollmentNumber || student.admissionNumber || student.studentId || "N/A",
        program: course.name || "Academic Program",
        semester: t.semester || 1,
        academicYear: t.academicYear || "Year 1",
        category: t.category || "tuition",
        categoryName: t.categoryName || "Tuition Fee",
        amount: t.amount || 0,
        paymentMethod: t.paymentMethod || "Cash",
        collectedBy: t.collectedBy || "Accounts Office",
        notes: t.notes || "",
        items: [
          {
            description: `${t.categoryName || t.category || "Fee"} (${t.academicYear || "Year 1"}, Sem ${t.semester || 1})`,
            amount: t.amount || 0
          }
        ]
      };
    });

    const employeeReceipts = payouts.map(p => {
      const payee = p.payeeId || {};
      return {
        _id: p._id,
        type: "employee",
        receiptType: "Employee Payment Voucher",
        receiptNumber: p.receiptNumber || `RCP-EMP-${p._id?.slice(-8).toUpperCase()}`,
        transactionId: p.transactionId || `TXN-${p._id?.slice(-6)}`,
        date: p.paymentDate || p.createdAt,
        name: p.payeeName || `${payee.firstName || ""} ${payee.lastName || ""}`.trim() || "Employee",
        idNumber: payee.employeeId || payee._id?.slice(-6) || "EMP-001",
        designation: p.designation || payee.role || "Faculty / Staff",
        department: p.department || payee.department || "Academics",
        payoutType: p.payoutType || "Salary",
        amount: p.amount || 0,
        paymentMethod: p.paymentMethod || "Bank Transfer",
        disbursedBy: p.disbursedBy || "Finance Officer",
        notes: p.notes || "",
        items: [
          {
            description: `${p.payoutType || "Salary"} Disbursal - ${p.monthYear || "Cycle"}`,
            amount: p.amount || 0
          }
        ]
      };
    });

    let combined = [];
    if (receiptFilterType === "student") combined = studentReceipts;
    else if (receiptFilterType === "employee") combined = employeeReceipts;
    else combined = [...studentReceipts, ...employeeReceipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (receiptSearchQuery && receiptSearchQuery.trim()) {
      const q = receiptSearchQuery.toLowerCase();
      combined = combined.filter(
        r =>
          r.receiptNumber.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.idNumber.toLowerCase().includes(q) ||
          r.transactionId.toLowerCase().includes(q)
      );
    }

    return combined;
  }, [transactions, payouts, receiptFilterType, receiptSearchQuery]);

  // Tab Definitions for the Dropdown & Pill Selector
  const tabOptions = [
    {
      id: "student_accounts",
      label: "Student Accounts & Dues (OS Ledger)",
      icon: Users,
      badge: `${institutionalMetrics.defaultersCount} Dues Pending`,
      badgeColor: institutionalMetrics.defaultersCount > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
    },
    {
      id: "fee_records",
      label: "Fee Collections & History",
      icon: CreditCard,
      badge: `${transactions.length} Transactions`,
      badgeColor: "bg-slate-100 text-slate-700"
    },
    {
      id: "categories",
      label: "Fee Categories & Rates (Books, Uniform, Blazer, Fine)",
      icon: Shirt,
      badge: `${categories.length} Items`,
      badgeColor: "bg-indigo-50 text-indigo-700"
    },
    {
      id: "receipts",
      label: "Receipts & Vouchers Hub (Student & Staff)",
      icon: Printer,
      badge: "Print & Thermal",
      badgeColor: "bg-purple-50 text-purple-700"
    },
    {
      id: "alerts",
      label: "Overdue Alerts & Due Notices",
      icon: Bell,
      badge: `${alertsData.summary?.highRiskCount || 0} High Risk`,
      badgeColor: "bg-rose-50 text-rose-700"
    },
    {
      id: "payouts",
      label: "Staff Payroll & Payouts",
      icon: Briefcase,
      badge: `${payouts.length} Vouchers`,
      badgeColor: "bg-slate-100 text-slate-700"
    },
    {
      id: "branch_course",
      label: "Course Fee Setup & Matrices",
      icon: Layers,
      badge: `${courses.length} Programs`,
      badgeColor: "bg-slate-100 text-slate-700"
    }
  ];

  const currentTabObj = tabOptions.find(t => t.id === activeTab) || tabOptions[0];

  // Open Statement Modal
  const handleOpenStudentStatement = async (student: any) => {
    setSelectedStudentForStatement(student);
    setIsStatementModalOpen(true);
    setIsLoadingStatement(true);
    try {
      const res = await fetch(`/api/finance/student-account/${student._id}`);
      const data = await res.json();
      if (res.ok) {
        setStudentStatementData(data);
      } else {
        alert(data.error || "Could not load student statement");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading student account");
    } finally {
      setIsLoadingStatement(false);
    }
  };

  // Open Add Fee Modal
  const handleOpenAddFeeModal = (student?: any) => {
    if (student) {
      setSelectedStudentForFee(student);
      setFeeForm({
        studentId: student._id,
        year: student.courseYear || Math.ceil((student.selectedSemester || 1) / 2) || 1,
        category: "tuition",
        categoryName: "Tuition Fee",
        amount: "",
        paymentMethod: "Cash",
        transactionId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        semester: student.selectedSemester || 1,
        notes: ""
      });
    } else {
      setSelectedStudentForFee(null);
      setFeeForm({
        studentId: "",
        year: 1,
        category: "tuition",
        categoryName: "Tuition Fee",
        amount: "",
        paymentMethod: "Cash",
        transactionId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        semester: 1,
        notes: ""
      });
    }
    setIsAddFeeModalOpen(true);
  };

  // Submit Payment
  const handleSubmitAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.studentId || !feeForm.amount) {
      alert("Please select a student and enter payment amount");
      return;
    }

    setIsSubmittingFee(true);
    try {
      const selectedCatObj = categories.find(c => c.code === feeForm.category);
      const catLabel = selectedCatObj?.name || feeForm.category.toUpperCase();

      const payload = {
        ...feeForm,
        categoryName: catLabel,
        academicYear: `Year ${feeForm.year}`
      };

      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Payment recorded & Official Receipt generated!");
        setIsAddFeeModalOpen(false);
        fetchData();

        if (data.transaction) {
          const studentObj = selectedStudentForFee || students.find(s => s._id === feeForm.studentId);
          setSelectedReceiptForModal({
            type: "student",
            receiptType: "Student Fee Receipt",
            receiptNumber: data.receiptNumber || `RCP-STU-${Date.now()}`,
            transactionId: data.transaction.transactionId,
            date: data.transaction.paymentDate,
            name: `${studentObj?.firstName || ""} ${studentObj?.lastName || ""}`.trim() || "Student",
            idNumber: studentObj?.enrollmentNumber || studentObj?.admissionNumber || "N/A",
            program: studentObj?.selectedProgram?.name || "Course",
            semester: data.transaction.semester || feeForm.semester,
            academicYear: `Year ${feeForm.year}`,
            category: feeForm.category,
            categoryName: catLabel,
            amount: Number(feeForm.amount),
            paymentMethod: feeForm.paymentMethod,
            collectedBy: "Accounts Office",
            notes: feeForm.notes,
            items: [
              {
                description: `${catLabel} (Year ${feeForm.year}, Sem ${feeForm.semester})`,
                amount: Number(feeForm.amount)
              }
            ]
          });
          setIsReceiptModalOpen(true);
        }
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      alert("Error recording payment");
    } finally {
      setIsSubmittingFee(false);
    }
  };

  // Submit Category
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setIsSubmittingCategory(true);
    try {
      const isEdit = Boolean(editingCategory);
      const res = await fetch("/api/finance/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingCategory._id, ...categoryForm } : categoryForm)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Category ${isEdit ? "updated" : "created"} successfully!`);
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        fetchData();
      } else {
        alert(data.error || "Failed to save category");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving category");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Open Alert Modal
  const handleOpenAlertModal = (student?: any) => {
    if (student) {
      const summary = getStudentFeeSummary(student);
      setAlertTargetStudent(student);
      setAlertForm({
        studentId: student._id,
        alertType: "Outstanding_Dues",
        title: `Fee Due Reminder: ₹${summary.balance.toLocaleString("en-IN")} Pending`,
        message: `Dear ${student.firstName}, your institutional fee balance of ₹${summary.balance.toLocaleString("en-IN")} is pending. Kindly deposit it at the Accounts Office at the earliest.`,
        outstandingAmount: summary.balance,
        channel: "In-App"
      });
    } else {
      setAlertTargetStudent(null);
      setAlertForm({
        studentId: "",
        alertType: "Outstanding_Dues",
        title: "Fee Due Payment Reminder",
        message: "Dear Student/Parent, please ensure all outstanding institutional fees are cleared before the upcoming semester assessments.",
        outstandingAmount: 0,
        channel: "In-App"
      });
    }
    setIsAlertModalOpen(true);
  };

  // Submit Alert
  const handleSubmitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.studentId && !alertTargetStudent) {
      alert("Please select a student");
      return;
    }

    setIsSubmittingAlert(true);
    try {
      const res = await fetch("/api/finance/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...alertForm,
          studentId: alertForm.studentId || alertTargetStudent?._id
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Due alert notice recorded & sent!");
        setIsAlertModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to send alert");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending alert");
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  // Copy WhatsApp Reminder Message
  const handleCopyWhatsAppMessage = (student: any) => {
    const summary = getStudentFeeSummary(student);
    const text = `*Maya Group of Institutions - Official Fee Reminder*\n\nDear ${student.firstName} ${student.lastName},\nYour current pending fee balance is *₹${summary.balance.toLocaleString("en-IN")}* for *${summary.courseObj?.name || "your course"}*.\n\nPlease visit the Accounts Office or clear your dues online.\n\nThank you,\nDepartment of Accounts`;
    navigator.clipboard.writeText(text);
    showToast("WhatsApp reminder text copied to clipboard!");
  };

  // Submit Payout
  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.payeeId || !payoutForm.amount) return;

    setIsSubmittingPayout(true);
    try {
      const staffMember = staffList.find(s => s._id === payoutForm.payeeId);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const receiptNo = `RCP-EMP-${dateStr}-${randomSuffix}`;
      const txnId = `TXN-EMP-${Date.now()}-${randomSuffix}`;

      const res = await fetch("/api/finance/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payoutForm,
          payeeName: `${staffMember?.firstName || ""} ${staffMember?.lastName || ""}`.trim(),
          receiptNumber: receiptNo,
          transactionId: txnId,
          monthYear: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        })
      });

      if (res.ok) {
        showToast("Staff payout voucher generated successfully!");
        setIsPayoutModalOpen(false);
        fetchData();

        setSelectedReceiptForModal({
          type: "employee",
          receiptType: "Employee Payment Voucher",
          receiptNumber: receiptNo,
          transactionId: txnId,
          date: payoutForm.paymentDate,
          name: `${staffMember?.firstName || ""} ${staffMember?.lastName || ""}`.trim() || "Employee",
          idNumber: staffMember?.employeeId || "EMP-001",
          designation: payoutForm.designation || staffMember?.role || "Staff",
          department: staffMember?.department || "Academics",
          payoutType: payoutForm.payoutType,
          amount: Number(payoutForm.amount),
          paymentMethod: payoutForm.paymentMethod,
          disbursedBy: "Finance Officer",
          notes: payoutForm.notes,
          items: [
            {
              description: `${payoutForm.payoutType} Disbursal - ${new Date().toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric"
              })}`,
              amount: Number(payoutForm.amount)
            }
          ]
        });
        setIsReceiptModalOpen(true);
      } else {
        alert("Failed to create payout voucher");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving payout");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-24 font-sans text-slate-800">
      
      {/* Universal Receipt Modal (Supports A4 & Thermal) */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={selectedReceiptForModal}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-slate-700 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* TOP HEADER & SECTION DROPDOWN (CLEAN ENGLISH & INTUITIVE)                 */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1650px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & Section Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    Finance & Accounts
                  </h1>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    Maya ERP Management System
                  </p>
                </div>
              </div>

              {/* PERFECT SECTION DROPDOWN SELECTOR */}
              <div className="relative">
                <button
                  onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl border border-slate-300 text-xs shadow-sm transition-all"
                >
                  <currentTabObj.icon className="w-4 h-4 text-indigo-600" />
                  <span className="font-black text-slate-900">{currentTabObj.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTabDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isTabDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsTabDropdownOpen(false)}
                    ></div>
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Select Module Section
                      </div>
                      {tabOptions.map(t => {
                        const Icon = t.icon;
                        const isSelected = activeTab === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              setActiveTab(t.id as any);
                              setIsTabDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-indigo-600"}`} />
                              <span>{t.label}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSelected ? "bg-white/20 text-white" : t.badgeColor
                            }`}>
                              {t.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={fetchData}
                title="Refresh Data"
                className="p-2.5 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => handleOpenAddFeeModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-xs"
              >
                <Plus className="w-4 h-4" /> Collect Student Fee
              </button>

              <button
                onClick={() => {
                  setReceiptFilterType("all");
                  setActiveTab("receipts");
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl transition-all text-xs"
              >
                <Printer className="w-4 h-4" /> Print Receipts
              </button>

              <button
                onClick={() => handleOpenAlertModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-all text-xs"
              >
                <Bell className="w-4 h-4" /> Due Reminder Alert
              </button>

              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
              >
                <Wallet className="w-4 h-4" /> Staff Payout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1650px] mx-auto px-6 lg:px-8 mt-6">

        {/* 4 Summary Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Expected Fees
              </span>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                {formatCurrency(institutionalMetrics.totalReceivable)}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">{students.length} Total Enrolled Students</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Total Deposited Fee
              </span>
              <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
                {formatCurrency(institutionalMetrics.totalCollected)}
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">{institutionalMetrics.recoveryRate}% Total Collected</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                Outstanding (OS) Dues
              </span>
              <div className="text-xl font-black text-rose-600 font-mono mt-0.5">
                {formatCurrency(institutionalMetrics.totalOS)}
              </div>
              <span className="text-[11px] text-rose-700 font-bold">{institutionalMetrics.defaultersCount} Students Pending</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
                Fee Items & Kit Catalog
              </span>
              <div className="text-xl font-black text-purple-700 font-mono mt-0.5">
                {categories.length} Items Configured
              </div>
              <span className="text-[11px] text-purple-600 font-semibold">Books, Blazer, Uniform, Fine</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: STUDENT ACCOUNTS & OS DUES LEDGER                              */}
        {/* ========================================================================= */}
        {activeTab === "student_accounts" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1 w-full lg:max-w-lg relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by Name, Roll Number, Enrollment, or Mobile..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setOsFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      osFilter === "all" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All Students
                  </button>
                  <button
                    onClick={() => setOsFilter("os_due")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      osFilter === "os_due" ? "bg-rose-600 text-white shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Dues Pending ({institutionalMetrics.defaultersCount})
                  </button>
                  <button
                    onClick={() => setOsFilter("cleared")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      osFilter === "cleared" ? "bg-emerald-600 text-white shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Cleared
                  </button>
                </div>

                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s: any) => {
                  const summary = getStudentFeeSummary(s);
                  const isCleared = summary.balance === 0 && summary.total > 0;

                  return (
                    <div
                      key={s._id}
                      className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isCleared ? "bg-emerald-100 text-emerald-800" : summary.paid > 0 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {s.firstName?.[0] || "S"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">
                              {s.firstName} {s.lastName}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isCleared
                                  ? "bg-emerald-100 text-emerald-800"
                                  : summary.paid > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isCleared ? "CLEARED" : summary.paid > 0 ? "PARTIAL DUE" : "FULL DUE"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                            <span className="font-mono font-bold text-indigo-900">
                              Roll: {s.enrollmentNumber || s.admissionNumber || "N/A"}
                            </span>
                            <span>•</span>
                            <span>{summary.courseObj?.name || "Program"}</span>
                            <span>•</span>
                            <span>Sem {s.selectedSemester || 1}</span>
                            {s.mobile && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-mono text-slate-600">
                                  <Phone className="w-3 h-3" /> {s.mobile}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 bg-slate-50 p-2.5 px-4 rounded-xl border border-slate-200 text-xs w-full lg:w-auto justify-between lg:justify-start">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Assessed</span>
                          <span className="font-mono font-black text-slate-800 text-sm">{formatCurrency(summary.total)}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Deposited</span>
                          <span className="font-mono font-black text-emerald-600 text-sm">{formatCurrency(summary.paid)}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div>
                          <span className="text-[10px] font-bold text-rose-500 uppercase block">Outstanding (OS)</span>
                          <span className="font-mono font-black text-rose-600 text-sm">{formatCurrency(summary.balance)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                        <button
                          onClick={() => handleOpenAddFeeModal(s)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                        >
                          <Plus className="w-3.5 h-3.5" /> Collect Fee
                        </button>

                        <button
                          onClick={() => handleOpenStudentStatement(s)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                          title="View Statement"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" /> OS Statement
                        </button>

                        <Link
                          href={`/dashboard/students/${s._id}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition-all"
                          title="See Student Profile"
                        >
                          <User className="w-3.5 h-3.5" /> See Profile
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-bold">No students found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: FEE COLLECTION HISTORY                                         */}
        {/* ========================================================================= */}
        {activeTab === "fee_records" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1 w-full lg:max-w-md relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt, student name, roll number..."
                  value={recordSearch}
                  onChange={e => setRecordSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={recordSemesterFilter}
                  onChange={e => setRecordSemesterFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">All Semesters</option>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                  ))}
                </select>

                <select
                  value={recordCategoryFilter}
                  onChange={e => setRecordCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">All Fee Categories</option>
                  {categories.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800 flex justify-between items-center">
                <span>Recent Collections & Deposits ({filteredTransactions.length})</span>
                <span className="text-xs text-slate-400 font-normal">Click Print Receipt to view or print official vouchers</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5 pl-5">Receipt No</th>
                      <th className="p-3.5">Student Name & Roll</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Payment Mode</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5 pr-5 text-right">Receipt Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTransactions.map((txn: any) => {
                      const student = txn.studentId || {};
                      const course = txn.courseId || {};
                      return (
                        <tr key={txn._id} className="hover:bg-slate-50">
                          <td className="p-3.5 pl-5 font-mono font-bold text-indigo-900">
                            {txn.receiptNumber || `RCP-${txn._id.slice(-6)}`}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{student.firstName} {student.lastName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{student.enrollmentNumber || "N/A"}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                              {txn.categoryName || txn.category || "Tuition"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px]">
                              {txn.paymentMethod || "Cash"}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {new Date(txn.paymentDate || txn.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          <td className="p-3.5 font-mono font-black text-sm text-emerald-600">
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <button
                              onClick={() => {
                                setSelectedReceiptForModal({
                                  type: "student",
                                  receiptType: "Student Fee Receipt",
                                  receiptNumber: txn.receiptNumber || `RCP-STU-${txn._id.slice(-8).toUpperCase()}`,
                                  transactionId: txn.transactionId,
                                  date: txn.paymentDate,
                                  name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
                                  idNumber: student.enrollmentNumber || student.admissionNumber || "N/A",
                                  program: course.name || "Academic Program",
                                  semester: txn.semester || 1,
                                  academicYear: txn.academicYear || "Year 1",
                                  category: txn.category || "tuition",
                                  categoryName: txn.categoryName || "Tuition Fee",
                                  amount: txn.amount,
                                  paymentMethod: txn.paymentMethod,
                                  collectedBy: "Accounts Office",
                                  notes: txn.notes,
                                  items: [
                                    {
                                      description: `${txn.categoryName || txn.category || "Fee"} (${txn.academicYear || "Year 1"}, Sem ${txn.semester || 1})`,
                                      amount: txn.amount
                                    }
                                  ]
                                });
                                setIsReceiptModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: FEE CATEGORIES (BOOKS, UNIFORM, BLAZER, FINE, ETC.)            */}
        {/* ========================================================================= */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-base">Fee Categories & Pricing Catalog</h3>
                <p className="text-xs text-slate-500">Books, Uniform, Blazer, T-Shirt, Bag, Lab Coat & Penalties</p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({
                    name: "",
                    code: "",
                    type: "Kit/Uniform",
                    defaultAmount: "",
                    frequency: "One-Time",
                    isMandatory: false,
                    description: ""
                  });
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat: any) => (
                <div key={cat._id || cat.code} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-slate-900 text-base">{cat.name}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">
                        {cat.frequency || "One-Time"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono">Code: {cat.code}</p>
                    <p className="text-xs text-slate-500 mt-2">{cat.description || "Standard student fee item."}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Standard Price</span>
                      <span className="text-lg font-black text-indigo-900 font-mono">{formatCurrency(cat.defaultAmount || 0)}</span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({
                          name: cat.name,
                          code: cat.code,
                          type: cat.type || "Kit/Uniform",
                          defaultAmount: String(cat.defaultAmount || 0),
                          frequency: cat.frequency || "One-Time",
                          isMandatory: Boolean(cat.isMandatory),
                          description: cat.description || ""
                        });
                        setIsCategoryModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                    >
                      Edit Price
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: RECEIPTS & VOUCHERS                                            */}
        {/* ========================================================================= */}
        {activeTab === "receipts" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-base">Receipts & Payment Vouchers</h3>
                <p className="text-xs text-slate-500">Official printable slips for Student Fee & Staff Salary</p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt number or beneficiary name..."
                  value={receiptSearchQuery}
                  onChange={e => setReceiptSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {combinedReceipts.map((r: any) => (
                <div key={r._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        r.type === "student" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-800"
                      }`}>
                        {r.receiptType}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {new Date(r.date).toLocaleDateString("en-IN")}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">{r.name}</h4>
                    <p className="text-xs font-mono text-slate-500">Receipt: {r.receiptNumber}</p>
                    <p className="text-xs text-slate-600 mt-2 font-medium">
                      Item: {r.categoryName || r.payoutType || "Fee Deposit"}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-base font-black text-emerald-600 font-mono">
                      {formatCurrency(r.amount)}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedReceiptForModal(r);
                        setIsReceiptModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: OVERDUE ALERTS                                                 */}
        {/* ========================================================================= */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-base">Fee Defaulter Alerts & Notices</h3>
                <p className="text-xs text-slate-500">Send reminder alerts to students with pending balances</p>
              </div>

              <button
                onClick={() => handleOpenAlertModal()}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20"
              >
                <Send className="w-4 h-4" /> Send New Due Alert
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
                Students with Pending Outstanding (OS) Dues
              </div>

              <div className="divide-y divide-slate-100">
                {filteredStudents.filter(s => getStudentFeeSummary(s).balance > 0).map(s => {
                  const summary = getStudentFeeSummary(s);
                  return (
                    <div key={s._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{s.firstName} {s.lastName}</h4>
                        <p className="text-xs text-slate-400 font-mono">
                          Roll: {s.enrollmentNumber || "N/A"} • Phone: {s.mobile || "N/A"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-rose-500 uppercase block">Pending Due</span>
                          <span className="font-mono font-black text-rose-600 text-base">{formatCurrency(summary.balance)}</span>
                        </div>

                        <button
                          onClick={() => handleCopyWhatsAppMessage(s)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message
                        </button>

                        <button
                          onClick={() => handleOpenAlertModal(s)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
                        >
                          <Bell className="w-3.5 h-3.5" /> Send Notice
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: STAFF PAYROLL                                                  */}
        {/* ========================================================================= */}
        {activeTab === "payouts" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-base">Staff Salaries & Payout Vouchers</h3>
                <p className="text-xs text-slate-500">Employee payment disbursements and vouchers</p>
              </div>

              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
              >
                <Plus className="w-4 h-4" /> Disburse Staff Payment
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-5">Voucher No</th>
                    <th className="p-3.5">Employee Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payouts.map((p: any) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                        {p.receiptNumber || `RCP-EMP-${p._id.slice(-6)}`}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{p.payeeName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-[10px]">
                          {p.payoutType || "Salary"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                      <td className="p-3.5 font-mono font-black text-sm text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedReceiptForModal({
                              type: "employee",
                              receiptType: "Employee Payment Voucher",
                              receiptNumber: p.receiptNumber || `RCP-EMP-${p._id.slice(-8).toUpperCase()}`,
                              transactionId: p.transactionId,
                              date: p.paymentDate,
                              name: p.payeeName,
                              idNumber: "EMP-001",
                              designation: p.designation || "Staff",
                              department: p.department || "Academics",
                              payoutType: p.payoutType || "Salary",
                              amount: p.amount,
                              paymentMethod: p.paymentMethod,
                              disbursedBy: "Finance Officer",
                              notes: p.notes,
                              items: [
                                {
                                  description: `${p.payoutType || "Salary"} Disbursal`,
                                  amount: p.amount
                                }
                              ]
                            });
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs"
                        >
                          Print Voucher
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7: COURSE FEES                                                    */}
        {/* ========================================================================= */}
        {activeTab === "branch_course" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-base">Course Tuition & Semester Fees</h3>
                <p className="text-xs text-slate-500">Set standard fee rates per academic course</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courses.map((c: any) => (
                <div key={c._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{c.name}</h4>
                    <p className="text-xs font-mono text-indigo-700">{c.code} • {c.duration || 4} Years</p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Course Tuition</span>
                      <span className="text-xl font-black text-slate-900 font-mono">{formatCurrency(c.tuitionFee || 0)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <Link
                      href={`/dashboard/finance/course-fees/${c._id}`}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs"
                    >
                      Configure Fee Structure
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD FEE / COLLECT PAYMENT                                        */}
      {/* ========================================================================= */}
      {(() => {
        const getAvailableFeeComponents = () => {
          if (!selectedStudentForFee) return [];
          const yr = feeForm.year || 1;
          
          if (selectedStudentForFee.fees?.isConfigured && Array.isArray(selectedStudentForFee.fees.years)) {
            const studentYear = selectedStudentForFee.fees.years.find((y: any) => y.year === yr);
            if (studentYear?.components && studentYear.components.length > 0) {
               return studentYear.components;
            }
          }
          
          const courseId = typeof selectedStudentForFee.selectedProgram === 'object' ? selectedStudentForFee.selectedProgram?._id : selectedStudentForFee.selectedProgram;
          const course = courses.find((c: any) => c._id === courseId);
          if (course && Array.isArray(course.feeStructureTemplate)) {
             const courseYear = course.feeStructureTemplate.find((y: any) => y.year === yr);
             if (courseYear?.components && courseYear.components.length > 0) {
                return courseYear.components;
             }
          }
          
          return [];
        };
        const dynamicFeeComponents = getAvailableFeeComponents();

        const getYearFeeSummary = () => {
          if (!selectedStudentForFee) return { total: 0, paid: 0, due: 0 };
          const yr = feeForm.year || 1;
          
          let total = 0;
          let paid = 0;

          const calculateComponentTotal = (c: any) => {
             const amt = Number(c.amount) || 0;
             return c.frequency === "Quarterly" ? amt * 4 : amt;
          };

          if (selectedStudentForFee.fees?.isConfigured && Array.isArray(selectedStudentForFee.fees.years)) {
            const studentYear = selectedStudentForFee.fees.years.find((y: any) => String(y.year) === String(yr));
            if (studentYear?.components && studentYear.components.length > 0) {
              total = studentYear.components.reduce((sum: number, c: any) => sum + calculateComponentTotal(c), 0);
              paid = studentYear.components.reduce((sum: number, c: any) => sum + (Number(c.paid) || 0), 0);
            } else if (studentYear) {
              total = (Number(studentYear.tuition?.total) || 0) + (Number(studentYear.exam?.total) || 0) + (Number(studentYear.transport?.total) || 0) + (Number(studentYear.other?.total) || 0);
              paid = (Number(studentYear.tuition?.paid) || 0) + (Number(studentYear.exam?.paid) || 0) + (Number(studentYear.transport?.paid) || 0) + (Number(studentYear.other?.paid) || 0);
            }
          } 
          
          if (total === 0) {
            const courseId = typeof selectedStudentForFee.selectedProgram === 'object' ? selectedStudentForFee.selectedProgram?._id : selectedStudentForFee.selectedProgram;
            const course = courses.find((c: any) => c._id === courseId);
            if (course) {
               if (Array.isArray(course.feeStructureTemplate)) {
                 const courseYear = course.feeStructureTemplate.find((y: any) => String(y.year) === String(yr));
                 if (courseYear?.components && courseYear.components.length > 0) {
                   total = courseYear.components.reduce((sum: number, c: any) => sum + calculateComponentTotal(c), 0);
                 }
               }
               if (total === 0) {
                 total = Number(course.tuitionFee) || 0;
               }
            }
          }
          
          const studentTxns = transactions.filter(t => 
             (t.studentId?._id === selectedStudentForFee._id || t.studentId === selectedStudentForFee._id) &&
             String(t.academicYear).includes(String(yr))
          );
          const txnPaid = studentTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          
          paid = Math.max(paid, txnPaid);
          const due = Math.max(0, total - paid);
          
          return { total, paid, due };
        };
        const yearSummary = getYearFeeSummary();

        return isAddFeeModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Collect Student Fee</h3>
                  <p className="text-xs text-slate-400">Direct receipt generation upon save</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddFeeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddFee} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-black mb-1">
                  1. Select Student <span className="text-rose-500">*</span>
                </label>
                <select
                  value={feeForm.studentId}
                  onChange={e => {
                    const s = students.find(st => st._id === e.target.value);
                    setSelectedStudentForFee(s);
                    setFeeForm(prev => ({
                      ...prev,
                      studentId: e.target.value,
                      year: s?.courseYear || 1,
                      semester: s?.selectedSemester || 1
                    }));
                  }}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none"
                >
                  <option value="">-- Choose Student by Name or Roll No --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} (Roll: {s.enrollmentNumber || s.admissionNumber || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-black mb-1">
                  2. Academic Year <span className="text-rose-500">*</span>
                </label>
                <select
                  value={feeForm.year}
                  onChange={e => setFeeForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 mb-3"
                >
                  {[1, 2, 3, 4, 5].map(y => (
                    <option key={y} value={y}>Academic Year {y}</option>
                  ))}
                </select>
                
                {selectedStudentForFee && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="text-center px-2">
                      <p className="text-[9px] font-black text-indigo-400 uppercase">Total Fee</p>
                      <p className="text-sm font-black text-indigo-900">₹{yearSummary.total.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-center px-2 border-l border-indigo-200">
                      <p className="text-[9px] font-black text-indigo-400 uppercase">Deposited</p>
                      <p className="text-sm font-black text-emerald-600">₹{yearSummary.paid.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-center px-2 border-l border-indigo-200">
                      <p className="text-[9px] font-black text-indigo-400 uppercase">Due Balance</p>
                      <p className="text-sm font-black text-rose-600">₹{yearSummary.due.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-black mb-1">
                  3. Fee Category / Item <span className="text-rose-500">*</span>
                </label>
                <select
                  value={feeForm.category}
                  onChange={e => {
                    if (dynamicFeeComponents.length > 0) {
                      const comp = dynamicFeeComponents.find((c: any) => c.category === e.target.value);
                      setFeeForm(prev => ({
                        ...prev,
                        category: e.target.value,
                        categoryName: e.target.value,
                        amount: comp?.amount ? String(comp.amount) : prev.amount
                      }));
                    } else {
                      const catObj = categories.find(c => c.code === e.target.value);
                      setFeeForm(prev => ({
                        ...prev,
                        category: e.target.value,
                        categoryName: catObj?.name || e.target.value,
                        amount: catObj?.defaultAmount ? String(catObj.defaultAmount) : prev.amount
                      }));
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">-- Select Fee Component --</option>
                  {dynamicFeeComponents.length > 0 ? (
                    dynamicFeeComponents.map((c: any, idx: number) => (
                      <option key={`dyn-${idx}`} value={c.category}>
                        {c.category} {c.amount ? `(₹${c.amount})` : ""}
                      </option>
                    ))
                  ) : (
                    categories.map(c => (
                      <option key={`cat-${c.code}`} value={c.code}>
                        {c.name} {c.defaultAmount ? `(₹${c.defaultAmount})` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-black mb-1">
                    Amount (INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={feeForm.amount}
                    onChange={e => setFeeForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 15000"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-black mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={feeForm.paymentMethod}
                    onChange={e => setFeeForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online / UPI (PhonePe, GPay)</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-black mb-1">
                  Remarks / Note
                </label>
                <input
                  type="text"
                  value={feeForm.notes}
                  onChange={e => setFeeForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Paid at campus counter"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddFeeModalOpen(false)}
                  className="px-4 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFee}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  {isSubmittingFee ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Save & Print Official Receipt
                </button>
              </div>
            </form>
          </motion.div>
        </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: STATEMENT / OS KHATA MODAL                                       */}
      {/* ========================================================================= */}
      {isStatementModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedStudentForStatement?.firstName} {selectedStudentForStatement?.lastName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Roll: {selectedStudentForStatement?.enrollmentNumber || "N/A"} • {selectedStudentForStatement?.selectedProgram?.name || "Program"}
                </p>
              </div>
              <button onClick={() => setIsStatementModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingStatement ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs font-bold">Loading student fee account...</p>
              </div>
            ) : studentStatementData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Assessed</span>
                    <span className="font-mono font-black text-slate-900 text-base">
                      {formatCurrency(studentStatementData.ledger?.totalAssessed)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase block">Deposited Fee</span>
                    <span className="font-mono font-black text-emerald-600 text-base">
                      {formatCurrency(studentStatementData.ledger?.totalPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-500 uppercase block">Outstanding (OS)</span>
                    <span className="font-mono font-black text-rose-600 text-base">
                      {formatCurrency(studentStatementData.ledger?.outstandingAmount)}
                    </span>
                  </div>
                </div>

                {/* YEAR-WISE BREAKDOWN */}
                {studentStatementData.ledger?.years && studentStatementData.ledger.years.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Year-wise Fee Breakdown</h4>
                    <div className="space-y-3">
                      {studentStatementData.ledger.years.map((y: any) => (
                        <div key={y.year} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                          <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-100">
                            <span className="font-bold text-sm text-slate-800">Year {y.year}</span>
                            <div className="flex gap-4 text-xs font-mono">
                              <span className="text-slate-500">Total: <span className="font-bold text-slate-900">{formatCurrency(y.yearTotal)}</span></span>
                              <span className="text-slate-500">Paid: <span className="font-bold text-emerald-600">{formatCurrency(y.yearPaid)}</span></span>
                              <span className="text-slate-500">OS: <span className="font-bold text-rose-600">{formatCurrency(y.yearOS)}</span></span>
                            </div>
                          </div>
                          {y.components && y.components.length > 0 && (
                            <div className="p-3 bg-white flex flex-wrap gap-2">
                              {y.components.map((c: any, i: number) => (
                                <div key={i} className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 flex items-center gap-2 text-[10px]">
                                  <span className="font-bold text-slate-600">{c.category}</span>
                                  <span className="text-slate-400 font-mono">{formatCurrency(c.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Past Receipts & Payments</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {studentStatementData.transactions?.map((t: any) => (
                      <div key={t._id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-indigo-900 block">{t.receiptNumber || `RCP-${t._id.slice(-6)}`}</span>
                          <span className="text-[10px] text-slate-400">{new Date(t.paymentDate).toLocaleDateString("en-IN")} • {t.paymentMethod}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-emerald-600">{formatCurrency(t.amount)}</span>
                          <button
                            onClick={() => {
                              setSelectedReceiptForModal({
                                type: "student",
                                receiptType: "Student Fee Receipt",
                                receiptNumber: t.receiptNumber || `RCP-STU-${t._id.slice(-8).toUpperCase()}`,
                                transactionId: t.transactionId,
                                date: t.paymentDate,
                                name: studentStatementData.student?.fullName || "Student",
                                idNumber: studentStatementData.student?.enrollmentNumber || "N/A",
                                program: studentStatementData.student?.course || "Course",
                                semester: t.semester || 1,
                                academicYear: t.academicYear || "Year 1",
                                category: t.category || "tuition",
                                categoryName: t.categoryName || "Tuition Fee",
                                amount: t.amount,
                                paymentMethod: t.paymentMethod,
                                collectedBy: "Accounts Office",
                                notes: t.notes,
                                items: [{ description: `${t.categoryName || t.category || "Fee"}`, amount: t.amount }]
                              });
                              setIsReceiptModalOpen(true);
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg"
                            title="Print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button onClick={() => setIsStatementModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl text-xs">
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsStatementModalOpen(false);
                      handleOpenAddFeeModal(selectedStudentForStatement);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                  >
                    + Collect Fee
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DUE REMINDER ALERT MODAL                                         */}
      {/* ========================================================================= */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Send Overdue Fee Alert</h3>
              <button onClick={() => setIsAlertModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAlert} className="space-y-3.5 text-xs font-semibold">
              {!alertTargetStudent && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Select Student</label>
                  <select
                    value={alertForm.studentId}
                    onChange={e => setAlertForm(prev => ({ ...prev, studentId: e.target.value }))}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-500 font-bold mb-1">Notice Title</label>
                <input
                  type="text"
                  value={alertForm.title}
                  onChange={e => setAlertForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Message Content</label>
                <textarea
                  value={alertForm.message}
                  onChange={e => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAlertModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingAlert} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md">
                  {isSubmittingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Alert"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD/EDIT CATEGORY MODAL                                          */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">{editingCategory ? "Edit Fee Item" : "New Fee Item / Category"}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitCategory} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Item Name (e.g. Blazer, Uniform, Books)</label>
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Standard Rate / Price (INR)</label>
                <input type="number" value={categoryForm.defaultAmount} onChange={e => setCategoryForm(prev => ({ ...prev, defaultAmount: e.target.value }))} placeholder="e.g. 2500" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmittingCategory} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
                  {isSubmittingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Rate"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: STAFF PAYOUT MODAL                                               */}
      {/* ========================================================================= */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Staff Salary / Disbursal Voucher</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePayout} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Select Employee</label>
                <select value={payoutForm.payeeId} onChange={e => {
                  const staff = staffList.find(s => s._id === e.target.value);
                  setPayoutForm(prev => ({ ...prev, payeeId: e.target.value, designation: staff?.role || "Staff" }));
                }} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map(s => (<option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.role || "Staff"})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Amount (INR)</label>
                <input type="number" value={payoutForm.amount} onChange={e => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmittingPayout} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl">
                  {isSubmittingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Print Voucher"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: COURSE FEE EDIT MODAL                                            */}
      {/* ========================================================================= */}
      {isCourseFeeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Course Tuition Fee</h3>
              <button onClick={() => setIsCourseFeeModalOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              setIsSavingCourseFee(true);
              try {
                const res = await fetch(`/api/courses/${editingCourse._id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tuitionFee: Number(courseFeeForm.tuitionFee) || 0, applyToStudents: true })
                });
                if (res.ok) {
                  showToast("Course fee updated!");
                  setIsCourseFeeModalOpen(false);
                  fetchData();
                }
              } finally {
                setIsSavingCourseFee(false);
              }
            }} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Total Course Fee (INR)</label>
                <input type="number" value={courseFeeForm.tuitionFee} onChange={e => setCourseFeeForm(prev => ({ ...prev, tuitionFee: e.target.value }))} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCourseFeeModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSavingCourseFee} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

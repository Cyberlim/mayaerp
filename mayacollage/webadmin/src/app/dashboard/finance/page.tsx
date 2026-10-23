"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Landmark,
  Users,
  User,
  Wallet,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  FileText,
  Search,
  AlertTriangle,
  RefreshCw,
  Printer,
  Bell,
  ShoppingBag,
  Shirt,
  Calendar,
  Layers,
  Settings,
  Copy,
  ChevronDown,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  Briefcase,
  GraduationCap,
  Receipt,
  ExternalLink,
  ArrowRight,
  Tag,
  ShieldCheck,
  Sparkles,
  Edit3,
  Check
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

const LOCAL_CACHE_KEY = "mayacollage_finance_master_cache";

const AVATAR_COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-purple-100 text-purple-800",
  "bg-indigo-100 text-indigo-800"
];

// Standard fee categories matching the Course Creation & Curriculum system
export const COURSE_CREATION_CATEGORIES = [
  { name: "Tuition Fee", code: "tuition", defaultAmount: 45000, type: "Academic" },
  { name: "Admission Fee", code: "admission", defaultAmount: 10000, type: "Academic" },
  { name: "Exam Fee", code: "exam", defaultAmount: 2500, type: "Academic" },
  { name: "Practical Fee", code: "practical", defaultAmount: 3000, type: "Academic" },
  { name: "Uniform Fee", code: "uniform", defaultAmount: 2200, type: "Kit/Uniform" },
  { name: "Blazer Fee", code: "blazer", defaultAmount: 2800, type: "Kit/Uniform" },
  { name: "Bag Fee", code: "bag", defaultAmount: 850, type: "Kit/Uniform" },
  { name: "Tie Fee", code: "tie", defaultAmount: 250, type: "Kit/Uniform" },
  { name: "T-Shirt Fee", code: "tshirt", defaultAmount: 650, type: "Kit/Uniform" },
  { name: "Lab Coat Fee", code: "labcoat", defaultAmount: 750, type: "Kit/Uniform" },
  { name: "Book Fee", code: "book", defaultAmount: 3500, type: "Kit/Uniform" },
  { name: "Transport Fee", code: "transport", defaultAmount: 12000, type: "Facility/Lab" },
  { name: "Breakage Fine", code: "fine", defaultAmount: 500, type: "Fine/Penalty" },
  { name: "Other Fee", code: "other", defaultAmount: 1000, type: "Other" }
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] || AVATAR_COLORS[0];
}

// Micro Bar Chart Component for Cards
function MicroBarChart({ color = "blue" }: { color?: "blue" | "emerald" | "rose" | "purple" }) {
  const bgClasses = {
    blue: "bg-blue-300",
    emerald: "bg-emerald-300",
    rose: "bg-rose-300",
    purple: "bg-purple-300"
  };
  return (
    <div className="flex items-end gap-1 h-9 shrink-0 opacity-80">
      <div className={`w-1 rounded-full h-3.5 ${bgClasses[color]}`} />
      <div className={`w-1 rounded-full h-5 ${bgClasses[color]}`} />
      <div className={`w-1 rounded-full h-7 ${bgClasses[color]}`} />
      <div className={`w-1 rounded-full h-9 ${bgClasses[color]}`} />
    </div>
  );
}

// Shimmer Skeleton for Finance Dashboard
function FinanceSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-6 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-8 w-6 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Search & Filter Skeleton */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="h-10 w-72 bg-slate-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-slate-100 rounded-xl" />
          <div className="h-10 w-24 bg-slate-100 rounded-xl" />
          <div className="h-10 w-20 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Roster Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-5 w-44 bg-slate-100 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-slate-100 rounded-xl" />
              <div className="h-8 w-24 bg-slate-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shimmer Skeleton for Collect Fee / Edit Fee Structure Modal
function CollectFeeModalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map((yrNum) => (
        <div key={yrNum} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
          {/* Header Row Skeleton */}
          <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-indigo-200/70 rounded-lg shrink-0" />
              <div className="h-4 w-32 bg-slate-200/90 rounded-md" />
              <div className="h-3 w-48 bg-slate-200/60 rounded-md hidden sm:block" />
            </div>
            <div className="h-6 w-28 bg-emerald-100/80 rounded-md" />
          </div>

          {/* Component Input Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((c) => (
              <div key={c} className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <div className="h-3.5 w-24 bg-slate-200/80 rounded" />
                  <div className="h-2.5 w-16 bg-indigo-100 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="h-2 w-12 bg-slate-200/70 rounded mb-1.5" />
                    <div className="h-9 w-full bg-slate-50 rounded-lg border border-slate-200/70" />
                  </div>
                  <div>
                    <div className="h-2 w-12 bg-emerald-200/70 rounded mb-1.5" />
                    <div className="h-9 w-full bg-slate-50 rounded-lg border border-slate-200/70" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Discount Block Skeleton */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-300/80 shrink-0" />
                <div className="space-y-1">
                  <div className="h-3 w-48 bg-emerald-200/80 rounded" />
                  <div className="h-2 w-64 bg-emerald-100/80 rounded hidden sm:block" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="h-2.5 w-24 bg-emerald-200/80 rounded mb-1.5" />
                <div className="h-9 w-full bg-white rounded-xl border border-emerald-300/70" />
              </div>
              <div>
                <div className="h-2.5 w-36 bg-emerald-200/80 rounded mb-1.5" />
                <div className="h-9 w-full bg-white rounded-xl border border-emerald-300/70" />
              </div>
            </div>
          </div>

          {/* Add extra charge skeleton */}
          <div className="w-full h-8 border border-dashed border-slate-200 rounded-xl bg-white/40" />
        </div>
      ))}

      {/* Add another academic year skeleton */}
      <div className="w-full h-11 border-2 border-dashed border-indigo-200/70 rounded-xl bg-indigo-50/40" />
    </div>
  );
}

export default function FinanceDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "student_accounts" | "fee_records" | "categories" | "receipts" | "alerts" | "branch_course" | "payouts"
  >("student_accounts");

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

  // Student Accounts Search, Infinite Scroll & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [osFilter, setOsFilter] = useState<"all" | "os_due" | "cleared">("all");
  const [visibleCount, setVisibleCount] = useState(20);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

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

  // Student Account Statement Modal State
  const [selectedStudentForStatement, setSelectedStudentForStatement] = useState<any>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [studentStatementData, setStudentStatementData] = useState<any>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [statementSidebarTab, setStatementSidebarTab] = useState<"all" | "categories" | "transactions">("all");
  const statementCacheRef = useRef<Record<string, any>>({});

  // Add Fee / Collect Payment Modal State
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [collectFeeModalTab, setCollectFeeModalTab] = useState<"pay" | "structure">("pay");
  const [selectedStudentForFee, setSelectedStudentForFee] = useState<any>(null);
  const [isSubmittingFee, setIsSubmittingFee] = useState(false);
  const [editFeeYears, setEditFeeYears] = useState<any[]>([]);
  const [isSavingFeeEdit, setIsSavingFeeEdit] = useState(false);
  const [isLoadingFeeStructure, setIsLoadingFeeStructure] = useState(false);
  const [feeForm, setFeeForm] = useState({
    studentId: "",
    year: 1,
    category: "tuition",
    categoryName: "Tuition Fee",
    amount: "",
    paymentMethod: "Cash",
    receiptNumber: "",
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

  const syncToLocalCache = (payload: any) => {
    if (typeof window === "undefined" || !payload) return;
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
      sessionStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showLoader = false, forceBust = false) => {
    if (showLoader && !stats.totalReceivable) setIsLoading(true);
    if (forceBust) setIsRefreshing(true);
    try {
      // 1. FAST SINGLE-SHOT BUNDLE (sub-20ms from Upstash Redis)
      const bundleUrl = forceBust ? "/api/finance/bundle?bust=true" : "/api/finance/bundle";
      const bundleRes = await fetch(bundleUrl);
      if (bundleRes.ok) {
        const bundle = await bundleRes.json();
        if (bundle && bundle.stats) {
          setStats(bundle.stats);
          setTransactions(Array.isArray(bundle.transactions) ? bundle.transactions : []);
          setPayouts(Array.isArray(bundle.payouts) ? bundle.payouts : []);
          setStaffList(Array.isArray(bundle.staffList) ? bundle.staffList : []);
          setBranches(Array.isArray(bundle.branches) ? bundle.branches : []);
          setCourses(Array.isArray(bundle.courses) ? bundle.courses : []);
          setStudents(Array.isArray(bundle.students) ? bundle.students : []);
          setCategories(Array.isArray(bundle.categories) ? bundle.categories : []);
          setAlertsData(bundle.alertsData || { summary: {}, alerts: [], defaulters: [] });

          syncToLocalCache(bundle);
          if (forceBust) showToast("Database refreshed & Redis cache updated!");
          return;
        }
      }

      // 2. Fallback to parallel individual endpoints if bundle fails
      const bustQuery = forceBust ? "?bust=true" : "";
      const [statsRes, txnsRes, payoutsRes, staffRes, branchesRes, coursesRes, studentsRes, categoriesRes, alertsRes] =
        await Promise.all([
          fetch(`/api/finance/stats${bustQuery}`).then(res => res.json()).catch(() => ({})),
          fetch("/api/finance/transactions?limit=250").then(res => res.json()).catch(() => []),
          fetch(`/api/finance/payouts${bustQuery}`).then(res => res.json()).catch(() => []),
          fetch("/api/users/staff").then(res => res.json()).catch(() => []),
          fetch(`/api/branches${bustQuery}`).then(res => res.json()).catch(() => []),
          fetch(`/api/courses${bustQuery}`).then(res => res.json()).catch(() => []),
          fetch(`/api/students${bustQuery}`).then(res => res.json()).catch(() => []),
          fetch(`/api/finance/categories${bustQuery}`).then(res => res.json()).catch(() => []),
          fetch(`/api/finance/alerts${bustQuery}`).then(res => res.json()).catch(() => ({ summary: {}, alerts: [], defaulters: [] }))
        ]);

      const validStats = statsRes || { totalCollected: 0, totalReceivable: 0, activeStudentCount: 0 };
      const validTxns = Array.isArray(txnsRes) ? txnsRes : [];
      const validPayouts = Array.isArray(payoutsRes) ? payoutsRes : [];
      const validStaff = Array.isArray(staffRes) ? staffRes : [];
      const validBranches = Array.isArray(branchesRes) ? branchesRes : [];
      const validCourses = Array.isArray(coursesRes) ? coursesRes : [];
      const validStudents = Array.isArray(studentsRes) ? studentsRes : [];
      const validCategories = Array.isArray(categoriesRes) ? categoriesRes : [];
      const validAlerts = alertsRes && alertsRes.summary ? alertsRes : { summary: {}, alerts: [], defaulters: [] };

      setStats(validStats);
      setTransactions(validTxns);
      setPayouts(validPayouts);
      setStaffList(validStaff);
      setBranches(validBranches);
      setCourses(validCourses);
      setStudents(validStudents);
      setCategories(validCategories);
      setAlertsData(validAlerts);

      syncToLocalCache({
        stats: validStats,
        transactions: validTxns,
        payouts: validPayouts,
        staffList: validStaff,
        branches: validBranches,
        courses: validCourses,
        students: validStudents,
        categories: validCategories,
        alertsData: validAlerts,
        timestamp: Date.now()
      });
      if (forceBust) showToast("Database refreshed & Redis cache updated!");
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 1. FAST SWR HYDRATION: Check client-side localStorage/sessionStorage first (0ms instant load)
    if (typeof window !== "undefined") {
      try {
        const cachedRaw = localStorage.getItem(LOCAL_CACHE_KEY) || sessionStorage.getItem(LOCAL_CACHE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && parsed.stats) {
            setStats(parsed.stats);
            if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
            if (Array.isArray(parsed.payouts)) setPayouts(parsed.payouts);
            if (Array.isArray(parsed.staffList)) setStaffList(parsed.staffList);
            if (Array.isArray(parsed.branches)) setBranches(parsed.branches);
            if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
            if (Array.isArray(parsed.students)) setStudents(parsed.students);
            if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
            if (parsed.alertsData) setAlertsData(parsed.alertsData);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.warn("Local storage cache read error:", err);
      }
    }

    // 2. Fetch fresh from PostgreSQL & Redis backend
    fetchData(true);
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
    const courseId = typeof student.selectedProgram === "object" ? student.selectedProgram?._id : (student.selectedProgram || student.selected_program);
    const courseObj = courses.find(c => c._id === courseId || c.id === courseId) || {
      name: student.courseName || student.course_name,
      code: student.courseCode || student.course_code,
      tuitionFee: Number(student.courseTuitionFee || student.course_tuition_fee) || 0
    };

    let courseBaseFee = Number(courseObj?.tuitionFee) || Number(student.courseTuitionFee || student.course_tuition_fee) || Number(student.totalFee || student.total_fee) || 0;
    if (Array.isArray(courseObj?.semesterFees) && courseObj.semesterFees.length > 0) {
      const sumSem = courseObj.semesterFees.reduce((acc: number, sf: any) => acc + (Number(sf.fee) || 0), 0);
      if (sumSem > 0) courseBaseFee = sumSem;
    }

    const feesObj = student?.fees || {};
    const isConfigured = Boolean(feesObj.isConfigured && Array.isArray(feesObj.years) && feesObj.years.length > 0);
    let gross = 0;
    let discount = 0;
    let total = Number(student.totalFee || student.total_fee) || 0;
    let paid = Number(student.paidFee || student.paid_fee) || 0;

    if (isConfigured && feesObj.years) {
      let calcGross = 0;
      let calcPaid = 0;
      feesObj.years.forEach((fy: any) => {
        let yrGross = 0;
        let yrPaid = 0;
        if (fy.components && fy.components.length > 0) {
          fy.components.forEach((c: any) => {
            yrGross += Number(c.amount) || 0;
            yrPaid += Number(c.paid) || 0;
          });
        } else {
          yrGross += (Number(fy.tuition?.total) || 0) + (Number(fy.exam?.total) || 0) + (Number(fy.transport?.total) || 0) + (Number(fy.other?.total) || 0);
          yrPaid += (Number(fy.tuition?.paid) || 0) + (Number(fy.exam?.paid) || 0) + (Number(fy.transport?.paid) || 0) + (Number(fy.other?.paid) || 0);
        }
        const yrDisc = Number(fy.discount) || 0;
        calcGross += Math.max(0, yrGross - yrDisc);
        calcPaid += yrPaid;
      });
      if (calcGross > 0) total = calcGross;
      if (calcPaid > paid) paid = calcPaid;
    }

    if (total === 0 && courseBaseFee > 0) {
      total = courseBaseFee;
      gross = courseBaseFee;
    }

    const studentTxns = transactions.filter(t => (t.studentId?._id || t.studentId?.id || t.studentId) === (student._id || student.id));
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

    return { isConfigured, gross, discount, total, paid, balance, status, courseBaseFee, courseObj, studentTxns };
  };

  // Filtered Students Roster
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const summary = getStudentFeeSummary(s);
      const fName = s.firstName || s.first_name || "";
      const lName = s.lastName || s.last_name || "";
      const name = `${fName} ${lName}`.toLowerCase();
      const enroll = (s.enrollmentNumber || s.enrollment_number || "").toLowerCase();
      const adm = (s.admissionNumber || s.admission_number || "").toLowerCase();
      const code = (s.studentId || s.student_id || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || enroll.includes(query) || adm.includes(query) || code.includes(query);
      const sCourseId = typeof s.selectedProgram === "object" ? s.selectedProgram?._id : (s.selectedProgram || s.selected_program);
      const matchesCourse = selectedCourse === "all" || sCourseId === selectedCourse;

      const matchesOS =
        osFilter === "all" ||
        (osFilter === "os_due" && summary.balance > 0) ||
        (osFilter === "cleared" && summary.paid > 0);

      return matchesSearch && matchesCourse && matchesOS;
    });
  }, [students, searchQuery, selectedCourse, osFilter, courses, transactions]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, selectedCourse, osFilter]);

  // Lazy loaded students for infinite scroll
  const visibleStudents = useMemo(() => {
    return filteredStudents.slice(0, visibleCount);
  }, [filteredStudents, visibleCount]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => {
            if (prev < filteredStudents.length) {
              return Math.min(prev + 20, filteredStudents.length);
            }
            return prev;
          });
        }
      },
      { root: null, rootMargin: "300px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredStudents.length]);

  // Aggregated Overview Metrics
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
      const enroll = (student?.enrollmentNumber || student?.admissionNumber || "").toLowerCase();
      const txnId = (t.transactionId || "").toLowerCase();
      const rcpt = (t.receiptNumber || "").toLowerCase();
      const q = recordSearch.toLowerCase().trim();

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
        _id: t._id || t.id,
        id: t._id || t.id,
        type: "student",
        receiptType: "Student Fee Receipt",
        receiptNumber: t.receiptNumber || `RCP-STU-${t.id?.slice(-8).toUpperCase()}`,
        transactionId: t.transactionId || `TXN-${t.id?.slice(-6)}`,
        date: t.paymentDate || t.createdAt,
        name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
        idNumber: student.enrollmentNumber || student.admissionNumber || student.studentId || "N/A",
        program: course.name || "Academic Program",
        semester: t.semester || 1,
        academicYear: t.academicYear || "Year 1",
        category: t.category || "tuition",
        categoryName: t.categoryName || "Tuition Fee",
        amount: Number(t.amount) || 0,
        paymentMethod: t.paymentMethod || "Cash",
        collectedBy: t.collectedBy || "Accounts Office",
        notes: t.notes || "",
        items: [
          {
            description: `${t.categoryName || t.category || "Fee"} (${t.academicYear || "Year 1"}, Sem ${t.semester || 1})`,
            amount: Number(t.amount) || 0
          }
        ]
      };
    });

    const employeeReceipts = payouts.map(p => {
      const payee = p.payeeId || {};
      return {
        _id: p._id || p.id,
        id: p._id || p.id,
        type: "employee",
        receiptType: "Employee Payment Voucher",
        receiptNumber: p.receiptNumber || `RCP-EMP-${p.id?.slice(-8).toUpperCase()}`,
        transactionId: p.transactionId || `TXN-${p.id?.slice(-6)}`,
        date: p.paymentDate || p.createdAt,
        name: p.payeeName || `${payee.firstName || ""} ${payee.lastName || ""}`.trim() || "Employee",
        idNumber: payee.employeeId || payee._id?.slice(-6) || "EMP-001",
        designation: p.designation || payee.role || "Faculty / Staff",
        department: p.department || payee.department || "Academics",
        payoutType: p.payoutType || "Salary",
        amount: Number(p.amount) || 0,
        paymentMethod: p.paymentMethod || "Bank Transfer",
        disbursedBy: p.disbursedBy || "Finance Officer",
        notes: p.notes || "",
        items: [
          {
            description: `${p.payoutType || "Salary"} Disbursal - ${p.monthYear || "Cycle"}`,
            amount: Number(p.amount) || 0
          }
        ]
      };
    });

    let combined = [];
    if (receiptFilterType === "student") combined = studentReceipts;
    else if (receiptFilterType === "employee") combined = employeeReceipts;
    else combined = [...studentReceipts, ...employeeReceipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (receiptSearchQuery && receiptSearchQuery.trim()) {
      const q = receiptSearchQuery.toLowerCase().trim();
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

  // Navigation Tabs with Clean Icons
  const tabList = [
    { id: "student_accounts", label: "Student Fees", icon: Users },
    { id: "fee_records", label: "Payment History", icon: Clock },
    { id: "categories", label: "Fee Setup", icon: Settings },
    { id: "receipts", label: "Receipts", icon: FileText },
    { id: "alerts", label: "Due Reminders", icon: Bell },
    { id: "payouts", label: "Staff Payments", icon: Briefcase },
    { id: "branch_course", label: "Courses & Rates", icon: GraduationCap },
  ];

  // Open Statement Sidebar with Fast SWR Client Cache & Instant Response
  const handleOpenStudentStatement = async (student: any, forceRefresh = false) => {
    const studentId = student._id || student.id;
    setSelectedStudentForStatement(student);
    setIsStatementModalOpen(true);
    setStatementSidebarTab("all");

    // 1. Check Fast Client-side Cache (Memory + SessionStorage)
    const memCached = statementCacheRef.current[studentId];
    let sessionCached = null;
    if (!memCached && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(`statement_cache_${studentId}`);
        if (raw) sessionCached = JSON.parse(raw);
      } catch (e) {}
    }
    const cached = memCached || sessionCached;

    if (cached && !forceRefresh) {
      setStudentStatementData(cached);
      setIsLoadingStatement(false);

      // Background revalidation (silent SWR refresh)
      fetch(`/api/finance/student-account/${studentId}`)
        .then(res => res.json())
        .then(fresh => {
          if (fresh && !fresh.error) {
            statementCacheRef.current[studentId] = fresh;
            try { sessionStorage.setItem(`statement_cache_${studentId}`, JSON.stringify(fresh)); } catch (e) {}
            setStudentStatementData(fresh);
          }
        })
        .catch(() => {});
      return;
    }

    // 2. If not in cache, clear previous statement data and show Skeleton UI
    setStudentStatementData(null);
    setIsLoadingStatement(true);

    try {
      const res = await fetch(`/api/finance/student-account/${studentId}`);
      const data = await res.json();
      if (res.ok && !data.error) {
        statementCacheRef.current[studentId] = data;
        try { sessionStorage.setItem(`statement_cache_${studentId}`, JSON.stringify(data)); } catch (e) {}
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

  // Calculation of Edit Fee Structure Totals (Gross, Net, Paid, Due)
  const editModalTotals = useMemo(() => {
    let grossTotal = 0;
    let totalDiscount = 0;
    let paid = 0;
    editFeeYears.forEach(y => {
      let yrGross = 0;
      (y.components || []).forEach((c: any) => {
        yrGross += Number(c.amount) || 0;
        paid += Number(c.paid) || 0;
      });
      const disc = Number(y.discount) || 0;
      grossTotal += yrGross;
      totalDiscount += disc;
    });
    const netTotal = Math.max(0, grossTotal - totalDiscount);
    return {
      grossTotal,
      totalDiscount,
      total: netTotal,
      paid,
      balance: Math.max(0, netTotal - paid)
    };
  }, [editFeeYears]);

  // Open Edit Fee Structure & Collect Fee Modal
  const parseLedgerYearsToEditFeeYears = (years: any[]) => {
    return (years || []).map((y: any, idx: number) => {
      let components = y.components || [];
      if (components.length === 0 && y.categories) {
        components = Object.entries(y.categories).map(([k, c]: any) => ({
          category: k.charAt(0).toUpperCase() + k.slice(1) + " Fee",
          amount: Number(c.total) || 0,
          paid: Number(c.paid) || 0,
          frequency: "Annual"
        }));
      } else if (components.length === 0) {
        components = [
          { category: "Tuition Fee", amount: Number(y.tuition?.total) || 0, paid: Number(y.tuition?.paid) || 0, frequency: "Annual" }
        ];
        if (Number(y.exam?.total) > 0 || Number(y.exam?.paid) > 0) {
          components.push({ category: "Exam Fee", amount: Number(y.exam?.total) || 0, paid: Number(y.exam?.paid) || 0, frequency: "Annual" });
        }
        if (Number(y.transport?.total) > 0 || Number(y.transport?.paid) > 0) {
          components.push({ category: "Transport Fee", amount: Number(y.transport?.total) || 0, paid: Number(y.transport?.paid) || 0, frequency: "Annual" });
        }
        if (Number(y.other?.total) > 0 || Number(y.other?.paid) > 0) {
          components.push({ category: "Other Fee", amount: Number(y.other?.total) || 0, paid: Number(y.other?.paid) || 0, frequency: "Annual" });
        }
      }

      return {
        year: y.year || idx + 1,
        discount: Number(y.discount) || 0,
        discountReason: y.discountReason || "",
        components: components.map((c: any) => ({
          category: c.category || "Tuition Fee",
          amount: Number(c.amount) || 0,
          paid: Number(c.paid) || 0,
          frequency: "Annual"
        }))
      };
    });
  };

  // Open Edit Fee Structure & Collect Fee Modal (Sub-10ms Instant Open + SWR Cache + Skeleton Fallback)
  const handleOpenAddFeeModal = async (student?: any) => {
    let target = student;
    if (!target && students.length > 0) {
      target = students[0];
    }
    setSelectedStudentForFee(target);
    setCollectFeeModalTab("pay");
    setIsAddFeeModalOpen(true);

    if (target) {
      const studentId = target._id || target.id;
      const initialDue = Number(target.feeBalance || target.fee_balance) || 0;
      const initialYear = Number(target.courseYear || (target.selected_semester ? Math.ceil(Number(target.selected_semester) / 2) : 1)) || 1;

      const sCourseId = typeof target.selectedProgram === "object" ? target.selectedProgram?._id : (target.selectedProgram || target.selected_program);
      const existingCourse = courses.find(c => (c._id || c.id) === sCourseId);

      // On-demand fetch course template from database if not yet loaded
      if (sCourseId && (!existingCourse?.feeStructureTemplate || existingCourse.feeStructureTemplate.length === 0)) {
        fetch(`/api/courses/${sCourseId}`)
          .then(r => r.json())
          .then(cData => {
            if (cData && cData.feeStructureTemplate) {
              setCourses(prev => prev.map(c => (c._id || c.id) === sCourseId ? { ...c, ...cData } : c));
            }
          })
          .catch(() => {});
      }

      // Check course template from database for initial year
      const yrTemplate = existingCourse?.feeStructureTemplate?.find((y: any) => y.year === initialYear);
      const firstComp = yrTemplate?.components?.[0];
      const initialCatName = firstComp?.category || "Tuition Fee";
      const initialCatCode = initialCatName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const initialCatAmt = firstComp?.amount ? String(firstComp.amount) : (initialDue > 0 ? String(initialDue) : "");

      setFeeForm({
        studentId,
        year: initialYear,
        category: initialCatCode,
        categoryName: initialCatName,
        amount: initialCatAmt,
        paymentMethod: "Cash",
        receiptNumber: "",
        transactionId: `TXN-${Date.now().toString().slice(-6)}`,
        paymentDate: new Date().toISOString().split("T")[0],
        semester: (initialYear * 2) - 1,
        notes: ""
      });
    }

    if (!target) {
      setEditFeeYears([
        {
          year: 1,
          discount: 0,
          discountReason: "",
          components: [{ category: "Tuition Fee", amount: 0, paid: 0, frequency: "Annual" }]
        }
      ]);
      setIsLoadingFeeStructure(false);
      return;
    }

    const studentId = target._id || target.id;

    // 1. Instant check from In-Memory Statement Cache (0ms)
    const memCached = statementCacheRef.current[studentId];
    if (memCached?.ledger?.years && memCached.ledger.years.length > 0) {
      setEditFeeYears(parseLedgerYearsToEditFeeYears(memCached.ledger.years));
      setIsLoadingFeeStructure(false);

      // Silent background SWR revalidation
      fetch(`/api/finance/student-account/${studentId}`)
        .then(res => res.json())
        .then(fresh => {
          if (fresh?.ledger?.years && fresh.ledger.years.length > 0) {
            statementCacheRef.current[studentId] = fresh;
            try { sessionStorage.setItem(`statement_cache_${studentId}`, JSON.stringify(fresh)); } catch (e) {}
            setEditFeeYears(parseLedgerYearsToEditFeeYears(fresh.ledger.years));
          }
        })
        .catch(() => {});
      return;
    }

    // 2. Instant check from SessionStorage Cache (< 2ms)
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(`statement_cache_${studentId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ledger?.years && parsed.ledger.years.length > 0) {
            statementCacheRef.current[studentId] = parsed;
            setEditFeeYears(parseLedgerYearsToEditFeeYears(parsed.ledger.years));
            setIsLoadingFeeStructure(false);

            // Silent background SWR revalidation
            fetch(`/api/finance/student-account/${studentId}`)
              .then(res => res.json())
              .then(fresh => {
                if (fresh?.ledger?.years && fresh.ledger.years.length > 0) {
                  statementCacheRef.current[studentId] = fresh;
                  try { sessionStorage.setItem(`statement_cache_${studentId}`, JSON.stringify(fresh)); } catch (e) {}
                  setEditFeeYears(parseLedgerYearsToEditFeeYears(fresh.ledger.years));
                }
              })
              .catch(() => {});
            return;
          }
        }
      } catch (e) {}
    }

    // 3. Instant check from Student Record's own fees object (< 2ms)
    let rawFees = target.fees;
    if (typeof rawFees === "string") {
      try {
        rawFees = JSON.parse(rawFees);
      } catch (e) {}
    }

    if (rawFees && Array.isArray(rawFees.years) && rawFees.years.length > 0) {
      setEditFeeYears(parseLedgerYearsToEditFeeYears(rawFees.years));
      setIsLoadingFeeStructure(false);

      // Silent background SWR fetch
      fetch(`/api/finance/student-account/${studentId}`)
        .then(res => res.json())
        .then(fresh => {
          if (fresh?.ledger?.years && fresh.ledger.years.length > 0) {
            statementCacheRef.current[studentId] = fresh;
            try { sessionStorage.setItem(`statement_cache_${studentId}`, JSON.stringify(fresh)); } catch (e) {}
            setEditFeeYears(parseLedgerYearsToEditFeeYears(fresh.ledger.years));
          }
        })
        .catch(() => {});
      return;
    }

    // 4. If never cached and no years configured, show Skeleton UI Layout while fetching
    setEditFeeYears([]);
    setIsLoadingFeeStructure(true);

    try {
      const res = await fetch(`/api/finance/student-account/${studentId}`);
      const data = await res.json();
      if (res.ok && data?.ledger?.years && data.ledger.years.length > 0) {
        statementCacheRef.current[studentId] = data;
        try { sessionStorage.setItem(`statement_cache_${studentId}`, JSON.stringify(data)); } catch (e) {}
        setEditFeeYears(parseLedgerYearsToEditFeeYears(data.ledger.years));
      } else {
        const sCourseId = typeof target.selectedProgram === "object" ? target.selectedProgram?._id : (target.selectedProgram || target.selected_program);
        const courseObj = courses.find(c => (c._id || c.id) === sCourseId);
        const duration = Number(courseObj?.durationYears) || Number(courseObj?.duration) || Number(target.courseYear) || 4;
        const courseTuition = Number(courseObj?.tuitionFee) || Number(target.courseTuitionFee || target.course_tuition_fee) || 0;
        const perYearTuition = duration > 0 && courseTuition > 0 ? Math.round(courseTuition / duration) : 0;

        setEditFeeYears(
          Array.from({ length: duration }).map((_, idx) => ({
            year: idx + 1,
            discount: 0,
            discountReason: "",
            components: [{ category: "Tuition Fee", amount: perYearTuition, paid: 0, frequency: "Annual" }]
          }))
        );
      }
    } catch (e) {
      console.warn("Could not fetch fresh student-account data:", e);
    } finally {
      setIsLoadingFeeStructure(false);
    }
  };

  const handleEditFeeChange = (yearIndex: number, componentIndex: number, field: "amount" | "paid" | "category", value: string) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];

    if (field === "category") {
      comps[componentIndex] = { ...comps[componentIndex], [field]: value };
    } else {
      const numVal = Math.max(0, Number(value) || 0);
      comps[componentIndex] = { ...comps[componentIndex], [field]: numVal };
    }

    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleEditYearDiscount = (yearIndex: number, field: "discount" | "discountReason", value: string) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    if (field === "discount") {
      yearObj.discount = Math.max(0, Number(value) || 0);
    } else {
      yearObj.discountReason = value;
    }
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleAddFeeComponent = (yearIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];
    comps.push({ category: "Custom Charge", amount: 0, paid: 0, frequency: "Annual" });
    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleRemoveFeeComponent = (yearIndex: number, componentIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];
    comps.splice(componentIndex, 1);
    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleQuickMarkCategoryPaid = (yearIndex: number, componentIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];
    comps[componentIndex] = { ...comps[componentIndex], paid: comps[componentIndex].amount || 0 };
    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleQuickMarkYearPaid = (yearIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    yearObj.components = (yearObj.components || []).map((c: any) => ({ ...c, paid: c.amount || 0 }));
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleMarkAllAsPaid = () => {
    const updated = editFeeYears.map(yr => ({
      ...yr,
      components: (yr.components || []).map((c: any) => ({ ...c, paid: c.amount || 0 }))
    }));
    setEditFeeYears(updated);
  };

  const handleResetAllPaid = () => {
    const updated = editFeeYears.map(yr => ({
      ...yr,
      components: (yr.components || []).map((c: any) => ({ ...c, paid: 0 }))
    }));
    setEditFeeYears(updated);
  };

  const handleAddAcademicYear = () => {
    const nextYearNum = editFeeYears.length + 1;
    setEditFeeYears([
      ...editFeeYears,
      {
        year: nextYearNum,
        discount: 0,
        discountReason: "",
        components: [{ category: "Tuition Fee", amount: 0, paid: 0, frequency: "Annual" }]
      }
    ]);
  };

  const handleRemoveAcademicYear = (index: number) => {
    if (editFeeYears.length <= 1) return;
    const updated = editFeeYears.filter((_, i) => i !== index).map((y, idx) => ({ ...y, year: idx + 1 }));
    setEditFeeYears(updated);
  };

  const handleSaveStudentFeeStructure = async () => {
    if (!selectedStudentForFee) return;
    const studentId = selectedStudentForFee._id || selectedStudentForFee.id;

    setIsSavingFeeEdit(true);
    try {
      const formattedYears = editFeeYears.map(yr => ({
        year: yr.year,
        discount: Number(yr.discount) || 0,
        discountReason: yr.discountReason || "",
        components: (yr.components || []).map((c: any) => ({
          category: c.category || "",
          amount: Number(c.amount) || 0,
          paid: Number(c.paid) || 0,
          frequency: c.frequency || "Annual"
        }))
      }));

      const payload = {
        fees: {
          isConfigured: true,
          years: formattedYears
        }
      };

      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const updatedStudent = await res.json();
      if (res.ok && !updatedStudent.error) {
        showToast("Fee structure and paid amounts saved to database!");
        setIsAddFeeModalOpen(false);

        // Update local student roster instantly
        setStudents(prev => prev.map(s => ((s._id || s.id) === studentId ? { ...s, ...updatedStudent } : s)));

        // Bust statement cache
        delete statementCacheRef.current[studentId];
        try { sessionStorage.removeItem(`statement_cache_${studentId}`); } catch(e) {}

        // Invalidate and refresh background finance data
        fetchData(false, true);
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

  // Submit Payment
  const handleSubmitAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.studentId || !feeForm.amount) {
      alert("Please select a student and enter payment amount");
      return;
    }

    setIsSubmittingFee(true);
    try {
      const finalCategory = feeForm.category || "tuition";
      const selectedCatObj = categories.find(c => c.code === finalCategory);
      const catLabel = selectedCatObj?.name || feeForm.categoryName || "Tuition Fee";

      const payload = {
        ...feeForm,
        receiptNumber: feeForm.receiptNumber?.trim() || undefined,
        category: finalCategory,
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

        const paidAmount = Number(feeForm.amount) || 0;

        // 1. Instant Real-Time Student State Update
        if (data.student) {
          setStudents(prev => prev.map(s => ((s._id || s.id) === (data.student._id || data.student.id) ? { ...s, ...data.student } : s)));
        } else {
          setStudents(prev => prev.map(s => {
            if ((s._id || s.id) === feeForm.studentId) {
              const prevPaid = Number(s.paidFee || s.paid_fee) || 0;
              const total = Number(s.totalFee || s.total_fee) || 0;
              const newPaid = prevPaid + paidAmount;
              const balance = Math.max(0, total - newPaid);
              const status = balance === 0 ? "paid" : (newPaid > 0 ? "partial" : "unpaid");
              return {
                ...s,
                paidFee: newPaid,
                paid_fee: newPaid,
                feeBalance: balance,
                fee_balance: balance,
                feeStatus: status,
                fee_status: status
              };
            }
            return s;
          }));
        }

        // 2. Instant Real-Time Transaction Append
        if (data.transaction) {
          setTransactions(prev => [data.transaction, ...prev]);
        }

        // 3. Instant Real-Time Stat Increment
        setStats(prev => ({
          ...prev,
          totalCollected: (Number(prev.totalCollected) || 0) + paidAmount,
          totalDue: Math.max(0, (Number(prev.totalReceivable) || 0) - ((Number(prev.totalCollected) || 0) + paidAmount))
        }));

        // 4. Background re-fetch from PostgreSQL & update Redis
        fetchData(false, true);

        // Invalidate student statement cache so fresh data loads on next view
        if (feeForm.studentId) {
          delete statementCacheRef.current[feeForm.studentId];
          try { sessionStorage.removeItem(`statement_cache_${feeForm.studentId}`); } catch (e) {}
        }

        if (data.transaction) {
          const studentObj = selectedStudentForFee || students.find(s => (s._id || s.id) === feeForm.studentId);
          setSelectedReceiptForModal({
            type: "student",
            receiptType: "Student Fee Receipt",
            receiptNumber: data.receiptNumber || data.transaction.receiptNumber || feeForm.receiptNumber?.trim() || `RCP-STU-${Date.now()}`,
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

  // Delete Transaction
  const handleDeleteTransaction = async (txnId: string) => {
    if (!confirm("Are you sure you want to delete this receipt? This will reverse the payment from the student's balance.")) return;

    try {
      // Optimistic real-time removal
      setTransactions(prev => prev.filter(t => (t._id || t.id) !== txnId));

      const res = await fetch(`/api/finance/transactions/${txnId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Receipt deleted and fee reversed successfully!");
        fetchData(false, true);
        if (selectedStudentForStatement) {
          const sId = selectedStudentForStatement._id || selectedStudentForStatement.id;
          delete statementCacheRef.current[sId];
          try { sessionStorage.removeItem(`statement_cache_${sId}`); } catch (e) {}
          handleOpenStudentStatement(selectedStudentForStatement, true);
        }
      } else {
        alert(data.error || "Failed to delete receipt.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting receipt.");
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
        body: JSON.stringify(isEdit ? { id: editingCategory._id || editingCategory.id, ...categoryForm } : categoryForm)
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
        studentId: student._id || student.id,
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
          studentId: alertForm.studentId || alertTargetStudent?._id || alertTargetStudent?.id
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

  // Submit Payout
  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.payeeId || !payoutForm.amount) return;

    setIsSubmittingPayout(true);
    try {
      const staffMember = staffList.find(s => (s._id || s.id) === payoutForm.payeeId);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const receiptNo = `RCP-EMP-${dateStr}-${randomSuffix}`;
      const txnId = `TXN-EMP-${Date.now()}-${randomSuffix}`;

      const res = await fetch("/api/finance/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payoutForm,
          payeeName: `${staffMember?.firstName || ""} ${staffMember?.lastName || ""}`.trim() || "Staff Member",
          receiptNumber: receiptNo,
          transactionId: txnId,
          monthYear: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        })
      });

      if (res.ok) {
        const newPayout = await res.json();
        showToast("Staff payout voucher generated successfully!");
        setIsPayoutModalOpen(false);
        if (newPayout && (newPayout._id || newPayout.id)) {
          setPayouts(prev => [newPayout, ...prev]);
        }
        fetchData(false, true);

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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">

      {/* Universal Receipt Modal */}
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
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold shadow-2xl flex items-center gap-2.5 text-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR (CLEAN SLIM TABS + ACTION BUTTONS)                     */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1650px] mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3">

            {/* Horizontal Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {tabList.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isActive
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">


              <button
                onClick={() => fetchData(false, true)}
                title="Bust & Re-query from Database"
                className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => handleOpenAddFeeModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#00875A] hover:bg-[#00704A] text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Collect Fee
              </button>

              <button
                onClick={() => {
                  setReceiptFilterType("all");
                  setActiveTab("receipts");
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1650px] mx-auto px-6 lg:px-8 mt-5 space-y-5">

        {/* ========================================================================= */}
        {/* 4 SLEEK MODERN CARDS (LOW COLOR, SLIM DESIGN WITH MICRO BARS)            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Fees to Collect */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Fees to Collect
                </span>
                <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                  {formatCurrency(institutionalMetrics.totalReceivable)}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {students.length} students
                </span>
              </div>
            </div>
            <MicroBarChart color="blue" />
          </div>

          {/* Card 2: Collected So Far */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Collected So Far
                </span>
                <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                  {formatCurrency(institutionalMetrics.totalCollected)}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  This academic year
                </span>
              </div>
            </div>
            <MicroBarChart color="emerald" />
          </div>

          {/* Card 3: Still to Pay (Dues) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Still to Pay
                </span>
                <div className="text-xl font-black text-rose-600 font-mono tracking-tight mt-0.5">
                  {formatCurrency(institutionalMetrics.totalOS)}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {institutionalMetrics.defaultersCount} students have dues
                </span>
              </div>
            </div>
            <MicroBarChart color="rose" />
          </div>

          {/* Card 4: Fee Items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Fee Items
                </span>
                <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                  {categories.length}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Books, uniform, blazer, fines
                </span>
              </div>
            </div>
            <MicroBarChart color="purple" />
          </div>

        </div>

        {/* LOADING STATE VIA SKELETON ANIMATION */}
        {isLoading ? (
          <FinanceSkeleton />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* SECTION 1: STUDENT FEES (EXACT MATCH TO ATTACHED SCREENSHOT)             */}
            {/* ========================================================================= */}
            {activeTab === "student_accounts" && (
              <div className="space-y-4">

                {/* Search & Filter Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3">

                  {/* Search Input Box */}
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by student name or roll number..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button
                      onClick={() => setOsFilter("all")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${osFilter === "all"
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                        }`}
                    >
                      Everyone
                    </button>

                    <button
                      onClick={() => setOsFilter("os_due")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${osFilter === "os_due"
                        ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>Has Due</span>
                    </button>

                    <button
                      onClick={() => setOsFilter("cleared")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${osFilter === "cleared"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Paid</span>
                    </button>

                    {/* Course Filter Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="appearance-none pl-8 pr-8 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer shadow-xs"
                      >
                        <option value="all">All courses</option>
                        {courses.map(c => (
                          <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                        ))}
                      </select>
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Helper Information Banner with Pagination */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Info className="w-6 h-6 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        Choose a student to see payments or collect a fee.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        View fee details, payment history, receipts and more.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-blue-200/80 rounded-xl text-xs text-slate-600 font-semibold shadow-2xs">
                      <span>Total</span>
                      <strong className="text-slate-900 font-black">{filteredStudents.length} students</strong>
                      <span className="text-slate-300">•</span>
                      <span className="text-blue-600 font-bold">Showing {visibleStudents.length} loaded</span>
                    </span>
                  </div>
                </div>

                {/* Modern Slim Student Roster Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">

                  {/* Table Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-12 sm:col-span-4 lg:col-span-3">STUDENT</div>
                    <div className="hidden sm:block sm:col-span-2 lg:col-span-2">STATUS</div>
                    <div className="hidden sm:block sm:col-span-3 lg:col-span-3">FEE DETAILS</div>
                    <div className="col-span-12 sm:col-span-3 lg:col-span-4 text-left sm:text-right">ACTIONS</div>
                  </div>

                  {/* Student Rows */}
                  <div className="divide-y divide-slate-100">
                    {visibleStudents.length > 0 ? (
                      <>
                        {visibleStudents.map((s: any) => {
                          const summary = getStudentFeeSummary(s);
                          const isPartlyPaid = summary.paid > 0 && summary.balance > 0;
                          const isCleared = summary.balance === 0 && summary.total > 0;
                          const isNotPaid = summary.paid === 0;

                          const fName = s.firstName || s.first_name || "";
                          const lName = s.lastName || s.last_name || "";
                          const fullName = (s.name || `${fName} ${lName}`).trim() || "Student";
                          const fatherName = (s.fatherName || s.father_name || s.documents?.fatherName || "").trim();
                          const roll = s.enrollmentNumber || s.enrollment_number || s.admissionNumber || s.admission_number || s.studentId || s.student_id || "N/A";
                          const courseCode = summary.courseObj?.code || s.courseCode || s.course_code || "COURSE";
                          const sem = s.selectedSemester || s.selected_semester || s.courseYear || s.course_year || 1;
                          const avatarColor = getAvatarColor(fullName);

                          return (
                            <div
                              key={s._id || s.id}
                              className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors"
                            >
                              {/* Column 1: Student Details */}
                              <div className="col-span-12 sm:col-span-4 lg:col-span-3 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 uppercase ${avatarColor}`}>
                                  {fullName[0] || "S"}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight truncate">
                                    {fullName}
                                  </h4>
                                  {fatherName && (
                                    <p className="text-[11px] text-slate-600 font-semibold truncate mt-0.5">
                                      <span className="text-slate-400 font-normal">S/O:</span> {fatherName}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                    Roll: {roll} • {courseCode} • Sem {sem}
                                  </p>
                                </div>
                              </div>

                              {/* Column 2: Status Badge */}
                              <div className="col-span-6 sm:col-span-2 lg:col-span-2">
                                {isCleared && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[11px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Paid</span>
                                  </span>
                                )}
                                {isPartlyPaid && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-[11px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <span>Partly paid</span>
                                  </span>
                                )}
                                {isNotPaid && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full text-[11px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>Not paid</span>
                                  </span>
                                )}
                              </div>

                              {/* Column 3: Fee Details (Total, Paid, Left to Pay) */}
                              <div className="col-span-6 sm:col-span-3 lg:col-span-3 flex items-center gap-6">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block">Total Fee</span>
                                  <span className="text-xs font-bold font-mono text-slate-900">
                                    {formatCurrency(summary.total)}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block">Paid</span>
                                  <span className="text-xs font-bold font-mono text-emerald-600">
                                    {formatCurrency(summary.paid)}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-400 font-medium block">Left to Pay</span>
                                  <span className={`text-xs font-bold font-mono ${summary.balance > 0 ? "text-rose-600 font-black" : "text-emerald-600"}`}>
                                    {formatCurrency(summary.balance)}
                                  </span>
                                </div>
                              </div>

                              {/* Column 4: Actions (3 Slim Modern Buttons) */}
                              <div className="col-span-12 sm:col-span-3 lg:col-span-4 flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                                <button
                                  onClick={() => handleOpenAddFeeModal(s)}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-[#00875A] hover:bg-[#00704A] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <span>₹</span> Collect fee
                                </button>

                                <button
                                  onClick={() => handleOpenStudentStatement(s)}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View statement</span>
                                </button>

                                <button
                                  onClick={() => router.push(`/dashboard/students/${s._id || s.id}?from=finance`)}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View profile</span>
                                </button>
                              </div>

                            </div>
                          );
                        })}

                        {/* Infinite Scroll Lazy Loading Sentinel */}
                        {visibleCount < filteredStudents.length ? (
                          <div
                            ref={scrollSentinelRef}
                            className="p-5 flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold bg-slate-50/50 border-t border-slate-100"
                          >
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span>Loading more students on scroll ({visibleStudents.length} of {filteredStudents.length})...</span>
                          </div>
                        ) : filteredStudents.length > 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 font-medium bg-slate-50/20 border-t border-slate-100">
                            All {filteredStudents.length} students loaded
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="p-16 text-center">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">No students match your search</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Try clearing your filters or search keywords.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 2: PAYMENT HISTORY                                                */}
            {/* ========================================================================= */}
            {activeTab === "fee_records" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search payment records by student or receipt number..."
                      value={recordSearch}
                      onChange={e => setRecordSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={recordCategoryFilter}
                      onChange={e => setRecordCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Fee Categories</option>
                      {categories.map(c => (
                        <option key={c._id || c.id} value={c.code}>{c.name}</option>
                      ))}
                    </select>

                    <select
                      value={recordYearFilter}
                      onChange={e => setRecordYearFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Years</option>
                      {[1, 2, 3, 4, 5].map(y => (
                        <option key={y} value={`Year ${y}`}>Year {y}</option>
                      ))}
                    </select>

                    <select
                      value={recordSemesterFilter}
                      onChange={e => setRecordSemesterFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={String(s)}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-black text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Receipt ID</th>
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Method</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((t: any) => {
                            const student = t.studentId || {};
                            return (
                              <tr key={t._id || t.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-blue-600">
                                  {t.receiptNumber || t.transactionId || "RCP-N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  <p className="font-bold text-slate-900">{student.firstName} {student.lastName}</p>
                                  <p className="text-[10px] text-slate-400">{student.enrollmentNumber || student.admissionNumber || "N/A"}</p>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700">
                                    {t.categoryName || t.category?.toUpperCase() || "TUITION"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                                  {formatCurrency(t.amount)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
                                    {t.paymentMethod || "Cash"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-400 font-mono">
                                  {new Date(t.paymentDate || t.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setSelectedReceiptForModal({
                                          type: "student",
                                          receiptType: "Student Fee Receipt",
                                          receiptNumber: t.receiptNumber || `RCP-STU-${t.id?.slice(-8)}`,
                                          transactionId: t.transactionId,
                                          date: t.paymentDate,
                                          name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
                                          idNumber: student.enrollmentNumber || student.admissionNumber || "N/A",
                                          program: t.courseId?.name || "Program",
                                          semester: t.semester || 1,
                                          academicYear: t.academicYear || "Year 1",
                                          category: t.category,
                                          categoryName: t.categoryName,
                                          amount: Number(t.amount),
                                          paymentMethod: t.paymentMethod,
                                          collectedBy: t.collectedBy || "Accounts Office",
                                          notes: t.notes,
                                          items: [{ description: `${t.categoryName || "Fee"}`, amount: Number(t.amount) }]
                                        });
                                        setIsReceiptModalOpen(true);
                                      }}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                      title="Print Receipt"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteTransaction(t._id || t.id)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                      title="Reverse / Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              No payment records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 3: FEE SETUP & CATEGORIES                                         */}
            {/* ========================================================================= */}
            {activeTab === "categories" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Fee Categories & Default Rates</h3>
                    <p className="text-xs text-slate-400">Configure standard charges for tuition, uniforms, books, and fines</p>
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
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Fee Item
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {categories.map((c: any) => (
                    <div key={c._id || c.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {c.type || "General"}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">{c.frequency || "One-Time"}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.description || "Institutional standard item rate"}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Standard Rate</p>
                          <p className="text-base font-bold font-mono text-slate-900">{formatCurrency(c.defaultAmount)}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCategoryForm({
                              name: c.name,
                              code: c.code,
                              type: c.type || "Kit/Uniform",
                              defaultAmount: String(c.defaultAmount || 0),
                              frequency: c.frequency || "One-Time",
                              isMandatory: Boolean(c.isMandatory),
                              description: c.description || ""
                            });
                            setIsCategoryModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 4: PRINTABLE RECEIPTS HUB                                         */}
            {/* ========================================================================= */}
            {activeTab === "receipts" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search receipts by receipt ID, payee, or roll number..."
                      value={receiptSearchQuery}
                      onChange={e => setReceiptSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setReceiptFilterType("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${receiptFilterType === "all" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      All Receipts ({combinedReceipts.length})
                    </button>
                    <button
                      onClick={() => setReceiptFilterType("student")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${receiptFilterType === "student" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      Student Fees
                    </button>
                    <button
                      onClick={() => setReceiptFilterType("employee")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${receiptFilterType === "employee" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      Staff Payments
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-black text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Receipt / Voucher</th>
                          <th className="py-3 px-4">Beneficiary</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Print Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {combinedReceipts.length > 0 ? (
                          combinedReceipts.map((r: any) => (
                            <tr key={r.id || r._id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-blue-600">
                                {r.receiptNumber}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900">{r.name}</p>
                                <p className="text-[10px] text-slate-400">ID: {r.idNumber}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${r.type === "student" ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-700"
                                  }`}>
                                  {r.receiptType}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                {formatCurrency(r.amount)}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono">
                                {new Date(r.date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedReceiptForModal(r);
                                    setIsReceiptModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-500" /> Print
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              No receipts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 5: DUE REMINDERS                                                  */}
            {/* ========================================================================= */}
            {activeTab === "alerts" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Students with Pending Dues</h4>
                      <p className="text-xs text-slate-400">Send reminder notice directly to students</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {alertsData.defaulters.length > 0 ? (
                      alertsData.defaulters.map((d: any, idx: number) => (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {d.name?.[0] || "S"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{d.name}</p>
                              <p className="text-[11px] text-slate-400">
                                Roll: {d.enrollmentNumber} • Program: {d.course}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">Pending Amount</p>
                              <p className="text-sm font-bold font-mono text-rose-600">{formatCurrency(d.outstandingAmount)}</p>
                            </div>

                            <button
                              onClick={() => {
                                const matchedStudent = students.find(s => (s._id || s.id) === d.studentId);
                                handleOpenAlertModal(matchedStudent || {
                                  _id: d.studentId,
                                  firstName: d.name,
                                  enrollmentNumber: d.enrollmentNumber
                                });
                              }}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Bell className="w-3.5 h-3.5" /> Send Notice
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-slate-400 text-xs">
                        All student fees are fully cleared. No pending dues!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 6: STAFF PAYMENTS                                                 */}
            {/* ========================================================================= */}
            {activeTab === "payouts" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Staff Payouts & Expense Records</h3>
                    <p className="text-xs text-slate-400">Record staff compensation and salary vouchers</p>
                  </div>
                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Issue Payout
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-black text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Voucher No</th>
                          <th className="py-3 px-4">Staff Member</th>
                          <th className="py-3 px-4">Designation</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {payouts.length > 0 ? (
                          payouts.map((p: any) => (
                            <tr key={p._id || p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.receiptNumber || p.transactionId}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{p.payeeName}</td>
                              <td className="py-3 px-4 text-slate-500">{p.designation}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold">
                                  {p.payoutType}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                              <td className="py-3 px-4 text-slate-400 font-mono">
                                {new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              No staff payout records yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 7: COURSES & RATES                                                */}
            {/* ========================================================================= */}
            {activeTab === "branch_course" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Academic Course Tuition Setup</h3>
                    <p className="text-xs text-slate-400">Default tuition fees configured per program</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {courses.map((c: any) => (
                    <div key={c._id || c.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                          {c.code || "COURSE"}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mb-0.5">{c.name}</h4>
                        <p className="text-xs text-slate-400 font-medium mb-3">Duration: {c.duration || 4} Years</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">Tuition Fee</p>
                          <p className="text-base font-bold font-mono text-blue-600">{formatCurrency(c.tuitionFee)}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingCourse(c);
                            setCourseFeeForm({
                              tuitionFee: String(c.tuitionFee || 0),
                              semesterFee: "",
                              applyToStudents: true
                            });
                            setIsCourseFeeModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: STUDENT STATEMENT & FINANCIAL LEDGER MODAL                       */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SLIDE-OVER SIDEBAR: STUDENT STATEMENT & FINANCIAL LEDGER (SLIDES FROM RIGHT)*/}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isStatementModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsStatementModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-over panel container */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col pointer-events-auto border-l border-slate-200/80 h-full"
              >
                {/* 1. Header (Sticky Top) */}
                <div className="p-5 sm:p-6 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-[11px] font-bold uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Student Financial Statement</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsStatementModalOpen(false);
                          handleOpenAddFeeModal(selectedStudentForStatement);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00875A] hover:bg-[#00704A] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Collect Fee</span>
                      </button>

                      <button
                        onClick={() => setIsStatementModalOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                        title="Close sidebar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Student Identity Card */}
                  {(() => {
                    const stu = studentStatementData?.student || selectedStudentForStatement || {};
                    const fName = stu.firstName || stu.first_name || "";
                    const lName = stu.lastName || stu.last_name || "";
                    const fullName = (stu.name || `${fName} ${lName}`).trim() || "Student";
                    const roll = stu.enrollmentNumber || stu.enrollment_number || stu.admissionNumber || stu.admission_number || stu.studentId || stu.student_id || "N/A";
                    const fatherName = (stu.fatherName || stu.father_name || stu.documents?.fatherName || "").trim();
                    const courseName = stu.selectedProgram?.name || stu.courseName || stu.course_name || stu.courseCode || "Course";
                    const courseCode = stu.selectedProgram?.code || stu.courseCode || stu.course_code || "";
                    const branchName = stu.selectedBranch?.name || stu.branchName || "";
                    const sem = stu.selectedSemester || stu.selected_semester || stu.courseYear || 1;
                    const avatarColor = getAvatarColor(fullName);

                    const summary = studentStatementData?.summary || {};
                    const isCleared = (summary.totalOutstanding === 0 && summary.totalAssessed > 0) || summary.status === "Paid" || summary.status === "Cleared";
                    const isPartial = summary.totalPaid > 0 && summary.totalOutstanding > 0;
                    const isUnpaid = summary.totalPaid === 0;

                    return (
                      <div className="flex items-center gap-3.5 pt-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 uppercase shadow-2xs ${avatarColor}`}>
                          {fullName[0] || "S"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900 text-base uppercase tracking-tight truncate">
                              {fullName}
                            </h3>
                            {isCleared && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Paid & Cleared</span>
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Partially Paid</span>
                              </span>
                            )}
                            {isUnpaid && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>Not Paid</span>
                              </span>
                            )}
                          </div>
                          {fatherName && (
                            <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                              <span className="text-slate-400 font-normal">S/O:</span> {fatherName}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                            Roll: <strong className="text-slate-700 font-mono">{roll}</strong> • {courseName} {courseCode ? `(${courseCode})` : ""} • Sem {sem}
                            {branchName ? ` • ${branchName}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Scrollable Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                  {isLoadingStatement ? (
                    <div className="space-y-6 animate-pulse">
                      {/* Skeleton Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200/60 space-y-2">
                            <div className="h-2.5 w-16 bg-slate-200 rounded-md" />
                            <div className="h-6 w-24 bg-slate-200 rounded-lg" />
                          </div>
                        ))}
                      </div>

                      {/* Skeleton Section Header */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-200 rounded" />
                          <div className="h-3.5 w-44 bg-slate-200 rounded-md" />
                        </div>
                        <div className="h-5 w-20 bg-slate-100 rounded-full" />
                      </div>

                      {/* Skeleton Transaction Cards */}
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="h-3.5 w-28 bg-slate-200 rounded" />
                                  <div className="h-4 w-16 bg-slate-200/80 rounded-md" />
                                  <div className="h-4 w-12 bg-slate-100 rounded" />
                                </div>
                                <div className="h-3 w-48 bg-slate-100 rounded" />
                              </div>
                              <div className="space-y-1.5 text-right">
                                <div className="h-5 w-24 bg-slate-200 rounded-lg ml-auto" />
                                <div className="h-2.5 w-16 bg-slate-100 rounded ml-auto" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="h-3 w-20 bg-slate-100 rounded" />
                              <div className="flex gap-2">
                                <div className="h-6 w-24 bg-slate-200/80 rounded-lg" />
                                <div className="h-6 w-6 bg-slate-100 rounded-lg" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : studentStatementData ? (
                    <>
                      {/* Financial Metrics Summary Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Assessed</span>
                          <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                            {formatCurrency(studentStatementData.summary?.totalGross || studentStatementData.summary?.totalAssessed || 0)}
                          </p>
                        </div>

                        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Paid</span>
                          <p className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                            {formatCurrency(studentStatementData.summary?.totalPaid || 0)}
                          </p>
                        </div>

                        <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100">
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Left to Pay</span>
                          <p className={`text-base font-bold font-mono mt-0.5 ${(studentStatementData.summary?.totalOutstanding || 0) > 0 ? "text-rose-700 font-black" : "text-emerald-700"}`}>
                            {formatCurrency(studentStatementData.summary?.totalOutstanding || 0)}
                          </p>
                        </div>

                        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Concession</span>
                          <p className="text-base font-bold font-mono text-blue-700 mt-0.5">
                            {studentStatementData.summary?.totalDiscount > 0 ? `- ${formatCurrency(studentStatementData.summary?.totalDiscount)}` : "₹0"}
                          </p>
                        </div>
                      </div>

                      {/* Payment Transactions & Categories What Student Paid For */}
                      {(() => {
                        const txns = studentStatementData.transactions || [];

                        return (
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                  Payment Transactions & Categories
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                                {txns.length} payment record{txns.length === 1 ? "" : "s"}
                              </span>
                            </div>

                                <div className="space-y-2.5">
                                  {txns.length > 0 ? (
                                    txns.map((t: any) => {
                                      const catName = t.categoryName || t.category || "Tuition Fee";
                                      const pDate = new Date(t.paymentDate || t.createdAt).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric"
                                      });

                                      return (
                                        <div
                                          key={t.id || t._id}
                                          className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all"
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono font-bold text-xs text-blue-600">
                                                  {t.receiptNumber || t.transactionId}
                                                </span>
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-200/60">
                                                  {catName}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                                                  {t.paymentMethod || "Cash"}
                                                </span>
                                              </div>

                                              <p className="text-[11px] text-slate-500 font-medium mt-1">
                                                Paid for: <strong className="text-slate-800">{catName}</strong>
                                                {t.semester ? ` • Semester ${t.semester}` : ""}
                                                {t.academicYear ? ` • ${t.academicYear}` : ""}
                                              </p>

                                              {t.notes && (
                                                <p className="text-[10px] text-slate-400 italic mt-0.5">
                                                  Note: {t.notes}
                                                </p>
                                              )}
                                            </div>

                                            <div className="text-right shrink-0">
                                              <span className="font-mono font-black text-sm text-emerald-600 block">
                                                + {formatCurrency(t.amount)}
                                              </span>
                                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                {pDate}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Row Actions: Print Receipt & Delete / Reverse */}
                                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-xs">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                              Status: <strong className="text-emerald-600">Confirmed</strong>
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                              <button
                                                onClick={() => {
                                                  const stu = studentStatementData?.student || selectedStudentForStatement;
                                                  setSelectedReceiptForModal({
                                                    type: "student",
                                                    receiptType: "Student Fee Receipt",
                                                    receiptNumber: t.receiptNumber || t.transactionId || `RCP-${Date.now()}`,
                                                    transactionId: t.transactionId,
                                                    date: t.paymentDate || t.createdAt,
                                                    name: `${stu?.firstName || ""} ${stu?.lastName || ""}`.trim() || "Student",
                                                    idNumber: stu?.enrollmentNumber || stu?.admissionNumber || stu?.studentId || "N/A",
                                                    program: stu?.selectedProgram?.name || stu?.courseName || "Course",
                                                    semester: t.semester,
                                                    academicYear: t.academicYear || `Year ${stu?.courseYear || 1}`,
                                                    category: t.category,
                                                    categoryName: catName,
                                                    amount: t.amount,
                                                    paymentMethod: t.paymentMethod || "Cash",
                                                    disbursedBy: "Accounts Department",
                                                    notes: t.notes || "",
                                                    items: [
                                                      {
                                                        description: `${catName} (${t.academicYear || `Sem ${t.semester || 1}`})`,
                                                        amount: t.amount
                                                      }
                                                    ]
                                                  });
                                                  setIsReceiptModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px] border border-slate-200/80 cursor-pointer transition-colors shadow-2xs"
                                              >
                                                <Printer className="w-3 h-3 text-slate-500" />
                                                <span>Print Receipt</span>
                                              </button>

                                              <button
                                                onClick={() => handleDeleteTransaction(t.id || t._id)}
                                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                                                title="Delete receipt & reverse payment"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2">
                                      <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                                      <p className="text-xs font-bold text-slate-600">No payment transactions recorded yet.</p>
                                      <p className="text-[11px] text-slate-400">
                                        Once a fee payment is collected, the receipt and transaction category will appear here.
                                      </p>
                                      <button
                                        onClick={() => {
                                          setIsStatementModalOpen(false);
                                          handleOpenAddFeeModal(selectedStudentForStatement);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00875A] text-white font-bold rounded-xl text-xs hover:bg-[#00704A] cursor-pointer mt-2 shadow-2xs"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Collect First Payment
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                  ) : null}
                </div>

                {/* 3. Footer (Sticky Bottom) */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 shrink-0 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Balance Left</span>
                    <span className={`text-base font-bold font-mono ${(studentStatementData?.summary?.totalOutstanding || 0) > 0 ? "text-rose-600 font-black" : "text-emerald-600"}`}>
                      {formatCurrency(studentStatementData?.summary?.totalOutstanding || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsStatementModalOpen(false)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsStatementModalOpen(false);
                        handleOpenAddFeeModal(selectedStudentForStatement);
                      }}
                      className="px-4 py-2 bg-[#00875A] hover:bg-[#00704A] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <span>₹</span> Collect Fee
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: COLLECT STUDENT FEE & EDIT FEE STRUCTURE POPUP                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddFeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsAddFeeModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[94vh] flex flex-col"
            >
              {(() => {
                const activeStudent = selectedStudentForFee || students.find(s => (s._id || s.id) === feeForm.studentId);
                const fName = activeStudent?.firstName || activeStudent?.first_name || "";
                const lName = activeStudent?.lastName || activeStudent?.last_name || "";
                const fullName = (activeStudent?.name || `${fName} ${lName}`).trim() || "Student";
                const rollNo = activeStudent?.enrollmentNumber || activeStudent?.admissionNumber || activeStudent?.studentId || "N/A";

                // Course and Branch details
                const sCourseId = typeof activeStudent?.selectedProgram === "object" ? activeStudent?.selectedProgram?._id : (activeStudent?.selectedProgram || activeStudent?.selected_program);
                const courseObj = courses.find(c => (c._id || c.id) === sCourseId);
                const courseName = courseObj?.name || activeStudent?.courseName || activeStudent?.selectedProgram?.name || "Standard Course";
                const branchName = activeStudent?.selectedBranch?.name || activeStudent?.branchName || "";

                // Financial Stats for selected student
                const grossTotal = editFeeYears.length > 0 
                  ? editModalTotals.grossTotal 
                  : (Number(activeStudent?.totalFee || activeStudent?.total_fee) || 0);
                const totalDiscount = editFeeYears.length > 0 
                  ? editModalTotals.totalDiscount 
                  : 0;
                const netTotal = editFeeYears.length > 0 
                  ? editModalTotals.total 
                  : Math.max(0, grossTotal - totalDiscount);
                const paidTotal = editFeeYears.length > 0 
                  ? editModalTotals.paid 
                  : (Number(activeStudent?.paidFee || activeStudent?.paid_fee) || 0);
                const dueTotal = editFeeYears.length > 0 
                  ? editModalTotals.balance 
                  : (Number(activeStudent?.feeBalance || activeStudent?.fee_balance) || Math.max(0, netTotal - paidTotal));
                const pct = netTotal > 0 ? Math.min(100, Math.round((paidTotal / netTotal) * 100)) : 0;

                // Stats for selected year in feeForm
                const selectedYrObj = editFeeYears.find(y => y.year === feeForm.year);
                let currentYrGross = 0;
                let currentYrPaid = 0;
                if (selectedYrObj) {
                  (selectedYrObj.components || []).forEach((c: any) => {
                    currentYrGross += Number(c.amount) || 0;
                    currentYrPaid += Number(c.paid) || 0;
                  });
                }
                const currentYrDisc = Number(selectedYrObj?.discount) || 0;
                const currentYrDue = Math.max(0, currentYrGross - currentYrDisc - currentYrPaid);

                // Course feeStructureTemplate components for this year (from create course page)
                const templateYear = courseObj?.feeStructureTemplate?.find((y: any) => y.year === feeForm.year);
                const templateComps = templateYear?.components || [];

                // Track components directly configured on this course in database with added prices
                const courseConfiguredComps = templateComps.map((tc: any) => {
                  const code = (tc.category || "").toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const ledgerComp = (selectedYrObj?.components || []).find((sc: any) => 
                    (sc.category || "").toLowerCase().replace(/[^a-z0-9]/g, '_') === code ||
                    sc.category?.toLowerCase() === tc.category?.toLowerCase()
                  );
                  const tot = ledgerComp ? Number(ledgerComp.amount) || 0 : Number(tc.amount) || 0;
                  const pd = ledgerComp ? Number(ledgerComp.paid) || 0 : 0;
                  const due = Math.max(0, tot - pd);
                  return {
                    name: tc.category,
                    code,
                    rate: Number(tc.amount) || 0,
                    total: tot,
                    paid: pd,
                    due,
                    frequency: tc.frequency || "Annual"
                  };
                });

                // Build rich categories map incorporating create course categories, DB categories, course template, and student ledger
                const catMap = new Map<string, { name: string; code: string; defaultAmount: number; type: string; due?: number }>();

                // 1. Base categories from course creation system
                COURSE_CREATION_CATEGORIES.forEach(c => {
                  catMap.set(c.code.toLowerCase(), {
                    name: c.name,
                    code: c.code,
                    defaultAmount: c.defaultAmount,
                    type: c.type
                  });
                });

                // 2. Database fee categories if registered
                categories.forEach(c => {
                  const code = (c.code || c.name || "").toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const prev = catMap.get(code);
                  catMap.set(code, {
                    name: c.name || prev?.name || code,
                    code: code,
                    defaultAmount: Number(c.defaultAmount || c.default_amount) || prev?.defaultAmount || 0,
                    type: c.type || prev?.type || "Other"
                  });
                });

                // 3. Course template components for this year (applies exact course-defined pricing)
                templateComps.forEach((tc: any) => {
                  const code = (tc.category || "").toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const prev = catMap.get(code);
                  catMap.set(code, {
                    name: tc.category || prev?.name || code,
                    code: code,
                    defaultAmount: Number(tc.amount) || prev?.defaultAmount || 0,
                    type: prev?.type || "Academic"
                  });
                });

                // 4. Student ledger components for selected year (attaches outstanding component balance)
                (selectedYrObj?.components || []).forEach((sc: any) => {
                  const code = (sc.category || "").toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const tot = Number(sc.amount) || 0;
                  const pd = Number(sc.paid) || 0;
                  const compDue = Math.max(0, tot - pd);
                  const existing = catMap.get(code);
                  if (existing) {
                    existing.due = compDue;
                    if (compDue > 0 && (!existing.defaultAmount || existing.defaultAmount === 0)) {
                      existing.defaultAmount = compDue;
                    }
                  } else {
                    catMap.set(code, {
                      name: sc.category,
                      code,
                      defaultAmount: tot,
                      due: compDue,
                      type: "Academic"
                    });
                  }
                });

                const allAvailableCategories = Array.from(catMap.values());
                const currentSelectedCat = allAvailableCategories.find(c => 
                  c.code === feeForm.category || 
                  c.name.toLowerCase() === (feeForm.categoryName || "").toLowerCase()
                );

                return (
                  <>
                    {/* Header with Student Identity & Quick Summary */}
                    <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">Collect Student Fee & Payment</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Official Counter
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="text-slate-800 font-extrabold">{fullName}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-bold">{courseName}</span>
                            {branchName && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500">{branchName}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-slate-400 font-mono">Roll: {rollNo}</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsAddFeeModalOpen(false)}
                        className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer shadow-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* All Student Stats Summary Deck */}
                    <div className="px-8 py-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-b border-slate-200/80">
                      {isLoadingFeeStructure && editFeeYears.length === 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-14 bg-slate-200/60 rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Gross Total */}
                            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Gross Assessed Fee
                              </span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base font-black text-slate-800">{formatCurrency(grossTotal)}</span>
                                {totalDiscount > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-700">(-{formatCurrency(totalDiscount)})</span>
                                )}
                              </div>
                            </div>

                            {/* Net Payable */}
                            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Net Total Fee
                              </span>
                              <span className="text-base font-black text-slate-900 mt-0.5 block">{formatCurrency(netTotal)}</span>
                            </div>

                            {/* Total Paid */}
                            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 shadow-2xs">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                                Total Paid Amount
                              </span>
                              <span className="text-base font-black text-emerald-700 mt-0.5 block">
                                {formatCurrency(paidTotal)}
                              </span>
                            </div>

                            {/* Total Due */}
                            <div className={`p-3 rounded-2xl border shadow-2xs ${dueTotal > 0 ? 'bg-amber-50/70 border-amber-200/80' : 'bg-emerald-50/70 border-emerald-200/80'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${dueTotal > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                  Total Due / Balance
                                </span>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${dueTotal > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {dueTotal > 0 ? 'Pending' : 'Cleared ✓'}
                                </span>
                              </div>
                              <span className={`text-base font-black mt-0.5 block ${dueTotal > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                                {formatCurrency(dueTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="flex items-center gap-3 pt-0.5">
                            <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden flex">
                              <div 
                                style={{ width: `${Math.max(4, pct)}%` }} 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" 
                              />
                            </div>
                            <span className="text-[11px] font-black text-emerald-700 whitespace-nowrap">
                              {pct}% Paid ({formatCurrency(paidTotal)} / {formatCurrency(netTotal)})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Student Selector if opened globally without pre-selection */}
                    {!selectedStudentForFee && (
                      <div className="px-8 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Select Student:</span>
                        <select
                          className="bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex-1 outline-none"
                          onChange={e => {
                            const found = students.find(s => (s._id || s.id) === e.target.value);
                            if (found) handleOpenAddFeeModal(found);
                          }}
                        >
                          <option value="">-- Choose Student Account --</option>
                          {students.map(s => (
                            <option key={s._id || s.id} value={s._id || s.id}>
                              {s.firstName} {s.lastName} (Roll: {s.enrollmentNumber || s.admissionNumber || s.studentId || "N/A"}) — Due: ₹{(Number(s.feeBalance || s.fee_balance) || 0).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Modal Tab Switcher: [Record Payment] vs [Fee Structure & Ledger] */}
                    <div className="flex border-b border-slate-200 bg-slate-50/90 px-8 pt-2">
                      <button
                        type="button"
                        onClick={() => setCollectFeeModalTab("pay")}
                        className={`px-5 py-2.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                          collectFeeModalTab === "pay"
                            ? "border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        Record Payment (Collect Fee)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollectFeeModalTab("structure")}
                        className={`px-5 py-2.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                          collectFeeModalTab === "structure"
                            ? "border-indigo-600 text-indigo-800 bg-white rounded-t-xl shadow-2xs"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Settings className="w-4 h-4 text-indigo-600" />
                        Fee Structure & Components
                      </button>
                    </div>

                    {/* TAB 1: RECORD PAYMENT (PAY FEE) */}
                    {collectFeeModalTab === "pay" ? (
                      <form onSubmit={handleSubmitAddFee} className="p-8 space-y-5 overflow-y-auto flex-1">
                        {/* Year & Category Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1 block mb-1">
                              Academic Year
                            </label>
                            <select
                              value={feeForm.year}
                              onChange={e => {
                                const yr = Number(e.target.value);
                                setFeeForm(prev => ({
                                  ...prev,
                                  year: yr,
                                  semester: (yr * 2) - 1
                                }));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                              {editFeeYears.length > 0 ? (
                                editFeeYears.map(y => {
                                  let yG = 0; let yP = 0;
                                  (y.components || []).forEach((c: any) => { yG += Number(c.amount) || 0; yP += Number(c.paid) || 0; });
                                  const yD = Math.max(0, yG - (Number(y.discount) || 0) - yP);
                                  return (
                                    <option key={y.year} value={y.year}>
                                      Year {y.year} {yD > 0 ? `(Pending Due: ₹${yD.toLocaleString('en-IN')})` : '(Cleared ✓)'}
                                    </option>
                                  );
                                })
                              ) : (
                                [1, 2, 3, 4, 5].map(y => (
                                  <option key={y} value={y}>Year {y}</option>
                                ))
                              )}
                            </select>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                Fee Category (From Course Structure)
                              </label>
                              {currentSelectedCat?.defaultAmount ? (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                  Rate: ₹{currentSelectedCat.defaultAmount.toLocaleString('en-IN')}
                                </span>
                              ) : null}
                            </div>
                            <select
                              value={feeForm.category}
                              onChange={e => {
                                const code = e.target.value;
                                const matched = allAvailableCategories.find(c => c.code === code);
                                const catName = matched?.name || code;
                                let autoAmt = feeForm.amount;
                                if (matched?.due && matched.due > 0) {
                                  autoAmt = String(matched.due);
                                } else if (matched?.defaultAmount && matched.defaultAmount > 0) {
                                  autoAmt = String(matched.defaultAmount);
                                }
                                setFeeForm(prev => ({
                                  ...prev,
                                  category: code,
                                  categoryName: catName,
                                  amount: autoAmt
                                }));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                              {courseConfiguredComps.length > 0 && (
                                <optgroup label={`⭐ Enrolled Course Fee Breakdown (${courseName} - Year ${feeForm.year})`}>
                                  {courseConfiguredComps.map((cc: any) => (
                                    <option key={`cc_${cc.code}`} value={cc.code}>
                                      {cc.name} — Added Price: ₹{cc.rate.toLocaleString('en-IN')} {cc.due > 0 ? `(Pending Due: ₹${cc.due.toLocaleString('en-IN')})` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="Academic Program & Course Fees">
                                {allAvailableCategories.filter(c => c.type === 'Academic').map(cat => (
                                  <option key={cat.code} value={cat.code}>
                                    {cat.name} {cat.defaultAmount ? `— ₹${cat.defaultAmount.toLocaleString('en-IN')}` : ''} {cat.due && cat.due > 0 ? `(Due: ₹${cat.due.toLocaleString('en-IN')})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Kit, Uniform & Course Material">
                                {allAvailableCategories.filter(c => c.type === 'Kit/Uniform').map(cat => (
                                  <option key={cat.code} value={cat.code}>
                                    {cat.name} {cat.defaultAmount ? `— ₹${cat.defaultAmount.toLocaleString('en-IN')}` : ''} {cat.due && cat.due > 0 ? `(Due: ₹${cat.due.toLocaleString('en-IN')})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Facilities, Labs & Transport">
                                {allAvailableCategories.filter(c => c.type === 'Facility/Lab').map(cat => (
                                  <option key={cat.code} value={cat.code}>
                                    {cat.name} {cat.defaultAmount ? `— ₹${cat.defaultAmount.toLocaleString('en-IN')}` : ''} {cat.due && cat.due > 0 ? `(Due: ₹${cat.due.toLocaleString('en-IN')})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Fines & Penalties">
                                {allAvailableCategories.filter(c => c.type === 'Fine/Penalty').map(cat => (
                                  <option key={cat.code} value={cat.code}>
                                    {cat.name} {cat.defaultAmount ? `— ₹${cat.defaultAmount.toLocaleString('en-IN')}` : ''} {cat.due && cat.due > 0 ? `(Due: ₹${cat.due.toLocaleString('en-IN')})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                              {allAvailableCategories.some(c => !['Academic', 'Kit/Uniform', 'Facility/Lab', 'Fine/Penalty'].includes(c.type)) && (
                                <optgroup label="Other Categories">
                                  {allAvailableCategories.filter(c => !['Academic', 'Kit/Uniform', 'Facility/Lab', 'Fine/Penalty'].includes(c.type)).map(cat => (
                                    <option key={cat.code} value={cat.code}>
                                      {cat.name} {cat.defaultAmount ? `— ₹${cat.defaultAmount.toLocaleString('en-IN')}` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Interactive Course Fee Breakdown from Database */}
                        {courseConfiguredComps.length > 0 && (
                          <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100/90 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                Database Added Fees for {courseName} (Year {feeForm.year})
                              </span>
                              <span className="text-[10px] font-bold text-indigo-600">Click any component to pay</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {courseConfiguredComps.map((cc: any) => {
                                const isSelected = feeForm.category === cc.code || feeForm.categoryName?.toLowerCase() === cc.name.toLowerCase();
                                return (
                                  <button
                                    key={`btn_${cc.code}`}
                                    type="button"
                                    onClick={() => {
                                      const autoAmt = cc.due > 0 ? String(cc.due) : (cc.rate > 0 ? String(cc.rate) : feeForm.amount);
                                      setFeeForm(prev => ({
                                        ...prev,
                                        category: cc.code,
                                        categoryName: cc.name,
                                        amount: autoAmt
                                      }));
                                    }}
                                    className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                                      isSelected
                                        ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                                        : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 shadow-2xs"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center gap-1">
                                      <span className="text-xs font-black truncate">{cc.name}</span>
                                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                                        isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
                                      }`}>
                                        ₹{cc.rate.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1.5">
                                      <span className={`text-[9px] font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {cc.due > 0 ? `Due: ₹${cc.due.toLocaleString('en-IN')}` : (cc.paid > 0 ? 'Cleared ✓' : 'Full Rate')}
                                      </span>
                                      {isSelected ? (
                                        <span className="text-[9px] font-black text-emerald-300">Selected ✓</span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-indigo-500">Pay →</span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Payment Amount with Quick Shortcuts */}
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                              Payment Amount (₹) <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {currentSelectedCat?.due && currentSelectedCat.due > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setFeeForm(prev => ({ ...prev, amount: String(currentSelectedCat.due) }))}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer"
                                >
                                  Fill Component Due (₹{currentSelectedCat.due.toLocaleString('en-IN')})
                                </button>
                              ) : null}
                              {currentYrDue > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setFeeForm(prev => ({ ...prev, amount: String(currentYrDue) }))}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                                >
                                  Fill Year {feeForm.year} Due (₹{currentYrDue.toLocaleString('en-IN')})
                                </button>
                              ) : null}
                              {dueTotal > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setFeeForm(prev => ({ ...prev, amount: String(dueTotal) }))}
                                  className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                                >
                                  Fill Total Balance (₹{dueTotal.toLocaleString('en-IN')})
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₹</span>
                            <input
                              type="number"
                              required
                              min="1"
                              placeholder="e.g. 25000"
                              value={feeForm.amount}
                              onChange={e => setFeeForm(prev => ({ ...prev, amount: e.target.value }))}
                              className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        {/* Mode & Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1 block mb-1">
                              Payment Method
                            </label>
                            <select
                              value={feeForm.paymentMethod}
                              onChange={e => setFeeForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                              <option value="Cash">Cash Counter</option>
                              <option value="Online">Online / UPI (PhonePe, GPay, Paytm)</option>
                              <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                              <option value="Cheque">Cheque / Demand Draft</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1 block mb-1">
                              Payment Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={feeForm.paymentDate}
                              onChange={e => setFeeForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>

                        {/* Receipt Number & Transaction Ref */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1 block mb-1">
                              Receipt Number <span className="text-slate-400 font-normal lowercase">(optional manual)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Auto-generated if left blank"
                              value={feeForm.receiptNumber}
                              onChange={e => setFeeForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1 block mb-1">
                              Cheque / Transaction Ref <span className="text-slate-400 font-normal lowercase">(optional)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. UPI Ref / Bank TXN / Cheque #"
                              value={feeForm.transactionId}
                              onChange={e => setFeeForm(prev => ({ ...prev, transactionId: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                            />
                          </div>
                        </div>

                        {/* Remarks / Notes */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1 block mb-1">
                            Remarks / Payment Notes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Paid at college counter, partial installment"
                            value={feeForm.notes}
                            onChange={e => setFeeForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium text-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        {/* Footer for Pay Tab */}
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setIsAddFeeModalOpen(false)}
                            className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingFee}
                            className="px-6 py-3 bg-[#00875A] hover:bg-[#00704A] text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                          >
                            {isSubmittingFee ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                            Pay Fee & Print Official Receipt
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* TAB 2: FEE STRUCTURE & LEDGER CONFIG */
                      <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Summary Action Bar for Structure Tab */}
                        <div className="px-8 py-3 bg-indigo-50/50 border-b border-indigo-100/50 flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-950">
                            Configure academic years, fee breakdown & scholarships for {fullName}
                          </span>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={handleMarkAllAsPaid}
                              disabled={isLoadingFeeStructure && editFeeYears.length === 0}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> Mark All as Paid
                            </button>
                            <button 
                              type="button" 
                              onClick={handleResetAllPaid}
                              disabled={isLoadingFeeStructure && editFeeYears.length === 0}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all cursor-pointer disabled:opacity-50"
                            >
                              Reset Paid
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Years & Fee Items */}
                        <div className="p-8 space-y-6 overflow-y-auto flex-1">
                          {isLoadingFeeStructure && editFeeYears.length === 0 ? (
                            <CollectFeeModalSkeleton />
                          ) : (
                            <>
                              {editFeeYears.map((yr, yIdx) => {
                                let yrGross = 0;
                                let yrPaid = 0;
                                (yr.components || []).forEach((c: any) => {
                                  yrGross += Number(c.amount) || 0;
                                  yrPaid += Number(c.paid) || 0;
                                });
                                const yrDiscount = Number(yr.discount) || 0;
                                const yrNet = Math.max(0, yrGross - yrDiscount);
                                const yrDue = Math.max(0, yrNet - yrPaid);

                                return (
                                  <div key={yIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                                      <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs">
                                          {yr.year}
                                        </span>
                                        <span className="font-black text-slate-800 text-sm">Academic Year {yr.year}</span>
                                        <span className="text-xs font-semibold text-slate-400">
                                          (Gross: {formatCurrency(yrGross)}
                                          {yrDiscount > 0 ? ` | Disc: -${formatCurrency(yrDiscount)}` : ""}
                                          {` | Net: ${formatCurrency(yrNet)} | Paid: ${formatCurrency(yrPaid)} | Due: ${formatCurrency(yrDue)}`})
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button 
                                          type="button" 
                                          onClick={() => handleQuickMarkYearPaid(yIdx)}
                                          className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          <Check className="w-3 h-3" /> Mark Year Paid
                                        </button>
                                        {editFeeYears.length > 1 && (
                                          <button 
                                            type="button" 
                                            onClick={() => handleRemoveAcademicYear(yIdx)}
                                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {(yr.components || []).map((comp: any, cIdx: number) => (
                                        <div key={cIdx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                                          <div className="flex justify-between items-center">
                                            <select
                                              value={comp.category || "Tuition Fee"}
                                              onChange={e => {
                                                const catName = e.target.value;
                                                const matched = COURSE_CREATION_CATEGORIES.find(c => c.name === catName);
                                                handleEditFeeChange(yIdx, cIdx, "category", catName);
                                                if (matched && Number(comp.amount || 0) === 0) {
                                                  handleEditFeeChange(yIdx, cIdx, "amount", String(matched.defaultAmount));
                                                }
                                              }}
                                              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none w-[65%]"
                                            >
                                              {COURSE_CREATION_CATEGORIES.map(cc => (
                                                <option key={cc.code} value={cc.name}>{cc.name}</option>
                                              ))}
                                            </select>
                                            <div className="flex items-center gap-2">
                                              <button 
                                                type="button" 
                                                onClick={() => handleQuickMarkCategoryPaid(yIdx, cIdx)}
                                                className="text-[10px] font-bold text-indigo-600 hover:underline whitespace-nowrap cursor-pointer"
                                              >
                                                Paid = Total
                                              </button>
                                              <button 
                                                type="button" 
                                                onClick={() => handleRemoveFeeComponent(yIdx, cIdx)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                                title="Remove Component"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <span className="text-[10px] font-bold text-slate-400 uppercase">Total (₹)</span>
                                              <input 
                                                type="number"
                                                value={comp.amount ?? 0}
                                                onChange={e => handleEditFeeChange(yIdx, cIdx, "amount", e.target.value)}
                                                className="w-full mt-0.5 bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-800 text-xs"
                                              />
                                            </div>
                                            <div>
                                              <span className="text-[10px] font-bold text-emerald-600 uppercase">Paid (₹)</span>
                                              <input 
                                                type="number"
                                                value={comp.paid ?? 0}
                                                onChange={e => handleEditFeeChange(yIdx, cIdx, "paid", e.target.value)}
                                                className="w-full mt-0.5 bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-emerald-700 text-xs"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Year Discount & Concession Configuration */}
                                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                                            %
                                          </div>
                                          <div>
                                            <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                                              Discount / Concession / Scholarship (Year {yr.year})
                                            </span>
                                            <p className="text-[10px] font-semibold text-emerald-700">Direct deduction from this year&apos;s total payable amount</p>
                                          </div>
                                        </div>
                                        {yrDiscount > 0 && (
                                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full">
                                            -{formatCurrency(yrDiscount)} Applied
                                          </span>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                          <label className="text-[10px] font-black uppercase text-emerald-800 block mb-1">
                                            Discount Amount (₹)
                                          </label>
                                          <input 
                                            type="number"
                                            min="0"
                                            value={yr.discount ?? 0}
                                            onChange={e => handleEditYearDiscount(yIdx, "discount", e.target.value)}
                                            placeholder="e.g. 15000"
                                            className="w-full bg-white border border-emerald-300 p-2.5 rounded-xl font-black text-emerald-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-black uppercase text-emerald-800 block mb-1">
                                            Reason / Scheme / Scholarship Note
                                          </label>
                                          <input 
                                            type="text"
                                            value={yr.discountReason ?? ""}
                                            onChange={e => handleEditYearDiscount(yIdx, "discountReason", e.target.value)}
                                            placeholder="e.g. Merit Scholarship / Early Bird / Concession"
                                            className="w-full bg-white border border-emerald-300 p-2.5 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <button 
                                      type="button" 
                                      onClick={() => handleAddFeeComponent(yIdx)}
                                      className="w-full mt-2 py-2 border border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-indigo-50/50 cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" /> Add Fee Component (From Course Categories)
                                    </button>
                                  </div>
                                );
                              })}

                              <button 
                                type="button" 
                                onClick={handleAddAcademicYear}
                                className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-indigo-50/50 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> Add Another Academic Year
                              </button>
                            </>
                          )}
                        </div>

                        {/* Footer for Structure Tab */}
                        <div className="px-8 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                          <button 
                            type="button" 
                            onClick={() => setIsAddFeeModalOpen(false)}
                            className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            disabled={isSavingFeeEdit}
                            onClick={handleSaveStudentFeeStructure}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            {isSavingFeeEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save Fee Structure & Updates
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: SEND OVERDUE REMINDER NOTICE                                     */}
      {/* ========================================================================= */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Send Due Reminder Notice</h3>
              <button onClick={() => setIsAlertModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmitAlert} className="space-y-3 text-xs font-semibold">
              {!alertTargetStudent && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Select Student</label>
                  <select
                    value={alertForm.studentId}
                    onChange={e => setAlertForm(prev => ({ ...prev, studentId: e.target.value }))}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s._id || s.id} value={s._id || s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Title</label>
                <input
                  type="text"
                  value={alertForm.title}
                  onChange={e => setAlertForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Message Content</label>
                <textarea
                  value={alertForm.message}
                  onChange={e => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAlertModalOpen(false)} className="px-3.5 py-1.5 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingAlert} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">
                  {isSubmittingAlert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Notice"}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">{editingCategory ? "Edit Fee Item" : "New Fee Item"}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmitCategory} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Item Name (e.g. Uniform, Blazer, Books)</label>
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Standard Rate (INR)</label>
                <input type="number" value={categoryForm.defaultAmount} onChange={e => setCategoryForm(prev => ({ ...prev, defaultAmount: e.target.value }))} placeholder="e.g. 2500" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-3.5 py-1.5 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingCategory} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">
                  {isSubmittingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Rate"}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Staff Payout Voucher</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreatePayout} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Staff Member</label>
                <select value={payoutForm.payeeId} onChange={e => {
                  const staff = staffList.find(s => (s._id || s.id) === e.target.value);
                  setPayoutForm(prev => ({ ...prev, payeeId: e.target.value, designation: staff?.role || "Staff" }));
                }} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer">
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map(s => (<option key={s._id || s.id} value={s._id || s.id}>{s.firstName} {s.lastName} ({s.role || "Staff"})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Amount (INR)</label>
                <input type="number" value={payoutForm.amount} onChange={e => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="px-3.5 py-1.5 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingPayout} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer">
                  {isSubmittingPayout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Voucher"}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Course Tuition Fee</h3>
              <button onClick={() => setIsCourseFeeModalOpen(false)} className="p-1 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              setIsSavingCourseFee(true);
              try {
                const res = await fetch(`/api/courses/${editingCourse._id || editingCourse.id}`, {
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
            }} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Total Course Fee (INR)</label>
                <input type="number" value={courseFeeForm.tuitionFee} onChange={e => setCourseFeeForm(prev => ({ ...prev, tuitionFee: e.target.value }))} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCourseFeeModalOpen(false)} className="px-3.5 py-1.5 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSavingCourseFee} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

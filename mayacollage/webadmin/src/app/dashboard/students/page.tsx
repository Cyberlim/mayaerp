"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Search, 
  Plus, 
  UserCircle, 
  Trash2, 
  Shield, 
  Loader2, 
  CheckCircle2, 
  Eye, 
  UploadCloud, 
  X, 
  Building2, 
  Key, 
  Lock, 
  Edit,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  AlertTriangle,
  Receipt,
  MoreVertical,
  Filter,
  Layers,
  Check,
  Undo2,
  ChevronDown,
  ChevronUp,
  BookOpen
} from "lucide-react";
import Link from "next/link";

export default function StudentManagementDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterSection, setFilterSection] = useState("All");
  const [filterFeeStatus, setFilterFeeStatus] = useState("All");
  const [toastMsg, setToastMsg] = useState("");

  // View Mode: Branch-Course, Cards or List
  const [viewMode, setViewMode] = useState<"branch_course" | "cards" | "list">("branch_course");
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  // Password Modal
  const [passwordModal, setPasswordModal] = useState<{isOpen: boolean, studentId: string, name: string}>({isOpen: false, studentId: "", name: ""});
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Batch update dialog state
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchYear, setBatchYear] = useState("");
  const [batchBranch, setBatchBranch] = useState("");
  const [batchProgram, setBatchProgram] = useState("");
  const [newSemester, setNewSemester] = useState(1);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const filters = ["All", "Active", "Inactive", "Suspended"];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, branchesRes, coursesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/branches"),
        fetch("/api/courses")
      ]);
      const [studentsData, branchesData, coursesData] = await Promise.all([
        studentsRes.json(),
        branchesRes.json(),
        coursesRes.json()
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete student: ${name}?`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToastMsg("Student deleted successfully!");
        fetchData();
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        alert("Failed to delete student.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await fetch(`/api/students/${passwordModal.studentId}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      
      if (res.ok) {
        setToastMsg("Password updated successfully!");
        setPasswordModal({ isOpen: false, studentId: "", name: "" });
        setNewPassword("");
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating the password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleBatchUpdate = async () => {
    if (!batchYear && !batchBranch && !batchProgram) {
      alert("Please select at least one filter to update students.");
      return;
    }
    
    if (!confirm(`Are you sure you want to promote these students to Semester ${newSemester}?`)) return;

    setIsBatchUpdating(true);
    try {
      const res = await fetch("/api/students/batch-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionYear: batchYear || undefined,
          selectedBranch: batchBranch || undefined,
          selectedProgram: batchProgram || undefined,
          newSemester
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToastMsg(`Promoted ${data.modifiedCount} students to Semester ${newSemester}!`);
        setShowBatchDialog(false);
        fetchData();
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        alert(data.error || "Batch update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error executing batch update.");
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Helper for student fee summary (inherits Course total fee if not custom configured)
  const getFeeInfo = (student: any) => {
    const courseObj = courses.find(c => c._id === (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram));
    
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

    // Default to Course base fee if student total is 0
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
    const summary = getFeeInfo(student);
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
        setToastMsg(markPaid ? `Marked ${student.firstName}'s fees as Fully Paid!` : `Marked ${student.firstName}'s fees as Unpaid.`);
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        alert(updated.error || "Failed to update fee status.");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating student fee status.");
    }
  };

  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedFilter !== "All") {
      result = result.filter(s => s.studentStatus === selectedFilter || s.status === selectedFilter);
    }
    if (filterBranch !== "All") {
      result = result.filter(s => {
        const bid = typeof s.selectedBranch === 'object' ? s.selectedBranch?._id : s.selectedBranch;
        return bid === filterBranch;
      });
    }
    if (filterCourse !== "All") {
      result = result.filter(s => {
        const pid = typeof s.selectedProgram === 'object' ? s.selectedProgram?._id : s.selectedProgram;
        return pid === filterCourse;
      });
    }
    if (filterBatch !== "All") {
      result = result.filter(s => s.batch === filterBatch);
    }
    if (filterSemester !== "All") {
      result = result.filter(s => s.selectedSemester === Number(filterSemester));
    }
    if (filterSection !== "All") {
      if (filterSection === "None") {
        result = result.filter(s => !s.selectedSection);
      } else {
        result = result.filter(s => s.selectedSection === filterSection);
      }
    }
    if (filterFeeStatus !== "All") {
      result = result.filter(s => {
        const feeInfo = getFeeInfo(s);
        return feeInfo.status === filterFeeStatus;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.firstName?.toLowerCase() || "").includes(q) || 
        (s.lastName?.toLowerCase() || "").includes(q) || 
        (s.studentId?.toLowerCase() || "").includes(q) ||
        (s.admissionNumber?.toLowerCase() || "").includes(q) ||
        (s.mobileNumber?.toLowerCase() || "").includes(q) ||
        (s.email?.toLowerCase() || "").includes(q)
      );
    }
    return result;
  }, [students, selectedFilter, filterBranch, filterCourse, filterBatch, filterSemester, filterSection, filterFeeStatus, searchQuery, courses]);

  // Grouped Branches and Courses for Branch-Course View
  const branchCourseHierarchy = useMemo(() => {
    return branches.map(branch => {
      const branchCourses = courses.filter(c => {
        const bId = typeof c.branchId === "object" ? c.branchId?._id : c.branchId;
        return bId === branch._id;
      });

      const coursesWithStudents = branchCourses.map(course => {
        const enrolledStudents = filteredStudents.filter(s => {
          const cId = typeof s.selectedProgram === "object" ? s.selectedProgram?._id : s.selectedProgram;
          return cId === course._id;
        });

        const totalCourseFee = Number(course.tuitionFee) || 0;
        const totalSemesters = course.totalSemesters || ((course.duration || 4) * 2);
        const semesterFee = totalSemesters > 0 ? Math.round(totalCourseFee / totalSemesters) : 0;

        return {
          ...course,
          enrolledStudents,
          totalCourseFee,
          totalSemesters,
          semesterFee
        };
      });

      return {
        ...branch,
        courses: coursesWithStudents
      };
    });
  }, [branches, courses, filteredStudents]);

  const uniqueBatches = useMemo(() => {
    const batches = new Set(students.map(s => s.batch).filter(Boolean));
    return Array.from(batches).sort().reverse();
  }, [students]);

  const dashboardMaxSemesters = useMemo(() => {
    let filteredCourses = courses;
    if (filterCourse !== "All") {
      filteredCourses = courses.filter(c => c._id === filterCourse);
    } else if (filterBranch !== "All") {
      filteredCourses = courses.filter(c => typeof c.branchId === 'object' ? c.branchId?._id === filterBranch : c.branchId === filterBranch);
    }
    if (filteredCourses.length > 0) {
      return Math.max(...filteredCourses.map(c => c.totalSemesters || 8));
    }
    return 8;
  }, [courses, filterBranch, filterCourse]);

  const batchMaxSemesters = useMemo(() => {
    let filteredCourses = courses;
    if (batchProgram) {
      filteredCourses = courses.filter(c => c._id === batchProgram);
    } else if (batchBranch) {
      filteredCourses = courses.filter(c => typeof c.branchId === 'object' ? c.branchId?._id === batchBranch : c.branchId === batchBranch);
    }
    if (filteredCourses.length > 0) {
      return Math.max(...filteredCourses.map(c => c.totalSemesters || 8));
    }
    return 8;
  }, [courses, batchBranch, batchProgram]);

  const uniqueSections = useMemo(() => {
    const sections = new Set(students.map(s => s.selectedSection).filter(Boolean));
    return Array.from(sections).sort();
  }, [students]);

  const stats = {
    total: students.length,
    active: students.filter(s => s.studentStatus === 'Active' || s.status === 'Active').length,
    inactive: students.filter(s => s.studentStatus === 'Inactive' || s.status === 'Inactive').length,
    suspended: students.filter(s => s.studentStatus === 'Suspended' || s.status === 'Suspended').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative font-sans text-slate-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h1>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full border border-indigo-100">
                  {students.length} Enrolled
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Branch-Course Fee Matrices • Enrollments & Fee Status
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            
            {/* View Mode Toggle: Branch-Course, Cards, List */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("branch_course")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === "branch_course" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Branch - Course View
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === "cards" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === "list" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List className="w-3.5 h-3.5" /> List View
              </button>
            </div>

            <button 
              onClick={() => setShowBatchDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl shadow-md hover:bg-slate-800 transition-all"
            >
              <UploadCloud className="w-4 h-4" /> Batch Promote
            </button>

            <Link href="/dashboard/students/create">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-all">
                <Plus className="w-4 h-4" /> Enroll Student
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 mt-8 space-y-6">
        
        {/* KPI Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Total Students", value: stats.total, color: "text-slate-900", bg: "bg-indigo-50", icon: GraduationCap },
            { label: "Active Profiles", value: stats.active, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
            { label: "Inactive Profiles", value: stats.inactive, color: "text-amber-500", bg: "bg-amber-50", icon: Clock },
            { label: "Suspended Profiles", value: stats.suspended, color: "text-rose-600", bg: "bg-rose-50", icon: AlertTriangle },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                <div className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</div>
              </div>
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search students by name, student ID, admission number, mobile or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedFilter === filter 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 items-center">
            <select 
              value={filterBranch} 
              onChange={e => setFilterBranch(e.target.value)} 
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none"
            >
              <option value="All">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            
            <select 
              value={filterCourse} 
              onChange={e => setFilterCourse(e.target.value)} 
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none"
            >
              <option value="All">All Courses</option>
              {courses
                .filter(c => filterBranch === "All" || (typeof c.branchId === 'object' ? c.branchId?._id === filterBranch : c.branchId === filterBranch))
                .map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
            
            <select 
              value={filterBatch} 
              onChange={e => setFilterBatch(e.target.value)} 
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none"
            >
              <option value="All">All Batches</option>
              {uniqueBatches.map((b: any) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select 
              value={filterSemester} 
              onChange={e => setFilterSemester(e.target.value)} 
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none"
            >
              <option value="All">All Semesters</option>
              {[...Array(dashboardMaxSemesters)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>

            <select 
              value={filterFeeStatus} 
              onChange={e => setFilterFeeStatus(e.target.value)} 
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none"
            >
              <option value="All">All Fee Statuses</option>
              <option value="paid">Fee Cleared / Paid</option>
              <option value="partial">Partial Payment / Due</option>
              <option value="unpaid">Completely Unpaid</option>
            </select>

            {(filterBranch !== "All" || filterCourse !== "All" || filterBatch !== "All" || filterSemester !== "All" || filterFeeStatus !== "All" || searchQuery) && (
              <button
                onClick={() => {
                  setFilterBranch("All");
                  setFilterCourse("All");
                  setFilterBatch("All");
                  setFilterSemester("All");
                  setFilterFeeStatus("All");
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
              >
                Reset Filters
              </button>
            )}

            <div className="ml-auto text-xs font-bold text-slate-400">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="p-20 flex flex-col justify-center items-center bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading student directory...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-800">No Students Found</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">No profiles match your current search and filters.</p>
          </div>
        ) : (
          <>
            {/* ================================================================= */}
            {/* OPTION 1: BRANCH - COURSE VIEW WITH ENROLLED STUDENTS & FEES      */}
            {/* ================================================================= */}
            {viewMode === "branch_course" && (
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
                            {branch.code} • Dean: {branch.deanName || "N/A"}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
                        {branch.courses.length} Programs
                      </span>
                    </div>

                    {/* Courses in this branch */}
                    <div className="space-y-4">
                      {branch.courses.map((course: any) => {
                        const isExpanded = expandedCourses[course._id] ?? true;

                        return (
                          <div key={course._id} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 overflow-hidden">
                            
                            {/* Course Header Row */}
                            <div className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-slate-900 text-sm sm:text-base">{course.name}</h4>
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-md border border-indigo-100">
                                    {course.code}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-slate-400 mt-0.5">
                                  {course.duration || 4} Years ({course.totalSemesters || 8} Semesters) • {course.enrolledStudents.length} Students Enrolled
                                </div>
                              </div>

                              {/* Fee Badges & Expand button */}
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-left">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block">Semester Fee</span>
                                  <span className="text-xs font-black text-slate-900">₹{course.semesterFee?.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-left">
                                  <span className="text-[9px] font-black uppercase text-indigo-600 block">Total Course Fee</span>
                                  <span className="text-xs font-black text-indigo-700">₹{course.totalCourseFee?.toLocaleString('en-IN')}</span>
                                </div>

                                <button 
                                  onClick={() => setExpandedCourses(prev => ({ ...prev, [course._id]: !isExpanded }))}
                                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                                >
                                  <span>{isExpanded ? "Hide" : "Show"} Students ({course.enrolledStudents.length})</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Students in this Course Table */}
                            {isExpanded && (
                              <div className="border-t border-slate-200 bg-white p-4">
                                {course.enrolledStudents.length === 0 ? (
                                  <div className="py-6 text-center text-slate-400 text-xs font-bold">
                                    No students enrolled matching current filters.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          <th className="py-3 px-4">Student</th>
                                          <th className="py-3 px-4">Semester</th>
                                          <th className="py-3 px-4 text-right">Total Fee</th>
                                          <th className="py-3 px-4 text-right">Paid</th>
                                          <th className="py-3 px-4 text-right">Due</th>
                                          <th className="py-3 px-4 text-center">Fee Status</th>
                                          <th className="py-3 px-4 text-center">Manage Fee Paid / Unpaid</th>
                                        </tr>
                                      </thead>
                                      <tbody className="text-xs divide-y divide-slate-100">
                                        {course.enrolledStudents.map((student: any) => {
                                          const feeInfo = getFeeInfo(student);
                                          const isPaid = feeInfo.status === "paid";

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
                                                ₹{feeInfo.total.toLocaleString('en-IN')}
                                              </td>

                                              <td className="py-3 px-4 text-right font-black text-emerald-600">
                                                ₹{feeInfo.paid.toLocaleString('en-IN')}
                                              </td>

                                              <td className="py-3 px-4 text-right font-black text-amber-600">
                                                ₹{feeInfo.balance.toLocaleString('en-IN')}
                                              </td>

                                              <td className="py-3 px-4 text-center">
                                                {isPaid ? (
                                                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-full border border-emerald-100 inline-flex items-center gap-1">
                                                    <Check className="w-3 h-3 text-emerald-600" /> Fully Paid
                                                  </span>
                                                ) : feeInfo.status === "partial" ? (
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
                                                  
                                                  {/* 1-Click Toggle: Mark Paid / Unpaid */}
                                                  {!isPaid ? (
                                                    <button
                                                      onClick={() => handleToggleStudentPaid(student, true)}
                                                      title="Mark fee as paid"
                                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-sm"
                                                    >
                                                      <Check className="w-3 h-3" /> Mark Paid
                                                    </button>
                                                  ) : (
                                                    <button
                                                      onClick={() => handleToggleStudentPaid(student, false)}
                                                      title="Mark fee as unpaid"
                                                      className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 border border-slate-200"
                                                    >
                                                      <Undo2 className="w-3 h-3" /> Mark Unpaid
                                                    </button>
                                                  )}

                                                  <Link href={`/dashboard/students/${student._id}`}>
                                                    <button title="View Detail Profile" className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs">
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
            )}

            {/* ================================================================= */}
            {/* OPTION 2: CARDS VIEW (GRID)                                       */}
            {/* ================================================================= */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredStudents.map(student => {
                  const feeInfo = getFeeInfo(student);
                  const isPaid = feeInfo.status === "paid";
                  const courseName = courses.find(c => c._id === (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram))?.name || "Unassigned Course";
                  const branchName = branches.find(b => b._id === (typeof student.selectedBranch === 'object' ? student.selectedBranch?._id : student.selectedBranch))?.name || "";

                  return (
                    <motion.div
                      key={student._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-indigo-100"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm shrink-0 overflow-hidden">
                              {student.profilePhoto || student.documents?.studentPhoto ? (
                                <img 
                                  src={student.profilePhoto || student.documents?.studentPhoto} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <span>{student.firstName?.[0]}{student.lastName?.[0]}</span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {student.firstName} {student.lastName}
                              </h3>
                              <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                                {student.admissionNumber || student.studentId || "No ID"}
                              </div>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border shrink-0 ${
                            student.studentStatus === 'Active' || student.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {student.studentStatus || student.status || 'Active'}
                          </span>
                        </div>

                        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs mb-4">
                          <div className="font-bold text-slate-800 line-clamp-1">{courseName}</div>
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                            <span>{branchName || "Branch -"}</span>
                            <span>Sem {student.selectedSemester || 1}</span>
                          </div>
                        </div>

                        {/* Fee Status Card with 1-Click Update */}
                        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[10px] font-black uppercase text-slate-400">Total Fee:</span>
                            <span className="font-black text-slate-900">₹{feeInfo.total.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[10px] font-black uppercase text-slate-400">Paid Amount:</span>
                            <span className="font-black text-emerald-600">₹{feeInfo.paid.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-xs">
                            <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
                            {isPaid ? (
                              <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Cleared
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-600">
                                Due: ₹{feeInfo.balance.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* 1-Click Toggle Paid / Unpaid */}
                        {!isPaid ? (
                          <button
                            onClick={() => handleToggleStudentPaid(student, true)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStudentPaid(student, false)}
                            className="flex-1 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-200"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Mark Unpaid
                          </button>
                        )}

                        <Link href={`/dashboard/students/${student._id}`}>
                          <button title="View Details" className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl text-xs transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        <button 
                          onClick={() => setPasswordModal({ isOpen: true, studentId: student._id, name: `${student.firstName} ${student.lastName}` })}
                          title="Reset Password"
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition-colors"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ================================================================= */}
            {/* OPTION 3: LIST VIEW (TABLE)                                       */}
            {/* ================================================================= */}
            {viewMode === "list" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-4 px-5">Student</th>
                        <th className="py-4 px-5">Program & Branch</th>
                        <th className="py-4 px-5 text-right">Total Course Fee</th>
                        <th className="py-4 px-5 text-right">Amount Paid</th>
                        <th className="py-4 px-5 text-right">Due Balance</th>
                        <th className="py-4 px-5 text-center">Fee Status</th>
                        <th className="py-4 px-5 text-center">Manage Fee / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-50">
                      {filteredStudents.map(student => {
                        const feeInfo = getFeeInfo(student);
                        const isPaid = feeInfo.status === "paid";
                        const courseName = courses.find(c => c._id === (typeof student.selectedProgram === 'object' ? student.selectedProgram?._id : student.selectedProgram))?.name || "Unassigned";
                        const branchName = branches.find(b => b._id === (typeof student.selectedBranch === 'object' ? student.selectedBranch?._id : student.selectedBranch))?.name || "-";

                        return (
                          <tr key={student._id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-4 px-5">
                              <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                {student.admissionNumber || student.studentId}
                              </div>
                            </td>

                            <td className="py-4 px-5">
                              <div className="font-bold text-slate-800 text-xs">{courseName}</div>
                              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{branchName} • Sem {student.selectedSemester || 1}</div>
                            </td>

                            <td className="py-4 px-5 text-right font-black text-slate-900">
                              ₹{feeInfo.total.toLocaleString('en-IN')}
                            </td>

                            <td className="py-4 px-5 text-right font-black text-emerald-600">
                              ₹{feeInfo.paid.toLocaleString('en-IN')}
                            </td>

                            <td className="py-4 px-5 text-right font-black text-amber-600">
                              ₹{feeInfo.balance.toLocaleString('en-IN')}
                            </td>

                            <td className="py-4 px-5 text-center">
                              {isPaid ? (
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-full border border-emerald-100 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" /> Fully Paid
                                </span>
                              ) : feeInfo.status === "partial" ? (
                                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-black text-[10px] rounded-full border border-amber-100">
                                  Partial
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-black text-[10px] rounded-full border border-rose-100">
                                  Unpaid
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!isPaid ? (
                                  <button
                                    onClick={() => handleToggleStudentPaid(student, true)}
                                    title="Mark fee as paid"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <Check className="w-3 h-3" /> Mark Paid
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStudentPaid(student, false)}
                                    title="Mark fee as unpaid"
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold rounded-lg text-xs transition-all flex items-center gap-1 border border-slate-200"
                                  >
                                    <Undo2 className="w-3 h-3" /> Mark Unpaid
                                  </button>
                                )}

                                <Link href={`/dashboard/students/${student._id}`}>
                                  <button title="View Detail Profile" className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg transition-colors">
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </Link>

                                <button 
                                  onClick={() => handleDelete(student._id, `${student.firstName} ${student.lastName}`)}
                                  title="Delete Student" 
                                  className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {passwordModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setPasswordModal({ isOpen: false, studentId: "", name: "" })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-hidden z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Reset Password</h3>
                    <p className="text-xs font-bold text-slate-400">{passwordModal.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPasswordModal({ isOpen: false, studentId: "", name: "" })}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">New Password</label>
                  <input 
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Save New Password
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Update Dialog */}
      <AnimatePresence>
        {showBatchDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowBatchDialog(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-7 overflow-hidden z-10 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Batch Semester Promotion</h3>
                    <p className="text-xs font-bold text-slate-400">Promote multiple students in bulk</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBatchDialog(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Target Branch</label>
                  <select 
                    value={batchBranch}
                    onChange={e => setBatchBranch(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 outline-none"
                  >
                    <option value="">All / Any Branch</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Target Course</label>
                  <select 
                    value={batchProgram}
                    onChange={e => setBatchProgram(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 outline-none"
                  >
                    <option value="">All / Any Course</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Batch / Session Year</label>
                  <select 
                    value={batchYear}
                    onChange={e => setBatchYear(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 outline-none"
                  >
                    <option value="">All Batches</option>
                    {uniqueBatches.map((b: any) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Promote To Semester</label>
                  <select 
                    value={newSemester}
                    onChange={e => setNewSemester(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 outline-none"
                  >
                    {[...Array(batchMaxSemesters)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => setShowBatchDialog(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBatchUpdate}
                  disabled={isBatchUpdating}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isBatchUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Execute Batch Promotion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

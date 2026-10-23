"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  Sparkles, 
  GraduationCap, 
  Users, 
  Building2, 
  Eye, 
  ArrowRight, 
  Info, 
  Calendar, 
  Key, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Search, 
  Check, 
  ChevronRight, 
  FileCheck, 
  Download, 
  Bus, 
  CreditCard, 
  FileText, 
  Beaker, 
  Plus, 
  X,
  ArrowDownToLine,
  FolderDown
} from "lucide-react";
import Link from "next/link";

interface FileSummary {
  fileName: string;
  sizeBytes: number;
  rowCount: number;
  headers: string[];
  sampleStudentName?: string;
  detectedCourse?: string;
  detectedSession?: string;
  preset: {
    courseCode: string;
    courseNameHint: string;
    sessionYear: string;
    admissionYear: string;
    batch: string;
    idPrefix: string;
    enrollmentPrefix: string;
  };
  suggestedCourseId: string;
  suggestedBranchId: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  duration: number;
  branch_id: string;
  tuition_fee: number;
  fee_structure_template: any;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  dean_name?: string;
  location?: string;
}

export default function SeedDataPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [syncingCourses, setSyncingCourses] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [files, setFiles] = useState<FileSummary[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dbStats, setDbStats] = useState<{ totalStudents: number; distribution: any[] }>({
    totalStudents: 0,
    distribution: []
  });
  const [dbColumns, setDbColumns] = useState<any[]>([]);

  // Backup State
  const [manifest, setManifest] = useState<any>(null);
  const [takingBackup, setTakingBackup] = useState(false);

  // Selection form states
  const [selectedFile, setSelectedFile] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [sessionYear, setSessionYear] = useState<string>("2025-2029");
  const [admissionYear, setAdmissionYear] = useState<string>("2025");
  const [batch, setBatch] = useState<string>("2025");
  const [idPrefix, setIdPrefix] = useState<string>("BPH25");
  const [enrollmentPrefix, setEnrollmentPrefix] = useState<string>("ENRBPH25");

  // Modals for creating Courses & Branches
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseDuration, setNewCourseDuration] = useState("4");
  const [newCourseBranchId, setNewCourseBranchId] = useState("");
  const [newCourseTuition, setNewCourseTuition] = useState("65000");
  const [savingCourse, setSavingCourse] = useState(false);

  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCode, setNewBranchCode] = useState("");
  const [newBranchDean, setNewBranchDean] = useState("");
  const [newBranchLocation, setNewBranchLocation] = useState("Main Campus");
  const [savingBranch, setSavingBranch] = useState(false);

  // Preview & Results
  const [activeTab, setActiveTab] = useState<"ready" | "duplicates" | "downloads" | "mapping" | "distribution">("ready");
  const [previewResult, setPreviewResult] = useState<{
    totalScanned: number;
    duplicatesCount: number;
    newStudentsCount: number;
    duplicateStudents: any[];
    previewStudents: any[];
    summary: { scanned: number; duplicates: number; readyToSeed: number };
  } | null>(null);

  const [seedResult, setSeedResult] = useState<{
    insertedCount: number;
    skippedCount: number;
    message: string;
  } | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadBackupStatus = async () => {
    try {
      const res = await fetch("/api/backup/postgres");
      const data = await res.json();
      if (data.success && data.manifest) {
        setManifest(data.manifest);
      }
    } catch (e) {
      console.error("Failed to load backup status:", e);
    }
  };

  const handleTakeBackup = async () => {
    setTakingBackup(true);
    try {
      const res = await fetch("/api/backup/postgres", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setManifest(data.manifest);
        showToast(data.message || "Fresh database backup created successfully!", "success");
      } else {
        showToast(data.error || "Backup failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create backup", "error");
    } finally {
      setTakingBackup(false);
    }
  };

  // 1. Load initial status & files
  const loadStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      await loadBackupStatus();
      const res = await fetch("/api/seed/students");
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
        setCourses(data.courses || []);
        setBranches(data.branches || []);
        setDbStats(data.dbStats || { totalStudents: 0, distribution: [] });
        setDbColumns(data.dbColumns || []);

        // Default to first file's mapping if single file selected
        if (data.files && data.files.length > 0) {
          const first = data.files[0];
          setSelectedCourseId(first.suggestedCourseId || data.courses[0]?.id || "");
          setSelectedBranchId(first.suggestedBranchId || data.branches[0]?.id || "");
          setSessionYear(first.preset?.sessionYear || "2025-2029");
          setAdmissionYear(first.preset?.admissionYear || "2025");
          setBatch(first.preset?.batch || "2025");
          setIdPrefix(first.preset?.idPrefix || "BPH25");
          setEnrollmentPrefix(first.preset?.enrollmentPrefix || "ENRBPH25");
        }
      } else {
        showToast(data.error || "Failed to load database status", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error loading seed data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // When selected file changes, update preset values
  const handleFileChange = (fileVal: string) => {
    setSelectedFile(fileVal);
    setPreviewResult(null);
    setSeedResult(null);

    if (fileVal !== "all") {
      const found = files.find(f => f.fileName === fileVal);
      if (found) {
        if (found.suggestedCourseId) setSelectedCourseId(found.suggestedCourseId);
        if (found.suggestedBranchId) setSelectedBranchId(found.suggestedBranchId);
        if (found.preset?.sessionYear) setSessionYear(found.preset.sessionYear);
        if (found.preset?.admissionYear) setAdmissionYear(found.preset.admissionYear);
        if (found.preset?.batch) setBatch(found.preset.batch);
        if (found.preset?.idPrefix) setIdPrefix(found.preset.idPrefix);
        if (found.preset?.enrollmentPrefix) setEnrollmentPrefix(found.preset.enrollmentPrefix);
      }
    }
  };

  // When course changes, auto-select corresponding branch
  const handleCourseChange = (courseIdVal: string) => {
    setSelectedCourseId(courseIdVal);
    const crs = courses.find(c => c.id === courseIdVal);
    if (crs && crs.branch_id) {
      setSelectedBranchId(crs.branch_id);
    }
  };

  // 2. File Upload Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/seed/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success && data.file) {
        showToast(data.message || `File ${file.name} uploaded successfully!`, "success");
        // Reload files list
        await loadStatus();
        // Automatically select the uploaded file
        handleFileChange(data.file.fileName);
      } else {
        showToast(data.error || "File upload failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to upload file", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 3. Action: Create New Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseCode.trim()) {
      showToast("Course Name and Code are required", "error");
      return;
    }

    setSavingCourse(true);
    try {
      const res = await fetch("/api/seed/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_course",
          name: newCourseName.trim(),
          code: newCourseCode.trim(),
          duration: Number(newCourseDuration) || 4,
          branchId: newCourseBranchId || branches[0]?.id || null,
          tuitionFee: Number(newCourseTuition) || 50000
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Course created successfully!", "success");
        setCourseModalOpen(false);
        setNewCourseName("");
        setNewCourseCode("");
        await loadStatus();
        if (data.courseId) setSelectedCourseId(data.courseId);
      } else {
        showToast(data.error || "Failed to create course", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error creating course", "error");
    } finally {
      setSavingCourse(false);
    }
  };

  // 4. Action: Create New Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) {
      showToast("Branch Name and Code are required", "error");
      return;
    }

    setSavingBranch(true);
    try {
      const res = await fetch("/api/seed/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_branch",
          name: newBranchName.trim(),
          code: newBranchCode.trim(),
          deanName: newBranchDean.trim(),
          location: newBranchLocation.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Branch created successfully!", "success");
        setBranchModalOpen(false);
        setNewBranchName("");
        setNewBranchCode("");
        setNewBranchDean("");
        await loadStatus();
        if (data.branchId) setSelectedBranchId(data.branchId);
      } else {
        showToast(data.error || "Failed to create branch", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error creating branch", "error");
    } finally {
      setSavingBranch(false);
    }
  };

  // 5. Action: Analyze & Preview Seeding
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/seed/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          fileName: selectedFile,
          courseId: selectedCourseId,
          branchId: selectedBranchId,
          sessionYear,
          admissionYear,
          batch,
          idPrefix,
          enrollmentPrefix
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewResult(data);
        showToast(`Scan complete: ${data.newStudentsCount} ready to seed, ${data.duplicatesCount} existing duplicates detected.`, "info");
      } else {
        showToast(data.error || "Analysis failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to analyze student data", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // 6. Action: Live Seed Data into PostgreSQL
  const handleSeed = async () => {
    const confirmMsg = selectedFile === "all"
      ? "Are you sure you want to seed all Excel datafiles into PostgreSQL database? All new students will be inserted with complete database fields."
      : `Are you sure you want to seed file "${selectedFile}" into PostgreSQL course "${courses.find(c => c.id === selectedCourseId)?.name || 'Selected Course'}"?`;

    if (!window.confirm(confirmMsg)) return;

    setSeeding(true);
    try {
      const res = await fetch("/api/seed/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seed",
          fileName: selectedFile,
          courseId: selectedCourseId,
          branchId: selectedBranchId,
          sessionYear,
          admissionYear,
          batch,
          idPrefix,
          enrollmentPrefix
        })
      });
      const data = await res.json();
      if (data.success) {
        setSeedResult(data);
        showToast(data.message || `Successfully seeded ${data.insertedCount} students!`, "success");
        await loadStatus();
      } else {
        showToast(data.error || "Seeding failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to seed students into database", "error");
    } finally {
      setSeeding(false);
    }
  };

  // 7. Action: Verify & Sync Courses and Branches
  const handleSyncCourses = async () => {
    setSyncingCourses(true);
    try {
      const res = await fetch("/api/seed/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_courses" })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Courses & Branches successfully verified & synced in PostgreSQL!", "success");
        await loadStatus();
      } else {
        showToast(data.error || "Failed to sync courses", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error syncing courses", "error");
    } finally {
      setSyncingCourses(false);
    }
  };

  const filteredPreviewStudents = (previewResult?.previewStudents || []).filter(s => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.father_name?.toLowerCase().includes(q) ||
      s.mobile?.includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.course_name?.toLowerCase().includes(q) ||
      s.aadhar_number?.includes(q)
    );
  });

  const filteredDuplicateStudents = (previewResult?.duplicateStudents || []).filter(s => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.dupReason?.toLowerCase().includes(q) ||
      s.mobile?.includes(q) ||
      s.aadhar?.includes(q) ||
      s.courseName?.toLowerCase().includes(q)
    );
  });

  // Table download catalog for the Download Center
  const downloadItems = [
    {
      title: "Students Records",
      table: "students",
      count: dbStats.totalStudents,
      description: "Complete roster including all 23+ personal, academic, and fee fields.",
      icon: Users,
      color: "from-blue-600 to-indigo-600"
    },
    {
      title: "Academic Courses",
      table: "courses",
      count: courses.length,
      description: "All degrees, codes, duration years, and fee templates.",
      icon: BookOpen,
      color: "from-indigo-600 to-purple-600"
    },
    {
      title: "Branches / Departments",
      table: "branches",
      count: branches.length,
      description: "Faculties, deans, contact info, and department codes.",
      icon: Building2,
      color: "from-purple-600 to-pink-600"
    },
    {
      title: "Transport & Buses",
      table: "buses",
      count: 4,
      description: "Fleet roster, drivers, conductors, routes, stops, and passenger lists.",
      icon: Bus,
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "Accounts & Fees",
      table: "fee_transactions",
      count: 351,
      description: "Historical transaction logs, fee receipts, payment modes, and balances.",
      icon: CreditCard,
      color: "from-emerald-600 to-teal-600"
    },
    {
      title: "Attendance Logs",
      table: "attendance",
      count: 26,
      description: "Daily and monthly student attendance records across departments.",
      icon: CheckCircle2,
      color: "from-cyan-600 to-blue-600"
    },
    {
      title: "Lab Inventories",
      table: "labs",
      count: 5,
      description: "Science & engineering lab facilities, equipment stock, and issue logs.",
      icon: Beaker,
      color: "from-rose-600 to-red-600"
    },
    {
      title: "Admissions Inquiries",
      table: "applications",
      count: 6,
      description: "Prospective candidate applications and onboarding records.",
      icon: FileText,
      color: "from-slate-700 to-slate-900"
    }
  ];

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all duration-300 ${
          toastMessage.type === "success" 
            ? "bg-emerald-950/95 border-emerald-500/50 text-emerald-200" 
            : toastMessage.type === "error" 
            ? "bg-rose-950/95 border-rose-500/50 text-rose-200" 
            : "bg-blue-950/95 border-blue-500/50 text-blue-200"
        }`}>
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === "info" && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Neon PostgreSQL Central Hub
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Database Seed & Universal Download Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Upload any student Excel file, map directly to any Course & Branch, preview duplicate safety checks, and seed data into PostgreSQL. Download complete backups for Courses, Branches, Buses, Students, Accounts, and Attendance anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCourseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
            <button
              onClick={() => setBranchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
            <button
              onClick={() => loadStatus(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
              Refresh DB
            </button>
          </div>
        </div>
      </div>

      {/* Universal Database Download & Safety Center */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zero-Risk Database Backup & Universal Download Center
              </div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Download Database Tables (Excel & JSON)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                One-click direct export for any dataset in PostgreSQL. Includes individual Excel tables (.xlsx), JSON data, and complete SQL dump.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/api/backup/postgres?download=sql"
                download="full_postgres_backup.sql"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition shadow-sm"
              >
                <FolderDown className="w-4 h-4 text-emerald-400" />
                Full SQL Dump
              </a>

              <a
                href="/api/backup/postgres?download=json"
                download="full_postgres_backup.json"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition shadow-sm"
              >
                <FolderDown className="w-4 h-4 text-blue-400" />
                Full JSON Dump
              </a>

              <button
                onClick={handleTakeBackup}
                disabled={takingBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${takingBackup ? "animate-spin text-slate-950" : ""}`} />
                {takingBackup ? "Archiving..." : "Take Fresh Snapshot"}
              </button>
            </div>
          </div>

          {/* Table-by-Table Download Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {downloadItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.table} className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 rounded-2xl p-4 flex flex-col justify-between transition group">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600">
                        {item.count} rows
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm mt-3">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{item.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <a
                      href={`/api/backup/postgres?table=${item.table}&format=xlsx`}
                      download={`${item.table}_export.xlsx`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition text-center"
                    >
                      <Download className="w-3.5 h-3.5" /> Excel (.xlsx)
                    </a>
                    <a
                      href={`/api/backup/postgres?table=${item.table}&format=json`}
                      download={`${item.table}_export.json`}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition"
                      title="Download as JSON"
                    >
                      JSON
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PostgreSQL Students</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{dbStats.totalStudents}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Active student records in Neon DB
          </p>
        </div>

        {/* Card 2: Courses in DB */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Courses</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{courses.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            Across {branches.length} academic branches
          </p>
        </div>

        {/* Card 3: Detected Datafiles */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Files</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{files.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            In public/datafiles repository
          </p>
        </div>

        {/* Card 4: Integrity Protection */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collision Shield</p>
              <h3 className="text-xl font-black text-emerald-600 mt-1">100% Guarded</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            Aadhar, Email, Mobile duplicate check
          </p>
        </div>
      </div>

      {/* Upload New Excel File Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Upload Student Excel File
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload any student Excel file (.xlsx, .xls, .csv). It will automatically be parsed, scanned for headers, and made ready to map with any course and seed into PostgreSQL.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="student-excel-upload"
            />
            <label
              htmlFor="student-excel-upload"
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition shadow-lg shadow-indigo-600/25 ${
                uploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Uploading & Scanning...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Choose Excel File to Upload
                </>
              )}
            </label>
          </div>
        </div>

        {/* Dropzone preview area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-8 text-center cursor-pointer transition group"
        >
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Click here to upload your student Excel file or drag & drop
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports .xlsx, .xls, and .csv files. Automatically detects student name, mobile, father name, aadhar, and fee fields.
          </p>
        </div>
      </div>

      {/* Main Configuration & Action Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Student Seed Configuration Console
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an uploaded Excel file or choose from detected files. Select target course and branch, then analyze and seed students data into PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || seeding}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                  Analyzing Database...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-slate-600" />
                  Analyze & Preview Seeding
                </>
              )}
            </button>

            <button
              onClick={handleSeed}
              disabled={analyzing || seeding}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              {seeding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Writing to PostgreSQL...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Seed Data into PostgreSQL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {/* File Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Source Excel Datafile
            </label>
            <select
              value={selectedFile}
              onChange={(e) => handleFileChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">⚡ All Files (Batch Seed All Courses)</option>
              {files.map(f => (
                <option key={f.fileName} value={f.fileName}>
                  📄 {f.fileName} ({f.rowCount} rows)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {selectedFile === "all" ? "Processes all files in public/datafiles" : `Rows: ${files.find(f => f.fileName === selectedFile)?.rowCount || 0}`}
            </p>
          </div>

          {/* Target Course */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Course
              </label>
              <button
                type="button"
                onClick={() => setCourseModalOpen(true)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              disabled={selectedFile === "all"}
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${selectedFile === "all" ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.duration} Yrs
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {selectedFile === "all" ? "Auto-matched per file" : "PostgreSQL course linked"}
            </p>
          </div>

          {/* Target Branch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Branch
              </label>
              <button
                type="button"
                onClick={() => setBranchModalOpen(true)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={selectedFile === "all"}
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${selectedFile === "all" ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {selectedFile === "all" ? "Auto-matched per course" : "Academic branch department"}
            </p>
          </div>

          {/* Session Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Session Year
            </label>
            <input
              type="text"
              value={sessionYear}
              onChange={(e) => setSessionYear(e.target.value)}
              disabled={selectedFile === "all"}
              placeholder="e.g. 2025-2029"
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${selectedFile === "all" ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">Academic batch cycle</p>
          </div>

          {/* Student ID Prefix */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Student ID Prefix
            </label>
            <input
              type="text"
              value={idPrefix}
              onChange={(e) => setIdPrefix(e.target.value)}
              disabled={selectedFile === "all"}
              placeholder="e.g. BPH25"
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${selectedFile === "all" ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">Generates {idPrefix}001, {idPrefix}002...</p>
          </div>

          {/* Enrollment Prefix */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Enrollment Prefix
            </label>
            <input
              type="text"
              value={enrollmentPrefix}
              onChange={(e) => setEnrollmentPrefix(e.target.value)}
              disabled={selectedFile === "all"}
              placeholder="e.g. ENRBPH25"
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${selectedFile === "all" ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">University enrollment code</p>
          </div>

          {/* Admission Year & Batch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Admission Year / Batch
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                disabled={selectedFile === "all"}
                placeholder="2025"
                className={`w-1/2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${selectedFile === "all" ? "opacity-60 cursor-not-allowed" : ""}`}
              />
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                disabled={selectedFile === "all"}
                placeholder="2025"
                className={`w-1/2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${selectedFile === "all" ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Admission Year & Batch tag</p>
          </div>

          {/* Default Password Notice */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                Default Credentials
              </div>
              <p className="text-xs text-indigo-700 mt-1 font-medium">
                Initial password: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">Maya@123</span>
              </p>
            </div>
            <p className="text-[11px] text-indigo-500 mt-2">Bcrypt 10-round salted hash</p>
          </div>
        </div>

        {/* Live Seed Success Banner */}
        {seedResult && (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-950">Seeding Execution Completed Successfully!</h3>
                <p className="text-sm text-emerald-800 mt-1 font-medium">{seedResult.message}</p>
                <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-emerald-200/60 text-xs font-bold">
                  <div>
                    <span className="text-emerald-600 uppercase tracking-wider">New Inserted: </span>
                    <span className="text-emerald-950 text-base">{seedResult.insertedCount}</span>
                  </div>
                  <div>
                    <span className="text-emerald-600 uppercase tracking-wider">Duplicates Skipped: </span>
                    <span className="text-emerald-950 text-base">{seedResult.skippedCount}</span>
                  </div>
                  <div>
                    <span className="text-emerald-600 uppercase tracking-wider">PostgreSQL Status: </span>
                    <span className="text-emerald-950 text-base">Committed & Cache Purged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Preview Card (when analyzed) */}
      {previewResult && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Pre-Execution Analysis & Duplicate Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Scanned {previewResult.totalScanned} rows across files. Verified against PostgreSQL existing records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter preview list..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-56"
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Total Rows Scanned</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{previewResult.totalScanned}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-slate-400" />
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase">Ready To Seed (New)</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{previewResult.newStudentsCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase">Already In DB (Skipped)</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{previewResult.duplicatesCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
            <button
              onClick={() => setActiveTab("ready")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === "ready"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Ready To Seed ({previewResult.newStudentsCount})
            </button>

            <button
              onClick={() => setActiveTab("duplicates")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === "duplicates"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Skipped Duplicates ({previewResult.duplicatesCount})
            </button>

            <button
              onClick={() => setActiveTab("mapping")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === "mapping"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              Field Mapping Matrix
            </button>

            <button
              onClick={() => setActiveTab("distribution")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === "distribution"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Database className="w-4 h-4 text-indigo-600" />
              Current PostgreSQL Roster
            </button>
          </div>

          {/* TAB 1: READY TO SEED TABLE */}
          {activeTab === "ready" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[500px]">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Student ID / Enr</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Father & Mother</th>
                    <th className="py-3 px-4">Course & Session</th>
                    <th className="py-3 px-4">Mobile / Email</th>
                    <th className="py-3 px-4">Aadhar / PAN</th>
                    <th className="py-3 px-4">Category / Rel</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Tuition Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreviewStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No new students found to seed in this selection.
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {s.student_id}
                          <p className="text-[10px] text-slate-400 font-mono">{s.enrollment_number}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{s.first_name} {s.middle_name} {s.last_name}</p>
                          <p className="text-[10px] text-slate-400">{s.gender} • DOB: {s.dob}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">F: {s.father_name || "—"}</p>
                          <p className="text-[10px] text-slate-500">M: {s.mother_name || "—"}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                            {s.course_name}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.session_year}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800 font-medium">{s.mobile}</p>
                          <p className="text-[10px] text-slate-400">{s.email}</p>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <p className="text-slate-800">{s.aadhar_number || "—"}</p>
                          {s.pan_number && <p className="text-[10px] text-slate-400">PAN: {s.pan_number}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-700">{s.caste_category || "GEN"}</span>
                          <p className="text-[10px] text-slate-400">{s.religion}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800">{s.city}, {s.state}</p>
                          <p className="text-[10px] text-slate-400">{s.pin_code}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">
                          ₹{Number(s.tuition_fee).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: SKIPPED DUPLICATES */}
          {activeTab === "duplicates" && (
            <div className="overflow-x-auto rounded-2xl border border-amber-200 max-h-[500px]">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-amber-50/70 border-b border-amber-200 text-amber-950 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Source File</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Course / Session</th>
                    <th className="py-3 px-4">Contact & Aadhar</th>
                    <th className="py-3 px-4">Duplicate Protection Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {filteredDuplicateStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        No duplicates detected in this file selection.
                      </td>
                    </tr>
                  ) : (
                    filteredDuplicateStudents.map((d, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {d.fileName} (Row {d.rowNumber})
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {d.name}
                          {d.fatherName && <p className="text-[10px] text-slate-400 font-normal">Father: {d.fatherName}</p>}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {d.courseName} ({d.sessionYear})
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800">{d.mobile || "—"}</p>
                          <p className="text-[10px] font-mono text-slate-400">{d.aadhar || d.email || ""}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            {d.dupReason}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: SCHEMA & FIELD MAPPING MATRIX */}
          {activeTab === "mapping" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  Excel Datafile Columns (23+ Fields)
                </h4>
                <ul className="space-y-2 text-xs">
                  {[
                    { excel: "Student NAME", pg: "first_name, middle_name, last_name" },
                    { excel: "FATHER NAME", pg: "father_name & documents.fatherName" },
                    { excel: "MOTHER NAME", pg: "mother_name & documents.motherName" },
                    { excel: "CASTE CATEGORY", pg: "caste_category & documents.casteCategory" },
                    { excel: "RELEGION / RELIGION", pg: "religion" },
                    { excel: "APPLICANTS MOBILE", pg: "mobile" },
                    { excel: "PARENT MOBILE", pg: "parent_mobile" },
                    { excel: "EMAIL", pg: "email" },
                    { excel: "GENDER", pg: "gender (Normalized: Male/Female)" },
                    { excel: "DOB", pg: "dob (Normalized: YYYY-MM-DD)" },
                    { excel: "ADDRESS 1 & 2", pg: "address" },
                    { excel: "CITY, STATE, ZIPCODE", pg: "city, state, pin_code" },
                    { excel: "AADHAR", pg: "aadhar_number" },
                    { excel: "PAN", pg: "pan_number & documents.panNumber" },
                    { excel: "GRN No.", pg: "grn_number" },
                    { excel: "ADMISSION FORM DATE", pg: "admission_form_date" },
                    { excel: "ENROLLMENT DATE", pg: "enrollment_date" },
                    { excel: "CASTE CERTIFICATE NUMBER", pg: "caste_certificate_number" }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                      <span className="font-bold text-slate-700">{item.excel}</span>
                      <span className="font-mono text-indigo-600 text-[11px] bg-indigo-50 px-2 py-0.5 rounded">{item.pg}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  PostgreSQL Students Table Schema
                </h4>
                <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-2">
                  {dbColumns.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-xs">
                      <span className="font-mono font-bold text-slate-800">{c.column_name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{c.data_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CURRENT DATABASE DISTRIBUTION */}
          {activeTab === "distribution" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4">Course Name</th>
                    <th className="py-3 px-4">Session Year</th>
                    <th className="py-3 px-4">Current Enrolled Students</th>
                    <th className="py-3 px-4">Database Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbStats.distribution.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.course_name || "Unassigned"}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{d.session_year || "—"}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600 text-sm">{d.count}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Neon PostgreSQL
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Available Datafiles Card Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Detected Datafiles Repository
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Files stored in <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700 font-bold">public/datafiles</code>. Click any file to select it for custom course and branch seeding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {files.map((f) => {
            const isSelected = selectedFile === f.fileName;
            const matchedCourse = courses.find(c => c.id === f.suggestedCourseId);

            return (
              <div
                key={f.fileName}
                onClick={() => handleFileChange(f.fileName)}
                className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-50/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {(f.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-3 line-clamp-1" title={f.fileName}>
                    {f.fileName}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <p className="text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Total Rows:</span>
                      <span className="font-bold text-slate-800">{f.rowCount}</span>
                    </p>
                    <p className="text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Detected Session:</span>
                      <span className="font-semibold text-slate-800">{f.preset?.sessionYear || "—"}</span>
                    </p>
                    <p className="text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Target Course:</span>
                      <span className="font-semibold text-indigo-600 line-clamp-1">{matchedCourse?.name || f.preset?.courseNameHint || "Auto"}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isSelected ? "text-indigo-600" : "text-slate-400"}`}>
                    {isSelected ? "Selected for Seeding" : "Click to select"}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: ADD & SEED COURSE */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Add & Seed New Course</h3>
                  <p className="text-xs text-slate-400">Creates course in PostgreSQL with automatic fee template</p>
                </div>
              </div>
              <button 
                onClick={() => setCourseModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration (Years)
                  </label>
                  <select
                    value={newCourseDuration}
                    onChange={(e) => setNewCourseDuration(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="4">4 Years</option>
                    <option value="5">5 Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Branch
                </label>
                <select
                  value={newCourseBranchId}
                  onChange={(e) => setNewCourseBranchId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="">Select Branch...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual Tuition Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="65000"
                  value={newCourseTuition}
                  onChange={(e) => setNewCourseTuition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {savingCourse ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Check className="w-4 h-4" />}
                  {savingCourse ? "Saving..." : "Seed Course in PostgreSQL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD & SEED BRANCH */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Add & Seed New Branch</h3>
                  <p className="text-xs text-slate-400">Creates academic branch/faculty in PostgreSQL</p>
                </div>
              </div>
              <button 
                onClick={() => setBranchModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Branch / Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. School of Pharmaceutical Sciences"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Branch Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHARM"
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dean / Department Head
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={newBranchDean}
                  onChange={(e) => setNewBranchDean(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Campus Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block B, Hathras Campus"
                  value={newBranchLocation}
                  onChange={(e) => setNewBranchLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBranchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBranch}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {savingBranch ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Check className="w-4 h-4" />}
                  {savingBranch ? "Saving..." : "Seed Branch in PostgreSQL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

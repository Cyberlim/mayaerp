"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  CheckCircle, 
  XCircle,
  User,
  GraduationCap,
  FileText,
  Loader2,
  AlertCircle,
  Building2,
  Briefcase,
  Settings2,
  Layers,
  BookOpen
} from "lucide-react";

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useParams();
  
  const [app, setApp] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  
  // Approval / Course & Branch Assignment Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    selectedBranch: "",
    selectedProgram: "",
    sessionYear: "2024-2025",
    batch: "2024-2028",
    selectedSemester: 1,
    selectedSection: "A",
    studentId: "",
    admissionNumber: "",
    feesYears: [] as any[]
  });

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const [appRes, coursesRes, branchesRes] = await Promise.all([
        fetch(`/api/applications/${id}`),
        fetch('/api/courses'),
        fetch('/api/branches')
      ]);
      
      if (!appRes.ok) throw new Error("Application not found");
      const appData = await appRes.json();
      const coursesData = await coursesRes.json();
      const branchesData = await branchesRes.json();
      
      setApp(appData);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenApprovalModal = async () => {
    const course = courses.find(c => (c.id || c._id) === app.selectedProgram || c.name === app.selectedProgram);
    const branch = branches.find(b => (b.id || b._id) === app.selectedBranch || b.name === app.selectedBranch || (course && (course.branchId === b.id || course.branch_id === b.id)));
    
    const chosenCourseId = course?.id || course?._id || app.selectedProgram || (courses[0]?.id || "");
    const chosenBranchId = branch?.id || branch?._id || course?.branchId || course?.branch_id || app.selectedBranch || (branches[0]?.id || "");
    
    const courseCode = course?.name ? course.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() : "CRS";
    
    let rollCount = 0;
    try {
      const countRes = await fetch(`/api/students?selectedProgram=${chosenCourseId}&countOnly=true`);
      if (countRes.ok) {
        const countData = await countRes.json();
        rollCount = countData.count || 0;
      }
    } catch (e) {
      console.error("Failed to fetch student count", e);
    }

    const year = new Date().getFullYear();
    const sequentialRoll = (rollCount + 1).toString().padStart(3, '0');
    
    const defaultStudentId = app.studentId || `${year}${courseCode}${sequentialRoll}`;
    const defaultAdmissionNo = app.admissionNumber || `${year}${courseCode}${sequentialRoll}`;
    const duration = course?.duration || 4;
    const sessionYear = app.sessionYear || `${year}-${year + 1}`;
    const batch = app.batch || `${year}-${year + duration}`;

    const initialFees = Array.from({ length: duration }).map((_, idx) => ({
      year: idx + 1,
      tuition: course?.baseFee || course?.base_fee || 45000,
      exam: 2500,
      transport: 0,
      other: 1000
    }));

    setApprovalData({
      selectedBranch: chosenBranchId,
      selectedProgram: chosenCourseId,
      sessionYear: sessionYear,
      batch: batch,
      selectedSemester: app.selectedSemester || 1,
      selectedSection: app.selectedSection || "A",
      studentId: defaultStudentId,
      admissionNumber: defaultAdmissionNo,
      feesYears: initialFees
    });
    
    setIsApprovalModalOpen(true);
  };

  const filteredCourses = approvalData.selectedBranch
    ? courses.filter(c => (c.branchId === approvalData.selectedBranch || c.branch_id === approvalData.selectedBranch || c.branchName === branches.find(b => (b.id || b._id) === approvalData.selectedBranch)?.name))
    : courses;
  const activeCourses = filteredCourses.length > 0 ? filteredCourses : courses;

  const handleBranchChange = (newBranchId: string) => {
    const branchCourses = courses.filter(c => c.branchId === newBranchId || c.branch_id === newBranchId);
    let newCourseId = approvalData.selectedProgram;
    if (branchCourses.length > 0 && !branchCourses.some(c => (c.id || c._id) === approvalData.selectedProgram)) {
      newCourseId = branchCourses[0].id || branchCourses[0]._id;
    }
    
    setApprovalData(prev => ({
      ...prev,
      selectedBranch: newBranchId,
      selectedProgram: newCourseId
    }));

    if (newCourseId !== approvalData.selectedProgram) {
      handleCourseChange(newCourseId, newBranchId);
    }
  };

  const handleCourseChange = (newCourseId: string, overrideBranchId?: string) => {
    const course = courses.find(c => (c.id || c._id) === newCourseId || c.name === newCourseId);
    const duration = course?.duration || 4;
    const courseCode = course?.name ? course.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() : "CRS";
    
    const year = new Date().getFullYear();
    const branchId = overrideBranchId || course?.branchId || course?.branch_id || approvalData.selectedBranch;
    
    const initialFees = Array.from({ length: duration }).map((_, idx) => ({
      year: idx + 1,
      tuition: course?.baseFee || course?.base_fee || 45000,
      exam: 2500,
      transport: 0,
      other: 1000
    }));

    setApprovalData(prev => ({
      ...prev,
      selectedBranch: branchId,
      selectedProgram: newCourseId,
      batch: prev.sessionYear ? `${prev.sessionYear.split('-')[0]}-${Number(prev.sessionYear.split('-')[0]) + duration}` : prev.batch,
      studentId: prev.studentId.includes(courseCode) ? prev.studentId : `${year}${courseCode}001`,
      admissionNumber: prev.admissionNumber.includes(courseCode) ? prev.admissionNumber : `${year}${courseCode}001`,
      feesYears: initialFees
    }));
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const selectedCourseObj = courses.find(c => (c.id || c._id) === approvalData.selectedProgram || c.name === approvalData.selectedProgram);
      const selectedBranchObj = branches.find(b => (b.id || b._id) === approvalData.selectedBranch || b.name === approvalData.selectedBranch);

      const payload: any = { 
        status: newStatus,
        selectedBranch: approvalData.selectedBranch,
        branchName: selectedBranchObj?.name || "",
        selectedProgram: approvalData.selectedProgram,
        courseName: selectedCourseObj?.name || "",
        courseDuration: selectedCourseObj?.duration || 4,
        sessionYear: approvalData.sessionYear,
        batch: approvalData.batch,
        selectedSemester: approvalData.selectedSemester,
        selectedSection: approvalData.selectedSection,
        studentId: approvalData.studentId,
        admissionNumber: approvalData.admissionNumber,
        feesYears: approvalData.feesYears
      };

      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update status");
      }
      
      const updatedApp = await res.json();
      setApp(updatedApp);
      setIsApprovalModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  const handleFeeChange = (yearIdx: number, field: string, value: string) => {
    const updatedFees = [...approvalData.feesYears];
    updatedFees[yearIdx][field] = Number(value) || 0;
    setApprovalData({ ...approvalData, feesYears: updatedFees });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-6 bg-rose-50 rounded-2xl flex items-center gap-3 text-rose-600 font-bold">
        <AlertCircle className="w-6 h-6" />
        {error || "Application not found"}
      </div>
    );
  }

  const getStatusBannerColor = () => {
    if (app.status === "Approved" || app.status === "Accepted") return "from-emerald-500 to-teal-400 shadow-emerald-500/20";
    if (app.status === "Rejected") return "from-rose-600 to-pink-500 shadow-rose-500/20";
    return "from-amber-500 to-orange-400 shadow-amber-500/20";
  };

  const currentCourse = courses.find(c => (c.id || c._id) === app.selectedProgram || c.name === app.selectedProgram);
  const currentBranch = branches.find(b => (b.id || b._id) === app.selectedBranch || b.name === app.selectedBranch);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          {app.status === "Pending" && (
            <>
              <button
                onClick={() => handleUpdateStatus("Rejected")}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
              <button
                onClick={handleOpenApprovalModal}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Approve & Enroll...
              </button>
            </>
          )}

          {(app.status === "Approved" || app.status === "Accepted") && (
            <button
              onClick={handleOpenApprovalModal}
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-indigo-200 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 shadow-sm transition-all"
            >
              <Settings2 className="w-4 h-4 text-indigo-600" />
              Change Course / Branch
            </button>
          )}
        </div>
      </div>

      {/* Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${getStatusBannerColor()} p-8 rounded-3xl text-white shadow-xl relative overflow-hidden`}
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 text-3xl font-black shadow-lg">
              {app.firstName?.substring(0,1)}{app.lastName?.substring(0,1)}
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                {app.status}
              </div>
              <h1 className="text-3xl font-black tracking-tight">{app.firstName} {app.lastName}</h1>
              <p className="text-white/90 font-semibold text-lg mt-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {app.courseName || currentCourse?.name || app.selectedProgram}
                {(app.branchName || currentBranch?.name || app.selectedBranch) && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-bold">
                    {app.branchName || currentBranch?.name || app.selectedBranch}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm font-bold uppercase tracking-wider">Application ID</p>
            <p className="font-mono text-lg font-bold">{app._id || app.id}</p>
            {app.studentId && (
              <p className="text-xs text-white/90 font-mono mt-1">Student ID: {app.studentId}</p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <User className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800">Personal Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <DetailRow label="Date of Birth" value={app.dob} />
            <DetailRow label="Gender" value={app.gender} />
            <DetailRow label="Email" value={app.email} />
            <DetailRow label="Mobile" value={app.mobile} />
            <DetailRow label="Category" value={app.category} />
            <DetailRow label="Address" value={`${app.address || ''}, ${app.city || ''}, ${app.state || ''} - ${app.pinCode || ''}`} />
          </div>
        </motion.div>

        {/* Academic Background */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-slate-800">Academic Background</h2>
          </div>
          <div className="p-6 space-y-4">
            <DetailRow label="Selected Course" value={app.courseName || currentCourse?.name || app.selectedProgram} />
            <DetailRow label="Selected Branch" value={app.branchName || currentBranch?.name || app.selectedBranch || "N/A"} />
            <DetailRow label="Highest Qualification" value={app.highestQualification} />
            <DetailRow label="Institution" value={app.institutionName} />
            <DetailRow label="Board/University" value={app.boardUniversity} />
            <DetailRow label="Percentage / CGPA" value={app.percentageCGPA} />
            <DetailRow label="Year of Passing" value={app.yearOfPassing} />
            {app.entranceScore && <DetailRow label="Entrance Score" value={app.entranceScore} />}
          </div>
        </motion.div>
      </div>

      {/* Approval & Academic Configuration Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-500" /> 
                  {app.status === 'Approved' ? 'Update Course & Branch Assignment' : 'Enrollment & Academic Configuration'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign branch, course, academic session, batch, and fees synced to PostgreSQL & MongoDB
                </p>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Academic Placement (Course & Branch Selection) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Academic Placement
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Course & Branch Allocation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Branch Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned Branch / Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={approvalData.selectedBranch}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id || b._id} value={b.id || b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course / Program Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enrolled Course / Program <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={approvalData.selectedProgram}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select Course</option>
                      {activeCourses.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name} ({c.duration || 4} Years)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Session Year */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Academic Session Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2027"
                      value={approvalData.sessionYear}
                      onChange={(e) => setApprovalData({ ...approvalData, sessionYear: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Batch */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Batch</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2030"
                      value={approvalData.batch}
                      onChange={(e) => setApprovalData({ ...approvalData, batch: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Semester</label>
                    <select
                      value={approvalData.selectedSemester}
                      onChange={(e) => setApprovalData({ ...approvalData, selectedSemester: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      placeholder="A, B, or C"
                      value={approvalData.selectedSection}
                      onChange={(e) => setApprovalData({ ...approvalData, selectedSection: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* IDs Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Student Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student ID (Auto-generated)</label>
                    <input 
                      type="text" 
                      value={approvalData.studentId}
                      onChange={(e) => setApprovalData({...approvalData, studentId: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admission Number</label>
                    <input 
                      type="text" 
                      value={approvalData.admissionNumber}
                      onChange={(e) => setApprovalData({...approvalData, admissionNumber: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Year-wise Fees Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  Year-wise Fees Structure
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md lowercase tracking-normal">
                    {approvalData.feesYears.length} academic years
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {approvalData.feesYears.map((fee, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-800 mb-3 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                        Academic Year {fee.year}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tuition Fee</label>
                          <input type="number" value={fee.tuition} onChange={(e) => handleFeeChange(idx, 'tuition', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exam Fee</label>
                          <input type="number" value={fee.exam} onChange={(e) => handleFeeChange(idx, 'exam', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Transport Fee</label>
                          <input type="number" value={fee.transport} onChange={(e) => handleFeeChange(idx, 'transport', e.target.value)} className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Other Fee</label>
                          <input type="number" value={fee.other} onChange={(e) => handleFeeChange(idx, 'other', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 sticky bottom-0">
              <button onClick={() => setIsApprovalModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus("Approved")}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {app.status === 'Approved' ? 'Save & Update Placement' : 'Confirm & Enroll Student'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value || "N/A"}</span>
    </div>
  );
}

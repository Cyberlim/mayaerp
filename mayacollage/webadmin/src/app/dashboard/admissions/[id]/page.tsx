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
  AlertCircle
} from "lucide-react";

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useParams();
  
  const [app, setApp] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  
  // Approval Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    studentId: "",
    admissionNumber: "",
    feesYears: [] as any[]
  });

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const [appRes, coursesRes] = await Promise.all([
        fetch(`/api/applications/${id}`),
        fetch('/api/courses')
      ]);
      
      if (!appRes.ok) throw new Error("Application not found");
      const appData = await appRes.json();
      const coursesData = await coursesRes.json();
      
      setApp(appData);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenApprovalModal = async () => {
    // Determine course duration and code
    const course = courses.find(c => c._id === app.selectedProgram);
    const courseCode = course?.name ? course.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() : "CRS";
    
    // Fetch previous student count for this program to generate sequential roll no
    let rollCount = 0;
    try {
      const countRes = await fetch(`/api/students?selectedProgram=${app.selectedProgram}&countOnly=true`);
      if (countRes.ok) {
        const countData = await countRes.json();
        rollCount = countData.count || 0;
      }
    } catch (e) {
      console.error("Failed to fetch student count", e);
    }

    const year = new Date().getFullYear();
    const sequentialRoll = (rollCount + 1).toString().padStart(3, '0');
    
    const defaultStudentId = `${year}${courseCode}${sequentialRoll}`;
    const defaultAdmissionNo = `${year}${courseCode}${sequentialRoll}`;

    const duration = course?.duration || 4; // Default to 4 years if unknown

    const initialFees = Array.from({ length: duration }).map((_, idx) => ({
      year: idx + 1,
      tuition: course?.baseFee || 0,
      exam: 0,
      transport: 0,
      other: 0
    }));

    setApprovalData({
      studentId: defaultStudentId,
      admissionNumber: defaultAdmissionNo,
      feesYears: initialFees
    });
    
    setIsApprovalModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const payload: any = { status: newStatus };
      if (newStatus === "Approved") {
        payload.studentId = approvalData.studentId;
        payload.admissionNumber = approvalData.admissionNumber;
        payload.feesYears = approvalData.feesYears;
      }

      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
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
        
        {app.status === "Pending" && (
          <div className="flex items-center gap-3">
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
              Approve...
            </button>
          </div>
        )}
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
              {app.firstName.substring(0,1)}{app.lastName.substring(0,1)}
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                {app.status}
              </div>
              <h1 className="text-3xl font-black tracking-tight">{app.firstName} {app.lastName}</h1>
              <p className="text-white/80 font-medium text-lg mt-1">
                {courses.find(c => c._id === app.selectedProgram)?.name || app.selectedProgram}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm font-bold uppercase tracking-wider">Application ID</p>
            <p className="font-mono text-lg font-bold">{app._id}</p>
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
            <DetailRow label="Address" value={`${app.address}, ${app.city}, ${app.state} - ${app.pinCode}`} />
          </div>
        </motion.div>

        {/* Academic Background */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-slate-800">Academic Background</h2>
          </div>
          <div className="p-6 space-y-4">
            <DetailRow label="Highest Qualification" value={app.highestQualification} />
            <DetailRow label="Institution" value={app.institutionName} />
            <DetailRow label="Board/University" value={app.boardUniversity} />
            <DetailRow label="Percentage / CGPA" value={app.percentageCGPA} />
            <DetailRow label="Year of Passing" value={app.yearOfPassing} />
            {app.entranceScore && <DetailRow label="Entrance Score" value={app.entranceScore} />}
          </div>
        </motion.div>
      </div>

      {/* Approval Configuration Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" /> 
                Approval Configuration
              </h2>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* IDs Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Student Identity</h3>
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
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  Year-wise Fees Structure
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md lowercase tracking-normal">
                    {approvalData.feesYears.length} years detected
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {approvalData.feesYears.map((fee, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-800 mb-3 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                        Year {fee.year}
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
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm & Enroll Student
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

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
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) throw new Error("Application not found");
      const data = await res.json();
      setApp(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      const updatedApp = await res.json();
      setApp(updatedApp);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
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
              onClick={() => handleUpdateStatus("Approved")}
              disabled={isUpdating}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Approve Application
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
              <p className="text-white/80 font-medium text-lg mt-1">{app.selectedProgram}</p>
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

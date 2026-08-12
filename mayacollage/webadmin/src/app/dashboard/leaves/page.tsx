"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, Check, X, Clock } from "lucide-react";

export default function AdminLeavesScreen() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/leaves");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAction = async (leaveId: string, status: string) => {
    setActionLoading(leaveId);
    try {
      const res = await fetch("/api/admin/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
          <Calendar className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Review and process staff leave requests</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaves.map((leave, idx) => (
            <motion.div
              key={leave._id || idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                    {leave.userId?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {leave.userId ? `${leave.userId.firstName} ${leave.userId.lastName}` : 'Unknown User'}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {leave.userId?.role || 'Staff'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(leave.status)}`}>
                  {leave.status || 'Pending'}
                </span>
              </div>

              <div className="flex items-center gap-6 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Leave Type</p>
                  <p className="text-sm font-bold text-slate-800">{leave.leaveType || 'General'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="mb-8 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reason for Leave</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  {leave.reason}
                </p>
              </div>

              {leave.status === 'Pending' && (
                <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-50">
                  <button 
                    onClick={() => handleAction(leave._id, 'Approved')}
                    disabled={actionLoading === leave._id}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {actionLoading === leave._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(leave._id, 'Rejected')}
                    disabled={actionLoading === leave._id}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {actionLoading === leave._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          {leaves.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No leave requests found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

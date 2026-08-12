"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function StaffLeaveScreen() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/staff/leave");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staff/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, startDate, endDate, reason }),
      });
      if (res.ok) {
        setShowForm(false);
        setLeaveType("Casual Leave");
        setStartDate("");
        setEndDate("");
        setReason("");
        fetchLeaves(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Approved': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'Rejected': return 'bg-rose-50 border-rose-200 text-rose-700';
      default: return 'bg-amber-50 border-amber-200 text-amber-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Premium Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg border border-emerald-100/50 mb-10 p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-emerald-500/20 border border-emerald-100">
            <div className="w-full h-full bg-slate-50 rounded-[1.5rem] flex items-center justify-center">
              <Calendar className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-1">Time Off</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Leave Management</h1>
          </div>
        </div>

        <div className="relative z-10">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1"
          >
            {showForm ? "Cancel Application" : <><Plus className="w-5 h-5" /> Apply Leave</>}
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-4">New Leave Application</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Leave Type</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full bg-slate-50 border border-slate-100 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>Duty Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="w-full bg-slate-50 border border-slate-100 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Brief reason for leave..." />
            </div>
            <div className="flex justify-end">
              <button disabled={isSubmitting} type="submit" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Casual Leave", total: 12, taken: leaves.filter(l => l.leaveType === 'Casual Leave' && l.status === 'Approved').length },
          { label: "Sick Leave", total: 10, taken: leaves.filter(l => l.leaveType === 'Sick Leave' && l.status === 'Approved').length },
          { label: "Earned Leave", total: 15, taken: leaves.filter(l => l.leaveType === 'Earned Leave' && l.status === 'Approved').length },
          { label: "Duty Leave", total: 5, taken: leaves.filter(l => l.leaveType === 'Duty Leave' && l.status === 'Approved').length },
        ].map((bal, idx) => (
          <motion.div
            key={bal.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
          >
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{bal.label}</h4>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-900">{bal.total - bal.taken}</span>
              <span className="text-sm font-bold text-slate-500 mb-1">/ {bal.total} Left</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* History */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-black text-slate-800">Leave History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Leave Type</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Duration</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Reason</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{leave.leaveType}</td>
                  <td className="py-4 px-6 font-semibold text-slate-600">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600 truncate max-w-[200px]">{leave.reason}</td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(leave.status)}`}>
                      {getStatusIcon(leave.status)}
                      <span className="text-xs font-black uppercase tracking-wider">{leave.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                    No leave history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

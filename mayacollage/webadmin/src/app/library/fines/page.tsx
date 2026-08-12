"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Banknote, AlertCircle, BookOpen, Search, 
  CheckCircle2, User, Calendar, Loader2
} from "lucide-react";
import dayjs from "dayjs";

export default function FinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      const res = await fetch("/api/library/circulation");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter only those with fines
        setFines(data.filter(tx => tx.fine > 0));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayFine = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/library/pay-fine/${id}`, { method: "PUT" });
      if (res.ok) {
        alert("Fine collected! The book loan has been renewed.");
        fetchFines();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to process payment");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredFines = fines.filter(f => 
    f.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    f.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    f.book?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPendingFines = fines.reduce((sum, f) => sum + f.fine, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Banknote className="text-violet-600" /> Fines & Dues
          </h1>
          <p className="text-slate-500 font-medium mt-1">Collect penalty fees for overdue books</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="px-6 py-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-rose-500">Total Pending</span>
            <span className="text-xl font-black text-rose-600">₹{totalPendingFines}</span>
          </div>
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search student or book..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          </div>
        ) : filteredFines.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-700">All clear!</h3>
            <p className="text-slate-500 mt-2 font-medium">There are no pending fines or overdue books.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredFines.map((fine, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: 0.05 * i }}
                  key={fine._id} 
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-rose-200 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{fine.student?.firstName} {fine.student?.lastName}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> ID: {fine.student?.studentId || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> {fine.book?.title}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-rose-400" /> Due: {dayjs(fine.dueDate).format('DD MMM YYYY')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <div className="text-right flex-1 md:flex-none">
                      <span className="block text-2xl font-black text-rose-600">₹{fine.fine}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penalty Amount</span>
                    </div>
                    <button 
                      onClick={() => handlePayFine(fine._id)}
                      disabled={processingId === fine._id}
                      className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 disabled:opacity-70 shrink-0"
                    >
                      {processingId === fine._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                      Collect & Renew
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

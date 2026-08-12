"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Edit, Plus, BookOpen, Loader2 } from "lucide-react";

export default function StaffExamsScreen() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExams() {
      try {
        const res = await fetch("/api/staff/exams");
        if (res.ok) {
          const data = await res.json();
          setExams(data.exams || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchExams();
  }, []);

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
              <FileText className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-1">Assessments</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Exams & Results</h1>
          </div>
        </div>

        <div className="relative z-10">
          <button className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1">
            <Plus className="w-5 h-5" /> Create Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam, idx) => (
          <motion.div
            key={exam._id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{exam.type}</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                exam.status === 'Upcoming' ? 'bg-amber-100 text-amber-700' :
                exam.status === 'Grading' ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {exam.status}
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors">
              {exam.title}
            </h3>
            <p className="text-sm font-bold text-slate-500 mb-6">{exam.subject}</p>
            
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                {new Date(exam.date).toLocaleDateString()}
              </span>
              {exam.status === 'Grading' ? (
                <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold text-xs transition-colors">
                  <Edit className="w-3.5 h-3.5" /> Grade Now
                </button>
              ) : exam.status === 'Upcoming' ? (
                <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors">
                  <Edit className="w-3.5 h-3.5" /> Edit Details
                </button>
              ) : (
                <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs transition-colors shadow-md shadow-slate-900/20">
                  View Results
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {exams.length === 0 && (
          <div className="col-span-full text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium">No exams scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
}

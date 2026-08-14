"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Edit, Plus, BookOpen, Loader2, X, Calendar, Clock } from "lucide-react";

export default function StaffExamsScreen() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

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
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Exams</h1>
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
            className="cursor-pointer bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1"
            onClick={() => setSelectedExam(exam)}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Exam</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-700`}>
                Upcoming
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors">
              {exam.examName}
            </h3>
            <div className="flex gap-2 mb-4">
              {exam.branchId && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold tracking-wider uppercase">{exam.branchId.name}</span>}
              {exam.courseId && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold tracking-wider uppercase">{exam.courseId.name}</span>}
            </div>
            <p className="text-sm font-bold text-slate-500 mb-6">{exam.dateSheet?.length || 0} Subjects Scheduled</p>
            
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                {exam.dateSheet && exam.dateSheet.length > 0 ? new Date(exam.dateSheet[0].date).toLocaleDateString() : 'No Date'}
              </span>
            </div>
          </motion.div>
        ))}
        {exams.length === 0 && (
          <div className="col-span-full text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium">No exams scheduled.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">{selectedExam.examName}</h2>
                  <div className="flex gap-2 mt-2">
                    {selectedExam.branchId && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedExam.branchId.name}</span>}
                    {selectedExam.courseId && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedExam.courseId.name}</span>}
                  </div>
                </div>
                <button onClick={() => setSelectedExam(null)} className="p-3 hover:bg-slate-200 rounded-xl transition-colors bg-white shadow-sm border border-slate-100">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                {selectedExam.dateSheet && selectedExam.dateSheet.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedExam.dateSheet.map((sheet: any, i: number) => (
                      <div key={i} className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
                        <div className="flex-shrink-0 text-center md:text-left md:w-32">
                          <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{sheet.day}</div>
                          <div className="text-2xl font-black text-slate-800">{new Date(sheet.date).getDate()}</div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(sheet.date).toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
                        </div>
                        
                        <div className="flex-grow">
                          <h4 className="text-xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors mb-2">{sheet.subject}</h4>
                          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {sheet.startTime} - {sheet.endTime}</span>
                            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> {sheet.type}</span>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${sheet.type === 'Practical' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {sheet.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No Schedule Found</h3>
                    <p className="text-slate-400 mt-2">This exam doesn't have any subjects scheduled yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

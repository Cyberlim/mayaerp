"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Calendar as CalendarIcon, Loader2, Plus, X, Send, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminNoticesScreen() {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [newNotice, setNewNotice] = useState({ 
    title: "", 
    description: "", 
    targetType: "All", 
    courseId: "", 
    branchId: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/notices");
      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
      }
      
      const [coursesRes, branchesRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/branches")
      ]);
      
      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        setCourses(Array.isArray(cData) ? cData : (cData.courses || []));
      }
      if (branchesRes.ok) {
        const bData = await branchesRes.json();
        setBranches(Array.isArray(bData) ? bData : (bData.branches || []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleNotice = (id: string) => {
    setExpandedNotice(expandedNotice === id ? null : id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.description) return;
    
    setIsSubmitting(true);
    try {
      let targetClass = newNotice.targetType;
      
      if (newNotice.targetType === 'Course') {
        const c = courses.find(x => x._id === newNotice.courseId);
        targetClass = c ? `Course: ${c.name}` : 'Course';
      } else if (newNotice.targetType === 'Branch') {
        const b = branches.find(x => x._id === newNotice.branchId);
        targetClass = b ? `Branch: ${b.name}` : 'Branch';
      }

      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNotice.title,
          description: newNotice.description,
          targetClass: targetClass,
          courseId: newNotice.targetType === 'Course' ? newNotice.courseId : null,
          branchId: newNotice.targetType === 'Branch' ? newNotice.branchId : null,
        }),
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setNewNotice({ title: "", description: "", targetType: "All", courseId: "", branchId: "" });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Notice Board</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage Institutional Announcements</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
        >
          <Plus className="w-5 h-5" />
          Publish Notice
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notices.map((notice, idx) => {
            const id = notice._id || String(idx);
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:border-rose-200 transition-colors cursor-pointer"
                onClick={() => toggleNotice(id)}
              >
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-3 w-48 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <h3 className="text-base font-black text-slate-800 flex-1 truncate group-hover:text-rose-600 transition-colors">
                      {notice.title}
                    </h3>

                    <div className="w-48 shrink-0 text-left md:text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Audience</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{notice.targetClass || 'All'}</p>
                    </div>
                    
                    <div className="w-32 shrink-0 text-left md:text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Author</p>
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {notice.author ? `${notice.author.firstName} ${notice.author.lastName}` : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors shrink-0">
                    {expandedNotice === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedNotice === id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                    >
                      <div className="p-6 text-sm font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {notice.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {notices.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No notices published yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-black text-slate-800">Publish New Notice</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notice Title</label>
                  <input 
                    type="text" 
                    required
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                    placeholder="e.g., Campus Closed on Friday"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Audience</label>
                  <select 
                    value={newNotice.targetType}
                    onChange={(e) => setNewNotice({...newNotice, targetType: e.target.value, courseId: "", branchId: ""})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700 appearance-none"
                  >
                    <option value="All">All (Everyone)</option>
                    <option value="Staff">Staff Only</option>
                    <option value="Course">Specific Course</option>
                    <option value="Branch">Specific Branch</option>
                  </select>
                </div>

                {newNotice.targetType === "Course" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Course</label>
                    <select 
                      required
                      value={newNotice.courseId}
                      onChange={(e) => setNewNotice({...newNotice, courseId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700 appearance-none"
                    >
                      <option value="" disabled>Select a course...</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {newNotice.targetType === "Branch" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Branch</label>
                    <select 
                      required
                      value={newNotice.branchId}
                      onChange={(e) => setNewNotice({...newNotice, branchId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700 appearance-none"
                    >
                      <option value="" disabled>Select a branch...</option>
                      {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Message Description</label>
                  <textarea 
                    required
                    rows={5}
                    value={newNotice.description}
                    onChange={(e) => setNewNotice({...newNotice, description: e.target.value})}
                    placeholder="Type the announcement details here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Publish Now
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

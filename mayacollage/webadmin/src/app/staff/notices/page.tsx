"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Calendar as CalendarIcon, ArrowRight, Loader2, Plus, X, Send, ChevronDown, ChevronUp } from "lucide-react";

export default function StaffNoticesScreen() {
  const [inboxNotices, setInboxNotices] = useState<any[]>([]);
  const [sentNotices, setSentNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [newNotice, setNewNotice] = useState({ title: "", description: "", classId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

  const toggleNotice = (id: string) => {
    setExpandedNotice(expandedNotice === id ? null : id);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      // Fetch notices
      const res = await fetch("/api/staff/notices");
      if (res.ok) {
        const data = await res.json();
        setInboxNotices(data.inboxNotices || []);
        setSentNotices(data.sentNotices || []);
      }
      // Fetch assigned classes for the modal dropdown
      const classesRes = await fetch("/api/staff/my-students");
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setAssignedClasses(classesData.groupedStudents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.description || !newNotice.classId) return;
    
    setIsSubmitting(true);
    try {
      // Find the specific course/branch info from the selected classId
      const selectedClass = assignedClasses.find(c => c.classId === newNotice.classId);
      const [courseId, branchId] = newNotice.classId.split('_');

      let targetClass = selectedClass?.className || 'Class';
      let courseIdVal = courseId !== 'undefined' ? courseId : null;
      let branchIdVal = branchId !== 'undefined' ? branchId : null;

      if (newNotice.classId === 'all') {
        targetClass = "All My Classes";
        courseIdVal = null;
        branchIdVal = null;
      }
      
      const res = await fetch("/api/staff/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNotice.title,
          description: newNotice.description,
          targetClass: targetClass,
          courseId: courseIdVal,
          branchId: branchIdVal,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewNotice({ title: "", description: "", classId: "" });
        setActiveTab("sent");
        fetchData(); // refresh lists
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderNoticeList = (notices: any[], emptyMessage: string) => (
    <div className="flex flex-col gap-4">
      {notices.map((notice, idx) => {
        const id = notice._id || String(idx);
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:border-emerald-200 transition-colors cursor-pointer"
            onClick={() => toggleNotice(id)}
          >
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                {/* Left side: Pill and Date */}
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${activeTab === 'inbox' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {activeTab === 'inbox' ? (notice.author?.role ? `From ${notice.author.role}` : 'Received') : 'Sent by You'}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-base font-black text-slate-800 flex-1 truncate group-hover:text-emerald-600 transition-colors">
                  {notice.title}
                </h3>

                {/* Right side: Author/Audience */}
                <div className="w-48 shrink-0 text-left md:text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {activeTab === 'inbox' ? 'Issued By' : 'Target Audience'}
                  </p>
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {activeTab === 'inbox' ? (notice.author ? (notice.author.role && !['staff', 'faculty', 'student'].includes(notice.author.role.toLowerCase()) ? notice.author.role.toUpperCase() : `${notice.author.firstName} ${notice.author.lastName}`) : 'ADMIN') : notice.targetClass}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
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
          <p className="text-slate-500 font-medium">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Premium Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg border border-emerald-100/50 mb-10 p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-emerald-500/20 border border-emerald-100">
            <div className="w-full h-full bg-slate-50 rounded-[1.5rem] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-1">Announcements</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Notice Board</h1>
          </div>
        </div>

        <div className="relative z-10">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            Publish Notice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-3 font-black text-sm tracking-wide transition-all border-b-2 ${activeTab === 'inbox' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Inbox ({inboxNotices.length})
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 font-black text-sm tracking-wide transition-all border-b-2 ${activeTab === 'sent' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Sent ({sentNotices.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : (
        activeTab === 'inbox' 
          ? renderNoticeList(inboxNotices, "No notices in your inbox.") 
          : renderNoticeList(sentNotices, "You haven't published any notices yet.")
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
                    placeholder="e.g., Upcoming Mid-term Exams"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Audience (Class)</label>
                  <select 
                    required
                    value={newNotice.classId}
                    onChange={(e) => setNewNotice({...newNotice, classId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 appearance-none"
                  >
                    <option value="" disabled>Select a class...</option>
                    <option value="all">All My Classes</option>
                    {assignedClasses.length === 0 && <option disabled>No classes assigned to you</option>}
                    {assignedClasses.map(c => (
                      <option key={c.classId} value={c.classId}>{c.className}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Message Description</label>
                  <textarea 
                    required
                    rows={5}
                    value={newNotice.description}
                    onChange={(e) => setNewNotice({...newNotice, description: e.target.value})}
                    placeholder="Type the announcement details here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

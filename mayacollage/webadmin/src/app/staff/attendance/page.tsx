"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Calendar, Users, ChevronRight, UserCheck, Loader2, X, ChevronLeft, Save, History } from "lucide-react";
import { format, subDays, isAfter, startOfDay } from "date-fns";

export default function StaffAttendanceScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Modal state
  const [activeClass, setActiveClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // History state
  const [activeHistoryStudent, setActiveHistoryStudent] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const maxPastDays = 2;
  const today = startOfDay(new Date());
  
  // Check if selected date is read-only (older than 2 days)
  const isReadOnly = selectedDate < subDays(today, maxPastDays);

  useEffect(() => {
    fetchClasses(selectedDate);
  }, [selectedDate]);

  async function fetchClasses(date: Date) {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/staff/attendance?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleMarkAttendance = async (cls: any) => {
    setActiveClass(cls);
    setIsLoadingStudents(true);
    try {
      const params = new URLSearchParams({
        courseId: cls.courseId,
        branchId: cls.branchId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        subject: cls.name
      });
      
      const res = await fetch(`/api/staff/attendance/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleMarkAll = (status: string) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const viewStudentHistory = async (student: any) => {
    setActiveHistoryStudent(student);
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        studentId: student.id,
        subject: activeClass?.name || ''
      });
      const res = await fetch(`/api/staff/attendance/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data.history || []);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const submitAttendance = async () => {
    if (!activeClass) return;
    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const payload = {
        date: dateStr,
        subject: activeClass.name,
        subjectCode: activeClass.subjectCode,
        course: activeClass.courseId,
        department: activeClass.branchId,
        section: activeClass.section,
        attendanceRecords: students.map(s => ({
          studentId: s.id,
          enrollmentNumber: s.enrollmentNumber,
          studentName: s.name,
          status: s.status
        }))
      };

      const res = await fetch(`/api/staff/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Refresh classes to show completed status
        fetchClasses(selectedDate);
        setActiveClass(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit attendance');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg border border-emerald-100/50 mb-10 p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-emerald-500/20 border border-emerald-100">
            <div className="w-full h-full bg-slate-50 rounded-[1.5rem] flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-1 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Mark & Review
            </p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Class Attendance</h1>
          </div>
        </div>

        {/* Date Selector embedded in header block */}
        <div 
          className="relative z-10 flex bg-white/70 backdrop-blur-md rounded-2xl p-2 border border-white shadow-xl shadow-emerald-100/50 group cursor-pointer hover:border-emerald-200 transition-colors"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input && typeof input.showPicker === 'function') {
              try { input.showPicker(); } catch (err) {}
            }
          }}
        >
          <input
            type="date"
            max={format(new Date(), 'yyyy-MM-dd')}
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) {
                const [year, month, day] = e.target.value.split('-');
                setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onClick={(e) => {
              if (typeof e.currentTarget.showPicker === 'function') {
                try { e.currentTarget.showPicker(); } catch (err) {}
              }
            }}
          />
          <div className="flex items-center gap-4 px-4 py-2 pointer-events-none">
            <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm border border-emerald-50 group-hover:bg-emerald-50 transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Select Date</span>
              <span className="text-xl font-black text-slate-800 leading-none">{format(selectedDate, 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, idx) => (
            <motion.div
              key={cls.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 lg:p-8 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:border-emerald-100`}
            >
              {/* Decorative Background Blob */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {cls.completed && (
                <div className="absolute top-5 right-5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-emerald-200/50 z-10">
                  <UserCheck className="w-3 h-3" /> Submitted
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/50 group-hover:scale-110 group-hover:from-emerald-50 group-hover:to-teal-50 group-hover:border-emerald-100 transition-all duration-300">
                  <Calendar className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{cls.time}</h3>
                  <p className="text-xs font-bold text-slate-400">{cls.room}</p>
                </div>
              </div>

              <h4 className="text-xl lg:text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 relative z-10">
                {cls.name}
              </h4>
              
              <div className="flex items-center gap-2 mb-8 relative z-10">
                <Users className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-emerald-500 transition-colors" />
                <span className="text-sm font-semibold text-slate-600 line-clamp-1 group-hover:text-slate-700 transition-colors" title={cls.className}>{cls.className || "Course / Branch Assigned"}</span>
              </div>

              <div className="relative z-10">
                {cls.completed ? (
                  <button onClick={() => handleMarkAttendance(cls)} className="w-full py-4 rounded-2xl bg-white text-slate-700 font-black shadow-sm border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group/btn">
                    {isReadOnly ? 'View Attendance' : 'Update Attendance'} <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button onClick={() => handleMarkAttendance(cls)} className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn ${isReadOnly ? 'bg-slate-100 text-slate-500 shadow-none hover:bg-slate-200' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-600 hover:to-teal-700'}`}>
                    {!isReadOnly && <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />}
                    <span className="relative z-10 flex items-center justify-center gap-2">{isReadOnly ? 'View Attendance' : 'Mark Attendance'} <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckSquare className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">No Classes Found</h3>
              <p className="text-slate-500 font-medium">You have no scheduled classes for {format(selectedDate, 'MMMM do, yyyy')}.</p>
            </div>
          )}
        </div>
      )}

      {/* --- ATTENDANCE MODAL --- */}
      <AnimatePresence>
        {activeClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full h-full relative z-10 flex flex-col overflow-hidden shadow-2xl">
              
              {/* Modal Header */}
              <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="max-w-6xl mx-auto w-full flex justify-between items-center px-6 py-4 lg:px-10 lg:py-5 relative z-10">
                    <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-white text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border border-emerald-100">{format(selectedDate, 'MMM dd, yyyy')}</span>
                      <span className="text-xs font-bold text-slate-500 bg-white/50 px-2.5 py-1 rounded-full">{activeClass.time}</span>
                      {isReadOnly && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border border-amber-200 ml-2">View Only</span>
                      )}
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">{activeClass.name}</h2>
                  </div>
                  <button onClick={() => setActiveClass(null)} className="w-10 h-10 bg-white border border-emerald-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105 transition-all shadow-sm shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Student List Area */}
              <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                <div className="max-w-6xl mx-auto w-full p-6 lg:p-10 min-h-full flex flex-col">
                  {isLoadingStudents ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Students...</p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Users className="w-12 h-12 text-slate-300" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">No Students Enrolled</h3>
                      <p className="text-slate-500 text-lg">There are no students mapped to this course and branch yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 px-2 lg:px-6 mb-8">
                        <div className="hidden lg:grid grid-cols-12 gap-4 flex-1 w-full text-xs font-black uppercase tracking-widest text-slate-400">
                          <div className="col-span-5">Student Information</div>
                          <div className="col-span-3 text-center">Enrollment ID</div>
                          <div className="col-span-4 text-center">Attendance Status</div>
                        </div>
                        
                        {!isReadOnly && (
                          <div className="flex justify-end gap-3 w-full lg:w-auto shrink-0">
                            <button onClick={() => handleMarkAll('Present')} className="flex-1 lg:flex-none px-5 py-2.5 bg-white text-emerald-600 border-2 border-emerald-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" /> All Present
                            </button>
                            <button onClick={() => handleMarkAll('Absent')} className="flex-1 lg:flex-none px-5 py-2.5 bg-white text-rose-600 border-2 border-rose-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm flex items-center gap-2">
                              <X className="w-4 h-4" /> All Absent
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {students.map((student, idx) => (
                        <motion.div 
                          key={student.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-white p-4 lg:px-6 py-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center transition-all group"
                        >
                          <div className="col-span-5 w-full flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                              <span className="text-lg font-black text-indigo-700">{student.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-slate-900 leading-tight tracking-tight">{student.name}</h4>
                                <button onClick={() => viewStudentHistory(student)} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-slate-300" title="View History">
                                  <History className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs font-bold tracking-wider text-slate-400 mt-1 lg:hidden uppercase">{student.enrollmentNumber}</p>
                            </div>
                          </div>
                          
                          <div className="col-span-3 hidden lg:block text-center w-full">
                            <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-100">{student.enrollmentNumber}</span>
                          </div>
                          
                          <div className="col-span-4 w-full flex justify-center lg:justify-end gap-2">
                            <button 
                              onClick={() => !isReadOnly && handleStatusChange(student.id, 'Present')}
                              disabled={isReadOnly && student.status !== 'Present'}
                              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${student.status === 'Present' ? 'bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] scale-105 border-transparent opacity-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-100 disabled:hover:text-slate-400'}`}
                            >
                              Present
                            </button>
                            <button 
                              onClick={() => !isReadOnly && handleStatusChange(student.id, 'Absent')}
                              disabled={isReadOnly && student.status !== 'Absent'}
                              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${student.status === 'Absent' ? 'bg-rose-500 text-white shadow-[0_8px_20px_rgba(244,63,94,0.3)] scale-105 border-transparent opacity-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-100 disabled:hover:text-slate-400'}`}
                            >
                              Absent
                            </button>
                            <button 
                              onClick={() => !isReadOnly && handleStatusChange(student.id, 'Not Marked')}
                              disabled={isReadOnly && student.status !== 'Not Marked'}
                              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${student.status === 'Not Marked' ? 'bg-slate-500 text-white shadow-[0_8px_20px_rgba(100,116,139,0.3)] scale-105 border-transparent opacity-100' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-100 disabled:hover:text-slate-400'}`}
                            >
                              Not Marked
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 bg-white relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                <div className="max-w-6xl mx-auto w-full px-6 py-4 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-sm font-black uppercase tracking-widest flex flex-wrap items-center gap-6">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-700">{students.filter(s => s.status === 'Present').length} Present</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-rose-700">{students.filter(s => s.status === 'Absent').length} Absent</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <span className="text-slate-600">{students.filter(s => s.status === 'Not Marked').length} Not Marked</span>
                    </span>
                  </div>
                  {isReadOnly ? (
                    <button 
                      onClick={() => setActiveClass(null)}
                      className="w-full md:w-auto px-8 py-3.5 bg-slate-800 text-white font-black rounded-xl shadow-[0_10px_25px_rgba(30,41,59,0.3)] hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-base hover:-translate-y-1"
                    >
                      Close View
                    </button>
                  ) : (
                    <button 
                      onClick={submitAttendance}
                      disabled={isSaving || students.length === 0}
                      className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 text-white font-black rounded-xl shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:bg-emerald-700 hover:shadow-[0_15px_35px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 text-base hover:-translate-y-1"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {isSaving ? 'Saving...' : 'Save Attendance'}
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HISTORY MODAL --- */}
      <AnimatePresence>
        {activeHistoryStudent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveHistoryStudent(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 flex flex-col h-[70vh] overflow-hidden border border-slate-100">
              
              <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{activeHistoryStudent.name}</h2>
                  <p className="text-sm font-bold text-slate-500">Attendance History • {activeClass?.name}</p>
                </div>
                <button onClick={() => setActiveHistoryStudent(null)} className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
                {isLoadingHistory ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <History className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No recent history found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyData.map((record: any, idx: number) => {
                      let statusColor = "bg-emerald-500";
                      if (record.status === 'Absent') statusColor = "bg-rose-500";
                      if (record.status === 'Late') statusColor = "bg-amber-500";
                      return (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-10 rounded-full ${statusColor}`} />
                            <div>
                              <p className="font-bold text-slate-800">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                              <p className="text-xs font-semibold text-slate-400">{format(new Date(record.date), 'EEEE')}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusColor.replace('bg-', 'text-')} bg-slate-50 border border-slate-100 shadow-sm`}>
                            {record.status}
                          </span>
                        </div>
                      )
                    })}
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

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Loader2, 
  Clock,
  Users,
  Search,
  Download,
  AlertTriangle,
  ChevronDown,
  Activity,
  CalendarDays,
  XCircle,
  Save,
  Zap,
  RefreshCw,
  UserCheck,
  UserX,
  FileSpreadsheet
} from "lucide-react";

export default function AttendancePage() {
  const today = new Date().toISOString().split('T')[0];

  // Filters
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [markDate, setMarkDate] = useState(today);
  const [markSubject, setMarkSubject] = useState("General Attendance");
  
  // State
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // 0ms Cache Hydration on mount
  useEffect(() => {
    try {
      const cachedBranches = localStorage.getItem("maya_academics_branches_cache");
      const cachedCourses = localStorage.getItem("maya_academics_courses_cache");
      
      let hasCache = false;
      if (cachedBranches) {
        setBranches(JSON.parse(cachedBranches));
        hasCache = true;
      }
      if (cachedCourses) {
        setCourses(JSON.parse(cachedCourses));
        hasCache = true;
      }
      if (hasCache) setFromCache(true);
    } catch (_) {}

    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/courses")
      ]);
      const bData = await bRes.json();
      const cData = await cRes.json();
      
      const bList = Array.isArray(bData) ? bData : [];
      const cList = Array.isArray(cData) ? cData : [];
      setBranches(bList);
      setCourses(cList);

      try {
        localStorage.setItem("maya_academics_branches_cache", JSON.stringify(bList));
        localStorage.setItem("maya_academics_courses_cache", JSON.stringify(cList));
      } catch (_) {}
    } catch (e) {
      console.error(e);
    }
  };

  // Load students based on course, branch, or search
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        let url = `/api/students?limit=100`;
        if (selectedBranch) url += `&selectedBranch=${selectedBranch}`;
        if (selectedCourse) url += `&selectedProgram=${selectedCourse}`;
        if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.students || []);
        setStudents(list);

        // Fetch existing attendance for these students on this date from PostgreSQL
        if (list.length > 0) {
          const studentIds = list.map((s: any) => s.id || s._id).join(',');
          const attRes = await fetch(`/api/attendance?date=${markDate}&studentIds=${studentIds}&subject=${encodeURIComponent(markSubject)}`);
          if (attRes.ok) {
            const attData = await attRes.json();
            const recs: Record<string, string> = {};
            attData.forEach((item: any) => {
              const sid = item.student || item.id || item._id;
              recs[sid] = item.status || 'Present';
            });
            setAttendanceRecords(recs);
          }
        } else {
          setAttendanceRecords({});
        }
      } catch (err) {
        console.error("Error fetching students/attendance:", err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    const timer = setTimeout(fetchStudents, 200);
    return () => clearTimeout(timer);
  }, [selectedBranch, selectedCourse, searchQuery, markDate, markSubject]);

  const toggleStudentStatus = (studentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Present' ? 'Absent' : currentStatus === 'Absent' ? 'Late' : 'Present';
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: nextStatus
    }));
  };

  const setStatusForStudent = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAll = (status: string) => {
    const updated: Record<string, string> = {};
    students.forEach(s => {
      const sid = s.id || s._id;
      updated[sid] = status;
    });
    setAttendanceRecords(updated);
  };

  const saveAttendance = async () => {
    if (students.length === 0) return;

    setIsSaving(true);
    try {
      const recordsToSave = students.map(s => {
        const sid = s.id || s._id;
        return {
          student: sid,
          studentId: s.studentId || s.student_id || sid,
          studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
          status: attendanceRecords[sid] || 'Present'
        };
      });

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: markDate,
          subject: markSubject,
          records: recordsToSave
        })
      });

      if (res.ok) {
        setToastMsg(`Saved ${recordsToSave.length} attendance records to PostgreSQL!`);
        setTimeout(() => setToastMsg(""), 3500);
      } else {
        throw new Error("Failed to save");
      }
    } catch (err: any) {
      alert("Error saving attendance: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics
  const presentCount = Object.values(attendanceRecords).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceRecords).filter(s => s === 'Absent').length;
  const lateCount = Object.values(attendanceRecords).filter(s => s === 'Late').length;
  const totalCount = students.length || 1;
  const attendanceRate = Math.round(((presentCount + (lateCount * 0.5)) / totalCount) * 100);

  const filteredCourses = courses.filter(c => selectedBranch ? (c.branchId === selectedBranch || c.branch_id === selectedBranch || c.branchId?._id === selectedBranch) : true);

  return (
    <div className="min-h-screen pb-24 font-sans text-slate-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-xl shadow-emerald-500/25 flex items-center gap-3 text-sm"
          >
            <CheckCircle2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner */}
      <div className="bg-white border-b border-slate-100 p-6 lg:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 rounded-[2rem] border shadow-sm mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Simple Fast Register</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Attendance Center</h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">Mark daily student attendance and save records directly to PostgreSQL</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => markAll('Present')}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" /> All Present
          </button>
          <button
            onClick={() => markAll('Absent')}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <UserX className="w-4 h-4" /> All Absent
          </button>
          <button 
            onClick={saveAttendance}
            disabled={isSaving || students.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            Save Attendance
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">Date</label>
          <input
            type="date"
            value={markDate}
            onChange={e => setMarkDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">Branch</label>
          <select 
            value={selectedBranch} 
            onChange={e => { setSelectedBranch(e.target.value); setSelectedCourse(""); }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">Course / Program</label>
          <select 
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="">All Courses</option>
            {filteredCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">Subject</label>
          <input
            type="text"
            placeholder="e.g. Data Structures"
            value={markSubject}
            onChange={e => setMarkSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">Search Student</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name or roll no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Enrolled</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{students.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Present</span>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{presentCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Absent</span>
            <h3 className="text-xl font-black text-rose-600 mt-0.5">{absentCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Attendance Rate</span>
            <h3 className="text-xl font-black text-indigo-600 mt-0.5">{students.length > 0 ? `${attendanceRate}%` : '—'}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-black text-slate-800">Student Attendance Sheet</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any status pill to toggle Present / Absent / Late</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            {students.length} Students Listed
          </span>
        </div>

        {isLoadingStudents ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-14 bg-slate-50 rounded-2xl" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            No students found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="p-4 border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">Roll No</th>
                  <th className="p-4 border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                  <th className="p-4 border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">Course / Branch</th>
                  <th className="p-4 border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Quick Toggle</th>
                  <th className="p-4 border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => {
                  const sid = student.id || student._id;
                  const currentStatus = attendanceRecords[sid] || 'Present';
                  const courseObj = courses.find(c => (c.id || c._id) === (student.selectedProgram || student.course_id));
                  const courseName = courseObj?.name || student.selectedProgram || 'Enrolled';

                  return (
                    <tr key={sid || idx} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="p-4 font-mono font-bold text-xs text-slate-500">
                        {student.studentId || student.student_id || `STU-${idx+1}`}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                            {student.firstName?.substring(0, 1) || 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors block">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {student.email || student.mobile}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {courseName}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/60 gap-1 text-xs font-bold">
                          <button
                            onClick={() => setStatusForStudent(sid, 'Present')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              currentStatus === 'Present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            P
                          </button>
                          <button
                            onClick={() => setStatusForStudent(sid, 'Absent')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              currentStatus === 'Absent' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            A
                          </button>
                          <button
                            onClick={() => setStatusForStudent(sid, 'Late')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              currentStatus === 'Late' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStudentStatus(sid, currentStatus)}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-transform active:scale-95 ${
                            currentStatus === 'Present' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                            currentStatus === 'Absent' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' :
                            'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {currentStatus}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 bg-white">
          <span>Showing {students.length} students</span>
          <span className="font-semibold text-slate-500">PostgreSQL Live Sync Enabled</span>
        </div>
      </div>

    </div>
  );
}

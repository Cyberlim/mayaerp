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
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText,
  CalendarDays,
  XCircle,
  Sun,
  Trash2,
  Plus,
  Save,
  CheckCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AttendanceAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  
  const today = new Date().toISOString().split('T')[0];

  // Filtering
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

  // Analytics Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Holidays
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", type: "National" });
  
  // Reset
  const [resetReason, setResetReason] = useState("");

  // Mark Attendance State
  const [markDate, setMarkDate] = useState(today);
  const [markSubject, setMarkSubject] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [isSavingMark, setIsSavingMark] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchCourses(selectedBranch);
      fetchHolidays();
    } else {
      setCourses([]);
      setSelectedCourse("");
      setHolidays([]);
      setSubjects([]);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if ((selectedBranch && selectedCourse) || searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchStudents();
        if (selectedBranch && selectedCourse) {
          fetchSubjects(selectedBranch, selectedCourse);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else if (!selectedBranch && !selectedCourse) {
      setStudents([]);
      setSubjects([]);
    }
  }, [selectedBranch, selectedCourse, searchQuery]);

  // Fetch existing attendance when date, subject, or class changes
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (students.length === 0) {
        setAttendanceRecords({});
        return;
      }
      
      try {
        const studentIds = students.map(s => s._id).join(',');
        const subject = markSubject || 'General Attendance';
        const url = `/api/attendance?date=${markDate}&studentIds=${studentIds}&subject=${encodeURIComponent(subject)}`;
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const newRecords: Record<string, string> = {};
          data.forEach((d: any) => {
            newRecords[d._id] = d.status || 'Present';
          });
          setAttendanceRecords(newRecords);
        } else {
          throw new Error("Failed to fetch");
        }
      } catch (e) {
        // Fallback: Default everyone to Present
        const defaultRecords: Record<string, string> = {};
        students.forEach(s => defaultRecords[s._id] = 'Present');
        setAttendanceRecords(defaultRecords);
      }
    };
    
    fetchExistingAttendance();
  }, [students, markDate, markSubject]);

  useEffect(() => {
    if (selectedStudentId && startDate && endDate) {
      fetchAnalytics();
    }
  }, [selectedStudentId, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      setBranches(await res.json());
    } catch (e) {}
  };

  const fetchCourses = async (branchId: string) => {
    try {
      const res = await fetch(`/api/courses?branchId=${branchId}`);
      setCourses(await res.json());
    } catch (e) {}
  };

  const fetchSubjects = async (branchId: string, courseId: string) => {
    try {
      const res = await fetch(`/api/subjects?branchId=${branchId}&courseId=${courseId}`);
      setSubjects(await res.json());
    } catch (e) {}
  };

  const fetchStudents = async () => {
    try {
      let url = "/api/students?";
      if (selectedBranch) url += `selectedBranch=${selectedBranch}&`;
      if (selectedCourse) url += `selectedProgram=${selectedCourse}&`;
      if (searchQuery) url += `search=${searchQuery}&`;

      const res = await fetch(url);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const fetchHolidays = async () => {
    try {
      let url = "/api/holidays?";
      if (selectedBranch) url += `branchId=${selectedBranch}`;
      const res = await fetch(url);
      setHolidays(await res.json());
    } catch (e) {}
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/analytics?studentId=${selectedStudentId}&startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        setAnalytics(await res.json());
      } else {
        setAnalytics(null);
      }
    } catch (e) {
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return alert("Please select a branch first to add a holiday.");
    if (!holidayForm.name || !holidayForm.date) return;
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...holidayForm, branchId: selectedBranch })
      });
      if (res.ok) {
        setHolidayForm({ name: "", date: "", type: "National" });
        fetchHolidays();
        if (selectedStudentId) fetchAnalytics();
      }
    } catch (e) {}
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchHolidays();
        if (selectedStudentId) fetchAnalytics();
      }
    } catch (e) {}
  };

  const handleResetAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !selectedCourse) {
      return alert("Please select a Branch and Course first.");
    }
    if (!confirm("Are you sure you want to reset attendance for ALL students in this Branch & Course for this date range? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/attendance/reset?branchId=${selectedBranch}&courseId=${selectedCourse}&startDate=${startDate}&endDate=${endDate}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Reset successful. Deleted ${data.count} attendance records.`);
        if (selectedStudentId) fetchAnalytics();
      } else {
        alert("Reset failed: " + data.error);
      }
    } catch (e) {
      alert("Error resetting attendance.");
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedBranch || !selectedCourse) return alert("Please select a branch and course first.");
    if (!markSubject.trim()) return alert("Please enter a subject name.");
    
    setIsSavingMark(true);
    try {
      const recordsToSave = students.map(student => ({
        student: student._id,
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        status: attendanceRecords[student._id] || 'Present'
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: markDate,
          subject: markSubject,
          records: recordsToSave
        })
      });

      if (res.ok) {
        alert("Attendance saved successfully!");
        if (selectedStudentId) fetchAnalytics(); // Refresh analytics if a student is selected
      } else {
        alert("Failed to save attendance.");
      }
    } catch (e) {
      alert("Error saving attendance.");
    } finally {
      setIsSavingMark(false);
    }
  };

  const renderCalendar = () => {
    if (!analytics) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), i);
      days.push(d);
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-800">Attendance Calendar - {start.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <div className="flex gap-2">
            <button className="p-1 border border-slate-200 rounded hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 border border-slate-200 rounded hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
            <button className="px-3 py-1 text-xs border border-slate-200 rounded font-bold hover:bg-slate-50">Today</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map(l => <div key={l} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{l}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square"></div>;
            
            const dateStr = d.toISOString().split('T')[0];
            const calData = analytics.calendarData?.[dateStr];
            let dot = null;

            if (calData) {
              if (calData.status === 'Present') dot = <span className="w-4 h-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[8px] font-black">P</span>;
              else if (calData.status === 'Absent') dot = <span className="w-4 h-4 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-[8px] font-black">A</span>;
              else if (calData.status === 'Holiday') dot = <span className="w-4 h-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[8px] font-black">H</span>;
            }

            return (
              <div key={i} className="aspect-square border border-slate-100 rounded-xl p-1 flex flex-col items-center justify-between hover:border-indigo-200 transition-colors cursor-pointer bg-white">
                <span className={`text-xs font-bold ${calData ? 'text-slate-800' : 'text-slate-300'}`}>{d.getDate()}</span>
                {dot}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-6 text-xs font-bold text-slate-500 justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[7px] font-black">P</span> Present</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-[7px] font-black">A</span> Absent</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[7px] font-black">H</span> Holiday</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans text-slate-800">
      {/* Header & Filters */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Attendance</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Admission No..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-bold outline-none w-48"
                />
              </div>

              <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none">
                <option value="">Select Course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>

              <select disabled={!students.length} value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none w-48">
                <option value="">Select Student...</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
              </select>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
                <span className="mx-2 text-slate-400">-</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
              </div>

              <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          <div className="flex gap-8 mt-4">
            {['Overview', 'Lecture Wise', 'Monthly', 'Weekly', 'Daily', 'Mark Attendance'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 mt-6">
        {activeTab === 'Mark Attendance' ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Mark Attendance</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Record attendance for {students.length} students</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Date</label>
                  <input type="date" value={markDate} onChange={e=>setMarkDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Subject</label>
                  <select value={markSubject} onChange={e=>setMarkSubject(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none w-48">
                    <option value="">Select Subject</option>
                    {subjects.map(sub => (
                      <option key={sub._id} value={sub.subjectName}>{sub.subjectName}</option>
                    ))}
                    {subjects.length === 0 && <option value="General">General (Default)</option>}
                  </select>
                </div>
                <div className="self-end pb-0.5">
                  <button onClick={handleSaveAttendance} disabled={isSavingMark || students.length === 0} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {isSavingMark ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Attendance
                  </button>
                </div>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <Users className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">Please select a Branch and Course above to load students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="p-4 rounded-tl-2xl">Roll No</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4 text-center rounded-tr-2xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedStudentId ? students.filter(s => s._id === selectedStudentId) : students).map((student) => (
                      <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-700">{student.studentId}</td>
                        <td className="p-4 font-semibold text-slate-800">{student.firstName} {student.lastName}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setAttendanceRecords({...attendanceRecords, [student._id]: 'Present'})} className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all ${attendanceRecords[student._id] === 'Present' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                              Present
                            </button>
                            <button onClick={() => setAttendanceRecords({...attendanceRecords, [student._id]: 'Absent'})} className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all ${attendanceRecords[student._id] === 'Absent' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                              Absent
                            </button>
                            <button onClick={() => setAttendanceRecords({...attendanceRecords, [student._id]: 'Late'})} className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all ${attendanceRecords[student._id] === 'Late' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                              Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-bold">Analyzing attendance data...</p>
          </div>
        ) : !analytics ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100">
            <CalendarDays className="w-16 h-16 mb-4 text-slate-200" />
            <p className="font-bold text-lg text-slate-600">Select a student and date range to view analytics.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Lectures</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{analytics.metrics.totalLectures}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lectures Attended</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{analytics.metrics.attended}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><XCircle className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lectures Absent</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{analytics.metrics.absent}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance %</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{analytics.metrics.attendancePercentage}%</p>
                  <p className="text-[9px] text-slate-400">(Excluding Holidays)</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><CalendarDays className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Working Days</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{analytics.metrics.workingDays}</p>
                  <p className="text-[9px] text-slate-400">(Holidays: {analytics.metrics.holidaysCount})</p>
                </div>
              </div>
            </div>

            {/* Main Grid: Table & Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Lecture Wise Table */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
                <h3 className="font-black text-slate-800 mb-4">Lecture Wise Attendance</h3>
                <div className="overflow-y-auto flex-1 pr-2">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Day</th>
                        <th className="pb-3">Lecture</th>
                        <th className="pb-3">Subject</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.lectureWiseData?.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 font-semibold text-slate-700">{row.date}</td>
                          <td className="py-3 text-slate-500">{row.day}</td>
                          <td className="py-3 text-slate-500 text-center">{row.lecture}</td>
                          <td className="py-3 font-semibold text-slate-700">{row.subject}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                              row.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                              row.status === 'Absent' ? 'bg-rose-50 text-rose-600' :
                              'bg-purple-50 text-purple-600'
                            }`}>{row.status}</span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase">{row.type}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center">
                {renderCalendar()}
              </div>
            </div>

            {/* Bottom Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Holiday Management */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-800">Holiday Management</h3>
                </div>
                
                <form onSubmit={handleAddHoliday} className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-xl">
                  <input required type="date" value={holidayForm.date} onChange={e=>setHolidayForm({...holidayForm, date: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded p-2 text-xs font-bold outline-none" />
                  <input required type="text" placeholder="Holiday Name" value={holidayForm.name} onChange={e=>setHolidayForm({...holidayForm, name: e.target.value})} className="flex-2 bg-white border border-slate-200 rounded p-2 text-xs font-bold outline-none" />
                  <button type="submit" className="bg-blue-600 text-white px-3 rounded flex items-center justify-center hover:bg-blue-700"><Plus className="w-4 h-4" /></button>
                </form>

                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Day</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map(h => (
                        <tr key={h._id} className="border-b border-slate-50">
                          <td className="py-2 font-semibold text-slate-700">{new Date(h.date).toISOString().split('T')[0]}</td>
                          <td className="py-2 text-slate-500">{h.day}</td>
                          <td className="py-2 font-semibold text-slate-700">{h.name}</td>
                          <td className="py-2 text-center">
                            <button onClick={() => handleDeleteHoliday(h._id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 className="w-3 h-3" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <p className="text-xs text-emerald-700 font-medium">Holidays are not counted in attendance percentage calculation.</p>
                </div>
              </div>

              {/* Reset Attendance */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                <h3 className="font-black text-slate-800 mb-4">Reset Attendance</h3>
                <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold mb-6">
                  Resetting will clear all attendance records for the selected Branch & Course in this period and cannot be undone.
                </div>
                
                <form onSubmit={handleResetAttendance} className="space-y-4 flex-1">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">From Date</label>
                    <input type="date" className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none" defaultValue={startDate} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">To Date</label>
                    <input type="date" className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none" defaultValue={endDate} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Reason (Optional)</label>
                    <input type="text" placeholder="End of Semester Reset" className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none" value={resetReason} onChange={e=>setResetReason(e.target.value)} />
                  </div>
                  <div className="pt-4 mt-auto">
                    <button type="submit" className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-colors">
                      Reset Attendance
                    </button>
                  </div>
                </form>
              </div>

              {/* Attendance Reports */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-800">Attendance Reports</h3>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm">Generate Report</button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="text-center p-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lectures</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{analytics.metrics.totalLectures}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attended</p>
                    <p className="text-lg font-black text-emerald-600 mt-1">{analytics.metrics.attended}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">%</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{analytics.metrics.attendancePercentage}%</p>
                  </div>
                </div>

                <div className="flex-1 min-h-0 w-full relative -ml-4">
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()} ${d.toLocaleString('default',{month:'short'})}` }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 text-center">Attendance Trend</p>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

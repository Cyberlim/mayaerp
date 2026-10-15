"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, Plus, Calendar, ChevronDown, Activity, 
  Users, CheckCircle, FileText, UploadCloud, 
  Settings2, Bell, Eye, Loader2, BookOpen, Zap, RefreshCw, Search
} from "lucide-react";
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdmissionsDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [serverStats, setServerStats] = useState<any>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("All Courses");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 0ms Cache Hydration
  useEffect(() => {
    try {
      const cachedApps = localStorage.getItem("maya_admissions_apps_cache");
      const cachedCourses = localStorage.getItem("maya_admissions_courses_cache");
      const cachedStats = localStorage.getItem("maya_admissions_stats_cache");

      let hasCache = false;
      if (cachedApps) {
        const parsed = JSON.parse(cachedApps);
        setApplications(parsed.applications || []);
        setStudentStats(parsed.studentCourseStats || []);
        setServerStats(parsed.stats || null);
        hasCache = true;
      }
      if (cachedCourses) {
        setCourses(JSON.parse(cachedCourses));
        hasCache = true;
      }
      if (cachedStats) {
        setServerStats(JSON.parse(cachedStats));
      }

      if (hasCache) {
        setFromCache(true);
        setIsLoading(false);
      }
    } catch (_) {}

    fetchData(false);
  }, []);

  const fetchData = async (showRefresh = true) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [appsRes, coursesRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/courses")
      ]);
      const appsData = await appsRes.json();
      const coursesData = await coursesRes.json();
      
      const appsList = Array.isArray(appsData.applications) ? appsData.applications : [];
      const courseStats = Array.isArray(appsData.studentCourseStats) ? appsData.studentCourseStats : [];
      const crsList = Array.isArray(coursesData) ? coursesData : [];

      setApplications(appsList);
      setStudentStats(courseStats);
      setServerStats(appsData.stats || null);
      setCourses(crsList);

      // Persist in localStorage for 0ms loads
      try {
        localStorage.setItem("maya_admissions_apps_cache", JSON.stringify(appsData));
        localStorage.setItem("maya_admissions_courses_cache", JSON.stringify(crsList));
        if (appsData.stats) {
          localStorage.setItem("maya_admissions_stats_cache", JSON.stringify(appsData.stats));
        }
      } catch (_) {}
    } catch (e) {
      console.error("Admissions fetch error:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Calculations
  const directEnrolledTotal = studentStats.reduce((sum, s) => sum + (s.filled || 0), 0);
  const totalApps = applications.length;
  const admittedApps = applications.filter(a => a.status === 'Approved' || a.status === 'Accepted').length;
  const enrolledApps = applications.filter(a => a.status === 'Accepted').length;
  const pendingApps = applications.filter(a => a.status === 'Pending' || a.status === 'Reviewed').length;
  
  const totalSeats = courses.reduce((sum, c) => sum + (c.intakeCapacity || c.intake_capacity || 0), 0) || (courses.length * 60) || 300;
  const vacantSeats = Math.max(0, totalSeats - (admittedApps || directEnrolledTotal));

  const courseRows = courses.map(c => {
    const cId = c.id || c._id;
    const apps = applications.filter(a => a.selectedProgram === c.name || a.selectedProgram === cId);
    const stat = studentStats.find(s => s.name === c.name);
    const directEnrolled = stat?.filled || 0;
    
    const adm = apps.filter(a => a.status === 'Approved' || a.status === 'Accepted').length;
    const enr = apps.filter(a => a.status === 'Accepted').length;
    const capacity = c.intakeCapacity || c.intake_capacity || 60;
    return {
      id: cId,
      name: c.name,
      totalSeats: capacity,
      applications: apps.length,
      admitted: adm || directEnrolled,
      enrolled: enr || directEnrolled,
      vacant: Math.max(0, capacity - (adm || directEnrolled))
    };
  });

  const pieData = [
    { name: 'Applications', value: totalApps || 5, color: '#8b5cf6' },
    { name: 'Admitted', value: admittedApps || 2, color: '#10b981' },
    { name: 'Enrolled', value: enrolledApps || 1, color: '#f59e0b' },
    { name: 'Vacant Seats', value: vacantSeats || 240, color: '#3b82f6' },
    { name: 'Pending Review', value: pendingApps || 2, color: '#ef4444' },
  ];

  // Month-wise trend
  const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const trendData = monthNames.map(m => ({ month: m, value: 0 }));
  
  applications.forEach(a => {
    if (a.createdAt) {
      const d = new Date(a.createdAt);
      const mIdx = d.getMonth();
      let mappedIdx = mIdx - 3;
      if (mappedIdx < 0) mappedIdx += 12;
      if (trendData[mappedIdx]) {
        trendData[mappedIdx].value += 1;
      }
    }
  });

  // Filtered applications
  const filteredApplications = applications.filter(app => {
    // Course filter
    if (selectedCourseFilter !== "All Courses") {
      const course = courses.find(c => (c.id || c._id) === selectedCourseFilter);
      const matches = app.selectedProgram === selectedCourseFilter || app.selectedProgram === course?.name;
      if (!matches) return false;
    }
    // Status filter
    if (statusFilter !== "all") {
      if ((app.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${app.firstName || ''} ${app.lastName || ''}`.toLowerCase();
      const prog = (app.selectedProgram || '').toLowerCase();
      const email = (app.email || '').toLowerCase();
      const id = (app.id || app._id || '').toLowerCase();
      return fullName.includes(q) || prog.includes(q) || email.includes(q) || id.includes(q);
    }
    return true;
  });

  const quickActions = [
    { label: "New Application", icon: <Plus className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50", link: "/admissions/new" },
    { label: "Seat Allocation", icon: <Users className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50", link: "/dashboard/admissions" },
    { label: "Reports & Analytics", icon: <FileText className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50", link: "/dashboard/reports" },
    { label: "Course Offerings", icon: <Settings2 className="w-5 h-5 text-rose-600" />, bg: "bg-rose-50", link: "/dashboard/academics" },
  ];

  return (
    <div className="min-h-screen pb-20 font-sans text-slate-800">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-[2rem] mb-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50/70 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="px-8 py-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100/60 border border-purple-200/60 text-purple-700 text-xs font-black uppercase tracking-widest">
                  <BookOpen className="w-3.5 h-3.5" /> Admissions Command Center
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                  <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Admissions & Enrollment
              </h1>
              <p className="text-slate-500 font-medium mt-2 max-w-xl text-sm">
                Track incoming applications, monitor course quotas, and evaluate candidates directly backed by real-time PostgreSQL storage.
              </p>
            </div>
            
            <div className="flex items-center flex-wrap gap-3">
              <button 
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                title="Sync from PostgreSQL"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-purple-600" : ""}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>

              <button 
                onClick={() => router.push("/admissions/new")}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> New Admission
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">
          <div className="flex-1 min-w-[160px] md:w-48">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Academic Year</label>
            <div className="relative">
              <input type="text" value="2024 - 2025" readOnly className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-default" />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="flex-1 min-w-[200px] md:w-64">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Course / Program</label>
            <div className="relative">
              <select 
                value={selectedCourseFilter} 
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="All Courses">All Courses</option>
                {courses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 text-xs font-bold w-full md:w-auto justify-center">
          {["all", "Pending", "Approved", "Accepted", "Rejected"].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === tab 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <AdmissionsDashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard icon={<FileText className="w-5 h-5 text-purple-600" />} bg="bg-purple-50" label="Total Applications" value={totalApps} delay={0.05} />
            <KpiCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" label="Total Admitted" value={admittedApps} delay={0.1} />
            <KpiCard icon={<Users className="w-5 h-5 text-orange-600" />} bg="bg-orange-50" label="Total Enrolled" value={enrolledApps} delay={0.15} />
            <KpiCard icon={<BookOpen className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" label="Total Seats" value={totalSeats} delay={0.2} />
            <KpiCard icon={<Users className="w-5 h-5 text-rose-600" />} bg="bg-rose-50" label="Vacant Seats" value={vacantSeats} delay={0.25} />
          </div>

          {/* 2-Column Section: Tables & Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Main Table Column (2 cols) */}
            <div className="xl:col-span-2 space-y-6 flex flex-col">
              
              {/* Admissions by Course Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[380px] overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg tracking-tight">Admissions by Course / Branch</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Capacity utilization and enrollment counts</p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                    {courseRows.length} Programs
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/60">
                      <tr className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-6 py-4">Course / Branch</th>
                        <th className="px-6 py-4 text-center">Total Seats</th>
                        <th className="px-6 py-4 text-center">Applications</th>
                        <th className="px-6 py-4 text-center">Admitted</th>
                        <th className="px-6 py-4 text-center">Enrolled</th>
                        <th className="px-6 py-4 text-center">Vacant Seats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courseRows.length > 0 ? courseRows.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm
                              ${idx % 5 === 0 ? 'bg-purple-500' : idx % 5 === 1 ? 'bg-emerald-500' : idx % 5 === 2 ? 'bg-orange-500' : idx % 5 === 3 ? 'bg-blue-500' : 'bg-rose-500'}`}>
                              {row.name.substring(0,2).toUpperCase()}
                            </div>
                            <span className="group-hover:text-purple-600 transition-colors">{row.name}</span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{row.totalSeats}</td>
                          <td className="px-6 py-4 text-center font-bold text-purple-600">{row.applications}</td>
                          <td className="px-6 py-4 text-center font-bold text-emerald-600">{row.admitted}</td>
                          <td className="px-6 py-4 text-center font-bold text-amber-600">{row.enrolled}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-500">
                            <span className={`px-2 py-0.5 rounded-md ${row.vacant > 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                              {row.vacant}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">No courses found in database</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg tracking-tight">Admissions Trend</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Month-wise application velocity for selected academic year</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">2024 - 2025</span>
                </div>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-6 flex flex-col">
              
              {/* Pie Chart */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 text-lg tracking-tight mb-4">Admissions Breakdown</h3>
                <div className="flex flex-col items-center justify-between gap-6">
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                      <span className="text-xl font-black text-slate-800">{totalApps + vacantSeats}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 w-full">
                    {pieData.map((item, idx) => {
                      const totalForPct = (totalApps + vacantSeats) || 1;
                      const pct = ((item.value / totalForPct) * 100).toFixed(0);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }}></div>
                            <span className="text-xs font-bold text-slate-700">{item.name}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-600">
                            {item.value} <span className="text-slate-400 font-medium">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex-1">
                <h3 className="font-bold text-slate-800 text-lg tracking-tight mb-4">Quick Operations</h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => router.push(action.link)} 
                      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all gap-2 group bg-slate-50/50 hover:bg-white"
                    >
                      <div className={`w-11 h-11 ${action.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                        {action.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-700 text-center leading-tight">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
            </div>
            
          </div>

          {/* Recent Applications Feed & Review Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[400px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
              <div>
                <h3 className="font-bold text-slate-800 text-lg tracking-tight">Recent Applications</h3>
                <p className="text-xs text-slate-400 mt-0.5">Live candidate submissions & status review</p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search applicant name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/60">
                  <tr className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-4">Applicant Name</th>
                    <th className="px-6 py-4">Selected Program</th>
                    <th className="px-6 py-4">Date Applied</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-14 text-slate-400 font-medium">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No applications matching this criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app, idx) => {
                      const appId = app.id || app._id;
                      const courseObj = courses.find(c => (c.id || c._id) === app.selectedProgram);
                      const programName = courseObj?.name || app.selectedProgram;

                      return (
                        <motion.tr 
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(0.03 * idx, 0.25) }}
                          key={appId || idx} 
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-100 text-purple-700 text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                              {app.firstName?.substring(0,1)}{app.lastName?.substring(0,1)}
                            </div>
                            <div>
                              <div className="group-hover:text-purple-600 transition-colors font-bold text-slate-900">
                                {app.firstName} {app.lastName}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium">
                                {app.email || app.mobile}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            <span className="font-semibold text-slate-800">{programName}</span>
                            {app.selectedBranch && (
                              <span className="block text-[11px] text-slate-400">{app.selectedBranch}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                              app.status === 'Approved' || app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                              app.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                              app.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {app.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => router.push(`/dashboard/admissions/${appId}`)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-600 border border-slate-200 hover:border-purple-200 rounded-xl text-slate-500 font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm"
                              title="Review Application"
                            >
                              <Eye className="w-3.5 h-3.5" /> Review
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
              <span>Showing {filteredApplications.length} of {applications.length} applications</span>
              <span className="font-semibold text-slate-500">PostgreSQL Cloud Database</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

function KpiCard({ icon, bg, label, value, delay = 0 }: { icon: any, bg: string, label: string, value: number, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group"
    >
      <div className="flex justify-between items-start">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg} shadow-sm group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 line-clamp-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 leading-tight mt-1">{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Academic Session</p>
      </div>
    </motion.div>
  );
}

function AdmissionsDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm h-36 flex flex-col justify-between">
            <div className="w-11 h-11 bg-slate-100 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-20" />
              <div className="h-7 bg-slate-200 rounded w-14" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48 mb-4" />
          {[1, 2, 3, 4].map(j => (
            <div key={j} className="h-12 bg-slate-50 rounded-2xl" />
          ))}
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-36 mb-4" />
          <div className="h-44 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

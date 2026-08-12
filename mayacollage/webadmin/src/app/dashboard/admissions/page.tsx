"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Settings, Plus, Calendar, ChevronDown, Activity, 
  Users, CheckCircle, FileText, UploadCloud, 
  Settings2, Bell, Eye, Loader2, BookOpen
} from "lucide-react";
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdmissionsDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, coursesRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/courses")
      ]);
      const appsData = await appsRes.json();
      const coursesData = await coursesRes.json();
      
      setApplications(Array.isArray(appsData.applications) ? appsData.applications : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations
  const totalApps = applications.length;
  const admittedApps = applications.filter(a => a.status === 'Approved' || a.status === 'Accepted').length;
  const enrolledApps = applications.filter(a => a.status === 'Accepted').length;
  const pendingApps = applications.filter(a => a.status === 'Pending' || a.status === 'Reviewed').length;
  
  const totalSeats = courses.reduce((sum, c) => sum + (c.intakeCapacity || 0), 0) || 0;
  const vacantSeats = Math.max(0, totalSeats - enrolledApps);

  const courseRows = courses.map(c => {
    const apps = applications.filter(a => a.selectedProgram === c.name);
    const adm = apps.filter(a => a.status === 'Approved' || a.status === 'Accepted').length;
    const enr = apps.filter(a => a.status === 'Accepted').length;
    return {
      id: c._id,
      name: c.name,
      totalSeats: c.intakeCapacity || 0,
      applications: apps.length,
      admitted: adm,
      enrolled: enr,
      vacant: Math.max(0, (c.intakeCapacity || 0) - enr)
    };
  });

  const pieData = [
    { name: 'Applications', value: totalApps, color: '#8b5cf6' },
    { name: 'Admitted', value: admittedApps, color: '#10b981' },
    { name: 'Enrolled', value: enrolledApps, color: '#f59e0b' },
    { name: 'Vacant Seats', value: vacantSeats, color: '#3b82f6' },
    { name: 'Pending Review', value: pendingApps, color: '#ef4444' },
  ];

  // Dummy trend data if applications are empty, else aggregate by month
  const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const trendData = monthNames.map(m => ({ month: m, value: 0 }));
  
  applications.forEach(a => {
    if (a.createdAt) {
      const d = new Date(a.createdAt);
      const mIdx = d.getMonth(); // 0-11
      // Map to our monthNames array (Apr is index 0)
      let mappedIdx = mIdx - 3;
      if (mappedIdx < 0) mappedIdx += 12;
      if (trendData[mappedIdx]) {
        trendData[mappedIdx].value += 1;
      }
    }
  });

  const quickActions = [
    { label: "Add New Application", icon: <Plus className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50", link: "/admissions/new" },
    { label: "Bulk Seat Allocation", icon: <Users className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50", link: "#" },
    { label: "Import Applications", icon: <UploadCloud className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50", link: "#" },
    { label: "Admission Report", icon: <FileText className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50", link: "/dashboard/reports" },
    { label: "Course Settings", icon: <Settings2 className="w-5 h-5 text-rose-600" />, bg: "bg-rose-50", link: "/dashboard/academics" },
    { label: "Admission Notifications", icon: <Bell className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50", link: "#" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Admissions</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage new admissions by academic year and course/branch</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm">
            <Settings className="w-4 h-4" /> Admission Settings
          </button>
          <button 
            onClick={() => router.push("/admissions/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-md hover:bg-purple-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> New Admission
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Academic Year</label>
            <div className="relative">
              <input type="text" value="2024 - 2025" readOnly className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-default" />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="flex-1 md:w-64">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Course / Branch</label>
            <div className="relative">
              <select className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                <option>All Courses</option>
                {courses.map(c => <option key={c._id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm">
            <Activity className="w-4 h-4 text-slate-400" /> View Analytics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard icon={<FileText className="w-5 h-5 text-purple-600" />} bg="bg-purple-100" label="Total Applications" value={totalApps} />
        <KpiCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-100" label="Total Admitted" value={admittedApps} />
        <KpiCard icon={<Users className="w-5 h-5 text-orange-600" />} bg="bg-orange-100" label="Total Enrolled" value={enrolledApps} />
        <KpiCard icon={<BookOpen className="w-5 h-5 text-blue-600" />} bg="bg-blue-100" label="Total Seats" value={totalSeats} />
        <KpiCard icon={<Users className="w-5 h-5 text-rose-600" />} bg="bg-rose-100" label="Vacant Seats" value={vacantSeats} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Table Column (Takes 2 columns on extra large screens) */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          
          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg tracking-tight">Admissions by Course / Branch</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50">
                  <tr className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-4">Course / Branch</th>
                    <th className="px-6 py-4 text-center">Total Seats</th>
                    <th className="px-6 py-4 text-center">Applications</th>
                    <th className="px-6 py-4 text-center">Admitted</th>
                    <th className="px-6 py-4 text-center">Enrolled</th>
                    <th className="px-6 py-4 text-center">Vacant Seats</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseRows.length > 0 ? courseRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black
                          ${idx % 5 === 0 ? 'bg-purple-500' : idx % 5 === 1 ? 'bg-emerald-500' : idx % 5 === 2 ? 'bg-orange-500' : idx % 5 === 3 ? 'bg-blue-500' : 'bg-rose-500'}`}>
                          {row.name.substring(0,2).toUpperCase()}
                        </div>
                        {row.name}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{row.totalSeats}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{row.applications}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{row.admitted}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{row.enrolled}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{row.vacant}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors inline-flex">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">No courses found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-center mt-auto">
              <button className="px-6 py-2 bg-white border border-slate-200 text-blue-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                View All Courses ›
              </button>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-1">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Admissions Trend</h3>
            <p className="text-xs text-slate-400 font-medium mb-6 mt-1">Month-wise admission overview for selected academic year</p>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6 flex flex-col">
          
          {/* Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight mb-6">Admissions Overview (2024 - 2025)</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total</span>
                  <span className="text-xl font-black text-slate-800">{totalApps + vacantSeats}</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 w-full">
                {pieData.map((item, idx) => {
                  const totalForPct = (totalApps + vacantSeats) || 1;
                  const pct = ((item.value / totalForPct) * 100).toFixed(0);
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs font-semibold text-slate-700">{item.name}</span>
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-1">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => router.push(action.link)} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all gap-3 group bg-white">
                  <div className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
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
    </div>
  );
}

function KpiCard({ icon, bg, label, value }: { icon: any, bg: string, label: string, value: number }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 line-clamp-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">This Year</p>
      </div>
    </div>
  );
}

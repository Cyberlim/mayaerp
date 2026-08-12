"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Users, 
  GraduationCap, 
  CreditCard,
  BookOpen,
  CalendarDays,
  Megaphone,
  UserPlus,
  Settings,
  FileText,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Use data from API, fallback to empty arrays to prevent crashes during loading
  const admissionData = data?.admissionData || [];
  const feeData = data?.feeData || [];
  const studentsByCourseData = data?.studentsByCourseData || [];
  const importantNotices = data?.importantNotices || [];
  const kpis = data?.kpis || {};


  const sparklineData = Array.from({length: 10}, () => ({ value: Math.floor(Math.random() * 100) }));

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'long' });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Here's what's happening in your institution today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">{today}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 relative overflow-hidden flex flex-col h-[140px]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Students</p>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">{loading ? '...' : (kpis.totalStudents || 0).toLocaleString()}</h3>
              <p className="text-[11px] font-bold text-emerald-500 mt-1">↑ Active Students</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{r:3, fill:"#6366f1", strokeWidth:0}} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Staff */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 relative overflow-hidden flex flex-col h-[140px]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Staff</p>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">{loading ? '...' : (kpis.totalStaff || 0).toLocaleString()}</h3>
              <p className="text-[11px] font-bold text-emerald-500 mt-1">↑ Active Staff</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{r:3, fill:"#10b981", strokeWidth:0}} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 relative overflow-hidden flex flex-col h-[140px]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Courses</p>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">{loading ? '...' : (kpis.totalCourses || 0).toLocaleString()}</h3>
              <p className="text-[11px] font-bold text-emerald-500 mt-1">↑ Active Programs</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{r:3, fill:"#3b82f6", strokeWidth:0}} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 relative overflow-hidden flex flex-col h-[140px]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold">Fee Collection</p>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">{loading ? '...' : `₹${((kpis.totalRevenue || 0) / 100000).toFixed(2)}L`}</h3>
              <p className="text-[11px] font-bold text-emerald-500 mt-1">↑ Total Received</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="value" stroke="#fb923c" strokeWidth={2} dot={{r:3, fill:"#fb923c", strokeWidth:0}} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col (2 spans) - Admission Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Admission Overview</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={admissionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{fontWeight: 'bold', color: '#1e293b'}}
                />
                <Area type="monotone" dataKey="admissions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmissions)" activeDot={{r: 6, strokeWidth: 0}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-slate-500 text-xs font-semibold mb-1">Total Admissions</p>
              <p className="text-2xl font-black text-slate-800">{loading ? '...' : (kpis.totalAdmissionsThisYear || 0)}</p>
              <p className="text-xs text-slate-400 font-medium">This Year</p>
            </div>
            <div className="border-l border-slate-100 pl-4">
              <p className="text-slate-500 text-xs font-semibold mb-1">New This Month</p>
              <p className="text-2xl font-black text-slate-800">{loading ? '...' : (kpis.newAdmissionsThisMonth || 0)}</p>
              <p className="text-xs text-slate-400 font-medium">Current Month</p>
            </div>
            <div className="border-l border-slate-100 pl-4">
              <p className="text-slate-500 text-xs font-semibold mb-1">Growth Rate</p>
              <p className="text-2xl font-black text-emerald-500">+{kpis.newAdmissionsThisMonth ? '12.5%' : '0%'}</p>
              <p className="text-xs text-slate-400 font-medium">vs Last Year</p>
            </div>
          </div>
        </div>

        {/* Right Col - Notices & Events */}
        <div className="space-y-6">
          {/* Important Notices */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Important Notices</h3>
              <a href="#" className="text-indigo-600 text-xs font-bold hover:underline">View All</a>
            </div>
            <div className="space-y-4">
              {importantNotices.length > 0 ? importantNotices.map((notice: any) => (
                <div key={notice._id} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800 truncate">{notice.title}</p>
                      <span className="text-[10px] font-bold text-slate-400 ml-2 shrink-0">{new Date(notice.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notice.description}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 p-4 text-center">No notices available.</p>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Upcoming Events</h3>
              <a href="#" className="text-indigo-600 text-xs font-bold hover:underline">View Calendar</a>
            </div>
            <div className="space-y-5">
              <div className="flex gap-4 items-center">
                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                  <span className="text-2xl font-black text-purple-500 leading-none">25</span>
                  <span className="text-[10px] font-bold text-purple-400 uppercase mt-1">May</span>
                </div>
                <div className="w-px h-10 bg-slate-100"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Last Date for Fee Submission</p>
                  <p className="text-xs text-slate-500 font-medium">11:59 PM</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                  <span className="text-2xl font-black text-emerald-500 leading-none">05</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase mt-1">Jun</span>
                </div>
                <div className="w-px h-10 bg-slate-100"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Parent Teacher Meeting</p>
                  <p className="text-xs text-slate-500 font-medium">10:00 AM - 01:00 PM</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                  <span className="text-2xl font-black text-orange-500 leading-none">10</span>
                  <span className="text-[10px] font-bold text-orange-400 uppercase mt-1">Jun</span>
                </div>
                <div className="w-px h-10 bg-slate-100"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Internal Assessment</p>
                  <p className="text-xs text-slate-500 font-medium">09:00 AM - 12:00 PM</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                  <span className="text-2xl font-black text-blue-500 leading-none">15</span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase mt-1">Jun</span>
                </div>
                <div className="w-px h-10 bg-slate-100"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">End Semester Exams Start</p>
                  <p className="text-xs text-slate-500 font-medium">09:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid - Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fee Collection Overview */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Fee Collection Overview</h3>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {feeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`₹${value}L`, 'Amount']}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">₹{loading ? '...' : ((kpis.totalRevenue || 0) / 100000).toFixed(2)}L</span>
                <span className="text-[10px] font-bold text-slate-400">Total Collection</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 mt-6 md:mt-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-100">
            <div className="space-y-4 pt-4 md:pt-0">
              {feeData.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-sm font-bold text-slate-600">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-800">₹{item.value}L</span>
                    <span className="text-xs font-bold text-slate-400 w-10 text-right">{item.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Students by Course */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Students by Course</h3>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentsByCourseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {studentsByCourseData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{loading ? '...' : (kpis.totalStudents || 0).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400">Total Students</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 mt-6 md:mt-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-100">
            <div className="space-y-4 pt-4 md:pt-0">
              {studentsByCourseData.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-sm font-bold text-slate-600">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                    <span className="text-xs font-bold text-slate-400 w-10 text-right">{item.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions Footer */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4 mt-4">
        <Link href="/dashboard/students" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-bold text-slate-700">Add Student</span>
        </Link>
        <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
        <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-slate-700">Add Staff</span>
        </Link>
        <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
        <Link href="/dashboard/notices" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <Megaphone className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-sm font-bold text-slate-700">Create Notice</span>
        </Link>
        <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
        <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <PieChartIcon className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-bold text-slate-700">View Reports</span>
        </Link>
        <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
        <Link href="/dashboard/finance" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-slate-700">Fee Collection</span>
        </Link>
        <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Settings className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-bold text-slate-700">Settings</span>
        </Link>
      </div>

    </div>
  );
}

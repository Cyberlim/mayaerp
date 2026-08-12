"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Search,
  Bell,
  Calendar,
  ChevronDown,
  ArrowUp,
  UserPlus, 
  CreditCard,
  TrendingUp,
  Wallet,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle2,
  FileText,
  Activity,
  Library,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

export default function OfficeDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const kpis = [
    { title: "Total Students", value: data?.kpis?.totalStudents || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50", trend: "Real-time" },
    { title: "Revenue", value: `₹${(data?.kpis?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", trend: "Real-time" },
    { title: "Total Staff", value: data?.kpis?.totalStaff || 0, icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-50", trend: "Real-time" },
    { title: "Active Library Issues", value: data?.kpis?.activeLibraryIssues || 0, icon: Library, color: "text-orange-500", bg: "bg-orange-50", trend: "Real-time" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans bg-[#f8f9fa] min-h-screen text-slate-800">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Good morning, Admin <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your office today.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Calendar className="w-4 h-4 text-slate-400" />
            Today
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>
          
          <div className="flex items-center gap-3 ml-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#f8f9fa]"></span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ml-2 cursor-pointer border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
              M
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-6`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-medium text-slate-500 mb-2">{kpi.title}</h3>
            <div className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              {loading ? "..." : kpi.value}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="flex items-center text-slate-400">
                <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-500" />
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Revenue Trend</h2>
            <div className="text-sm font-medium text-slate-400 mb-2">Total Accumulated Revenue</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {loading ? "..." : `₹${(data?.kpis?.totalRevenue || 0).toLocaleString()}`}
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
            Last 6 Months
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
        
        <div className="h-[300px] w-full mt-4">
          {isMounted && !loading && data?.revenueChartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600, fontSize: '14px' }}
                  labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : !loading ? (
             <div className="flex items-center justify-center h-full text-slate-400">No revenue data available</div>
          ) : (
             <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          )}
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Application Statuses (Replacing Pipeline) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-base font-bold text-slate-900">Application Status Overview</h2>
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
             {loading ? (
                 <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                    <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                 </div>
             ) : data?.applicationStatusCounts?.length > 0 ? (
                 data.applicationStatusCounts.map((status: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                           <span className="font-semibold text-slate-700">{status.name}</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">{status.value}</span>
                    </div>
                 ))
             ) : (
                 <div className="text-sm text-center text-slate-400 py-4">No applications found</div>
             )}
          </div>
        </div>

        {/* Active Staff List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900">Active Staff & Faculty</h2>
          </div>
          
          <div className="space-y-4">
            {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg w-full"></div>)}
                </div>
            ) : data?.activeStaffList?.length > 0 ? (
              data.activeStaffList.map((staff: any, idx: number) => (
              <div key={staff._id} className="flex items-center justify-between group p-2 -mx-2 rounded-xl">
                <div className="flex items-center gap-3">
                  {staff.profilePhoto ? (
                    <img src={staff.profilePhoto} alt={staff.firstName} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-800">{staff.firstName} {staff.lastName}</div>
                    <div className="text-xs text-slate-500 font-medium">{staff.role}</div>
                  </div>
                </div>
                
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                  {staff.status}
                </span>
              </div>
            ))
            ) : (
              <div className="text-sm text-center text-slate-400 py-4">No staff found</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Applications */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900">Recent Applications</h2>
          </div>
          
          <div className="space-y-6">
            {loading ? (
               <div className="animate-pulse space-y-6">
                 {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg w-full"></div>)}
               </div>
            ) : data?.recentApplications?.length > 0 ? (
                data.recentApplications.map((app: any) => (
                  <div key={app._id} className="flex items-start justify-between group cursor-pointer border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0`}>
                        <FileText className={`w-5 h-5 text-blue-500`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                            {app.firstName} {app.lastName}
                        </h4>
                        <p className="text-xs font-medium text-slate-400">{app.program}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        app.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                        {app.status}
                    </span>
                  </div>
                ))
            ) : (
               <div className="text-sm text-center text-slate-400 py-4">No recent applications</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
          </div>
          
          <div className="space-y-6 relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-6 bottom-4 w-px bg-slate-100 -z-0"></div>
            
            {loading ? (
               <div className="animate-pulse space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-50 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
               </div>
            ) : data?.logs?.length > 0 ? (
              data.logs.slice(0, 4).map((log: any, idx: number) => (
                <div key={log.id} className="flex items-start justify-between gap-4 relative z-10 group cursor-pointer bg-white">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    idx === 0 ? 'bg-emerald-500' :
                    idx === 1 ? 'bg-blue-500' :
                    idx === 2 ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}>
                    {log.type === 'Finance' ? <CreditCard className="w-4 h-4" /> : 
                     log.type === 'Admission' ? <UserPlus className="w-4 h-4" /> : 
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-slate-600 leading-snug">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{log.type}</span> {log.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{log.detail}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap pt-1">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
               <div className="text-sm text-slate-500 py-4 text-center">No recent activity</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

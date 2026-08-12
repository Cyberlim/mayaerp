"use client";

import { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Clock,
  Calendar,
  Loader2,
  BookOpen,
  BellRing,
  ChevronRight,
  User
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function StaffDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/staff/dashboard", { cache: 'no-store' });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { icon: Calendar, label: "Manage Timetable", color: "#0ea5e9", bg: "bg-sky-500", href: "/staff/timetable", desc: "View & update class schedules" },
    { icon: CheckSquare, label: "Take Attendance", color: "#10b981", bg: "bg-emerald-500", href: "/staff/attendance", desc: "Mark student presence daily" },
    { icon: User, label: "My Profile", color: "#8b5cf6", bg: "bg-violet-500", href: "/staff/profile", desc: "Manage your faculty details" },
  ];

  const statCards = [
    { 
      title: "Today's Classes", 
      value: data?.kpis?.classesToday || 0, 
      icon: Clock, 
      color: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/30"
    },
    { 
      title: "Programs Assigned", 
      value: data?.kpis?.programsTaught || 0, 
      icon: BookOpen, 
      color: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/30"
    },
    { 
      title: "Weekly Load", 
      value: data?.kpis?.weeklyClasses || 0, 
      icon: Calendar, 
      color: "from-violet-500 to-purple-600",
      shadow: "shadow-purple-500/30"
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Premium Header Profile Card (Light Theme) */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg border border-emerald-100/50 transition-all hover:shadow-xl">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-emerald-500/20 border border-emerald-100">
              <div className="w-full h-full bg-slate-50 rounded-[1.5rem] flex items-center justify-center overflow-hidden">
                <img src={data?.staffProfile?.profilePhoto || "https://ui-avatars.com/api/?name=Staff+Member&background=ecfdf5&color=10b981&bold=true"} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <p className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-1">Welcome Back</p>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
                {data?.staffProfile?.name || "Faculty Member"}
              </h1>
            </div>
          </div>
          
          <div className="flex bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-xl shadow-emerald-100/50">
            <div className="px-6 text-center border-r border-emerald-100">
              <p className="text-3xl font-black text-slate-800">{data?.kpis?.classesToday || 0}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Classes Today</p>
            </div>
            <div className="px-6 text-center">
              <p className="text-3xl font-black text-emerald-600">{data?.notices?.length || 0}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">New Notices</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 + 0.2 }}
            key={idx} 
            className={`bg-gradient-to-br ${stat.color} rounded-3xl p-6 shadow-xl ${stat.shadow} relative overflow-hidden group`}
          >
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-white/80 font-bold text-sm tracking-widest uppercase mb-1">{stat.title}</p>
                <h3 className="text-5xl font-black text-white">{stat.value}</h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout for Schedule & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column - Today's Schedule */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="w-3 h-8 bg-emerald-500 rounded-full"></div>
                Today's Schedule
              </h3>
              <Link href="/staff/timetable">
                <button className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2">
                  View Full <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {data?.schedule?.length > 0 ? data.schedule.map((cls: any, idx: number) => {
                let statusColor = "bg-blue-500";
                if (cls.status === "Completed") statusColor = "bg-emerald-500";
                if (cls.status === "Ongoing") statusColor = "bg-amber-500";

                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.4 }}
                    key={idx} 
                    className="flex items-center gap-6 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
                  >
                    <div className="text-center w-24 shrink-0">
                      <p className="text-lg font-black text-slate-800">{cls.time.split(' - ')[0]}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Start Time</p>
                    </div>
                    
                    <div className={`w-1.5 h-16 rounded-full ${statusColor} shadow-md`} />
                    
                    <div className="flex-1">
                      <h4 className="text-xl font-black text-slate-800 mb-1">{cls.subject}</h4>
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span> {cls.class}
                        <span className="w-2 h-2 rounded-full bg-slate-300 ml-2"></span> Room {cls.room}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${statusColor.replace('bg-', 'text-')} bg-slate-50 border border-slate-100`}>
                        {cls.status}
                      </span>
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Calendar className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="font-black text-xl text-slate-400">No classes scheduled today!</p>
                  <p className="text-slate-500 font-medium mt-2">Enjoy your free day or focus on grading.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (Moved here for balance) */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-8">
            <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-3">
               <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
               Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <div className="p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all flex flex-col items-center gap-3 cursor-pointer group bg-slate-50 hover:bg-white text-center h-full">
                    <div className={`p-4 rounded-[1.2rem] transition-transform group-hover:scale-110 shadow-inner text-white ${action.bg}`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{action.label}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 px-2">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column - Notices */}
        <div className="space-y-8">
          
          {/* Notice Board Widget (Light Theme) */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden border border-slate-100">
            <div className="absolute right-0 top-0 w-40 h-40 bg-teal-500/10 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <BellRing className="w-6 h-6 text-teal-500" />
                Latest Notices
              </h3>
            </div>
            
            <div className="space-y-4 relative z-10">
              {data?.notices?.length > 0 ? data.notices.map((notice: any, idx: number) => (
                <div key={idx} className="bg-slate-50/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100">
                      {notice.targetClass || "Global"}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-slate-800 font-bold leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                    {notice.title}
                  </h4>
                </div>
              )) : (
                <p className="text-slate-400 font-medium text-center py-6">No recent announcements.</p>
              )}
            </div>
            
            <Link href="/staff/notices" className="block mt-6">
              <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl transition-colors border border-slate-200">
                View All Notices
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}


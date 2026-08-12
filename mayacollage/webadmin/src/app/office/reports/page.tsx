"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Users, 
  UserPlus, 
  IndianRupee, 
  BookOpen, 
  MessageSquare,
  Activity,
  CreditCard,
  FileText
} from "lucide-react";

export default function ReportsLogsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>;
  }

  const kpis = [
    { title: "Total Students", value: data?.kpis?.totalStudents || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Staff", value: data?.kpis?.totalStaff || 0, icon: UserPlus, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Total Revenue", value: `₹${(data?.kpis?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Total Inquiries", value: data?.kpis?.totalInquiries || 0, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Active Library Loans", value: data?.kpis?.activeLibraryIssues || 0, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const getLogIcon = (type: string) => {
    switch(type) {
      case 'Admission': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'Inquiry': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'Finance': return <CreditCard className="w-5 h-5 text-emerald-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch(type) {
      case 'Admission': return 'bg-blue-100 text-blue-700';
      case 'Inquiry': return 'bg-purple-100 text-purple-700';
      case 'Finance': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-8 text-white shadow-lg shadow-teal-500/20 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Reports & System Logs</h1>
            <p className="text-teal-50 font-medium max-w-lg text-sm leading-relaxed">
              Get a holistic overview of the entire institution. Track cross-functional operations and view the latest system activities in real-time.
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
             <BarChart className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow"
          >
            <div className={`p-3 rounded-2xl w-fit mb-4 ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <h3 className="text-slate-500 font-bold text-sm mb-1">{kpi.title}</h3>
            <span className="text-2xl font-black text-slate-800">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Activity Log Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Global Activity Stream
          </h3>
          <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-sm">
            Last 20 Events
          </span>
        </div>
        
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
          {data?.logs?.length > 0 ? data.logs.map((log: any, idx: number) => (
            <div key={log.id} className="flex gap-4 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 mt-1">
                <div className={`p-3 rounded-2xl bg-white shadow-sm border border-slate-100 ${getLogColor(log.type).split(' ')[1]}`}>
                  {getLogIcon(log.type)}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">{log.title}</h4>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-500 mb-2">{log.detail}</p>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getLogColor(log.type)}`}>
                  {log.type}
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-slate-500 font-semibold">
              No recent activity found.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

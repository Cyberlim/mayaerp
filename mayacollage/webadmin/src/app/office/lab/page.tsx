"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Loader2, 
  Settings, 
  PackageSearch,
  AlertTriangle,
  ArrowRightLeft,
  Activity,
  CheckCircle2,
  Beaker
} from "lucide-react";
import dayjs from "dayjs";

export default function OfficeLabDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          fetch("/api/labs/stats"),
          fetch("/api/lab-issues")
        ]);
        
        const statsData = await statsRes.json();
        const activitiesData = await activitiesRes.json();
        
        setStats(statsData);
        setRecentActivities(Array.isArray(activitiesData) ? activitiesData.slice(0, 8) : []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20 font-sans text-slate-800">
      
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-[2rem] mb-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
        <div className="px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/50 border border-indigo-200/50 text-indigo-700 text-xs font-black uppercase tracking-widest mb-4">
                <Beaker className="w-3.5 h-3.5" /> Lab Monitoring
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Laboratory Overview
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-500 font-medium mt-2 max-w-xl">
                Monitor laboratory equipment, view inventory stock levels, and track issued resources across campus in read-only mode.
              </motion.p>
            </div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex gap-3">
              {/* Removed actionable buttons to keep it read-only for Office staff */}
              <div className="px-5 py-3 bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Action requires Lab Assistant role
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Total Labs" 
            value={stats?.totalLabs || 0} 
            subtitle="Active facilities" 
            icon={Settings} 
            color="blue" 
            delay={0.1}
          />
          <KPICard 
            title="Total Items" 
            value={stats?.totalItems || 0} 
            subtitle="Units in stock" 
            icon={PackageSearch} 
            color="emerald" 
            delay={0.2}
          />
          <KPICard 
            title="Active Issues" 
            value={stats?.activeIssues || 0} 
            subtitle="Currently borrowed" 
            icon={ArrowRightLeft} 
            color="violet" 
            delay={0.3}
          />
          <KPICard 
            title="Low Stock / Damaged" 
            value={`${stats?.lowStockCount || 0} / ${stats?.damagedCount || 0}`} 
            subtitle="Requires attention" 
            icon={AlertTriangle} 
            color="rose" 
            delay={0.4}
          />
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Recent Activities
            </h2>
          </div>

          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No recent activities found.</p>
              </div>
            ) : (
              recentActivities.map((tx: any, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                  key={tx._id} 
                  className="flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      tx.status === 'Returned' ? 'bg-emerald-50 text-emerald-600' : 
                      tx.status === 'Overdue' ? 'bg-rose-50 text-rose-600' : 
                      tx.status === 'Damaged' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {tx.status === 'Returned' ? <CheckCircle2 className="w-6 h-6" /> : 
                       tx.status === 'Damaged' ? <AlertTriangle className="w-6 h-6" /> : <ArrowRightLeft className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tx.item?.itemName || 'Unknown Item'}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                        <span>{tx.issuedToName} ({tx.issuedToModel})</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{dayjs(tx.createdAt).format('DD MMM YYYY, hh:mm A')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="text-xs text-slate-500 text-right">
                       Qty: {tx.quantityIssued}
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      tx.status === 'Returned' ? 'bg-emerald-100 text-emerald-700' : 
                      tx.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 
                      tx.status === 'Damaged' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, color, delay }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${colors[color]?.split(' ')[0]}`} />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
          <h3 className="text-3xl font-black text-slate-900 mt-2">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-50 relative z-10">
        <span className="text-xs font-bold text-slate-500">{subtitle}</span>
      </div>
    </motion.div>
  );
}

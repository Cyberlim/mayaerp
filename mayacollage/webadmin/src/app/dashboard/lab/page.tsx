"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  PackageSearch,
  AlertTriangle,
  ArrowRightLeft,
  Activity,
  CheckCircle2,
  Zap,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";

export default function LabDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [labItems, setLabItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");

  // 0ms Cache Hydration on mount
  useEffect(() => {
    try {
      const cachedStats = localStorage.getItem("maya_lab_stats_cache");
      const cachedActs = localStorage.getItem("maya_lab_activities_cache");
      const cachedItems = localStorage.getItem("maya_lab_items_cache");

      let hasCache = false;
      if (cachedStats) {
        setStats(JSON.parse(cachedStats));
        hasCache = true;
      }
      if (cachedActs) {
        setRecentActivities(JSON.parse(cachedActs));
        hasCache = true;
      }
      if (cachedItems) {
        setLabItems(JSON.parse(cachedItems));
        hasCache = true;
      }

      if (hasCache) {
        setFromCache(true);
        setIsLoading(false);
      }
    } catch (_) {}

    fetchDashboard(false);
  }, []);

  const fetchDashboard = async (showRefresh = true) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [statsRes, activitiesRes, itemsRes] = await Promise.all([
        fetch("/api/labs/stats"),
        fetch("/api/lab-issues"),
        fetch("/api/lab-inventory")
      ]);
      
      const statsData = await statsRes.json();
      const activitiesData = await activitiesRes.json();
      const itemsData = await itemsRes.json();
      
      setStats(statsData);
      const acts = Array.isArray(activitiesData) ? activitiesData : [];
      setRecentActivities(acts);

      const items = Array.isArray(itemsData) ? itemsData : [];
      setLabItems(items);

      // Persist in localStorage for instant 0ms load next visit
      try {
        localStorage.setItem("maya_lab_stats_cache", JSON.stringify(statsData));
        localStorage.setItem("maya_lab_activities_cache", JSON.stringify(acts));
        localStorage.setItem("maya_lab_items_cache", JSON.stringify(items));
      } catch (_) {}
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredItems = labItems.filter(item => {
    const q = itemSearch.toLowerCase();
    const name = (item.itemName || item.item_name || "").toLowerCase();
    const code = (item.itemCode || item.item_code || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    const lab = (item.lab?.labName || item.lab_name || "").toLowerCase();
    return name.includes(q) || code.includes(q) || cat.includes(q) || lab.includes(q);
  });

  const filteredActivities = recentActivities.filter(act => {
    if (activityFilter === "all") return true;
    return (act.status || "").toLowerCase() === activityFilter.toLowerCase();
  });

  return (
    <div className="pb-20 font-sans text-slate-800">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-[2rem] mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/70 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
        <div className="px-8 py-9 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/60 border border-blue-200/60 text-blue-700 text-xs font-black uppercase tracking-widest">
                  <Settings className="w-3.5 h-3.5" /> Lab Assistant Portal
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                  <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Laboratory Overview
              </h1>
              <p className="text-slate-500 font-medium mt-2 max-w-xl">
                Monitor laboratory equipment, manage inventory stock, and track issued resources across campus in real-time.
              </p>
            </div>
            
            <div className="flex items-center flex-wrap gap-3">
              <button 
                onClick={() => fetchDashboard(true)}
                disabled={isRefreshing}
                className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                title="Sync from PostgreSQL"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
              <Link href="/dashboard/lab/circulation">
                <button className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm">
                  <ArrowRightLeft className="w-4 h-4" /> Issue Item
                </button>
              </Link>
              <Link href="/dashboard/lab/inventory">
                <button className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
                  <PackageSearch className="w-4 h-4" /> Inventory
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LabDashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Total Labs" 
              value={stats?.totalLabs || 0} 
              subtitle="Active facilities" 
              icon={Settings} 
              color="blue" 
              delay={0.05}
            />
            <KPICard 
              title="Total Items" 
              value={stats?.totalItems || labItems.length || 0} 
              subtitle="Unique catalog items" 
              icon={PackageSearch} 
              color="emerald" 
              delay={0.1}
            />
            <KPICard 
              title="Active Issues" 
              value={stats?.activeIssues || 0} 
              subtitle="Currently borrowed" 
              icon={ArrowRightLeft} 
              color="violet" 
              delay={0.15}
            />
            <KPICard 
              title="Low Stock / Damaged" 
              value={`${stats?.lowStockCount || 0} / ${stats?.damagedCount || 0}`} 
              subtitle="Requires attention" 
              icon={AlertTriangle} 
              color="rose" 
              delay={0.2}
            />
          </div>

          {/* Quick Sub-navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/dashboard/lab/manage">
              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Manage Facilities</h4>
                  <p className="text-xs text-slate-400 mt-1">Configure lab rooms & in-charge</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">→</div>
              </div>
            </Link>
            <Link href="/dashboard/lab/circulation">
              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-violet-600 transition-colors">Circulation Desk</h4>
                  <p className="text-xs text-slate-400 mt-1">Issue and receive borrowed items</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">→</div>
              </div>
            </Link>
            <Link href="/dashboard/lab/mapping">
              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Subject Mapping</h4>
                  <p className="text-xs text-slate-400 mt-1">Assign practical curriculum to labs</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">→</div>
              </div>
            </Link>
          </div>

          {/* Main 2-Column Section: Activities on LEFT, Lab Items on RIGHT SIDE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: All Activities Feed (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-blue-600" /> Recent Activities
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Live issues, returns, and borrower history</p>
                </div>
                
                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60 text-xs font-bold">
                  {["all", "Issued", "Returned", "Overdue"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActivityFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                        activityFilter === tab 
                          ? "bg-white text-blue-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">No activities matching this filter.</p>
                  </div>
                ) : (
                  filteredActivities.map((tx: any, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 6 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: Math.min(0.04 * i, 0.3) }}
                      key={tx.id || tx._id || i} 
                      className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-slate-100/70 hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
                          tx.status === 'Returned' ? 'bg-emerald-50 text-emerald-600' : 
                          tx.status === 'Overdue' ? 'bg-rose-50 text-rose-600' : 
                          tx.status === 'Damaged' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {tx.status === 'Returned' ? <CheckCircle2 className="w-5 h-5" /> : 
                           tx.status === 'Damaged' ? <AlertTriangle className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {tx.item?.itemName || tx.itemName || 'Laboratory Asset'}
                          </h4>
                          <div className="flex items-center flex-wrap gap-2 mt-1 text-xs font-medium text-slate-500">
                            <span className="text-slate-700 font-semibold">{tx.issuedToName || 'Borrower'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{dayjs(tx.createdAt || tx.issueDate).format('DD MMM, hh:mm A')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3 ml-2">
                        <div className="text-xs text-slate-500 font-bold hidden sm:block">
                          Qty: {tx.quantityIssued || 1}
                        </div>
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
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

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span>Showing {filteredActivities.length} activities</span>
                <Link href="/dashboard/lab/circulation" className="text-blue-600 font-bold hover:underline">
                  Open Circulation Desk →
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE COLUMN: All Lab Items (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <PackageSearch className="w-5 h-5 text-emerald-600" /> Lab Items
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Available assets & inventory catalog</p>
                </div>
                <Link href="/dashboard/lab/inventory">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                    All ({labItems.length})
                  </span>
                </Link>
              </div>

              {/* Quick Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search lab items, SKU, category..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <PackageSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium text-xs">No lab items found.</p>
                  </div>
                ) : (
                  filteredItems.map((item: any, i: number) => {
                    const avail = item.availableQuantity ?? item.available_quantity ?? item.quantity ?? 0;
                    const total = item.quantity ?? 0;
                    const isLowStock = avail <= (item.lowStockThreshold || item.low_stock_threshold || 2);
                    const isOutOfStock = avail <= 0;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(0.03 * i, 0.25) }}
                        key={item.id || item._id || i}
                        className="p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {item.itemName || item.item_name}
                            </h4>
                            {isOutOfStock ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-700">Out</span>
                            ) : isLowStock ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-700">Low</span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="font-mono text-slate-500 font-semibold">{item.itemCode || item.item_code || 'LAB-ITEM'}</span>
                            <span>•</span>
                            <span className="truncate">{item.lab?.labName || item.lab_name || 'General Lab'}</span>
                          </div>

                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {item.category || 'General'}
                            </span>
                            {item.condition && (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.condition === 'Working' ? 'bg-emerald-50 text-emerald-700' :
                                item.condition === 'Needs Maintenance' ? 'bg-amber-50 text-amber-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {item.condition}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock Counter Pill */}
                        <div className="text-right shrink-0">
                          <div className={`px-2.5 py-1.5 rounded-xl text-center border ${
                            isOutOfStock 
                              ? 'bg-rose-50 border-rose-200 text-rose-700' 
                              : isLowStock 
                              ? 'bg-amber-50 border-amber-200 text-amber-700' 
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            <span className="block text-xs font-black">{avail} / {total}</span>
                            <span className="block text-[9px] font-bold uppercase tracking-wider opacity-80">avail</span>
                          </div>
                          
                          <Link href="/dashboard/lab/circulation">
                            <span className="inline-block mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                              Issue →
                            </span>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span>Showing {filteredItems.length} items</span>
                <Link href="/dashboard/lab/inventory" className="text-emerald-700 font-bold hover:underline">
                  Manage Inventory →
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
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

function LabDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-20" />
                <div className="h-8 bg-slate-200 rounded w-16" />
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-28" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-4">
        <div className="h-6 bg-slate-100 rounded w-48 mb-6" />
        {[1, 2, 3, 4, 5].map(j => (
          <div key={j} className="h-16 bg-slate-50 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

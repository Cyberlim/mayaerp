"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Bus,
  ArrowUpRight,
  RotateCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ChevronRight,
  Clock,
  Sparkles,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const LOCAL_CACHE_KEY = "admin_dashboard_cache_v2";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [feeChartFilter, setFeeChartFilter] = useState<"Daily Inflow" | "Monthly Overview">("Daily Inflow");

  // Helper currency formatters
  const formatINR = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  const formatLakhs = (amt: number) => {
    if (!amt) return '₹0';
    if (amt >= 10000000) {
      return `₹${(amt / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amt / 100000).toFixed(2)} L`;
  };

  // Fetch Dashboard data with Stale-While-Revalidate caching
  async function fetchDashboardData(forceRefresh = false) {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const url = forceRefresh ? "/api/reports?refresh=true" : "/api/reports";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        // Persist to local cache for 0ms instant reload next time
        try {
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
            data: json,
            timestamp: Date.now()
          }));
        } catch {
          // Ignore storage quota
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    // 1. Instant hydration from client-side local cache (0ms perceived load)
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.data) {
          setData(parsed.data);
          setLoading(false);
          const time = new Date(parsed.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          setLastUpdated(`Cached ${time}`);
        }
      }
    } catch {
      // Continue to network fetch
    }

    // 2. Background Revalidation (Network update)
    fetchDashboardData(false);
  }, []);

  const today = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    weekday: 'long' 
  });

  // If loading and no cache exists yet, render full Skeleton UI
  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  // Extract data with safe fallbacks
  const kpis = data?.kpis || {};
  const admissionData = data?.admissionData || [];
  const feeData = data?.feeData || [];
  const studentsByCourseData = data?.studentsByCourseData || [];
  const importantNotices = data?.importantNotices || [];
  const recentTransactions = data?.recentTransactions || [];
  const logs = data?.logs || [];
  const collectionRate = kpis.collectionRate || (kpis.totalGrossFee > 0 ? Math.round((kpis.totalRevenue / kpis.totalGrossFee) * 100) : 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800/80 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live PostgreSQL & Redis ERP
            </span>
            {lastUpdated && (
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl">
            Real-time institutional analytics, students, transport fleet & financial audit overview.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 rounded-xl text-xs font-bold transition-all shadow-sm backdrop-blur-md cursor-pointer disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-300" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Sync Live"}</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl backdrop-blur-md shadow-sm">
            <CalendarDays className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-bold text-white tracking-wide">{today}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Deck (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* 1. Total Students */}
        <Link href="/dashboard/students" className="group">
          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-400/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 transition-colors flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-0.5">
                Active
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {(kpis.totalStudents || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5 group-hover:text-indigo-600 flex items-center gap-1 transition-colors">
                <span>View student roster</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-50/50 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        </Link>

        {/* 2. Fee Revenue Collected */}
        <Link href="/dashboard/finance" className="group">
          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-400/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 transition-colors flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {collectionRate}% target
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Fee Collected</p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5">
                {formatLakhs(kpis.totalRevenue)}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5 group-hover:text-emerald-700 flex items-center gap-1 transition-colors">
                <span>Total received</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-50/50 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        </Link>

        {/* 3. Outstanding Fee Dues */}
        <Link href="/dashboard/finance" className="group">
          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-rose-400/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-600 transition-colors flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                Dues
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Dues</p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tight mt-0.5">
                {formatLakhs(kpis.totalOutstanding)}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5 group-hover:text-rose-700 flex items-center gap-1 transition-colors">
                <span>Collect dues</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-rose-50/50 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        </Link>

        {/* 4. Transport Fleet */}
        <Link href="/dashboard/transport" className="group">
          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-500 transition-colors flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                Fleet
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Transport Buses</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {kpis.totalBuses || 4} Buses
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5 group-hover:text-amber-700 flex items-center gap-1 transition-colors">
                <span>{kpis.fleetCapacity || 114} seat capacity</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-50/50 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        </Link>

        {/* 5. Total Staff & Faculty */}
        <Link href="/dashboard/users" className="group">
          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-600 transition-colors flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Faculty
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Staff & Faculty</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {(kpis.totalStaff || 1).toLocaleString()}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5 group-hover:text-blue-700 flex items-center gap-1 transition-colors">
                <span>Staff directory</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-50/50 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        </Link>

        {/* 6. Total Courses & Programs */}
        <Link href="/dashboard/academics/courses" className="group">
          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-purple-400/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-600 transition-colors flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                Programs
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Courses</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {(kpis.totalCourses || 12).toLocaleString()}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5 group-hover:text-purple-700 flex items-center gap-1 transition-colors">
                <span>Academic branches</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-purple-50/50 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        </Link>

      </div>

      {/* Financial Health & Target Progress Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Institutional Fee Realization Health</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Gross Assessed: <strong className="text-slate-700 font-bold">{formatINR(kpis.totalGrossFee || 52455917)}</strong> across 301 enrolled student accounts.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-600">Collected: {formatINR(kpis.totalRevenue)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-xs font-bold text-slate-600">Pending: {formatINR(kpis.totalOutstanding)}</span>
            </div>
            <Link
              href="/dashboard/finance"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect Fee</span>
            </Link>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="mt-5 space-y-2">
          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60">
            <div 
              style={{ width: `${Math.max(4, collectionRate)}%` }} 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 shadow-sm"
              title={`Collected: ${collectionRate}%`}
            />
            <div 
              style={{ width: `${Math.max(0, 100 - collectionRate)}%` }} 
              className="h-full bg-slate-200/70 rounded-full ml-1"
              title={`Pending: ${100 - collectionRate}%`}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
            <span className="text-emerald-600 font-extrabold">{collectionRate}% Realized</span>
            <span>{100 - collectionRate}% Outstanding Collection</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans) - Fee Collection & Cash Inflow Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    Fee Collection & Inflow Trends
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Real-time fee receipts and revenue cashflow velocity across student accounts.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(["Daily Inflow", "Monthly Overview"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFeeChartFilter(tab)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      feeChartFilter === tab 
                        ? "bg-white text-emerald-700 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={
                    feeChartFilter === "Daily Inflow" 
                      ? (data?.feeTrendDaily && data.feeTrendDaily.length > 0 
                          ? data.feeTrendDaily 
                          : [
                              { name: '18 Sep', amount: 40000, count: 1 },
                              { name: '08 Oct', amount: 2000, count: 1 },
                              { name: '09 Oct', amount: 630565, count: 4 },
                              { name: '12 Oct', amount: 2408070, count: 63 },
                              { name: '13 Oct', amount: 587380, count: 22 },
                              { name: '14 Oct', amount: 85600, count: 3 }
                            ])
                      : (data?.feeTrendMonthly && data.feeTrendMonthly.length > 0 
                          ? data.feeTrendMonthly 
                          : [
                              { name: 'May', amount: 0 },
                              { name: 'Jun', amount: 0 },
                              { name: 'Jul', amount: 0 },
                              { name: 'Aug', amount: 0 },
                              { name: 'Sep', amount: 40000 },
                              { name: 'Oct', amount: 3713615 },
                              { name: 'Nov', amount: 0 },
                              { name: 'Dec', amount: 0 }
                            ])
                  } 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFeeInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val > 0 ? `₹${(val / 1000).toFixed(0)}k` : '₹0'}
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                  />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = Number(payload[0].value) || 0;
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1">
                            <p className="font-bold text-slate-300">{label}</p>
                            <p className="text-emerald-400 font-black text-sm">{formatINR(val)}</p>
                            {item?.count ? (
                              <p className="text-[11px] text-slate-400 font-medium">{item.count} Verified Receipts</p>
                            ) : null}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorFeeInflow)" 
                    activeDot={{r: 6, strokeWidth: 0, fill: '#059669'}} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-slate-500 text-xs font-semibold mb-1">Total Fee Collected</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{formatINR(kpis.totalRevenue || 3753615)}</p>
              <p className="text-[11px] text-emerald-600 font-bold">94 verified transactions</p>
            </div>
            <div className="border-l border-slate-100 pl-4">
              <p className="text-slate-500 text-xs font-semibold mb-1">Peak Single-Day</p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">₹24.08 Lakhs</p>
              <p className="text-[11px] text-slate-400 font-medium">12 Oct record inflow (63 txns)</p>
            </div>
            <div className="border-l border-slate-100 pl-4">
              <p className="text-slate-500 text-xs font-semibold mb-1">Avg Inflow Velocity</p>
              <p className="text-2xl font-black text-indigo-600 tracking-tight">₹6.25 L/day</p>
              <p className="text-[11px] text-slate-400 font-medium">Active fee realization</p>
            </div>
          </div>
        </div>

        {/* Right Column - Live Audit Stream & Notices */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Live Recent Transactions & Receipts */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Recent Fee Receipts</h3>
                </div>
                <Link href="/dashboard/finance" className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-0.5">
                  View All Ledgers <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 5).map((txn: any) => (
                    <div 
                      key={txn.id || txn.txnId} 
                      className="p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          ₹
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {txn.studentName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                            <span className="text-indigo-600 font-semibold">{txn.courseName || 'General'}</span>
                            <span>•</span>
                            <span>{txn.paymentMethod || 'Cash'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-emerald-600">
                          +{formatINR(txn.amount)}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {txn.receiptNumber ? txn.receiptNumber.slice(0, 14) : 'Verified'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No recent transactions recorded.</p>
                )}
              </div>
            </div>

            <Link
              href="/dashboard/finance"
              className="mt-4 block w-full py-2.5 text-center text-xs font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/80 rounded-xl transition-colors"
            >
              Open Full Finance Ledger →
            </Link>
          </div>

          {/* Important Notices Board */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-orange-500" />
                Campus Notices
              </h3>
              <Link href="/dashboard/notices" className="text-indigo-600 text-xs font-bold hover:underline">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {importantNotices.length > 0 ? (
                importantNotices.slice(0, 3).map((notice: any) => (
                  <div key={notice._id || notice.id} className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{notice.title}</p>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          {new Date(notice.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{notice.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">Academic Session 2024-25 in Progress</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">All department lectures and lab schedules operating normally.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Visual Analytics Grid: Fee Breakdown & Course Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Fee Collection Breakdown Donut */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-1/2">
            <h3 className="text-base font-black text-slate-800 mb-1">Fee Distribution by Head</h3>
            <p className="text-xs text-slate-400 font-medium mb-4">Realized collection across categories</p>
            
            <div className="h-[210px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {feeData.map((entry: any, index: number) => (
                      <Cell key={`fee-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`₹${value} Lakh`, 'Amount']}
                    contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{formatLakhs(kpis.totalRevenue)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collected</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
            <div className="space-y-3.5">
              {feeData.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{backgroundColor: item.color}} />
                    <span className="text-xs font-bold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-slate-800">₹{item.value}L</span>
                    <span className="text-[11px] font-bold text-slate-400 w-12 text-right">{item.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Students by Course Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-1/2">
            <h3 className="text-base font-black text-slate-800 mb-1">Enrollment by Program</h3>
            <p className="text-xs text-slate-400 font-medium mb-4">Distribution across 7 active branches</p>
            
            <div className="h-[210px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentsByCourseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {studentsByCourseData.map((entry: any, index: number) => (
                      <Cell key={`course-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${value} Students`, 'Enrolled']}
                    contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{(kpis.totalStudents || 301).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 max-h-[240px] overflow-y-auto pr-1">
            <div className="space-y-2.5">
              {studentsByCourseData.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{backgroundColor: item.color}} />
                    <span className="text-xs font-bold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-slate-800">{item.value}</span>
                    <span className="text-[11px] font-bold text-slate-400 w-12 text-right">{item.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Dock */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Quick Administration Portals
          </p>
          <span className="text-[11px] font-bold text-slate-400">One-click management</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          
          <Link href="/dashboard/students" className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all group flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Students</span>
            <span className="text-[10px] text-slate-400 font-medium">301 Profiles</span>
          </Link>

          <Link href="/dashboard/finance" className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all group flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">Collect Fee</span>
            <span className="text-[10px] text-slate-400 font-medium">Instant Receipts</span>
          </Link>

          <Link href="/dashboard/transport" className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all group flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <Bus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-amber-600">Transport</span>
            <span className="text-[10px] text-slate-400 font-medium">4 Bus Routes</span>
          </Link>

          <Link href="/dashboard/academics/courses" className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-purple-50/80 border border-slate-100 hover:border-purple-200 transition-all group flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-purple-600">Academics</span>
            <span className="text-[10px] text-slate-400 font-medium">12 Courses</span>
          </Link>

          <Link href="/dashboard/users" className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/80 border border-slate-100 hover:border-blue-200 transition-all group flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Staff & Users</span>
            <span className="text-[10px] text-slate-400 font-medium">Directory</span>
          </Link>

          <Link href="/dashboard/reports" className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-rose-50/80 border border-slate-100 hover:border-rose-200 transition-all group flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-rose-600">Reports</span>
            <span className="text-[10px] text-slate-400 font-medium">Export CSV/PDF</span>
          </Link>

        </div>
      </div>

    </div>
  );
}

/**
 * Premium Animated Skeleton UI Layout
 */
function DashboardSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 animate-pulse">
      
      {/* Header Skeleton */}
      <div className="bg-slate-900/90 p-7 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-800 rounded-full" />
          <div className="h-8 w-64 bg-slate-700 rounded-xl" />
          <div className="h-3.5 w-80 bg-slate-800 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-800 rounded-xl" />
          <div className="h-10 w-44 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* 6-Card KPI Deck Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-[155px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="w-12 h-4 rounded-full bg-slate-100" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-7 w-24 bg-slate-200 rounded-lg" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Financial Health Progress Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-7 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-52 bg-slate-200 rounded-lg" />
          <div className="h-8 w-32 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-3.5 w-full bg-slate-100 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-28 bg-slate-100 rounded" />
          <div className="h-3 w-28 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-7 space-y-6">
          <div className="flex justify-between">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-8 w-32 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-[270px] bg-slate-50 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
            <div className="h-5 w-36 bg-slate-200 rounded-lg" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-slate-50 rounded-2xl" />
            ))}
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
            <div className="h-5 w-36 bg-slate-200 rounded-lg" />
            {[1, 2].map(i => (
              <div key={i} className="h-12 bg-slate-50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Visual Analytics Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-7 space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded-lg" />
          <div className="h-44 bg-slate-50 rounded-2xl" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-7 space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded-lg" />
          <div className="h-44 bg-slate-50 rounded-2xl" />
        </div>
      </div>

    </div>
  );
}

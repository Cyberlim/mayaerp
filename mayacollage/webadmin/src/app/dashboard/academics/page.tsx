"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  BookOpen, 
  Users, 
  Plus, 
  MoreVertical,
  Laptop,
  BriefcaseMedical,
  Scale,
  GraduationCap,
  Search,
  Zap,
  RefreshCw,
  Clock,
  DollarSign,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  Award,
  Calendar
} from "lucide-react";

const getIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case "laptop": return Laptop;
    case "medical": return BriefcaseMedical;
    case "scale": return Scale;
    case "science": return GraduationCap;
    default: return Building2;
  }
};

// Shimmer Skeleton for Academic Hub
function AcademicHubSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-screen pb-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200 rounded-xl"></div>
          <div className="h-4 w-80 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-12 w-36 bg-slate-200 rounded-2xl"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-slate-100 rounded"></div>
              <div className="h-7 w-16 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Header Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-44 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-64 bg-slate-100 rounded-2xl"></div>
        </div>
        
        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="h-32 bg-slate-100"></div>
              <div className="p-6 pt-10 space-y-4 relative flex-1 flex flex-col">
                <div className="absolute -top-7 left-6 w-14 h-14 rounded-2xl bg-slate-200 shadow-md"></div>
                <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between">
                  <div className="h-8 w-16 bg-slate-100 rounded"></div>
                  <div className="h-8 w-16 bg-slate-100 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AcademicManagement() {
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheSource, setCacheSource] = useState("Neon PostgreSQL (Warmed)");
  const [activeTab, setActiveTab] = useState<"branches" | "courses">("branches");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("All");

  // Progressive Lazy Load Limit
  const [visibleCount, setVisibleCount] = useState(16);

  // Sync to local cache helper
  const syncToLocalCache = (bList: any[], cList: any[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("maya_academics_branches_cache", JSON.stringify(bList));
      localStorage.setItem("maya_academics_courses_cache", JSON.stringify(cList));
      sessionStorage.setItem("maya_academics_branches_cache", JSON.stringify(bList));
      sessionStorage.setItem("maya_academics_courses_cache", JSON.stringify(cList));
    } catch (_) {}
  };

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else if (branches.length === 0 && courses.length === 0) {
      setIsLoading(true);
    }

    try {
      const bUrl = forceRefresh ? "/api/branches?bust=true" : "/api/branches";
      const cUrl = forceRefresh ? "/api/courses?bust=true" : "/api/courses";

      const [bRes, cRes, sRes, fRes] = await Promise.all([
        fetch(bUrl),
        fetch(cUrl),
        fetch("/api/students"),
        fetch("/api/faculty")
      ]);

      const source = cRes.headers.get("X-Cache-Source") || "Neon-PostgreSQL";
      if (source.includes("Redis")) {
        setCacheSource("⚡ Redis In-Memory (sub-10ms)");
      } else {
        setCacheSource("Neon PostgreSQL (Warmed)");
      }

      const bData = await bRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      const fData = await fRes.json();

      const bList = Array.isArray(bData) ? bData : [];
      const cList = Array.isArray(cData) ? cData : [];
      const sList = Array.isArray(sData) ? sData : [];
      const fList = Array.isArray(fData) ? fData : (fData.faculty || []);

      setBranches(bList);
      setCourses(cList);
      setStudents(sList);
      setFaculty(fList);

      // Persist to localStorage for 0ms subsequent loads
      syncToLocalCache(bList, cList);
    } catch (err) {
      console.error("Academics fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 1. FAST SWR HYDRATION from persistent localStorage (0ms load)
    if (typeof window !== "undefined") {
      try {
        const cachedBranches = localStorage.getItem("maya_academics_branches_cache") || sessionStorage.getItem("maya_academics_branches_cache");
        const cachedCourses = localStorage.getItem("maya_academics_courses_cache") || sessionStorage.getItem("maya_academics_courses_cache");
        const cachedStudents = localStorage.getItem("mayacollage_students_cache") || sessionStorage.getItem("mayacollage_students_cache");

        let hasData = false;
        if (cachedBranches) {
          const parsed = JSON.parse(cachedBranches);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBranches(parsed);
            hasData = true;
          }
        }
        if (cachedCourses) {
          const parsed = JSON.parse(cachedCourses);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCourses(parsed);
            hasData = true;
          }
        }
        if (cachedStudents) {
          try { setStudents(JSON.parse(cachedStudents)); } catch (_) {}
        }

        if (hasData) {
          setIsLoading(false);
          setCacheSource("⚡ Local Cache (0ms Instant)");
        }
      } catch (e) {
        console.warn("Academics local cache read error:", e);
      }
    }

    // 2. Background revalidation from Neon PostgreSQL
    fetchData();
  }, []);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.deanName && b.deanName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [branches, searchQuery]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (selectedBranchFilter !== "All") {
        const bId = typeof c.branchId === 'object' ? c.branchId?._id : c.branchId;
        if (bId !== selectedBranchFilter) return false;
      }
      return true;
    });
  }, [courses, searchQuery, selectedBranchFilter]);

  const stats = [
    { title: "Total Branches", value: branches.length.toString(), icon: Building2, color: "text-rose-600", bg: "bg-rose-50", badge: "Active Faculties" },
    { title: "Total Courses", value: courses.length.toString(), icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", badge: "Degrees & Diplomas" },
    { title: "Total Students", value: students.length.toString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", badge: "Live Enrolled" },
    { title: "Faculty Members", value: faculty.length.toString(), icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50", badge: "Professors & Staff" },
  ];

  if (isLoading) {
    return <AcademicHubSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-screen pb-16 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Academic Hub</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Neon PostgreSQL</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-black rounded-full border border-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{cacheSource}</span>
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              title="Refresh from Neon PostgreSQL"
              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs transition-colors border border-slate-200 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="text-[10px] font-bold">Sync</span>
            </button>
          </div>
          <p className="text-slate-500 font-medium text-sm mt-1.5">
            Curriculum architecture, degree branches, intake caps, and student allocations.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => router.push("/dashboard/students/promote")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(15,23,42,0.2)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(15,23,42,0.3)] transition-all text-sm"
          >
            <GraduationCap className="w-4 h-4" />
            Batch Promote
          </button>
          <button 
            onClick={() => router.push("/academics/branches/new")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(79,70,229,0.35)] transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </div>
      </div>

      {/* Academic Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-4 rounded-2xl ${stat.bg} shrink-0`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{stat.title}</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">{stat.value}</p>
              <span className="text-[10px] font-bold text-slate-400">{stat.badge}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Selector & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("branches")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "branches" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Branches Matrix ({branches.length})
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "courses" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            All Courses ({courses.length})
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex items-center gap-3">
          {activeTab === "courses" && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Branches</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "branches" ? "Search branches or dean..." : "Search courses or codes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Branches View */}
      {activeTab === "branches" && (
        <div className="space-y-6">
          {filteredBranches.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
              <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700">No branches match your search</h3>
              <p className="text-slate-400 text-sm mt-1">Try modifying your query or add a new branch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredBranches.map((branch, idx) => {
                  const Icon = getIcon(branch.iconName);
                  const branchCourses = courses.filter(c => {
                    const bid = typeof c.branchId === 'object' ? c.branchId?._id : c.branchId;
                    return bid === branch._id;
                  });
                  const branchStudents = students.filter(s => {
                    const sbid = typeof s.selectedBranch === 'object' ? s.selectedBranch?._id : s.selectedBranch;
                    return sbid === branch._id;
                  });
                  const enrolledCount = branchStudents.length;
                  
                  return (
                    <motion.div
                      key={branch._id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => router.push(`/dashboard/academics/branches/${branch._id}`)}
                      className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                    >
                      {/* Top Header Background */}
                      <div 
                        className="h-32 relative overflow-hidden flex items-center justify-center transition-colors" 
                        style={{ backgroundColor: branch.colorHex || "#4F46E5" }}
                      >
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                        <Icon className="w-16 h-16 text-white/40 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-wider">
                          {branch.code}
                        </span>
                      </div>
                      
                      <div className="p-6 relative flex-1 flex flex-col">
                        <div className="absolute -top-8 left-6 p-3.5 rounded-2xl bg-white shadow-xl border border-slate-50">
                          <Icon className="w-6 h-6" style={{ color: branch.colorHex || "#4F46E5" }} />
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800 mt-5 leading-snug group-hover:text-indigo-600 transition-colors">
                          {branch.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          Dean: <span className="text-slate-600">{branch.deanName || "Not Assigned"}</span>
                        </p>
                        
                        <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-center flex-1">
                            <p className="text-2xl font-black text-slate-800 tracking-tight">{branchCourses.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Courses</p>
                          </div>
                          <div className="w-px h-8 bg-slate-100"></div>
                          <div className="text-center flex-1">
                            <p className="text-2xl font-black text-slate-800 tracking-tight">{enrolledCount}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Enrolled</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-indigo-600 text-xs font-black group-hover:translate-x-0.5 transition-transform">
                          <span>View Branch Courses</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Main Content: Courses View */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
              <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700">No courses match your filter</h3>
              <p className="text-slate-400 text-sm mt-1">Try selecting a different branch or clear search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredCourses.slice(0, visibleCount).map((course, idx) => {
                  const branchObj = typeof course.branchId === 'object' ? course.branchId : branches.find(b => b._id === course.branchId);
                  const enrolledCount = students.filter(s => {
                    const spid = typeof s.selectedProgram === 'object' ? s.selectedProgram?._id : s.selectedProgram;
                    return spid === course._id;
                  }).length;
                  const themeColor = branchObj?.colorHex || "#4F46E5";

                  return (
                    <motion.div
                      key={course._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => router.push(`/dashboard/academics/courses/${course._id}`)}
                      className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        {/* Course Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase text-white shadow-sm"
                            style={{ backgroundColor: themeColor }}
                          >
                            {course.code}
                          </span>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-black">
                            {course.duration || 4} Years • {course.totalSemesters || 8} Sems
                          </span>
                        </div>

                        {/* Title & Branch */}
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {course.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{branchObj?.name || "General Department"}</span>
                        </p>

                        {/* Fee & Capacity Badges */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tuition Fee</span>
                            <span className="text-sm font-black text-slate-800 mt-0.5 block">
                              {course.tuitionFee ? `₹${Number(course.tuitionFee).toLocaleString('en-IN')}` : "Free / Included"}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Intake Seats</span>
                            <span className="text-sm font-black text-slate-800 mt-0.5 block">
                              {course.intakeCapacity || 60} Seats
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-black text-slate-700">{enrolledCount} Students Enrolled</span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-600 text-xs font-black group-hover:translate-x-1 transition-transform">
                          <span>Curriculum</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Lazy Load Button */}
          {filteredCourses.length > visibleCount && (
            <div className="text-center pt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + 16)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-full transition-all"
              >
                Load More Courses ({filteredCourses.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

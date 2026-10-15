"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  ChevronLeft, 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Loader2,
  Plus,
  Search,
  Laptop,
  BriefcaseMedical,
  Scale,
  GraduationCap,
  Timer,
  Wallet,
  Edit,
  Trash2,
  Users,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  RefreshCw,
  BookOpen
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

// Shimmer Skeleton for Branch Detail
function BranchDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="w-full bg-slate-900 px-6 lg:px-8 pt-10 pb-24">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center mb-10">
            <div className="h-10 w-36 bg-slate-800 rounded-2xl"></div>
            <div className="h-12 w-44 bg-slate-800 rounded-2xl"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="h-6 w-32 bg-slate-800 rounded-full"></div>
              <div className="h-14 w-3/4 bg-slate-800 rounded-2xl"></div>
              <div className="h-4 w-1/2 bg-slate-800/80 rounded-lg"></div>
              <div className="flex gap-4 pt-4">
                <div className="h-10 w-28 bg-slate-800 rounded-xl"></div>
                <div className="h-10 w-28 bg-slate-800 rounded-xl"></div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="h-56 bg-slate-800/60 rounded-[32px]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-10 relative z-20 space-y-8">
        <div className="h-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
              <div className="flex justify-between">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                <div className="w-20 h-8 bg-slate-100 rounded-full"></div>
              </div>
              <div className="h-7 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
              <div className="h-12 bg-slate-100 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BranchDetail() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;

  const [branch, setBranch] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cacheSource, setCacheSource] = useState("Neon PostgreSQL");

  const syncBranchToLocalCache = (branchData: any, coursesData: any[], studentCount: number) => {
    if (typeof window === "undefined" || !branchData) return;
    try {
      const payload = {
        branch: branchData,
        courses: coursesData,
        enrolledStudents: studentCount,
        timestamp: Date.now()
      };
      localStorage.setItem(`maya_branch_detail_${branchId}`, JSON.stringify(payload));
      sessionStorage.setItem(`maya_branch_detail_${branchId}`, JSON.stringify(payload));
    } catch (_) {}
  };

  const fetchData = async (forceRefresh = false) => {
    if (!branch && !forceRefresh) setIsLoading(true);
    try {
      const bUrl = forceRefresh ? `/api/branches/${branchId}?bust=true` : `/api/branches/${branchId}`;
      const cUrl = forceRefresh ? `/api/courses?branchId=${branchId}&bust=true` : `/api/courses?branchId=${branchId}`;

      const [bRes, cRes, sRes] = await Promise.all([
        fetch(bUrl),
        fetch(cUrl),
        fetch(`/api/students?selectedBranch=${branchId}&countOnly=true`)
      ]);
      const bData = await bRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();

      const source = bRes.headers.get("X-Cache-Source") || "Neon-PostgreSQL";
      if (source.includes("Redis")) {
        setCacheSource("⚡ Redis In-Memory");
      } else {
        setCacheSource("Neon PostgreSQL");
      }

      const validCourses = Array.isArray(cData) ? cData : [];
      const count = sData.count || (Array.isArray(sData) ? sData.length : 0);

      if (bData && !bData.error) {
        setBranch(bData);
        setCourses(validCourses);
        setEnrolledStudents(count);
        syncBranchToLocalCache(bData, validCourses, count);
      }
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. FAST SWR HYDRATION from local cache (0ms paint)
    if (typeof window !== "undefined") {
      try {
        const cachedRaw = localStorage.getItem(`maya_branch_detail_${branchId}`) || sessionStorage.getItem(`maya_branch_detail_${branchId}`);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed.branch) {
            setBranch(parsed.branch);
            if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
            if (parsed.enrolledStudents !== undefined) setEnrolledStudents(parsed.enrolledStudents);
            setIsLoading(false);
            setCacheSource("⚡ Local Cache (0ms)");
            fetchData(true);
            return;
          }
        }

        // Check fallback to general branches cache
        const allBranchesRaw = localStorage.getItem("maya_academics_branches_cache");
        if (allBranchesRaw) {
          const list = JSON.parse(allBranchesRaw);
          if (Array.isArray(list)) {
            const found = list.find((b: any) => b._id === branchId || b.id === branchId);
            if (found) {
              setBranch(found);
              setIsLoading(false);
              fetchData(true);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Local cache read error:", e);
      }
    }

    // 2. Fetch fresh from Neon PostgreSQL
    fetchData(false);
  }, [branchId]);

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course from PostgreSQL?")) return;
    
    // Optimistic UI update
    setCourses(prev => {
      const next = prev.filter(c => c._id !== courseId && c.id !== courseId);
      if (branch) syncBranchToLocalCache(branch, next, enrolledStudents);
      return next;
    });

    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (!res.ok) {
        fetchData(true);
        alert("Failed to delete course.");
      }
    } catch (e) {
      console.error(e);
      fetchData(true);
    }
  };

  if (isLoading) {
    return <BranchDetailSkeleton />;
  }

  if (!branch) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 font-sans">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center">
          <Building2 className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-700">Branch Not Found</h2>
        <button onClick={() => router.push("/dashboard/academics")} className="text-indigo-600 font-bold hover:underline">
          Return to Hub
        </button>
      </div>
    );
  }

  const Icon = getIcon(branch.iconName);
  const totalSeats = courses.reduce((sum, c) => sum + (c.intakeCapacity || 0), 0);
  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const themeColor = branch.colorHex || "#4F46E5";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      
      {/* HERO BANNER SECTION */}
      <div className="relative w-full overflow-hidden">
        <div 
          className="absolute inset-0 opacity-100 mix-blend-multiply"
          style={{ 
            background: `linear-gradient(135deg, ${themeColor} 0%, #0F172A 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-black/20 rounded-full blur-3xl pointer-events-none" />
        <Icon className="absolute -right-20 -bottom-20 w-[400px] h-[400px] text-white/5 rotate-12 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-24">
          
          {/* Top Navigation Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-16">
            <button 
              onClick={() => router.push("/dashboard/academics")}
              className="group flex items-center gap-3 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                <ChevronLeft className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold tracking-wide text-sm">Back to Hub</span>
            </button>
            
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/10">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{cacheSource}</span>
              </span>

              <button 
                onClick={() => router.push(`/academics/courses/new?branchId=${branch._id || branch.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-black rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Deploy Course
              </button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Branch Info */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/90 text-xs font-black tracking-widest uppercase">
                  Active Faculty • Code: {branch.code}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                {branch.name}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-white/80 font-bold text-sm">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                  <User className="w-4 h-4 text-white" />
                  <span>Dean: {branch.deanName || "Not Assigned"}</span>
                </div>
                {branch.location && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <MapPin className="w-4 h-4 text-white" />
                    <span>{branch.location}</span>
                  </div>
                )}
                {branch.establishedYear && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <Calendar className="w-4 h-4 text-white" />
                    <span>Est. {branch.establishedYear}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Floating Stats Glass Card */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-2xl">Overview</h3>
                    <p className="text-white/60 font-semibold text-xs">Live Neon PostgreSQL Metrics</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-4xl font-black text-white mb-1">{courses.length}</p>
                    <p className="text-white/60 font-bold text-xs tracking-widest uppercase flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-300" /> Active Courses
                    </p>
                  </div>
                  <div>
                    <p className="text-4xl font-black text-white mb-1">{enrolledStudents}</p>
                    <p className="text-white/60 font-bold text-xs tracking-widest uppercase flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-300" /> Enrolled Students
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* COURSES GRID SECTION */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-10 relative z-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-10">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Curriculum Directory</h2>
              <p className="text-slate-500 font-semibold text-xs mt-0.5">Manage and deploy courses for {branch.name}</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search course name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl text-slate-900 text-xs font-bold transition-all outline-none"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Laptop className="w-16 h-16 text-slate-300" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4">No courses deployed yet</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-sm">
              Start building your academic infrastructure by deploying the first course for {branch.name}.
            </p>
            <button 
              onClick={() => router.push(`/academics/courses/new?branchId=${branch._id || branch.id}`)}
              className="px-8 py-3.5 bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Deploy First Course
            </button>
          </motion.div>
        ) : (
          
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredCourses.map((course, idx) => (
                <motion.div
                  key={course._id || course.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group relative bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between"
                >
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-tr-[2.5rem] opacity-50 pointer-events-none" />
                  
                  {/* Header Row */}
                  <div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                          {course.code ? course.code.substring(0, 2) : "CR"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Active Program</span>
                          </div>
                          <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] tracking-wider shadow-sm">
                            {course.code}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/academics/courses/${course._id || course.id}/edit`); }} 
                          title="Edit Course"
                          className="w-9 h-9 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCourse(course._id || course.id); }} 
                          title="Delete Course from PostgreSQL"
                          className="w-9 h-9 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Course Title */}
                    <div className="mb-6 relative z-10">
                      <h3 
                        onClick={() => router.push(`/dashboard/academics/courses/${course._id || course.id}`)}
                        className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {course.name}
                      </h3>
                    </div>

                    {/* Info Tags */}
                    <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <Timer className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{course.duration || 4} Years</span>
                      </div>
                      {course.coordinator && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{course.coordinator}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">
                          {course.tuitionFee ? `₹${Number(course.tuitionFee).toLocaleString('en-IN')}` : "Free"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Action */}
                  <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col gap-3.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-indigo-500" /> {course.intakeCapacity || 60}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Capacity</p>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-500" /> ₹{(course.feeStructureTemplate?.[0]?.totalYearlyFee || (course.semesterFees?.[0]?.fee * 2) || (course.tuitionFee ? (course.tuitionFee / (course.duration || 4)) : 0)).toLocaleString()}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Per Year</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/academics/courses/${course._id || course.id}`)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold text-xs transition-all group-hover:shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Manage Curriculum & Structure
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

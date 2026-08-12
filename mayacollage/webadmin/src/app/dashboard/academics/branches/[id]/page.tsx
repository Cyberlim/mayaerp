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
  Award
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

export default function BranchDetail() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;

  const [branch, setBranch] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, cRes, sRes] = await Promise.all([
        fetch(`/api/branches/${branchId}`),
        fetch(`/api/courses?branchId=${branchId}`),
        fetch(`/api/students?selectedBranch=${branchId}&countOnly=true`)
      ]);
      const bData = await bRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      
      setBranch(bData);
      setCourses(Array.isArray(cData) ? cData : []);
      setEnrolledStudents(sData.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await fetch(`/api/courses/${courseId}`, { method: "DELETE" }); 
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center animate-bounce">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
          <p className="text-slate-500 font-semibold animate-pulse">Loading Branch Matrix...</p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
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
  const totalStudents = courses.reduce((sum, c) => sum + (c.intakeCapacity || 0), 0);
  const filteredCourses = courses.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()));
  const themeColor = branch.colorHex || "#4F46E5";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* 
        =====================================================================
        HERO BANNER SECTION
        =====================================================================
      */}
      <div className="relative w-full overflow-hidden">
        {/* Dynamic Background */}
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
          <div className="flex justify-between items-center mb-16">
            <button 
              onClick={() => router.push("/dashboard/academics")}
              className="group flex items-center gap-3 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                <ChevronLeft className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold tracking-wide text-sm">Back to Hub</span>
            </button>
            
            <button 
              onClick={() => router.push(`/academics/courses/new?branchId=${branch._id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-black rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Deploy Course
            </button>
          </div>

          {/* Banner Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Branding & Info */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="flex items-center gap-4 mb-6">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/20 rounded-xl">
                  <span className="text-white font-black tracking-[0.2em] text-xs uppercase">{branch.code}</span>
                </div>
                <div className="px-4 py-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-bold tracking-widest text-xs uppercase">Operational</span>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8 drop-shadow-sm">
                {branch.name}
              </h1>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <InfoChip icon={<User />} label="Dean" value={branch.deanName} />
                <InfoChip icon={<Mail />} label="Contact" value={branch.contactEmail} />
                <InfoChip icon={<MapPin />} label="Campus" value={branch.location} />
                <InfoChip icon={<Calendar />} label="Est." value={branch.establishedYear} />
              </div>

              <button 
                onClick={() => router.push(`/academics/branches/${branch._id}/edit`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white font-bold text-sm transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Branch Settings
              </button>
            </div>

            {/* Right: Floating Stats Glass Card */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-center gap-6 mb-10 border-b border-white/10 pb-8">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-2xl">Overview</h3>
                    <p className="text-white/60 font-semibold text-sm">Real-time statistics</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-5xl font-black text-white mb-2">{courses.length}</p>
                    <p className="text-white/60 font-bold text-xs tracking-widest uppercase flex items-center gap-2">
                      <Award className="w-4 h-4" /> Active Courses
                    </p>
                  </div>
                  <div>
                    <p className="text-5xl font-black text-white mb-2">{enrolledStudents}</p>
                    <p className="text-white/60 font-bold text-xs tracking-widest uppercase flex items-center gap-2">
                      <Users className="w-4 h-4" /> Enrolled Students
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 
        =====================================================================
        COURSES GRID SECTION
        =====================================================================
      */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-10 relative z-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-10">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Curriculum Directory</h2>
              <p className="text-slate-500 font-semibold text-sm">Manage courses for this branch</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl text-slate-900 font-semibold transition-all outline-none"
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
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-lg">
              Start building your academic infrastructure by deploying the first course for {branch.name}.
            </p>
            <button 
              onClick={() => router.push(`/academics/courses/new?branchId=${branch._id}`)}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all"
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
                  key={course._id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                  className="group relative bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col"
                >
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-tr-[2.5rem] opacity-50 pointer-events-none" />
                  
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                        {course.code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
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
                      <button onClick={() => router.push(`/academics/courses/${course._id}/edit`)} className="w-10 h-10 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 rounded-full flex items-center justify-center transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCourse(course._id)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Course Title */}
                  <div className="mb-8 relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                      {course.name}
                    </h3>
                  </div>

                  {/* Info Tags */}
                  <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <Timer className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">{course.duration} Years</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{course.coordinator}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">₹{(course.tuitionFee/1000).toFixed(1)}k Total</span>
                    </div>
                  </div>

                  {/* Bottom Stats & Action */}
                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-500" /> {course.intakeCapacity}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Capacity</p>
                      </div>
                      <div className="w-px h-8 bg-slate-100" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-500" /> ₹{(course.semesterFees?.[0]?.fee || course.tuitionFee).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Per Sem</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => router.push(`/dashboard/academics/courses/${course._id}`)}
                      className="w-12 h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:-translate-y-1 hover:shadow-indigo-500/30 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
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

// Helper Component for the Hero Info Chips
function InfoChip({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/20 transition-colors cursor-default">
      <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/80">
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </div>
      <div>
        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

import React from "react";

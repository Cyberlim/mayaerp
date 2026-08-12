"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  GraduationCap
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

export default function AcademicManagement() {
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, cRes, sRes, fRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/courses"),
        fetch("/api/students"),
        fetch("/api/faculty")
      ]);
      const bData = await bRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      const fData = await fRes.json();
      setBranches(Array.isArray(bData) ? bData : []);
      setCourses(Array.isArray(cData) ? cData : []);
      setStudents(Array.isArray(sData) ? sData : []);
      setFaculty(Array.isArray(fData) ? fData : (fData.faculty || []));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { title: "Total Branches", value: branches.length.toString(), icon: Building2, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Total Courses", value: courses.length.toString(), icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Students", value: students.length.toString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Faculty Members", value: faculty.length.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-screen pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Academic Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Manage branches, courses, and curriculum structures.</p>
        </div>
        <button 
          onClick={() => router.push("/academics/branches/new")}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Branch
        </button>
      </div>

      {/* Academic Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center gap-4"
          >
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">{stat.title}</p>
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-100 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-black text-slate-800">{stat.value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Branches Grid */}
      <div className="pt-4">
        <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Academic Branches</h2>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No branches found</h3>
            <p className="text-slate-500 mt-2">Get started by creating your first academic branch.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {branches.map((branch, idx) => {
                const Icon = getIcon(branch.iconName);
                const branchCourses = courses.filter(c => c.branchId?._id === branch._id || c.branchId === branch._id);
                const branchStudents = students.filter(s => s.selectedBranch === branch._id);
                const enrolledCount = branchStudents.length;
                
                return (
                  <motion.div
                    key={branch._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => router.push(`/dashboard/academics/branches/${branch._id}`)}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <button className="p-2 bg-white/50 hover:bg-white backdrop-blur-md rounded-full text-slate-400 hover:text-slate-700 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="h-32 relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: branch.colorHex || "#4F46E5" }}>
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                      <Icon className="w-16 h-16 text-white/50 transform group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    <div className="p-6 relative flex-1 flex flex-col">
                      <div className="absolute -top-10 left-6 p-4 rounded-2xl bg-white shadow-xl">
                        <Icon className="w-6 h-6" style={{ color: branch.colorHex || "#4F46E5" }} />
                      </div>
                      
                      <h3 className="text-lg font-black text-slate-800 mt-6 leading-tight">{branch.name}</h3>
                      <p className="text-sm font-semibold text-slate-500 mt-1">Dean: {branch.deanName}</p>
                      
                      <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-2xl font-black text-slate-800">{branchCourses.length}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Courses</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-slate-800">{enrolledCount}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Enrolled</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

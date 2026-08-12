"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Loader2, Filter, UserCircle, Eye, Shield, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function StaffStudentsScreen() {
  const [classGroups, setClassGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (classId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [classId]: prev[classId] === false ? true : false
    }));
  };

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/staff/my-students");
        if (res.ok) {
          const data = await res.json();
          setClassGroups(data.groupedStudents || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const filteredGroups = classGroups.map(group => {
    const filteredStudents = group.students.filter((s: any) => 
      s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...group, students: filteredStudents };
  }).filter(group => group.students.length > 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Premium Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg border border-emerald-100/50 mb-10 p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-emerald-500/20 border border-emerald-100">
            <div className="w-full h-full bg-slate-50 rounded-[1.5rem] flex items-center justify-center">
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-1">Class Roster</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">My Students</h1>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-md border border-white py-4 pl-12 pr-4 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all shadow-xl shadow-emerald-100/50"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
          <button className="w-14 h-14 flex items-center justify-center bg-emerald-600 text-white rounded-2xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:bg-emerald-700 transition-all flex-shrink-0">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : classGroups.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800">No Assigned Classes</h3>
          <p className="text-sm text-slate-500 font-medium mt-2">You don't have any students enrolled in your active timetables.</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800">No Students Found</h3>
          <p className="text-sm text-slate-500 font-medium mt-2">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredGroups.map(group => (
            <div key={group.classId} className="space-y-6">
              {/* Group Header */}
              <div 
                className="flex items-center gap-3 border-b border-slate-100 pb-4 cursor-pointer hover:bg-slate-50 transition-colors p-2 -mx-2 rounded-xl group/header"
                onClick={() => toggleGroup(group.classId)}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-inner group-hover/header:bg-emerald-200 transition-colors">
                  <GraduationCap className="w-5 h-5 text-emerald-700" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight flex-1">{group.className}</h2>
                <span className="ml-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black shadow-sm border border-emerald-100">
                  {group.students.length} Student{group.students.length !== 1 ? 's' : ''}
                </span>
                <div className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover/header:bg-slate-200 transition-colors">
                  {expandedGroups[group.classId] === false ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </div>
              </div>

              {/* Group Grid */}
              <AnimatePresence initial={false}>
                {expandedGroups[group.classId] !== false && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2 pb-4">
                      {group.students.map((student: any) => (
                        <motion.div 
                          key={student._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-100 transition-all flex flex-col"
                        >
                          <div className="h-24 bg-gradient-to-r from-emerald-50 to-teal-50 group-hover:from-emerald-100 group-hover:to-teal-100 transition-colors relative" />
                          
                          <div className="px-6 pb-6 flex-1 flex flex-col relative -mt-12">
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-md overflow-hidden mb-4 mx-auto flex items-center justify-center">
                              {student.profilePhoto ? (
                                <img src={student.profilePhoto} alt={student.firstName} className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle className="w-12 h-12 text-slate-300" />
                              )}
                            </div>
                            
                            <div className="text-center mb-6">
                              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                {student.firstName} {student.lastName}
                              </h3>
                              <p className="text-xs font-bold text-slate-400 mt-1">{student.studentId || "No ID"}</p>
                            </div>

                            <div className="mt-auto grid grid-cols-1 gap-3 pt-6 border-t border-slate-50">
                              <Link href={`/staff/students/${student._id}`}>
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs rounded-xl transition-colors border border-transparent">
                                  <Eye className="w-4 h-4" /> View Academic Profile
                                </button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

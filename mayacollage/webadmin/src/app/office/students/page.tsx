"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Search, Plus, UserCircle, Trash2, Shield, Loader2, CheckCircle2, Eye, UploadCloud, X, Edit } from "lucide-react";
import Link from "next/link";

export default function StudentManagementDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterSection, setFilterSection] = useState("All");
  const [toastMsg, setToastMsg] = useState("");

  // Batch update dialog state
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchYear, setBatchYear] = useState("");
  const [batchBranch, setBatchBranch] = useState("");
  const [batchProgram, setBatchProgram] = useState("");
  const [newSemester, setNewSemester] = useState(1);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const filters = ["All", "Active", "Inactive", "Suspended"];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, branchesRes, coursesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/branches"),
        fetch("/api/courses")
      ]);
      const [studentsData, branchesData, coursesData] = await Promise.all([
        studentsRes.json(),
        branchesRes.json(),
        coursesRes.json()
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete student: ${name}?`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToastMsg("Student deleted successfully!");
        fetchData();
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        alert("Failed to delete student.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchUpdate = async () => {
    if (!batchYear && !batchBranch && !batchProgram) {
      alert("Please select at least one filter to update students.");
      return;
    }
    
    if (!confirm(`Are you sure you want to promote these students to Semester ${newSemester}?`)) return;

    setIsBatchUpdating(true);
    try {
      const res = await fetch("/api/students/batch-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionYear: batchYear || undefined,
          selectedBranch: batchBranch || undefined,
          selectedProgram: batchProgram || undefined,
          newSemester
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToastMsg(`Promoted ${data.modifiedCount} students to Semester ${newSemester}!`);
        setShowBatchDialog(false);
        fetchData();
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        alert(data.error || "Batch update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error executing batch update.");
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedFilter !== "All") {
      result = result.filter(s => s.studentStatus === selectedFilter || s.status === selectedFilter);
    }
    if (filterBranch !== "All") {
      result = result.filter(s => {
        const bid = typeof s.selectedBranch === 'object' ? s.selectedBranch?._id : s.selectedBranch;
        return bid === filterBranch;
      });
    }
    if (filterCourse !== "All") {
      result = result.filter(s => {
        const pid = typeof s.selectedProgram === 'object' ? s.selectedProgram?._id : s.selectedProgram;
        return pid === filterCourse;
      });
    }
    if (filterBatch !== "All") {
      result = result.filter(s => s.batch === filterBatch);
    }
    if (filterSemester !== "All") {
      result = result.filter(s => s.selectedSemester === Number(filterSemester));
    }
    if (filterSection !== "All") {
      if (filterSection === "None") {
        result = result.filter(s => !s.selectedSection);
      } else {
        result = result.filter(s => s.selectedSection === filterSection);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.firstName?.toLowerCase() || "").includes(q) || 
        (s.lastName?.toLowerCase() || "").includes(q) || 
        (s.studentId?.toLowerCase() || "").includes(q) ||
        (s.email?.toLowerCase() || "").includes(q)
      );
    }
    return result;
  }, [students, selectedFilter, filterBranch, filterCourse, filterBatch, filterSemester, filterSection, searchQuery]);

  const uniqueSessionYears = useMemo(() => {
    const years = new Set(students.map(s => s.sessionYear).filter(Boolean));
    return Array.from(years).sort().reverse();
  }, [students]);

  const uniqueBatches = useMemo(() => {
    const batches = new Set(students.map(s => s.batch).filter(Boolean));
    return Array.from(batches).sort().reverse();
  }, [students]);

  const dashboardMaxSemesters = useMemo(() => {
    let filteredCourses = courses;
    if (filterCourse !== "All") {
      filteredCourses = courses.filter(c => c._id === filterCourse);
    } else if (filterBranch !== "All") {
      filteredCourses = courses.filter(c => typeof c.branchId === 'object' ? c.branchId?._id === filterBranch : c.branchId === filterBranch);
    }
    if (filteredCourses.length > 0) {
      return Math.max(...filteredCourses.map(c => c.totalSemesters || 8));
    }
    return 8;
  }, [courses, filterBranch, filterCourse]);

  const batchMaxSemesters = useMemo(() => {
    let filteredCourses = courses;
    if (batchProgram) {
      filteredCourses = courses.filter(c => c._id === batchProgram);
    } else if (batchBranch) {
      filteredCourses = courses.filter(c => typeof c.branchId === 'object' ? c.branchId?._id === batchBranch : c.branchId === batchBranch);
    }
    if (filteredCourses.length > 0) {
      return Math.max(...filteredCourses.map(c => c.totalSemesters || 8));
    }
    return 8;
  }, [courses, batchBranch, batchProgram]);

  const uniqueSections = useMemo(() => {
    const sections = new Set(students.map(s => s.selectedSection).filter(Boolean));
    return Array.from(sections).sort();
  }, [students]);

  // Compute preview count for batch
  const previewCount = useMemo(() => {
    return students.filter(s => {
      let match = true;
      if (batchYear) match = match && s.sessionYear === batchYear;
      if (batchBranch) {
        const bid = typeof s.selectedBranch === 'object' ? s.selectedBranch?._id : s.selectedBranch;
        match = match && bid === batchBranch;
      }
      if (batchProgram) {
        const pid = typeof s.selectedProgram === 'object' ? s.selectedProgram?._id : s.selectedProgram;
        match = match && pid === batchProgram;
      }
      return match;
    }).length;
  }, [students, batchYear, batchBranch, batchProgram]);

  const stats = {
    total: students.length,
    active: students.filter(s => s.studentStatus === 'Active' || s.status === 'Active').length,
    inactive: students.filter(s => s.studentStatus === 'Inactive' || s.status === 'Inactive').length,
    suspended: students.filter(s => s.studentStatus === 'Suspended' || s.status === 'Suspended').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans text-slate-800">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-indigo-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Management</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage academic profiles & enrollments</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <input 
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 py-3 pl-10 pr-4 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <button 
              onClick={() => setShowBatchDialog(true)}
              className="w-full sm:w-auto flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
            >
              <UploadCloud className="w-4 h-4" /> Batch Promote
            </button>

            <Link href="/admissions/new">
              <button className="w-full sm:w-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                <Plus className="w-4 h-4" /> Enroll Student
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 mt-10">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Students", value: stats.total, color: "text-slate-900" },
            { label: "Active", value: stats.active, color: "text-emerald-600" },
            { label: "Inactive", value: stats.inactive, color: "text-amber-500" },
            { label: "Suspended", value: stats.suspended, color: "text-rose-600" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</span>
              <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex flex-wrap gap-3">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${selectedFilter === filter ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                {filter}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-4 ml-auto">
            <select 
              value={filterBranch} 
              onChange={e => setFilterBranch(e.target.value)} 
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            
            <select 
              value={filterCourse} 
              onChange={e => setFilterCourse(e.target.value)} 
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Courses</option>
              {courses
                .filter(c => filterBranch === "All" || (typeof c.branchId === 'object' ? c.branchId?._id === filterBranch : c.branchId === filterBranch))
                .map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
            
            <select 
              value={filterBatch} 
              onChange={e => setFilterBatch(e.target.value)} 
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Batches</option>
              {uniqueBatches.map((b: any) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select 
              value={filterSemester} 
              onChange={e => setFilterSemester(e.target.value)} 
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Semesters</option>
              {[...Array(dashboardMaxSemesters)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>

            <select 
              value={filterSection} 
              onChange={e => setFilterSection(e.target.value)} 
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Sections</option>
              <option value="None">Not Assigned</option>
              {uniqueSections.map((s: any) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-800">No Students Found</h3>
            <p className="text-sm text-slate-500 font-medium mt-2">No profiles match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredStudents.map((student, idx) => (
                <motion.div 
                  key={student._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all flex flex-col"
                >
                  <div className="h-24 bg-gradient-to-r from-indigo-50 to-blue-50 group-hover:from-indigo-100 group-hover:to-blue-100 transition-colors relative">
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40 shadow-sm">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${student.studentStatus === 'Active' || student.status === 'Active' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {student.studentStatus || student.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-6 pb-6 flex-1 flex flex-col relative -mt-12">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-md overflow-hidden mb-4 mx-auto flex items-center justify-center">
                      {student.profilePhoto ? (
                        <img src={student.profilePhoto} alt={student.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-1 line-clamp-1">{student.studentId || "No ID"}</p>
                      {student.batch && (
                        <div className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest mr-2">
                          Batch {student.batch}
                        </div>
                      )}
                      {student.selectedSemester && (
                        <div className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                          Sem {student.selectedSemester} {student.selectedSection ? `| ${student.selectedSection}` : ''}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-3 gap-2 pt-6 border-t border-slate-50">
                      <Link href={`/office/students/${student._id}`}>
                        <button className="w-full flex items-center justify-center gap-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] rounded-xl transition-colors border border-transparent">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </Link>
                      <Link href={`/office/students/${student._id}/edit`}>
                        <button className="w-full flex items-center justify-center gap-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-[10px] rounded-xl transition-colors border border-transparent">
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(student._id, `${student.firstName} ${student.lastName}`)}
                        className="w-full flex items-center justify-center gap-1 py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-[10px] rounded-xl transition-colors border border-transparent"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Batch Update Dialog */}
      <AnimatePresence>
        {showBatchDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBatchDialog(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Batch Semester Promotion</h2>
                    <p className="text-indigo-100 text-xs font-medium mt-1">Update semester for an entire batch in one click</p>
                  </div>
                </div>
                <button onClick={() => setShowBatchDialog(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Filter by Batch Year</label>
                  <select value={batchYear} onChange={e => setBatchYear(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none">
                    <option value="">All Years</option>
                    {uniqueSessionYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Filter by Branch</label>
                    <select value={batchBranch} onChange={e => setBatchBranch(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none">
                      <option value="">All Branches</option>
                      {branches.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Filter by Course</label>
                    <select value={batchProgram} onChange={e => setBatchProgram(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none">
                      <option value="">All Courses</option>
                      {courses
                        .filter((c: any) => !batchBranch || (typeof c.branchId === 'object' ? c.branchId?._id === batchBranch : c.branchId === batchBranch))
                        .map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Target Semester to Promote To</label>
                  <select value={newSemester} onChange={e => setNewSemester(Number(e.target.value))} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none">
                    {[...Array(batchMaxSemesters)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Preview Update</h4>
                    <p className="text-xs font-medium text-indigo-700 mt-1">
                      This action will update <span className="font-black text-rose-600 bg-rose-100 px-1 rounded">{previewCount}</span> students to Semester {newSemester}. Please ensure filters are correct!
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleBatchUpdate}
                  disabled={isBatchUpdating || previewCount === 0}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  {isBatchUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  Confirm Batch Promotion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

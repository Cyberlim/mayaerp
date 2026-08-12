"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  ChevronLeft, 
  School,
  Timer,
  Users,
  GraduationCap,
  CheckCircle,
  Map,
  BookOpen,
  User,
  Loader2,
  Settings,
  Plus,
  Wallet,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  Book,
  Trash2,
  X
} from "lucide-react";

export default function CourseDetail() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("curriculum");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal states
  const [modalType, setModalType] = useState<"semester" | "section" | "subject" | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  // Form states for modals
  const [semNumber, setSemNumber] = useState("");
  const [secName, setSecName] = useState("");
  const [subName, setSubName] = useState("");
  const [subCredits, setSubCredits] = useState("3");
  const [subFaculty, setSubFaculty] = useState("");
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [res, stuRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/students?selectedProgram=${courseId}`)
      ]);
      const data = await res.json();
      const studentsData = await stuRes.json();
      setCourse(data);
      setStudents(Array.isArray(studentsData) ? studentsData : []); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/faculty').then(res => res.json()).then(data => setFacultyList(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  const updateCurriculum = async (newCurriculum: any[]) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curriculum: newCurriculum }),
      });
      const data = await res.json();
      setCourse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      closeModal();
    }
  };

  // --- Curriculum Actions ---

  const handleAddSemester = () => {
    const cur = [...(course.curriculum || [])];
    const newSemNum = parseInt(semNumber) || (cur.length + 1);
    cur.push({
      semester: newSemNum,
      credits: 20,
      sections: [{ name: "Section A", subjects: [] }]
    });
    updateCurriculum(cur);
  };

  const handleAddSection = () => {
    const { semesterIndex } = modalData;
    const cur = [...(course.curriculum || [])];
    const secs = [...(cur[semesterIndex].sections || [])];
    secs.push({
      name: secName || `Section ${String.fromCharCode(65 + secs.length)}`,
      subjects: []
    });
    cur[semesterIndex].sections = secs;
    updateCurriculum(cur);
  };

  const handleDeleteSection = (semesterIndex: number, sectionIndex: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    const cur = [...(course.curriculum || [])];
    cur[semesterIndex].sections.splice(sectionIndex, 1);
    updateCurriculum(cur);
  };

  const handleAddSubject = () => {
    const { semesterIndex, sectionIndex } = modalData;
    const cur = [...(course.curriculum || [])];
    const subs = [...(cur[semesterIndex].sections[sectionIndex].subjects || [])];
    
    subs.push({
      name: subName,
      credits: parseInt(subCredits) || 3,
      facultyId: subFaculty // In future, this would be an actual Object ID
    });
    
    cur[semesterIndex].sections[sectionIndex].subjects = subs;
    
    // Recalculate semester credits
    let totalCredits = 0;
    // Assuming sections should have identical subjects typically, but we sum across the first section for display usually
    if (cur[semesterIndex].sections.length > 0) {
        totalCredits = cur[semesterIndex].sections[0].subjects.reduce((sum: number, s: any) => sum + (s.credits || 0), 0);
    }
    cur[semesterIndex].credits = totalCredits;

    updateCurriculum(cur);
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
    setSemNumber("");
    setSecName("");
    setSubName("");
    setSubCredits("3");
    setSubFaculty("");
    setFacultySearch("");
    setShowFacultyDropdown(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) return <div>Course Not Found</div>;

  const branch = course.branchId || {};
  const curriculum = course.curriculum || [];
  const themeColor = branch.colorHex || "#4F46E5";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative">
      
      {/* 
        =====================================================================
        HERO BANNER SECTION
        =====================================================================
      */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-[#0F172A]" />
        <div 
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[100px] opacity-40 pointer-events-none mix-blend-screen"
          style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}
        />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" style={{ transform: 'translate(-20%, 40%)' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-20">
          
          <div className="flex justify-between items-center mb-12">
            <button 
              onClick={() => router.push(`/dashboard/academics/branches/${branch._id}`)}
              className="group flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                <ChevronLeft className="w-5 h-5 text-white/90" />
              </div>
              <span className="text-white/90 font-bold tracking-wide text-sm">Return to Branch</span>
            </button>

            <button 
              onClick={() => router.push(`/academics/courses/${course._id}/edit`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl transition-all text-white font-bold text-sm"
            >
              <Settings className="w-4 h-4" />
              Manage Course Settings
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-8 flex flex-col items-start">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}88 100%)` }}>
                  <School className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/10 text-white/90 border border-white/10 rounded-lg text-xs font-black tracking-widest uppercase shadow-inner">
                      {branch.code}
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black tracking-widest uppercase">
                      ACTIVE UNIT
                    </span>
                  </div>
                  <p className="text-white/60 font-bold tracking-wide flex items-center gap-2">
                    {branch.name} <ChevronRight className="w-3 h-3" /> {course.code}
                  </p>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-8">
                {course.name}
              </h1>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <User className="w-4 h-4 text-white/50" />
                  <span className="text-white/80 font-bold text-sm">Coordinator: {course.coordinator}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <Wallet className="w-4 h-4 text-white/50" />
                  <span className="text-white/80 font-bold text-sm">Total Fee: ₹{(course.tuitionFee/1000).toFixed(1)}k</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <Calendar className="w-4 h-4 text-white/50" />
                  <span className="text-white/80 font-bold text-sm">{course.totalSemesters} Semesters</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              <StatGlass val={students.length.toString()} label="Enrolled Students" icon={<Users />} />
              <StatGlass val={`${course.duration} Yrs`} label="Program Duration" icon={<Timer />} />
              <StatGlass val={(curriculum.reduce((s:any, c:any)=> s + (c.credits||0), 0) || 160).toString()} label="Total Credits" icon={<GraduationCap />} />
              <StatGlass val={course.intakeCapacity.toString()} label="Intake Capacity" icon={<Layers />} />
            </div>

          </div>
        </div>
      </div>

      {/* 
        =====================================================================
        MAIN CONTENT AREA
        =====================================================================
      */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-6 relative z-20">
        
        <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-lg border border-slate-100 max-w-fit mb-10">
          <TabButton active={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')} icon={<Map />} label="Curriculum Matrix" color={themeColor} />
          <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users />} label="Student Roster" color={themeColor} />
        </div>

        <div className="min-h-[500px]">
          {activeTab === 'curriculum' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 px-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <Map className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Curriculum Matrix</h2>
                    <p className="text-slate-500 font-semibold text-sm">Map of semesters and assigned subjects</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalType("semester")}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Semester
                </button>
              </div>

              {curriculum.length === 0 ? (
                <div className="w-full bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3">Empty Curriculum</h3>
                  <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                    The curriculum matrix is currently empty. Start by adding semesters and subjects to build out the academic structure.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {curriculum.map((sem: any, idx: number) => (
                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                      
                      {/* Semester Header */}
                      <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                            {sem.semester}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900">Semester {sem.semester}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{sem.credits || 0} Expected Credits</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setModalType("section"); setModalData({ semesterIndex: idx }); }}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Section
                        </button>
                      </div>

                      {/* Sections List */}
                      {(!sem.sections || sem.sections.length === 0) ? (
                        <div className="flex flex-col items-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                           <p className="text-sm font-semibold text-slate-500">No sections configured.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {sem.sections.map((sec: any, sIdx: number) => (
                            <div key={sIdx} className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-100">
                              
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-700">{sec.name}</h4>
                                <div className="flex gap-2">
                                  <button onClick={() => { setModalType("subject"); setModalData({ semesterIndex: idx, sectionIndex: sIdx }); }} className="text-indigo-600 p-1.5 hover:bg-indigo-100 rounded-lg">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteSection(idx, sIdx)} className="text-rose-500 p-1.5 hover:bg-rose-100 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {(!sec.subjects || sec.subjects.length === 0) ? (
                                  <p className="text-xs text-slate-400 font-medium italic">No subjects added.</p>
                                ) : (
                                  sec.subjects.map((sub: any, subIdx: number) => (
                                    <div key={subIdx} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                      <div className="flex items-center gap-3">
                                        <Book className="w-4 h-4 text-slate-400" />
                                        <div>
                                          <p className="text-sm font-bold text-slate-900">{sub.name}</p>
                                          <p className="text-[10px] font-bold text-slate-400">Instr: {sub.facultyId || "Not Allocated"}</p>
                                        </div>
                                      </div>
                                      <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black">{sub.credits} Cr</span>
                                    </div>
                                  ))
                                )}
                              </div>

                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {students.length === 0 ? (
                <div className="w-full bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-sm">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3">Student Roster is Empty</h3>
                  <p className="text-slate-500 font-medium max-w-md mx-auto">
                    No active students are currently enrolled in {course.code}. Once admissions are approved, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-900">Enrolled Students ({students.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {students.map((s, idx) => (
                      <div key={idx} onClick={() => router.push(`/dashboard/students/${s._id}`)} className="p-6 hover:bg-slate-50 transition-colors flex items-center gap-6 cursor-pointer group">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                          {s.applicantPhoto ? (
                            <img src={s.applicantPhoto} alt="Student" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-indigo-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-slate-900 leading-tight">
                            {s.firstName} {s.lastName}
                          </h4>
                          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                            ID: {s.studentId || s.admissionNumber || "PENDING"}
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="flex gap-2 justify-end mb-1">
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              SEM {s.sessionYear || 1}
                            </span>
                            <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              SEC A
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">
                  {modalType === 'semester' && "New Semester"}
                  {modalType === 'section' && "Add Section"}
                  {modalType === 'subject' && "New Subject"}
                </h2>
                <button onClick={closeModal} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {modalType === 'semester' && (
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Semester Number</label>
                    <input type="number" placeholder="e.g. 1" value={semNumber} onChange={e => setSemNumber(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                )}
                {modalType === 'section' && (
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Section Name</label>
                    <input type="text" placeholder="e.g. Section A" value={secName} onChange={e => setSecName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                )}
                {modalType === 'subject' && (
                  <>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Subject Name</label>
                      <input type="text" placeholder="e.g. Data Structures" value={subName} onChange={e => setSubName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Credits</label>
                      <input type="number" placeholder="3" value={subCredits} onChange={e => setSubCredits(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                    <div className="relative">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Allocate Faculty (Optional)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search and select faculty..." 
                          value={facultySearch} 
                          onChange={e => {
                            setFacultySearch(e.target.value);
                            setShowFacultyDropdown(true);
                            if (!e.target.value) setSubFaculty("");
                          }} 
                          onFocus={() => setShowFacultyDropdown(true)}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                        />
                        {showFacultyDropdown && facultyList.length > 0 && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] max-h-48 overflow-y-auto">
                            {facultyList.filter(f => (f.firstName + ' ' + f.lastName).toLowerCase().includes(facultySearch.toLowerCase())).map(f => (
                              <div 
                                key={f._id} 
                                className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                                onClick={() => {
                                  setSubFaculty(f._id);
                                  setFacultySearch(`${f.firstName} ${f.lastName}`);
                                  setShowFacultyDropdown(false);
                                }}
                              >
                                <p className="font-bold text-slate-800">{f.firstName} {f.lastName}</p>
                                <p className="text-xs font-semibold text-slate-400">{f.email}</p>
                              </div>
                            ))}
                            {facultyList.filter(f => (f.firstName + ' ' + f.lastName).toLowerCase().includes(facultySearch.toLowerCase())).length === 0 && (
                              <div className="p-4 text-center text-slate-500 text-sm font-semibold">No faculty found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <button onClick={closeModal} className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                <button 
                  onClick={() => {
                    if (modalType === 'semester') handleAddSemester();
                    if (modalType === 'section') handleAddSection();
                    if (modalType === 'subject') handleAddSubject();
                  }} 
                  disabled={isUpdating}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatGlass({ val, label, icon }: any) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-[24px] flex flex-col justify-between h-32 group hover:bg-white/20 transition-all">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
          {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4 text-white" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-none mb-1">{val}</p>
        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
        active 
          ? "bg-slate-900 text-white shadow-md" 
          : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <div className={active ? "text-white" : "text-slate-400"}>
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </div>
      {label}
    </button>
  );
}

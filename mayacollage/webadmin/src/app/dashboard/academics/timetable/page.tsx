"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronDown, 
  Plus, 
  Save, 
  X, 
  Loader2, 
  Download,
  BookOpen,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
  Users,
  Zap,
  RefreshCw,
  Search,
  FileSpreadsheet
} from "lucide-react";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SLOTS = [
  '09:00 - 10:00', 
  '10:00 - 11:00', 
  '11:00 - 12:00', 
  '12:00 - 01:00', 
  '01:00 - 02:00 (LUNCH)', 
  '02:00 - 03:00', 
  '03:00 - 04:00', 
  '04:00 - 05:00'
];

export default function TimetableManagement() {
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  
  // Class selection state
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [schedule, setSchedule] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_SLOTS);

  const [timetablesList, setTimetablesList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Modal State
  const [activeCell, setActiveCell] = useState<{ day: string, time: string } | null>(null);
  const [subName, setSubName] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [subType, setSubType] = useState("Lecture");
  
  const [subFaculty, setSubFaculty] = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  // 0ms Cache hydration on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedBranches = localStorage.getItem("maya_academics_branches_cache");
        const cachedCourses = localStorage.getItem("maya_academics_courses_cache");
        const cachedList = localStorage.getItem("maya_timetable_list_cache");
        
        let hasCache = false;
        if (cachedBranches) {
          setBranches(JSON.parse(cachedBranches));
          hasCache = true;
        }
        if (cachedCourses) {
          setCourses(JSON.parse(cachedCourses));
          hasCache = true;
        }
        if (cachedList) {
          setTimetablesList(JSON.parse(cachedList));
          hasCache = true;
        }
        if (hasCache) {
          setFromCache(true);
          setIsLoading(false);
        }
      } catch (_) {}
    }
    fetchInitialData();
    fetchTimetablesList();
  }, []);

  useEffect(() => {
    if (selectedBranchId && selectedCourseId && selectedSemester && selectedSection) {
      loadTimetable();
    } else {
      setSchedule([]);
    }
  }, [selectedBranchId, selectedCourseId, selectedSemester, selectedSection]);

  const fetchTimetablesList = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setIsLoadingList(true);
    try {
      const res = await fetch(`/api/timetable/list`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setTimetablesList(list);
        try {
          localStorage.setItem("maya_timetable_list_cache", JSON.stringify(list));
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingList(false);
      setIsRefreshing(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [bRes, cRes, fRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/courses"),
        fetch("/api/faculty")
      ]);
      const bData = await bRes.json();
      const cData = await cRes.json();
      const fData = await fRes.json();
      
      const bList = Array.isArray(bData) ? bData : [];
      const cList = Array.isArray(cData) ? cData : [];
      const fList = Array.isArray(fData) ? fData : [];

      setBranches(bList);
      setCourses(cList);
      setFaculties(fList);

      try {
        localStorage.setItem("maya_academics_branches_cache", JSON.stringify(bList));
        localStorage.setItem("maya_academics_courses_cache", JSON.stringify(cList));
      } catch (_) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimetable = async () => {
    setIsLoading(true);
    try {
      const url = `/api/timetable?branchId=${selectedBranchId}&courseId=${selectedCourseId}&semester=${selectedSemester}&section=${selectedSection}`;
      const res = await fetch(url);
      const data = await res.json();
      
      let initialSchedule = DAYS.map(d => ({ day: d, slots: [] }));
      
      if (data && data.schedule && data.schedule.length > 0) {
        initialSchedule = initialSchedule.map(dayObj => {
          const fetchedDay = data.schedule.find((d: any) => d.day === dayObj.day);
          return fetchedDay ? fetchedDay : dayObj;
        });
      }
      
      if (data && data.timeSlots && data.timeSlots.length > 0) {
        setTimeSlots(data.timeSlots);
      } else {
        setTimeSlots(DEFAULT_SLOTS);
      }
      
      setSchedule(initialSchedule);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTimetable = async (scheduleDataToSave = schedule) => {
    if (!selectedBranchId || !selectedCourseId) return;

    setIsSaving(true);
    try {
      const payload: any = {
        schedule: scheduleDataToSave,
        timeSlots,
        branchId: selectedBranchId, 
        courseId: selectedCourseId,
        semester: selectedSemester,
        section: selectedSection || "A"
      };

      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setToastMsg("Timetable Saved to PostgreSQL!");
        setTimeout(() => setToastMsg(""), 3500);
        fetchTimetablesList(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = async () => {
    if (!pdfRef.current) return;
    const el = pdfRef.current;
    
    try {
      const dataUrl = await htmlToImage.toPng(el, { 
        quality: 1, 
        backgroundColor: '#ffffff', 
        pixelRatio: 2,
        filter: (node: any) => {
          if (node.classList?.contains('pdf-exclude')) return false;
          return true;
        }
      });
      const pdf = new jsPDF("l", "pt", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const elWidth = el.offsetWidth;
      const elHeight = el.offsetHeight;
      const pdfHeight = (elHeight * pdfWidth) / elWidth;
      
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const progName = selectedCourseDetails?.name ? selectedCourseDetails.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Class';
      const fileName = `Timetable_${progName}_Sem${selectedSemester}_Sec${selectedSection}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  };

  const handleDeleteTimetable = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this timetable?")) return;
    try {
      const res = await fetch(`/api/timetable?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTimetablesList(prev => prev.filter(t => (t.id || t._id) !== id));
        setToastMsg("Timetable removed");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (day: string, time: string) => {
    if (time.includes("BREAK") || time.includes("LUNCH")) return; 
    
    const dayData = schedule.find(d => d.day === day);
    const existingSlot = dayData?.slots.find((s: any) => s.startTime === time.split(" - ")[0]);
    
    setActiveCell({ day, time });
    
    if (existingSlot) {
      setSubName(existingSlot.subject || "");
      setSubLocation(existingSlot.location || "");
      setSubType(existingSlot.type || "Lecture");
      setSubFaculty(existingSlot.facultyUserId || "");
      setFacultySearch(existingSlot.facultyName || "");
    } else {
      setSubName("");
      setSubLocation("");
      setSubType("Lecture");
      setSubFaculty("");
      setFacultySearch("");
    }
  };

  const closeModal = () => setActiveCell(null);

  const saveSlot = () => {
    if (!activeCell) return;
    
    const [start, end] = activeCell.time.split(" - ");
    const newSlot: any = {
      subject: subName,
      startTime: start,
      endTime: end,
      location: subLocation,
      type: subType,
      facultyUserId: subFaculty || null,
      facultyName: facultySearch
    };

    setSchedule(prev => {
      const newSchedule = prev.map(d => {
        if (d.day === activeCell.day) {
          const slots = [...d.slots];
          const existingIdx = slots.findIndex((s: any) => s.startTime === start);
          if (existingIdx >= 0) {
            slots[existingIdx] = newSlot;
          } else {
            slots.push(newSlot);
          }
          return { ...d, slots };
        }
        return d;
      });
      
      saveTimetable(newSchedule);
      return newSchedule;
    });
    
    closeModal();
  };

  const clearSlot = (dayOverride?: string, timeOverride?: string) => {
    const targetDay = dayOverride || activeCell?.day;
    const targetTime = timeOverride || activeCell?.time;
    if (!targetDay || !targetTime) return;
    const [start] = targetTime.split(" - ");
    
    setSchedule(prev => {
      const newSchedule = prev.map(d => {
        if (d.day === targetDay) {
          return { ...d, slots: d.slots.filter((s: any) => s.startTime !== start) };
        }
        return d;
      });
      
      saveTimetable(newSchedule);
      return newSchedule;
    });
    
    if (!dayOverride) closeModal();
  };

  const filteredCourses = courses.filter(c => selectedBranchId ? (c.branchId === selectedBranchId || c.branchId?._id === selectedBranchId || c.branch_id === selectedBranchId) : true);
  const selectedCourseDetails = courses.find(c => (c.id || c._id) === selectedCourseId);

  const availableSections = React.useMemo(() => {
    if (!selectedCourseDetails || !selectedSemester) return ['A', 'B'];
    const curr = selectedCourseDetails.curriculum?.find((c: any) => c.semester === Number(selectedSemester));
    if (curr && curr.sections && curr.sections.length > 0) {
      return curr.sections.map((s: any) => s.name).filter(Boolean);
    }
    return ['A', 'B', 'C'];
  }, [selectedCourseDetails, selectedSemester]);

  const canSaveOrExport = selectedBranchId && selectedCourseId && selectedSemester && selectedSection && !isLoading;

  const filteredTimetablesList = timetablesList.filter(tt => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const crs = (tt.courseName || "").toLowerCase();
    const br = (tt.branchName || "").toLowerCase();
    const sem = `sem ${tt.semester}`.toLowerCase();
    const sec = `sec ${tt.section}`.toLowerCase();
    return crs.includes(q) || br.includes(q) || sem.includes(q) || sec.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative font-sans text-slate-800">
      
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-xl shadow-emerald-500/25 flex items-center gap-3 text-sm"
          >
            <CheckCircle2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner */}
      <div className="bg-white border-b border-slate-100 p-6 lg:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
              </span>
              <span className="text-xs text-slate-400 font-semibold">• {timetablesList.length} schedules created</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">Schedule & Timetable Engine</h1>
            <p className="text-xs lg:text-sm font-medium text-slate-500 mt-0.5">Design weekly class matrices, assign faculty slots, and export PDFs backed by PostgreSQL</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3">
          <button 
            onClick={() => fetchTimetablesList(true)}
            disabled={isRefreshing}
            className="p-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl shadow-sm transition-all"
            title="Sync latest from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button 
            onClick={exportPDF}
            disabled={!canSaveOrExport || schedule.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-sm"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export PDF
          </button>
          
          <button 
            onClick={() => saveTimetable()}
            disabled={!canSaveOrExport || isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            Save & Publish
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 mt-8">
        
        {/* Class Selection Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-20">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">1. Academic Branch</label>
            <div className="relative">
              <select 
                value={selectedBranchId} 
                onChange={e => { setSelectedBranchId(e.target.value); setSelectedCourseId(""); }}
                className="w-full appearance-none bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Select a Branch...</option>
                {branches.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">2. Course / Program</label>
            <div className="relative">
              <select 
                value={selectedCourseId} 
                onChange={e => { setSelectedCourseId(e.target.value); }}
                disabled={!selectedBranchId}
                className="w-full appearance-none bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Select a Program...</option>
                {filteredCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">3. Semester</label>
            <div className="relative">
              <select 
                value={selectedSemester} 
                onChange={e => setSelectedSemester(e.target.value)}
                disabled={!selectedCourseId}
                className="w-full appearance-none bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Select Semester...</option>
                {[...Array(selectedCourseDetails?.totalSemesters || selectedCourseDetails?.duration ? selectedCourseDetails.duration * 2 : 8)].map((_, i) => (
                  <option key={i+1} value={i+1}>Semester {i+1}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">4. Section</label>
            <div className="relative">
              <select 
                value={selectedSection} 
                onChange={e => setSelectedSection(e.target.value)}
                disabled={!selectedCourseId}
                className="w-full appearance-none bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Select Section...</option>
                {availableSections.map((s: any) => <option key={s} value={s}>Section {s}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Timetable Matrix Grid */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-12" ref={pdfRef}>
          {isLoading ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
                <div className="h-6 w-32 bg-slate-100 rounded-lg"></div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map(col => (
                  <div key={col} className="space-y-3">
                    <div className="h-8 bg-slate-100 rounded-xl"></div>
                    {[1, 2, 3, 4, 5].map(row => (
                      <div key={row} className="h-24 bg-slate-50 border border-slate-100 rounded-2xl p-2.5 space-y-2">
                        <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                        <div className="h-2.5 w-1/2 bg-slate-100 rounded"></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : !canSaveOrExport ? (
            <div className="h-[420px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-indigo-50/60 rounded-3xl flex items-center justify-center mb-5 text-indigo-500">
                <Calendar className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Class Not Selected</h3>
              <p className="text-slate-400 font-medium text-sm max-w-md">
                Select your Branch, Program, Semester, and Section above to edit the live schedule, or select an existing timetable from the list below.
              </p>
            </div>
          ) : (
            <div className="w-full p-4 lg:p-6 overflow-hidden">
              
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 bg-slate-50/50 rounded-2xl">
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    {selectedCourseDetails?.name}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Semester {selectedSemester} • Section {selectedSection}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 self-start sm:self-auto">
                  Click any cell to edit slot
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse bg-white min-w-[900px]">
                  <thead>
                    <tr>
                      <th className="p-2 border-b-2 border-r-2 border-slate-100 bg-slate-50 text-left w-[90px] rounded-tl-2xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Day</span>
                      </th>
                      {timeSlots.map((slot, idx) => {
                        const isBreak = slot.toUpperCase().includes("BREAK") || slot.toUpperCase().includes("LUNCH");
                        return (
                          <th key={idx} className={`p-2 border-b-2 border-slate-100 text-center ${isBreak ? 'bg-amber-50/50 w-[60px]' : 'bg-slate-50'} ${idx === timeSlots.length-1 ? 'rounded-tr-2xl' : ''}`}>
                            <input 
                              type="text"
                              value={slot}
                              onChange={(e) => {
                                const newSlots = [...timeSlots];
                                newSlots[idx] = e.target.value;
                                setTimeSlots(newSlots);
                              }}
                              className={`w-full text-center bg-transparent outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${isBreak ? 'text-amber-500' : 'text-slate-500'}`}
                            />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, dIdx) => {
                      const dayData = schedule.find(d => d.day === day);
                      
                      return (
                        <tr key={day}>
                          <td className="p-2 border-r-2 border-b-2 border-slate-100 font-black text-slate-700 bg-slate-50/50 text-xs lg:text-sm">
                            {day}
                          </td>
                          {timeSlots.map((slot, sIdx) => {
                            const isBreak = slot.toUpperCase().includes("BREAK") || slot.toUpperCase().includes("LUNCH");
                            const startT = slot.split(" - ")[0];
                            
                            if (isBreak) {
                              return (
                                <td key={sIdx} className="p-0 border-b-2 border-slate-100 bg-amber-50/30 text-center align-middle overflow-hidden relative">
                                  {dIdx === 2 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="inline-flex rotate-[-90deg] whitespace-nowrap opacity-20 font-black text-xs text-amber-600 tracking-[0.2em]">
                                        LUNCH
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            const slotData = dayData?.slots?.find((s: any) => s.startTime === startT);

                            return (
                              <td key={sIdx} className="p-1 lg:p-2 border-b-2 border-r-2 border-slate-100 hover:bg-slate-50/50 transition-colors h-24 lg:h-32 align-top">
                                <div 
                                  onClick={() => openModal(day, slot)}
                                  className={`w-full h-full rounded-xl border-2 border-dashed p-1.5 lg:p-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center group overflow-hidden ${
                                    slotData 
                                      ? 'border-transparent bg-indigo-50/60 hover:bg-indigo-100/60 shadow-sm' 
                                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20'
                                  }`}
                                >
                                  {slotData ? (
                                    <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="px-1.5 py-0.5 bg-white text-[8px] font-black text-indigo-600 uppercase tracking-widest rounded shadow-xs whitespace-nowrap">
                                          {slotData.type || 'Lecture'}
                                        </span>
                                        
                                        <div className="pdf-exclude opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity z-10 relative">
                                          <button onClick={(e) => { e.stopPropagation(); openModal(day, slot); }} className="w-5 h-5 rounded bg-white flex items-center justify-center shadow-xs text-indigo-600 hover:bg-indigo-50">
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); clearSlot(day, slot); }} className="w-5 h-5 rounded bg-rose-50 flex items-center justify-center shadow-xs text-rose-500 hover:bg-rose-100">
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                      <h4 className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2 break-words text-left">{slotData.subject}</h4>
                                      <div className="mt-auto pt-1 text-[9px] font-semibold text-slate-500 flex flex-col gap-0.5 text-left w-full overflow-hidden">
                                        <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap"><User className="w-2.5 h-2.5 shrink-0" /> <span className="truncate">{slotData.facultyName || "TBD"}</span></div>
                                        <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap"><MapPin className="w-2.5 h-2.5 shrink-0" /> <span className="truncate">{slotData.location || "Room"}</span></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="pdf-exclude opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                                        <Plus className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="text-[10px] font-bold text-indigo-400">Add Class</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Saved Timetables Section */}
        <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm relative z-20">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> 
                All Created Timetables
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Stored in PostgreSQL • Select any to load or export</p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search program, branch, semester..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          
          {isLoadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredTimetablesList.length === 0 ? (
            <div className="text-center py-14 text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No timetables matching your search. Create one using the form above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="p-4 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">Course & Branch</th>
                    <th className="p-4 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Semester</th>
                    <th className="p-4 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Section</th>
                    <th className="p-4 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Total Scheduled</th>
                    <th className="p-4 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTimetablesList.map((tt: any) => {
                    const totalSlotsCount = (tt.schedule || []).reduce((acc: number, d: any) => acc + (d.slots?.length || 0), 0);

                    return (
                      <tr key={tt.id || tt._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {tt.courseName}
                          </div>
                          <div className="text-xs font-medium text-slate-400 mt-0.5">
                            {tt.branchName}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black">
                            Sem {tt.semester}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-black">
                            Sec {tt.section}
                          </span>
                        </td>
                        <td className="p-4 text-center text-xs font-bold text-slate-500">
                          {totalSlotsCount} classes/week
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedBranchId(tt.branchId);
                                setSelectedCourseId(tt.courseId);
                                setSelectedSemester(String(tt.semester));
                                setSelectedSection(String(tt.section));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-3.5 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                            >
                              Load Matrix
                            </button>
                            <button
                              onClick={(e) => handleDeleteTimetable(tt.id || tt._id, e)}
                              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                              title="Delete timetable"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Edit Slot Modal */}
      <AnimatePresence>
        {activeCell && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => closeModal()} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 flex flex-col">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Assign Class Slot</h2>
                  <p className="text-sm font-bold text-indigo-600">{activeCell.day} • {activeCell.time}</p>
                </div>
                <button onClick={() => closeModal()} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-visible">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Subject Name</label>
                  <input type="text" placeholder="e.g. Data Structures & Algorithms" value={subName} onChange={e => setSubName(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Room / Lab No.</label>
                    <input type="text" placeholder="e.g. LH-101 or Lab 2" value={subLocation} onChange={e => setSubLocation(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Class Type</label>
                    <select value={subType} onChange={e => setSubType(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none">
                      <option value="Lecture">Lecture</option>
                      <option value="Lab">Lab / Practical</option>
                      <option value="Tutorial">Tutorial</option>
                      <option value="Seminar">Seminar</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assign Faculty</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search faculty name or enter directly..."
                      value={facultySearch}
                      onChange={(e) => {
                        setFacultySearch(e.target.value);
                        setShowFacultyDropdown(true);
                      }}
                      onFocus={() => setShowFacultyDropdown(true)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    {showFacultyDropdown && faculties.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                        {faculties.filter(f => `${f.firstName || ''} ${f.lastName || ''}`.toLowerCase().includes(facultySearch.toLowerCase())).map(f => (
                          <div 
                            key={f.id || f._id}
                            onClick={() => {
                              setSubFaculty(f.id || f._id);
                              setFacultySearch(`${f.firstName || ''} ${f.lastName || ''}`.trim());
                              setShowFacultyDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer font-medium text-slate-700 text-xs"
                          >
                            {f.firstName} {f.lastName} <span className="text-slate-400 text-[11px]">({f.email})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                <button onClick={() => clearSlot()} className="py-3.5 px-5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => saveSlot()} 
                  disabled={!subName}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
                >
                  Save Slot
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

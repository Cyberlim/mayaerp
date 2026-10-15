"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Trash2, BookOpen, Search, Zap, RefreshCw } from "lucide-react";

export default function SubjectLabMapping() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState("1");
  const [lab, setLab] = useState("");
  const [facultyId, setFacultyId] = useState("");

  // 0ms Cache Hydration on mount
  useEffect(() => {
    try {
      const cachedMappings = localStorage.getItem("maya_lab_mappings_cache");
      const cachedLabs = localStorage.getItem("maya_labs_cache");
      const cachedFaculty = localStorage.getItem("maya_faculty_cache");

      if (cachedMappings) {
        const parsed = JSON.parse(cachedMappings);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMappings(parsed);
          setFromCache(true);
          setIsLoading(false);
        }
      }
      if (cachedLabs) setLabs(JSON.parse(cachedLabs));
      if (cachedFaculty) setFaculty(JSON.parse(cachedFaculty));
    } catch (_) {}

    fetchData(false);
  }, []);

  const fetchData = async (showRefresh = true) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [mappingsRes, labsRes, facRes] = await Promise.all([
        fetch("/api/subject-lab-mapping"),
        fetch("/api/labs"),
        fetch("/api/users/staff")
      ]);
      const mData = await mappingsRes.json();
      const lData = await labsRes.json();
      const fData = await facRes.json();
      
      const mapList = Array.isArray(mData) ? mData : [];
      const labList = Array.isArray(lData) ? lData : [];
      const facList = Array.isArray(fData) ? fData : [];

      setMappings(mapList);
      if (labList.length > 0) setLabs(labList);
      if (facList.length > 0) setFaculty(facList);

      try {
        localStorage.setItem("maya_lab_mappings_cache", JSON.stringify(mapList));
        if (labList.length > 0) localStorage.setItem("maya_labs_cache", JSON.stringify(labList));
        if (facList.length > 0) localStorage.setItem("maya_faculty_cache", JSON.stringify(facList));
      } catch (_) {}
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return alert("Subject name is required");
    if (!lab) return alert("Please select a lab facility");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subject-lab-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          course,
          branch,
          semester: `Semester ${semester}`,
          lab,
          faculty: facultyId || null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const newMapping = data.mapping;

        // Optimistic update
        setMappings(prev => {
          const updated = [newMapping, ...prev];
          try {
            localStorage.setItem("maya_lab_mappings_cache", JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });

        setIsModalOpen(false);
        setSubject("");
        setLab("");
        setFacultyId("");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to create mapping");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mapping: any) => {
    const id = mapping.id || mapping._id;
    if (confirm(`Remove allocation for "${mapping.subject}"?`)) {
      setMappings(prev => {
        const updated = prev.filter(m => (m.id !== id && m._id !== id));
        try {
          localStorage.setItem("maya_lab_mappings_cache", JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      await fetch(`/api/subject-lab-mapping?id=${id}`, { method: "DELETE" });
    }
  };

  const filteredMappings = mappings.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    const sub = (m.subject || '').toLowerCase();
    const crs = (m.course || '').toLowerCase();
    const brn = (m.branch || '').toLowerCase();
    const lName = (m.lab?.labName || '').toLowerCase();
    return sub.includes(q) || crs.includes(q) || brn.includes(q) || lName.includes(q);
  });

  return (
    <div className="font-sans text-slate-800 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subject-Lab Mapping</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
            </span>
          </div>
          <p className="text-slate-500 font-medium mt-1">Assign practical and laboratory curriculum modules to dedicated campus facilities</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl shadow-sm transition-all"
            title="Refresh from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> New Mapping
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search subjects, courses, branches, or labs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold transition-all"
          />
        </div>
        <div className="text-xs font-bold text-slate-400">
          Showing {filteredMappings.length} Allocations
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <MappingSkeleton />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-6 py-4 border-b border-slate-100">Subject Module</th>
                  <th className="px-6 py-4 border-b border-slate-100">Course & Branch</th>
                  <th className="px-6 py-4 border-b border-slate-100">Lab Facility</th>
                  <th className="px-6 py-4 border-b border-slate-100">Assigned Faculty</th>
                  <th className="px-6 py-4 border-b border-slate-100">Academic Term</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No subject-to-lab mappings found.
                    </td>
                  </tr>
                ) : (
                  filteredMappings.map((m, idx) => {
                    const mapId = m.id || m._id;
                    const facultyName = typeof m.faculty === 'object' && m.faculty?.firstName
                      ? `${m.faculty.firstName} ${m.faculty.lastName || ''}`.trim()
                      : null;
                    const labName = typeof m.lab === 'object' ? m.lab?.labName : m.lab;
                    const roomStr = typeof m.lab === 'object' && m.lab?.roomNumber ? `(Room ${m.lab.roomNumber})` : '';

                    return (
                      <motion.tr 
                        key={mapId || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.02 * idx }}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <span>{m.subject}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{m.course}</div>
                          <div className="text-xs text-slate-400 font-medium">{m.branch} • {m.semester}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {labName} <span className="text-slate-400 text-xs font-normal">{roomStr}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {facultyName ? (
                            <span className="font-semibold text-slate-800">{facultyName}</span>
                          ) : (
                            <span className="text-slate-400 italic font-medium">TBA / Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-md">
                            {m.academicYear || '2024-2025'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(m)} 
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Remove Allocation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-black text-slate-900">New Subject-Lab Allocation</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="mappingForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Practical Subject Name</label>
                    <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" placeholder="e.g. Distributed Computing Lab" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Program / Course</label>
                      <select required value={course} onChange={e => setCourse(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                        <option>B.Tech Computer Science</option>
                        <option>B.Tech Electronics & Comm.</option>
                        <option>B.Tech Mechanical</option>
                        <option>B.Sc Physics</option>
                        <option>B.Sc Chemistry</option>
                        <option>BCA</option>
                        <option>MCA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Branch</label>
                      <input type="text" required value={branch} onChange={e => setBranch(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" placeholder="e.g. School of Engineering" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Semester</label>
                    <input type="number" required min="1" max="10" value={semester} onChange={e => setSemester(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Facility</label>
                      <select required value={lab} onChange={e => setLab(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                        <option value="">Choose Lab</option>
                        {labs.map(l => {
                          const lid = l.id || l._id;
                          return <option key={lid} value={lid}>{l.labName} ({l.roomNumber})</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assigned Faculty</label>
                      <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                        <option value="">Choose Faculty</option>
                        {faculty.map(f => {
                          const fid = f.id || f._id;
                          return (
                            <option key={fid} value={fid}>
                              {f.firstName} {f.lastName} ({f.department || 'Faculty'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" form="mappingForm" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-70 transition-colors text-sm shadow-md shadow-blue-500/20">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Allocation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MappingSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between">
        <div className="h-4 bg-slate-200 rounded w-36" />
        <div className="h-4 bg-slate-200 rounded w-20" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="h-4 bg-slate-200 rounded w-44" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-36" />
            <div className="h-4 bg-slate-100 rounded w-28" />
            <div className="h-4 bg-slate-100 rounded w-28" />
            <div className="h-5 bg-slate-100 rounded-md w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

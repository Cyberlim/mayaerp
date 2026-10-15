"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Settings, Users, Loader2, Search, Zap, RefreshCw, CheckCircle2 } from "lucide-react";

export default function ManageLabs() {
  const [labs, setLabs] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);

  // Form State
  const [labName, setLabName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [labType, setLabType] = useState("Computer");
  const [labIncharge, setLabIncharge] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 0ms Cache Hydration
  useEffect(() => {
    try {
      const cachedLabs = localStorage.getItem("maya_labs_cache");
      const cachedFaculty = localStorage.getItem("maya_faculty_cache");
      if (cachedLabs) {
        const parsed = JSON.parse(cachedLabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLabs(parsed);
          setFromCache(true);
          setIsLoading(false);
        }
      }
      if (cachedFaculty) {
        setFaculty(JSON.parse(cachedFaculty));
      }
    } catch (_) {}

    fetchData(false);
  }, []);

  const fetchData = async (showRefresh = true) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [labsRes, facRes] = await Promise.all([
        fetch("/api/labs"),
        fetch("/api/users/staff")
      ]);
      const labsData = await labsRes.json();
      const facData = await facRes.json();
      const labList = Array.isArray(labsData) ? labsData : [];
      const facList = Array.isArray(facData) ? facData : [];

      setLabs(labList);
      setFaculty(facList);

      try {
        localStorage.setItem("maya_labs_cache", JSON.stringify(labList));
        localStorage.setItem("maya_faculty_cache", JSON.stringify(facList));
        sessionStorage.setItem("maya_labs_cache", JSON.stringify(labList));
      } catch (_) {}
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const openModal = (lab: any = null) => {
    if (lab) {
      setEditingLab(lab);
      setLabName(lab.labName || "");
      setRoomNumber(lab.roomNumber || "");
      setCapacity((lab.capacity || 30).toString());
      setLabType(lab.labType || "Computer");
      setLabIncharge(typeof lab.labIncharge === 'object' ? (lab.labIncharge?.id || lab.labIncharge?._id) : (lab.labIncharge || ""));
      setDescription(lab.description || "");
    } else {
      setEditingLab(null);
      setLabName("");
      setRoomNumber("");
      setCapacity("30");
      setLabType("Computer");
      setLabIncharge("");
      setDescription("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        labName, 
        roomNumber, 
        capacity: parseInt(capacity) || 30, 
        labType, 
        labIncharge: labIncharge || null, 
        description
      };
      
      const labId = editingLab?.id || editingLab?._id;
      const url = editingLab ? `/api/labs/${labId}` : "/api/labs";
      const method = editingLab ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        const savedLab = data.lab;

        // Optimistic local cache update
        setLabs(prev => {
          let updated;
          if (editingLab) {
            updated = prev.map(l => (l.id === labId || l._id === labId) ? { ...l, ...savedLab } : l);
          } else {
            updated = [savedLab, ...prev];
          }
          try {
            localStorage.setItem("maya_labs_cache", JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });

        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.message || "An error occurred");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (lab: any) => {
    const id = lab.id || lab._id;
    if (confirm(`Are you sure you want to delete ${lab.labName}?`)) {
      // Optimistic delete
      setLabs(prev => {
        const updated = prev.filter(l => (l.id !== id && l._id !== id));
        try {
          localStorage.setItem("maya_labs_cache", JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      await fetch(`/api/labs/${id}`, { method: "DELETE" });
    }
  };

  // Filtered labs
  const filteredLabs = labs.filter(l => {
    const matchesSearch = !search || 
      l.labName?.toLowerCase().includes(search.toLowerCase()) || 
      l.roomNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || l.labType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="font-sans text-slate-800 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Labs</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
            </span>
          </div>
          <p className="text-slate-500 font-medium mt-1">Configure physical laboratory facilities, room codes, and faculty in-charge</p>
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
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Add Lab
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search labs by name or room..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Computer", "Robotics", "Engineering", "Physics", "Chemistry"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === type 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Facilities Table */}
      {isLoading ? (
        <LabManageSkeleton />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-6 py-4 border-b border-slate-100">Lab Name</th>
                  <th className="px-6 py-4 border-b border-slate-100">Room</th>
                  <th className="px-6 py-4 border-b border-slate-100">Type</th>
                  <th className="px-6 py-4 border-b border-slate-100">Capacity</th>
                  <th className="px-6 py-4 border-b border-slate-100">In-Charge</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLabs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No matching lab facilities found.
                    </td>
                  </tr>
                ) : (
                  filteredLabs.map((lab, idx) => {
                    const labId = lab.id || lab._id;
                    const inchargeName = typeof lab.labIncharge === 'object' && lab.labIncharge?.firstName
                      ? `${lab.labIncharge.firstName} ${lab.labIncharge.lastName || ''}`.trim()
                      : null;

                    return (
                      <motion.tr 
                        key={labId || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.03 * idx }}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              <Settings className="w-5 h-5" />
                            </div>
                            <div>
                              <span>{lab.labName}</span>
                              {lab.description && (
                                <p className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">{lab.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{lab.roomNumber}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                            {lab.labType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400"/> {lab.capacity} Seats
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {inchargeName ? (
                            <span className="font-semibold text-slate-800">{inchargeName}</span>
                          ) : (
                            <span className="text-slate-400 font-medium italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openModal(lab)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(lab)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors ml-1" title="Delete">
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
                <h3 className="text-lg font-black text-slate-900">{editingLab ? "Edit Facility" : "Add New Lab Facility"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="labForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lab Name</label>
                    <input type="text" required value={labName} onChange={e => setLabName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-semibold transition-all" placeholder="e.g. Artificial Intelligence & Vision Lab" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Room Number</label>
                      <input type="text" required value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-semibold transition-all" placeholder="e.g. CS-301" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Capacity</label>
                      <input type="number" required min="1" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-semibold transition-all" placeholder="e.g. 45" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lab Type</label>
                      <select required value={labType} onChange={e => setLabType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold transition-all">
                        <option value="Computer">Computer</option>
                        <option value="Robotics">Robotics</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Media">Media</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lab In-Charge</label>
                      <select value={labIncharge} onChange={e => setLabIncharge(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold transition-all">
                        <option value="">Select In-Charge</option>
                        {faculty.map((f: any) => {
                          const fid = f.id || f._id;
                          return (
                            <option key={fid} value={fid}>
                              {f.firstName} {f.lastName} ({f.department || 'Staff'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description (Optional)</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold transition-all resize-none" placeholder="Details about workstation specs, equipment, safety rules..." />
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" form="labForm" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-70 transition-colors text-sm shadow-md shadow-blue-500/20">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingLab ? "Save Changes" : "Create Lab"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LabManageSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-4 bg-slate-200 rounded w-20" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-44" />
                <div className="h-3 bg-slate-100 rounded w-28" />
              </div>
            </div>
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-5 bg-slate-100 rounded-full w-20" />
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-4 bg-slate-100 rounded w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

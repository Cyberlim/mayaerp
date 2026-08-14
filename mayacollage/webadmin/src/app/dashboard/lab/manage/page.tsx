"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Settings, Users, Loader2 } from "lucide-react";

export default function ManageLabs() {
  const [labs, setLabs] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [labsRes, facRes] = await Promise.all([
        fetch("/api/labs"),
        fetch("/api/users/staff") // Fetch faculty/staff for lab in-charge
      ]);
      const labsData = await labsRes.json();
      const facData = await facRes.json();
      setLabs(Array.isArray(labsData) ? labsData : []);
      setFaculty(Array.isArray(facData) ? facData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (lab: any = null) => {
    if (lab) {
      setEditingLab(lab);
      setLabName(lab.labName);
      setRoomNumber(lab.roomNumber);
      setCapacity(lab.capacity.toString());
      setLabType(lab.labType);
      setLabIncharge(lab.labIncharge?._id || "");
      setDescription(lab.description || "");
    } else {
      setEditingLab(null);
      setLabName("");
      setRoomNumber("");
      setCapacity("");
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
        labName, roomNumber, capacity: parseInt(capacity), labType, labIncharge, description
      };
      
      const url = editingLab ? `/api/labs/${editingLab._id}` : "/api/labs";
      const method = editingLab ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lab?")) {
      await fetch(`/api/labs/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  if (isLoading) {
    return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="font-sans text-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manage Labs</h1>
          <p className="text-slate-500 font-medium">Create and manage laboratory facilities</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Lab
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-slate-100">Lab Name</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Room</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Type</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Capacity</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">In-Charge</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">No labs found. Add one to get started.</td>
                </tr>
              ) : (
                labs.map((lab) => (
                  <tr key={lab._id} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Settings className="w-5 h-5" />
                        </div>
                        {lab.labName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{lab.roomNumber}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                        {lab.labType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium flex items-center gap-1"><Users className="w-4 h-4 text-slate-400"/> {lab.capacity}</td>
                    <td className="px-6 py-4 text-sm">
                      {lab.labIncharge ? `${lab.labIncharge.firstName} ${lab.labIncharge.lastName}` : <span className="text-red-400 font-medium">Not Assigned</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(lab)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lab._id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors ml-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">{editingLab ? "Edit Lab" : "Add New Lab"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="labForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lab Name</label>
                    <input type="text" required value={labName} onChange={e => setLabName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Advanced Physics Lab" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Room Number</label>
                      <input type="text" required value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. B-301" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Capacity</label>
                      <input type="number" required min="1" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. 60" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lab Type</label>
                      <input type="text" required value={labType} onChange={e => setLabType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Computer, Chemistry, etc." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lab In-Charge</label>
                      <select required value={labIncharge} onChange={e => setLabIncharge(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                        <option value="">Select In-Charge</option>
                        {faculty.map((f: any) => (
                          <option key={f._id} value={f._id}>{f.firstName} {f.lastName} ({f.department || 'Staff'})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description (Optional)</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="Details about equipment or safety procedures..." />
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" form="labForm" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-70 transition-colors">
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

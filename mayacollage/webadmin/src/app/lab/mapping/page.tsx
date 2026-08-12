"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, BookOpen } from "lucide-react";
import dayjs from "dayjs";

export default function SubjectLabMapping() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState("1");
  const [lab, setLab] = useState("");
  const [facultyId, setFacultyId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mappingsRes, labsRes, facRes] = await Promise.all([
        fetch("/api/subject-lab-mapping"),
        fetch("/api/labs"),
        fetch("/api/staff")
      ]);
      const mData = await mappingsRes.json();
      const lData = await labsRes.json();
      const fData = await facRes.json();
      
      setMappings(Array.isArray(mData) ? mData : []);
      setLabs(Array.isArray(lData) ? lData : []);
      setFaculty(Array.isArray(fData) ? fData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subject-lab-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          course,
          branch,
          semester,
          lab,
          faculty: facultyId
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setSubject("");
        fetchData();
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

  if (isLoading) {
    return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="font-sans text-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Subject-Lab Mapping</h1>
          <p className="text-slate-500 font-medium">Assign practical subjects to laboratories</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus className="w-5 h-5" /> New Mapping
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-slate-100">Subject</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Course & Branch</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Lab Facility</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Assigned Faculty</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Academic Year</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">No mappings found.</td>
                </tr>
              ) : (
                mappings.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        {m.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{m.course}</div>
                      <div className="text-xs text-slate-500">{m.branch} (Sem {m.semester})</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{m.lab?.labName}</td>
                    <td className="px-6 py-4 text-sm">{m.faculty?.firstName} {m.faculty?.lastName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{m.academicYear}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">New Subject-Lab Mapping</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="mappingForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Subject Name</label>
                  <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Data Structures Lab" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Course</label>
                    <select required value={course} onChange={e => setCourse(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                      <option>B.Tech</option>
                      <option>M.Tech</option>
                      <option>BCA</option>
                      <option>MCA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Branch</label>
                    <input type="text" required value={branch} onChange={e => setBranch(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Computer Science" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Semester</label>
                  <input type="number" required min="1" max="10" value={semester} onChange={e => setSemester(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Lab</label>
                    <select required value={lab} onChange={e => setLab(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                      <option value="">Choose Lab</option>
                      {labs.map(l => <option key={l._id} value={l._id}>{l.labName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assigned Faculty</label>
                    <select required value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                      <option value="">Choose Faculty</option>
                      {faculty.map(f => <option key={f._id} value={f._id}>{f.firstName} {f.lastName}</option>)}
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="mappingForm" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-70 transition-colors">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

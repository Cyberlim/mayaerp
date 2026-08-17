"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function BatchPromotePage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    selectedBranch: "",
    selectedProgram: "",
    sessionYear: "",
    newSemester: 2,
  });

  // Fetch Branches and Courses
  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then(res => res.json()),
      fetch("/api/courses").then(res => res.json())
    ]).then(([branchesData, coursesData]) => {
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    }).catch(console.error);
  }, []);

  const availableCourses = courses.filter(c => 
    !formData.selectedBranch || 
    (c.branchId && (c.branchId._id === formData.selectedBranch || c.branchId === formData.selectedBranch))
  );

  const handlePreview = async () => {
    if (!formData.selectedBranch && !formData.selectedProgram && !formData.sessionYear) {
      setMessage({ type: 'error', text: 'Please select at least one filter criteria to preview students.' });
      return;
    }

    setIsPreviewing(true);
    setMessage(null);
    setPreviewStudents([]);

    try {
      const queryParams = new URLSearchParams();
      if (formData.selectedBranch) queryParams.append("selectedBranch", formData.selectedBranch);
      if (formData.selectedProgram) queryParams.append("selectedProgram", formData.selectedProgram);
      if (formData.sessionYear) queryParams.append("sessionYear", formData.sessionYear);

      const res = await fetch(`/api/students?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewStudents(data);
        if (data.length === 0) {
          setMessage({ type: 'error', text: 'No students found matching these filters.' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch students for preview.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error fetching preview.' });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedBranch && !formData.selectedProgram && !formData.sessionYear) {
      setMessage({ type: 'error', text: 'Please select at least one filter criteria (Branch, Course, or Year).' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/students/batch-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedBranch: formData.selectedBranch || undefined,
          selectedProgram: formData.selectedProgram || undefined,
          sessionYear: formData.sessionYear || undefined,
          newSemester: Number(formData.newSemester)
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully promoted ${data.modifiedCount} students to Semester ${formData.newSemester}.` });
      } else {
        setMessage({ type: 'error', text: data.error || data.message || 'Failed to update students.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred during promotion.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Batch Promote Students</h1>
          <p className="text-sm font-medium text-slate-500">Update the semester for an entire batch of students at once.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl">
        <form onSubmit={handlePromote} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Filter Students</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch <span className="text-rose-500">*</span></label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={formData.selectedBranch}
                  onChange={(e) => setFormData({...formData, selectedBranch: e.target.value, selectedProgram: ""})}
                >
                  <option value="">-- All Branches --</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course / Program</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={formData.selectedProgram}
                  onChange={(e) => setFormData({...formData, selectedProgram: e.target.value})}
                  disabled={!formData.selectedBranch}
                >
                  <option value="">-- All Courses --</option>
                  {availableCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Year (Batch)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="e.g. 2024-2028"
                  value={formData.sessionYear}
                  onChange={(e) => setFormData({...formData, sessionYear: e.target.value})}
                />
              </div>

            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Promotion Details</h3>
            
            <div className="space-y-2 max-w-xs">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promote To Semester <span className="text-rose-500">*</span></label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={formData.newSemester}
                onChange={(e) => setFormData({...formData, newSemester: Number(e.target.value)})}
                required
              >
                {[1,2,3,4,5,6,7,8,9,10].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <div className={`flex items-start gap-3 p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="px-6 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Find Students
            </button>
            <button
              type="submit"
              disabled={isLoading || previewStudents.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Promote {previewStudents.length > 0 ? previewStudents.length : ''} Students
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {previewStudents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
            Students Selected for Promotion ({previewStudents.length})
          </h3>
          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
            {previewStudents.map(student => (
              <div key={student._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                    {student.applicantPhoto ? (
                      <img src={student.applicantPhoto} alt={student.firstName} className="w-full h-full object-cover" />
                    ) : (
                      student.firstName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{student.firstName} {student.lastName}</p>
                    <p className="text-xs font-medium text-slate-500">ID: {student.studentId} • Current Sem: {student.selectedSemester}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

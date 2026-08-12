"use client";

import React, { useState, useEffect } from "react";
import { Plus, Save, Trash2, Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";

export default function ExamsDashboard() {
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [examName, setExamName] = useState("");
  
  const [dateSheet, setDateSheet] = useState<any[]>([]);
  
  useEffect(() => {
    fetch("/api/branches").then(res => res.json()).then(setBranches);
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetch(`/api/courses?branchId=${selectedBranch}`).then(res => res.json()).then(setCourses);
    } else {
      setCourses([]);
      setSelectedCourse("");
      setSubjects([]);
      setExams([]);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch && selectedCourse) {
      fetch(`/api/subjects?courseId=${selectedCourse}`).then(res => res.json()).then(setSubjects);
      fetchExams();
    } else {
      setSubjects([]);
      setExams([]);
    }
  }, [selectedBranch, selectedCourse]);

  const fetchExams = async () => {
    if (!selectedBranch || !selectedCourse) return;
    try {
      const res = await fetch(`/api/exams?branchId=${selectedBranch}&courseId=${selectedCourse}`);
      setExams(await res.json());
    } catch (e) {}
  };

  const handleAddRow = () => {
    setDateSheet([
      ...dateSheet,
      { date: "", day: "", subject: "", startTime: "10:00", endTime: "13:00", type: "Theory" }
    ]);
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const newSheet = [...dateSheet];
    newSheet[index][field] = value;
    
    // Auto-fill day based on date
    if (field === 'date' && value) {
      const dateObj = new Date(value);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      newSheet[index].day = days[dateObj.getDay()];
    }
    
    setDateSheet(newSheet);
  };

  const handleRemoveRow = (index: number) => {
    const newSheet = [...dateSheet];
    newSheet.splice(index, 1);
    setDateSheet(newSheet);
  };

  const handleSaveExam = async () => {
    if (!examName.trim()) return alert("Exam Name is required");
    if (dateSheet.length === 0) return alert("Date sheet must have at least one subject schedule");
    
    for (const row of dateSheet) {
      if (!row.date || !row.subject || !row.startTime || !row.endTime) {
        return alert("Please fill all fields in the date sheet");
      }
    }

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch,
          courseId: selectedCourse,
          examName,
          dateSheet
        })
      });
      if (res.ok) {
        setIsCreating(false);
        setExamName("");
        setDateSheet([]);
        fetchExams();
      }
    } catch (e) {
      alert("Error saving exam");
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam schedule?")) return;
    try {
      await fetch(`/api/exams?id=${id}`, { method: "DELETE" });
      fetchExams();
    } catch (e) {}
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Exam Schedules</h1>
          <p className="text-slate-500 font-medium mt-2">Manage date sheets and examination timetables</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Select Branch</label>
          <select value={selectedBranch} onChange={e=>setSelectedBranch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-700">
            <option value="">Select Branch</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Select Course</label>
          <select value={selectedCourse} onChange={e=>setSelectedCourse(e.target.value)} disabled={!selectedBranch} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-700 disabled:opacity-50">
            <option value="">Select Course</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedBranch || !selectedCourse ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-20 flex flex-col items-center justify-center text-center">
          <Calendar className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">Select a Branch and Course</h3>
          <p className="text-slate-400 mt-2">To view or create exam schedules.</p>
        </div>
      ) : isCreating ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800">Create Date Sheet</h2>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
          </div>

          <div className="mb-8">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Exam Name</label>
            <input type="text" placeholder="e.g. Mid-Term Examination 2026" value={examName} onChange={e=>setExamName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold outline-none text-slate-700" />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-700">Schedule</h3>
              <button onClick={handleAddRow} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-xs">
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="p-4 rounded-tl-xl">Date</th>
                    <th className="p-4">Day</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 rounded-tr-xl"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dateSheet.map((row, index) => (
                    <tr key={index}>
                      <td className="p-3">
                        <input type="date" value={row.date} onChange={e=>handleRowChange(index, 'date', e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="text" readOnly value={row.day} className="w-24 bg-transparent p-2 text-xs font-semibold text-slate-500 outline-none" placeholder="Day" />
                      </td>
                      <td className="p-3">
                        <select value={row.subject} onChange={e=>handleRowChange(index, 'subject', e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none">
                          <option value="">Select Subject</option>
                          {subjects.map(s => <option key={s._id} value={s.subjectName}>{s.subjectName}</option>)}
                        </select>
                      </td>
                      <td className="p-3 flex items-center gap-1">
                        <input type="time" value={row.startTime} onChange={e=>handleRowChange(index, 'startTime', e.target.value)} className="w-24 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none" />
                        <span className="text-slate-400">-</span>
                        <input type="time" value={row.endTime} onChange={e=>handleRowChange(index, 'endTime', e.target.value)} className="w-24 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none" />
                      </td>
                      <td className="p-3">
                        <select value={row.type} onChange={e=>handleRowChange(index, 'type', e.target.value)} className="w-24 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none">
                          <option value="Theory">Theory</option>
                          <option value="Practical">Practical</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleRemoveRow(index)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {dateSheet.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        No subjects added to this exam schedule yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-slate-100">
            <button onClick={handleSaveExam} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Save className="w-5 h-5" /> Save Date Sheet
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <div>
              <h3 className="font-black text-blue-900 text-lg">Manage Exam Schedules</h3>
              <p className="text-sm text-blue-700 font-medium mt-1">Create and publish date sheets for this course.</p>
            </div>
            <button onClick={() => { setIsCreating(true); setDateSheet([]); setExamName(""); }} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create New Exam
            </button>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-20 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-400">No Exams Found</h3>
              <p className="text-slate-400 mt-2">There are no date sheets created for this course yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {exams.map(exam => (
                <div key={exam._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800">{exam.examName}</h3>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider">{exam.status}</span>
                      <button onClick={() => handleDeleteExam(exam._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <th className="p-3 rounded-tl-lg">Date & Day</th>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Time</th>
                          <th className="p-3 rounded-tr-lg">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exam.dateSheet.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">
                              {new Date(item.date).toLocaleDateString()} <span className="text-slate-400 ml-1 text-xs">{item.day}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-500" /> {item.subject}
                            </td>
                            <td className="p-3 font-medium text-slate-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.startTime} - {item.endTime}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.type === 'Practical' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{item.type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

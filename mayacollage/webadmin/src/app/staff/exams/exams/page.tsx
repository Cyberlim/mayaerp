"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";

export default function StaffExamsDashboard() {
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    fetch("/api/branches").then(res => res.json()).then(setBranches);
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetch(`/api/courses?branchId=${selectedBranch}`).then(res => res.json()).then(setCourses);
    } else {
      setCourses([]);
      setSelectedCourse("");
      setExams([]);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch && selectedCourse) {
      fetchExams();
    } else {
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

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Exam Schedules</h1>
          <p className="text-slate-500 font-medium mt-2">View upcoming examination timetables</p>
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
          <p className="text-slate-400 mt-2">To view upcoming exam schedules.</p>
        </div>
      ) : (
        <div className="space-y-6">
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
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider">{exam.status}</span>
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

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function EditStudentFullPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Personal
    firstName: "", lastName: "", dob: "", gender: "", category: "General",
    admissionNumber: "", studentId: "", email: "", phone: "", alternateMobile: "",
    city: "", state: "", pinCode: "", address: "", profilePhoto: "",
    
    // Academics
    selectedBranch: "", selectedProgram: "", sessionYear: "", selectedSemester: 1, selectedSection: "Section A",
    highestQualification: "", boardUniversity: "", institutionName: "", percentageCGPA: "", yearOfPassing: "",
    subjectMarks: { subject1: "", subject2: "", subject3: "" }, entranceScore: "", statementOfPurpose: "",
    
    // Fees
    fees: { semester: 0, transport: 0, exam: 0, other: 0 }
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then(res => res.json()),
      fetch("/api/courses").then(res => res.json()),
      fetch(`/api/students/${studentId}`).then(res => res.json())
    ]).then(([branchesData, coursesData, student]) => {
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      
      if (student && !student.error) {
        setFormData({
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          dob: student.dob || "",
          gender: student.gender || "",
          category: student.category || "General",
          admissionNumber: student.admissionNumber || "",
          studentId: student.studentId || "",
          email: student.email || "",
          phone: student.phone || student.mobile || "",
          alternateMobile: student.alternateMobile || "",
          city: student.city || "",
          state: student.state || "",
          pinCode: student.pinCode || "",
          address: student.address || "",
          profilePhoto: student.profilePhoto || "",

          selectedBranch: typeof student.selectedBranch === 'object' ? student.selectedBranch._id : student.selectedBranch || "",
          selectedProgram: typeof student.selectedProgram === 'object' ? student.selectedProgram._id : student.selectedProgram || "",
          sessionYear: student.sessionYear || "",
          selectedSemester: student.selectedSemester || 1,
          selectedSection: student.selectedSection || "Section A",

          highestQualification: student.highestQualification || "",
          boardUniversity: student.boardUniversity || "",
          institutionName: student.institutionName || "",
          percentageCGPA: student.percentageCGPA || "",
          yearOfPassing: student.yearOfPassing || "",

          subjectMarks: {
            subject1: student.subjectMarks?.subject1 || "",
            subject2: student.subjectMarks?.subject2 || "",
            subject3: student.subjectMarks?.subject3 || ""
          },
          entranceScore: student.entranceScore || "",
          statementOfPurpose: student.statementOfPurpose || "",

          fees: {
            semester: student.fees?.semester || 0,
            transport: student.fees?.transport || 0,
            exam: student.fees?.exam || 0,
            other: student.fees?.other || 0
          }
        });
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg("Student updated successfully!");
        setTimeout(() => {
          router.push(`/dashboard/students/${studentId}`);
        }, 1500);
      } else {
        alert(data.error || "Failed to update student.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating student.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const InputField = ({ label, value, field, type = "text", disabled = false }: any) => (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">{label}</label>
      <input 
        required={!disabled} 
        disabled={disabled}
        type={type} 
        value={value} 
        onChange={e => setFormData({...formData, [field]: type === 'number' ? Number(e.target.value) : e.target.value})} 
        className={`w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">
      
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/students/${studentId}`}>
              <button className="flex items-center justify-center w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900">Edit Full Profile</h1>
              <p className="text-xs font-bold text-slate-400">{formData.firstName} {formData.lastName} ({formData.studentId})</p>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all text-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* PERSONAL */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField label="First Name" value={formData.firstName} field="firstName" />
              <InputField label="Last Name" value={formData.lastName} field="lastName" />
              <InputField label="Date of Birth" value={formData.dob} field="dob" type="date" />
              <InputField label="Gender" value={formData.gender} field="gender" />
              <InputField label="Category" value={formData.category} field="category" />
              <InputField label="Profile Photo URL" value={formData.profilePhoto} field="profilePhoto" type="url" />
              <InputField label="Student ID (Roll No)" value={formData.studentId} field="studentId" disabled />
              <InputField label="Admission No" value={formData.admissionNumber} field="admissionNumber" />
            </div>
            
            <h3 className="text-sm font-black text-slate-400 mt-8 mb-4 uppercase tracking-widest">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField label="Email Address" value={formData.email} field="email" type="email" />
              <InputField label="Phone Number" value={formData.phone} field="phone" />
              <InputField label="Alternate Number" value={formData.alternateMobile} field="alternateMobile" />
              <InputField label="City" value={formData.city} field="city" />
              <InputField label="State" value={formData.state} field="state" />
              <InputField label="Pin Code" value={formData.pinCode} field="pinCode" />
              <div className="md:col-span-3">
                <InputField label="Full Address" value={formData.address} field="address" />
              </div>
            </div>
          </div>

          {/* ACADEMICS */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Academic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Branch</label>
                <select value={formData.selectedBranch} onChange={e => setFormData({...formData, selectedBranch: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none">
                  <option value="">Select...</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Course</label>
                <select value={formData.selectedProgram} onChange={e => setFormData({...formData, selectedProgram: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none">
                  <option value="">Select...</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <InputField label="Session Year" value={formData.sessionYear} field="sessionYear" />
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Semester</label>
                <select value={formData.selectedSemester} onChange={e => setFormData({...formData, selectedSemester: Number(e.target.value)})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none">
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <InputField label="Section" value={formData.selectedSection} field="selectedSection" />
            </div>

            <h3 className="text-sm font-black text-slate-400 mt-8 mb-4 uppercase tracking-widest">Previous Qualifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField label="Highest Level" value={formData.highestQualification} field="highestQualification" />
              <InputField label="Board / University" value={formData.boardUniversity} field="boardUniversity" />
              <InputField label="Institution Name" value={formData.institutionName} field="institutionName" />
              <InputField label="Percentage / CGPA" value={formData.percentageCGPA} field="percentageCGPA" />
              <InputField label="Year of Passing" value={formData.yearOfPassing} field="yearOfPassing" />
            </div>

            <h3 className="text-sm font-black text-slate-400 mt-8 mb-4 uppercase tracking-widest">Entrance & SOP</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Subject 1 Score</label>
                <input value={formData.subjectMarks.subject1} onChange={e => setFormData({...formData, subjectMarks: {...formData.subjectMarks, subject1: e.target.value}})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Subject 2 Score</label>
                <input value={formData.subjectMarks.subject2} onChange={e => setFormData({...formData, subjectMarks: {...formData.subjectMarks, subject2: e.target.value}})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Subject 3 Score</label>
                <input value={formData.subjectMarks.subject3} onChange={e => setFormData({...formData, subjectMarks: {...formData.subjectMarks, subject3: e.target.value}})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
              </div>
              <InputField label="Entrance Score Overall" value={formData.entranceScore} field="entranceScore" />
              <div className="md:col-span-2">
                <InputField label="Statement of Purpose" value={formData.statementOfPurpose} field="statementOfPurpose" />
              </div>
            </div>
          </div>

          {/* FEES */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Fee Structure overrides</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Semester Fee (₹)</label>
                <input type="number" value={formData.fees.semester} onChange={e => setFormData({...formData, fees: {...formData.fees, semester: Number(e.target.value)}})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Transport Fee (₹)</label>
                <input type="number" value={formData.fees.transport} onChange={e => setFormData({...formData, fees: {...formData.fees, transport: Number(e.target.value)}})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Exam Fee (₹)</label>
                <input type="number" value={formData.fees.exam} onChange={e => setFormData({...formData, fees: {...formData.fees, exam: Number(e.target.value)}})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Other Fee (₹)</label>
                <input type="number" value={formData.fees.other} onChange={e => setFormData({...formData, fees: {...formData.fees, other: Number(e.target.value)}})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

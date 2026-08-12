"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, User, Mail, Phone, MapPin, Building2, Briefcase, Loader2, CheckCircle2, Image as ImageIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateStudentPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    studentId: "",
    selectedSection: "A",
    selectedBranch: "",
    selectedProgram: "",
    selectedSemester: 1,
    sessionYear: "", // For batch/roll logic
    studentStatus: "Active",
    profilePhoto: ""
  });

  const [feesYears, setFeesYears] = useState([{ year: 1, tuitionTotal: "", examTotal: "", otherTotal: "" }]);

  useEffect(() => {
    if (formData.selectedProgram && courses.length > 0) {
      const course = courses.find(c => c._id === formData.selectedProgram);
      const duration = course ? course.duration || 4 : 4;
      const newFees = Array.from({length: duration}, (_, i) => ({
        year: i + 1,
        tuitionTotal: "", examTotal: "", otherTotal: ""
      }));
      setFeesYears(newFees);
    }
  }, [formData.selectedProgram, courses]);

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then(res => res.json()),
      fetch("/api/courses").then(res => res.json())
    ]).then(([branchesData, coursesData]) => {
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    }).catch(console.error);
  }, []);

  const stepLabels = ["Academic Setup", "Personal Details", "Contact & Photo", "Fees Structure"];

  const validateStep = () => {
    if (step === 0) {
      if (!formData.selectedBranch || !formData.selectedProgram || !formData.sessionYear) {
        alert("Please select Branch, Course and Session Year");
        return false;
      }
    }
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.studentId) {
        alert("Please fill out First Name, Last Name, and Student ID");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < stepLabels.length - 1) {
        setStep(s => s + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        fees: {
          isConfigured: feesYears.some(f => f.tuitionTotal || f.examTotal || f.otherTotal),
          years: feesYears.map(f => ({
            year: f.year,
            tuition: { total: Number(f.tuitionTotal) || 0, paid: 0 },
            exam: { total: Number(f.examTotal) || 0, paid: 0 },
            other: { total: Number(f.otherTotal) || 0, paid: 0 }
          }))
        }
      };

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg("Student enrolled successfully!");
        setTimeout(() => {
          router.push("/dashboard/students");
        }, 1500);
      } else {
        alert(data.error || "Failed to enroll student.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving student.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCourse = courses.find(c => c._id === formData.selectedProgram);
  const selectedBranchFull = branches.find(b => b._id === formData.selectedBranch);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Stepper Panel */}
      <div className="hidden lg:flex w-[320px] relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA]">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 w-full p-8 flex flex-col justify-between h-full">
          <div>
            <Link href="/dashboard/students">
              <button className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur-md border border-white/20">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
          </div>
          
          <div className="mt-12 flex-1">
            <h2 className="text-2xl font-black text-white tracking-tight mb-8">Enroll Student</h2>
            
            {/* Stepper Logic */}
            <div className="space-y-6">
              {stepLabels.map((label, idx) => {
                const isActive = step === idx;
                const isPast = step > idx;
                return (
                  <div key={label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isActive ? 'bg-white text-blue-600 scale-110 shadow-lg shadow-white/20' : 
                        isPast ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white/50 border border-white/10'
                      }`}>
                        {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      {idx !== stepLabels.length - 1 && (
                        <div className={`w-0.5 h-10 mt-2 rounded-full ${isPast ? 'bg-emerald-400/50' : 'bg-white/10'}`} />
                      )}
                    </div>
                    <div className={`pt-1 ${isActive ? 'text-white' : isPast ? 'text-white/80' : 'text-white/40'}`}>
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-[10px] font-medium uppercase tracking-widest mt-1 opacity-80">
                        {idx === 0 ? "Course & Branch" : idx === 1 ? "Name & ID" : idx === 2 ? "Contact Info" : "Fee Details"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Course Chip Preview */}
            <AnimatePresence>
              {selectedCourse && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 p-4 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Selected Program</p>
                  <p className="text-sm font-bold text-white line-clamp-1">{selectedCourse.name}</p>
                  {selectedBranchFull && <p className="text-xs text-white/70 line-clamp-1 mt-1">{selectedBranchFull.name}</p>}
                  <div className="mt-3 inline-block px-2 py-1 bg-white/20 rounded-md text-[10px] font-bold text-white uppercase">
                    Sem {formData.selectedSemester}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col bg-[#F5F6FA]">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <Link href="/dashboard/students">
              <button className="flex items-center justify-center w-10 h-10 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm border border-slate-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Step {step + 1} of {stepLabels.length}
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            
            {/* STEP 0: Academic Setup */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Academic Setup</h1>
                <p className="text-sm text-slate-500 mb-8">Select the program and branch the student is enrolling in.</p>
                
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Branch</label>
                    <select value={formData.selectedBranch} onChange={e => setFormData({...formData, selectedBranch: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none">
                      <option value="">Select Branch...</option>
                      {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Course / Program</label>
                    <select value={formData.selectedProgram} onChange={e => setFormData({...formData, selectedProgram: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none">
                      <option value="">Select Course...</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Starting Semester</label>
                      <select value={formData.selectedSemester} onChange={e => setFormData({...formData, selectedSemester: Number(e.target.value)})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none">
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Session Year</label>
                      <input value={formData.sessionYear} onChange={e => setFormData({...formData, sessionYear: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="2024-25" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Personal Details</h1>
                <p className="text-sm text-slate-500 mb-8">Enter the core identity details of the student.</p>
                
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">First Name</label>
                      <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="John" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Last Name</label>
                      <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Student ID (Roll No)</label>
                    <input required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="STU-2024-001" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Date of Birth</label>
                    <input value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} type="date" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Contact & Photo */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Contact & Photo</h1>
                <p className="text-sm text-slate-500 mb-8">Almost done! Add communication details and a profile picture.</p>
                
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email Address</label>
                    <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="student@example.com" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Phone Number</label>
                    <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="+1 234 567 890" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Home Address</label>
                    <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="123 Student Avenue" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Profile Photo URL</label>
                    <input value={formData.profilePhoto} onChange={e => setFormData({...formData, profilePhoto: e.target.value})} type="url" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" placeholder="https://example.com/avatar.jpg" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Fees Structure */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Fees Structure (Optional)</h1>
                <p className="text-sm text-slate-500 mb-8">Define the initial fee structure for each academic year.</p>
                
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {feesYears.map((fy, index) => (
                    <div key={fy.year} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                      <h3 className="font-black text-slate-800 text-lg border-b border-slate-50 pb-2">Year {fy.year}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Tuition Total</label>
                          <input 
                            value={fy.tuitionTotal} 
                            onChange={e => {
                              const newFees = [...feesYears];
                              newFees[index].tuitionTotal = e.target.value;
                              setFeesYears(newFees);
                            }} 
                            type="number" className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" placeholder="e.g. 50000" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Exam Total</label>
                          <input 
                            value={fy.examTotal} 
                            onChange={e => {
                              const newFees = [...feesYears];
                              newFees[index].examTotal = e.target.value;
                              setFeesYears(newFees);
                            }} 
                            type="number" className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" placeholder="e.g. 2000" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Other Total</label>
                          <input 
                            value={fy.otherTotal} 
                            onChange={e => {
                              const newFees = [...feesYears];
                              newFees[index].otherTotal = e.target.value;
                              setFeesYears(newFees);
                            }} 
                            type="number" className="w-full mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" placeholder="e.g. 1500" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="bg-white border-t border-slate-100 p-6 flex justify-between items-center z-10 sticky bottom-0">
          <button 
            onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/dashboard/students')}
            className="px-6 py-3 font-bold text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          
          <button 
            onClick={handleNext}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             step === stepLabels.length - 1 ? <Save className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            {step === stepLabels.length - 1 ? "Complete Enrollment" : "Next Step"}
          </button>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, User, Mail, Phone, MapPin, Building2, Briefcase, Loader2, Calendar, FileText, Save, FileCheck2, Calculator, BarChart, Download, CreditCard, Receipt } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import IdCardModal, { IdCardFront } from "@/components/IdCardModal";
import { useSocket } from "@/components/SocketProvider";

export default function StudentDetailScreen() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Personal");
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
  
  const [studentData, setStudentData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then(res => res.json()),
      fetch("/api/courses").then(res => res.json()),
      fetch(`/api/students/${studentId}`).then(res => res.json())
    ]).then(([branchesData, coursesData, student]) => {
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      if (student && !student.error) {
        setStudentData(student);
        setEditStatus(student.studentStatus || student.status || "Active");
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [studentId]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleStudentUpdated = (payload: any) => {
      if (payload.studentId === studentId && payload.data) {
        console.log("Real-time update received:", payload);
        setStudentData(payload.data);
        if (payload.data.studentStatus || payload.data.status) {
           setEditStatus(payload.data.studentStatus || payload.data.status || "Active");
        }
      }
    };
    
    socket.on('student_updated', handleStudentUpdated);
    
    return () => {
      socket.off('student_updated', handleStudentUpdated);
    };
  }, [socket, studentId]);

  const handleUpdateStatus = async () => {
    if (!studentData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentStatus: editStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setStudentData(updated);
        alert("Status updated successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F6] flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8F6F6]">
        <h2 className="text-xl font-bold">Student not found.</h2>
        <Link href="/office/students"><button className="mt-4 text-indigo-500 font-bold">Go Back</button></Link>
      </div>
    );
  }

  const selectedCourse = courses.find(c => c._id === (typeof studentData.selectedProgram === 'object' ? studentData.selectedProgram?._id : studentData.selectedProgram));
  const selectedBranch = branches.find(b => b._id === (typeof studentData.selectedBranch === 'object' ? studentData.selectedBranch?._id : studentData.selectedBranch));

  const tabs = ["Personal", "Academics", "Fees", "Documents", "Administration"];

  // Helper for rendering grids
  const InfoGrid = ({ title, data }: { title?: string, data: {label: string, value: string}[] }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8 overflow-hidden">
      {title && <h3 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-50 pb-4">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {data.map(item => (
          <div key={item.label}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
            <p className="text-sm font-bold text-slate-800">{item.value || "N/A"}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F6F6] flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* LEFT PROFILE SIDEBAR */}
      <div className="w-full md:w-[320px] bg-[#1E1E2D] flex flex-col z-10 sticky top-0 md:h-screen shadow-2xl overflow-y-auto">
        <div className="p-8">
          <Link href="/office/students">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xs transition-colors mb-10 w-fit">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </Link>

          <div className="flex flex-col items-center justify-center w-full transform scale-90 origin-top">
            <IdCardFront
              photoUrl={studentData.profilePhoto || studentData.documents?.studentPhoto || "/placeholder-avatar.jpg"}
              fullName={`${studentData.firstName || ''} ${studentData.lastName || ''}`.trim()}
              department={selectedCourse?.name || selectedBranch?.name || "N/A"}
              designation="Student"
              mobile={studentData.mobile || studentData.phone || "N/A"}
              email={studentData.email || "N/A"}
              address={[studentData.address, studentData.city, studentData.state].filter(Boolean).join(', ') || "N/A"}
            />
          </div>
        </div>

        <div className="px-8 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-xs text-white/50 font-medium">Current CGPA</span>
            <span className="text-sm font-black text-green-400">{studentData.cgpa || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-xs text-white/50 font-medium">Attendance</span>
            <span className="text-sm font-black text-blue-400">{studentData.attendance || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-xs text-white/50 font-medium">Section</span>
            <span className="text-sm font-black text-orange-400">{studentData.selectedSection || "Section A"}</span>
          </div>
          
          <div className="pt-4 flex flex-col gap-3">
            <Link href={`/office/students/${studentId}/edit`}>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex justify-center items-center gap-2 rounded-xl transition-all">
                <User className="w-4 h-4" /> Edit Profile
              </button>
            </Link>
            <button onClick={() => setIsIdModalOpen(true)} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex justify-center items-center gap-2 rounded-xl transition-all">
              <Download className="w-4 h-4" /> Print ID Card
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* TAB BAR */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex gap-6 overflow-x-auto sticky top-0 z-10 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 font-black text-sm transition-all border-b-2 ${
                activeTab === tab 
                ? "border-rose-500 text-rose-500" 
                : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            
            {/* PERSONAL TAB */}
            {activeTab === "Personal" && (
              <motion.div key="Personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                <InfoGrid data={[
                  {label: "FULL NAME", value: `${studentData.firstName || ''} ${studentData.lastName || ''}`},
                  {label: "DATE OF BIRTH", value: studentData.dob},
                  {label: "GENDER", value: studentData.gender},
                  {label: "CATEGORY", value: studentData.category || "General"},
                  {label: "ADMISSION NO", value: studentData.admissionNumber},
                  {label: "STUDENT ID", value: studentData.studentId},
                ]} />

                <InfoGrid data={[
                  {label: "EMAIL ADDRESS", value: studentData.email},
                  {label: "PHONE NUMBER", value: studentData.phone || studentData.mobile},
                  {label: "ALT NUMBER", value: studentData.alternateMobile},
                  {label: "CITY", value: studentData.city},
                  {label: "STATE", value: studentData.state},
                  {label: "PIN CODE", value: studentData.pinCode},
                ]} />

                <InfoGrid data={[
                  {label: "FULL ADDRESS", value: studentData.address},
                ]} />
              </motion.div>
            )}

            {/* ACADEMICS TAB */}
            {activeTab === "Academics" && (
              <motion.div key="Academics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                <InfoGrid title="Current Program Details" data={[
                  {label: "BRANCH", value: selectedBranch?.name},
                  {label: "COURSE", value: selectedCourse?.name},
                  {label: "SESSION", value: studentData.sessionYear},
                  {label: "SEMESTER", value: studentData.selectedSemester?.toString()},
                  {label: "SECTION", value: studentData.selectedSection},
                ]} />

                <InfoGrid title="Previous Qualifications" data={[
                  {label: "HIGHEST LEVEL", value: studentData.highestQualification},
                  {label: "BOARD/UNIVERSITY", value: studentData.boardUniversity},
                  {label: "INSTITUTION", value: studentData.institutionName},
                  {label: "PERCENTAGE/CGPA", value: studentData.percentageCGPA?.toString()},
                  {label: "YEAR OF PASSING", value: studentData.yearOfPassing?.toString()},
                ]} />

                <InfoGrid title="Subject Entrance Scores" data={[
                  {label: "SUBJECT 1", value: studentData.subjectMarks?.subject1},
                  {label: "SUBJECT 2", value: studentData.subjectMarks?.subject2},
                  {label: "SUBJECT 3", value: studentData.subjectMarks?.subject3},
                  {label: "ENTRANCE SCORE", value: studentData.entranceScore},
                ]} />

                <InfoGrid title="Statement of Purpose" data={[
                  {label: "SOP SUMMARY", value: studentData.statementOfPurpose || "No statement provided."},
                ]} />
              </motion.div>
            )}

            {/* FEES TAB */}
            {activeTab === "Fees" && (
              <motion.div key="Fees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6">
                {(!studentData.fees || !studentData.fees.isConfigured) ? (
                  <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <Receipt className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-black text-slate-800">Fees Not Configured</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm">
                      Fees are not updated by admin. Please contact the office to configure the fee structure for this student.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                      {studentData.fees.years?.map((fy: any) => (
                        <div key={fy.year} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                          <h4 className="text-lg font-black text-slate-800 mb-4 border-b border-slate-50 pb-2">Year {fy.year}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { title: "Tuition Fee", total: fy.tuition?.total || 0, paid: fy.tuition?.paid || 0, color: "bg-blue-500", icon: Calculator },
                              { title: "Exam Fee", total: fy.exam?.total || 0, paid: fy.exam?.paid || 0, color: "bg-purple-500", icon: FileText },
                              { title: "Other Charges", total: fy.other?.total || 0, paid: fy.other?.paid || 0, color: "bg-orange-500", icon: Receipt },
                            ].map(fee => (
                              <div key={fee.title} className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl ${fee.color} bg-opacity-10 flex items-center justify-center`}>
                                    <fee.icon className={`w-5 h-5 ${fee.color.replace('bg-', 'text-')}`} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-slate-800">{fee.title}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paid: ₹{fee.paid}</p>
                                  </div>
                                </div>
                                <div className="text-sm font-black text-slate-900">₹{fee.total}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 bg-gradient-to-r from-[#6B0F3A] to-rose-600 rounded-[2rem] p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6 justify-between">
                      <div className="flex items-center gap-6">
                        <CreditCard className="w-12 h-12 opacity-80" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Assigned (All Years)</p>
                          <p className="text-4xl font-black mt-1">
                            ₹{studentData.fees.years?.reduce((sum: number, fy: any) => sum + (fy.tuition?.total || 0) + (fy.exam?.total || 0) + (fy.other?.total || 0), 0) || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Paid (All Years)</p>
                          <p className="text-2xl font-black mt-1 text-emerald-300">
                            ₹{studentData.fees.years?.reduce((sum: number, fy: any) => sum + (fy.tuition?.paid || 0) + (fy.exam?.paid || 0) + (fy.other?.paid || 0), 0) || 0}
                          </p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === "Documents" && (
              <motion.div key="Documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                
                <div className="bg-gradient-to-br from-[#1B3E5F] to-[#2E6B9E] rounded-[2rem] p-8 text-white shadow-xl flex items-center mb-8">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mr-6">
                    <FileCheck2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">Document Status</h3>
                    <p className="text-xs font-bold text-white/70 mt-1 uppercase tracking-widest">
                      Documents uploaded via student portal
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    {key: 'studentPhoto', label: 'Student Photo', icon: User},
                    {key: 'marksheet10', label: '10th Marksheet', icon: FileText},
                    {key: 'marksheet12', label: '12th Marksheet', icon: FileText},
                    {key: 'aadharCard', label: 'Aadhar Card', icon: Briefcase},
                    {key: 'transferCertificate', label: 'Transfer Certificate', icon: FileCheck2},
                    {key: 'casteCertificate', label: 'Caste Certificate', icon: FileText},
                  ].map(doc => {
                    const hasDoc = studentData.documents?.[doc.key];
                    return (
                      <div 
                        key={doc.key} 
                        onClick={() => hasDoc && window.open(hasDoc, '_blank')}
                        className={`p-6 rounded-[2rem] border-2 text-center transition-all ${
                          hasDoc ? 'bg-emerald-50 border-emerald-500 cursor-pointer hover:bg-emerald-100 hover:shadow-md' : 'bg-white border-slate-100'
                        }`}
                      >
                        <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                          hasDoc ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          <doc.icon className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 mb-1">{doc.label}</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${hasDoc ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {hasDoc ? 'Uploaded' : 'Pending'}
                        </p>
                      </div>
                    );
                  })}
                </div>

              </motion.div>
            )}

            {/* PERFORMANCE TAB */}
            {activeTab === "Performance" && (
              <motion.div key="Performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto text-center py-20">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Performance Metrics</h3>
                <p className="text-sm font-medium text-slate-500 mt-2 max-w-md mx-auto">
                  Grades, attendance charts, and semester-wise performance insights will be displayed here once academic records are integrated.
                </p>
              </motion.div>
            )}

            {/* ADMINISTRATION TAB */}
            {activeTab === "Administration" && (
              <motion.div key="Administration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-xl mx-auto">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-slate-900 border-b border-slate-50 pb-4">Enrollment Status</h3>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Modify Status</label>
                    <select 
                      value={editStatus} 
                      onChange={e => setEditStatus(e.target.value)} 
                      className="w-full mt-2 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-sm appearance-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Graduated">Graduated</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleUpdateStatus}
                    disabled={isSaving || editStatus === (studentData.studentStatus || studentData.status)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Update Status
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <IdCardModal
        isOpen={isIdModalOpen}
        onClose={() => setIsIdModalOpen(false)}
        studentData={studentData}
        branchName={selectedBranch?.name}
        courseName={selectedCourse?.name}
      />
    </div>
  );
}

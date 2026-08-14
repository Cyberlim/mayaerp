"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  User, 
  Lock, 
  Phone, 
  AtSign, 
  Calendar,
  Camera,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Activity,
  GraduationCap,
  FileText,
  Upload,
  School,
  Building,
  Percent,
  CalendarDays,
  Book,
  ClipboardList,
  Library,
  Briefcase,
  MapPin,
  Map
} from "lucide-react";

const steps = [
  { id: 1, title: "Personal Details", desc: "Enter the applicant's personal information", icon: User },
  { id: 2, title: "Academic Info", desc: "Previous education & qualification scores", icon: GraduationCap },
  { id: 3, title: "Program Selection", desc: "Choose the course and intake session", icon: Library },
  { id: 4, title: "Documents", desc: "Attach all required scanned documents (PDF/JPG)", icon: Upload },
];

export default function StandaloneNewApplication() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [applicantPhoto, setApplicantPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Document states
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});

  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then(res => res.json()),
      fetch("/api/courses").then(res => res.json())
    ]).then(([branchesData, coursesData]) => {
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    }).catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male",
    email: "",
    mobile: "",
    alternateMobile: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    highestQualification: "XII / HSC",
    institutionName: "",
    boardUniversity: "",
    percentageCGPA: "",
    yearOfPassing: "",
    subject1: "",
    subject2: "",
    subject3: "",
    entranceScore: "",
    selectedBranch: "",
    selectedProgram: "",
    batch: "",
    semester: "",
    year: "",
    sessionYear: "2024-2025",
    category: "General",
    statementOfPurpose: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        applicantPhoto,
        subjectMarks: {
          subject1: formData.subject1,
          subject2: formData.subject2,
          subject3: formData.subject3,
        },
        documents,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");

      router.push("/dashboard/admissions");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "Portfolio");
    data.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dtaruu90e");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dtaruu90e"}/image/upload`,
      { method: "POST", body: data }
    );
    if (!res.ok) throw new Error("Upload failed");
    return await res.json();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      setApplicantPhoto(uploaded.secure_url);
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocs((prev) => ({ ...prev, [docKey]: true }));
    try {
      const uploaded = await uploadToCloudinary(file);
      setDocuments((prev) => ({ ...prev, [docKey]: uploaded.secure_url }));
    } catch (err) {
      alert(`Failed to upload ${docKey}.`);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      
      {/* CUSTOM RED SIDEBAR */}
      <div className="hidden lg:flex w-[320px] bg-gradient-to-br from-[#c9264c] to-[#f64c67] relative overflow-hidden flex-col items-center py-10 shadow-[20px_0_40px_rgba(201,38,76,0.15)] z-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-10 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/2"></div>
        
        <div className="w-full px-6 flex justify-start z-10 relative mb-12">
          <button 
            onClick={() => router.push("/dashboard/admissions")}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="z-10 flex flex-col items-center mb-12">
          <div className="relative group cursor-pointer mb-4">
            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handlePhotoUpload} />
            <div className="w-28 h-28 rounded-full border-2 border-white/40 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden relative">
              {isUploadingPhoto ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : applicantPhoto ? <img src={applicantPhoto} alt="Applicant" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-white/80" />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-[#f64c67] z-30">
              <Camera className="w-4 h-4 text-[#c9264c]" />
            </div>
          </div>
          <h3 className="text-white font-bold text-lg">Applicant Photo</h3>
          <p className="text-white/60 text-xs font-semibold mt-1">Tap to upload • Max 5MB</p>
        </div>

        <div className="w-full flex-1 z-10">
          <div className="flex flex-col">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              
              return (
                <div key={step.id} className="relative px-8 py-5 flex items-center gap-6 cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                  {isActive && <motion.div layoutId="sidebarActiveBg" className="absolute inset-y-0 right-0 left-0 bg-white/10 border-r-4 border-white" />}
                  <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                    isActive ? "bg-white text-[#c9264c] shadow-[0_0_20px_rgba(255,255,255,0.4)]" : isPast ? "bg-white/30 text-white border border-white/50" : "border-2 border-white/20 text-white/50"
                  }`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5 text-white" /> : step.id}
                  </div>
                  <span className={`relative z-10 text-sm transition-colors ${isActive ? "font-bold text-white text-[15px]" : isPast ? "font-semibold text-white/80" : "font-medium text-white/50"}`}>
                    {step.title}
                  </span>
                  {step.id !== 4 && <div className="absolute left-[3.15rem] top-12 bottom-[-1rem] w-px bg-white/20 z-0"></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full px-8 pb-4 z-10 flex flex-col gap-4 mt-auto">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-white/80" /></div><span className="text-xs text-white/80 font-bold">Secure Data</span></div>
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-4 h-4 text-white/80" /></div><span className="text-xs text-white/80 font-bold">Auto Alerts</span></div>
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Activity className="w-4 h-4 text-white/80" /></div><span className="text-xs text-white/80 font-bold">Real-time Tracking</span></div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col bg-[#F9FAFB] relative h-screen overflow-hidden">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden bg-[#c9264c] p-4 flex items-center gap-4 text-white">
          <button onClick={() => router.push("/dashboard/admissions")}><ChevronLeft className="w-6 h-6" /></button>
          <span className="font-bold text-lg">New Application</span>
        </div>

        {/* Top Header Row */}
        <div className="bg-white px-6 lg:px-10 py-6 flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 z-10 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight hidden lg:block">New Application</h1>
            <p className="text-slate-400 font-medium text-sm mt-1">Step {currentStep}: {steps[currentStep-1].title}</p>
          </div>
          
          <div className="w-full lg:w-48">
            <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
              <span className="text-rose-600">{progressPercentage}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-600 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Form Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-10 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl"
            >
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
                  {currentStep === 1 && <User className="w-6 h-6" />}
                  {currentStep === 2 && <GraduationCap className="w-6 h-6" />}
                  {currentStep === 3 && <Library className="w-6 h-6" />}
                  {currentStep === 4 && <Upload className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{steps[currentStep-1].title}</h2>
                  <p className="text-slate-500 text-sm font-medium">{steps[currentStep-1].desc}</p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {currentStep === 1 && (
                  <>
                    <InputGroup icon={<User />} label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                    <InputGroup icon={<User />} label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                    <InputGroup icon={<Calendar />} label="Date of Birth" name="dob" type="date" placeholder="DD/MM/YYYY" value={formData.dob} onChange={handleChange} />
                    
                    <DropdownGroup icon={<User />} label="Gender" name="gender" options={["Male", "Female", "Other"]} value={formData.gender} onChange={handleChange} />

                    <div className="md:col-span-2">
                      <InputGroup icon={<AtSign />} label="Email Address" name="email" type="email" placeholder="applicant@example.com" value={formData.email} onChange={handleChange} />
                    </div>

                    <InputGroup icon={<Lock />} label="Password" name="password" placeholder="Default is DOB" disabled />
                    <InputGroup icon={<Lock />} label="Confirm Password" name="passwordConfirm" placeholder="Same as password" disabled />

                    <InputGroup icon={<Phone />} label="Mobile Number" name="mobile" placeholder="+91 9999 999 999" value={formData.mobile} onChange={handleChange} />
                    <InputGroup icon={<Phone />} label="Alternate Mobile" name="alternateMobile" placeholder="Optional" value={formData.alternateMobile} onChange={handleChange} />

                    <div className="md:col-span-2">
                      <InputGroup icon={<MapPin />} label="Full Address" name="address" placeholder="Street, Area" value={formData.address} onChange={handleChange} />
                    </div>

                    <InputGroup icon={<Building />} label="City" name="city" value={formData.city} onChange={handleChange} />
                    <InputGroup icon={<Map />} label="State" name="state" value={formData.state} onChange={handleChange} />
                    <InputGroup icon={<MapPin />} label="PIN Code" name="pinCode" placeholder="6-digit" value={formData.pinCode} onChange={handleChange} />
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <DropdownGroup icon={<School />} label="Highest Qualification" name="highestQualification" options={['XII / HSC', 'Diploma', 'BSc', 'BCom', 'BA', 'BE/BTech', 'Other']} value={formData.highestQualification} onChange={handleChange} />
                    
                    <div className="hidden md:block"></div>

                    <InputGroup icon={<Building />} label="Institution Name" name="institutionName" placeholder="Previous school/college" value={formData.institutionName} onChange={handleChange} />
                    <InputGroup icon={<School />} label="Board / University" name="boardUniversity" value={formData.boardUniversity} onChange={handleChange} />
                    <InputGroup icon={<Percent />} label="Percentage / CGPA" name="percentageCGPA" placeholder="e.g. 92.4 or 8.5" value={formData.percentageCGPA} onChange={handleChange} />
                    <InputGroup icon={<CalendarDays />} label="Year of Passing" name="yearOfPassing" placeholder="e.g. 2023" value={formData.yearOfPassing} onChange={handleChange} />
                    
                    <InputGroup icon={<Book />} label="Subject 1 Marks" name="subject1" value={formData.subject1} onChange={handleChange} />
                    <InputGroup icon={<Book />} label="Subject 2 Marks" name="subject2" value={formData.subject2} onChange={handleChange} />
                    <InputGroup icon={<Book />} label="Subject 3 Marks" name="subject3" value={formData.subject3} onChange={handleChange} />
                    <InputGroup icon={<ClipboardList />} label="Entrance Exam Score (if any)" name="entranceScore" placeholder="e.g. JEE Main 85 percentile" value={formData.entranceScore} onChange={handleChange} />
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <DropdownGroup icon={<Briefcase />} label="Select Branch" name="selectedBranch" options={branches.map(b => ({ label: b.name, value: b._id }))} value={formData.selectedBranch} onChange={handleChange} />
                    <DropdownGroup icon={<School />} label="Select Course" name="selectedProgram" options={courses.filter(c => !formData.selectedBranch || c.branchId === formData.selectedBranch || c.branchId?._id === formData.selectedBranch).map(c => ({ label: c.name, value: c._id }))} value={formData.selectedProgram} onChange={handleChange} />
                    
                    <InputGroup icon={<CalendarDays />} label="Batch" name="batch" placeholder="e.g. 2024-2028" value={formData.batch} onChange={handleChange} />
                    <InputGroup icon={<Book />} label="Semester" name="semester" placeholder="e.g. 1" value={formData.semester} onChange={handleChange} />
                    <InputGroup icon={<Calendar />} label="Year" name="year" placeholder="e.g. 1st Year" value={formData.year} onChange={handleChange} />
                    <InputGroup icon={<Calendar />} label="Session Year" name="sessionYear" placeholder="e.g. 2024-2025" value={formData.sessionYear} onChange={handleChange} />
                    
                    <DropdownGroup icon={<User />} label="Category" name="category" options={["General", "OBC", "SC/ST", "Management Quota"]} value={formData.category} onChange={handleChange} />

                    <div className="md:col-span-2 mt-4">
                      <InputGroup icon={<FileText />} label="Statement of Purpose (Why this program?)" name="statementOfPurpose" placeholder="Brief statement..." value={formData.statementOfPurpose} onChange={handleChange} />
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <DocUploadCard label="10th Marksheet" docKey="marksheet10" icon={<FileText />} color="#4F46E5" uploading={uploadingDocs["marksheet10"]} uploadedUrl={documents["marksheet10"]} onChange={(e: any) => handleDocumentUpload(e, "marksheet10")} />
                      <DocUploadCard label="12th Marksheet" docKey="marksheet12" icon={<FileText />} color="#0891B2" uploading={uploadingDocs["marksheet12"]} uploadedUrl={documents["marksheet12"]} onChange={(e: any) => handleDocumentUpload(e, "marksheet12")} />
                      <DocUploadCard label="Transfer Certificate" docKey="transferCertificate" icon={<FileText />} color="#7C3AED" uploading={uploadingDocs["transferCertificate"]} uploadedUrl={documents["transferCertificate"]} onChange={(e: any) => handleDocumentUpload(e, "transferCertificate")} />
                      <DocUploadCard label="Aadhar Card" docKey="aadharCard" icon={<FileText />} color="#e11d48" uploading={uploadingDocs["aadharCard"]} uploadedUrl={documents["aadharCard"]} onChange={(e: any) => handleDocumentUpload(e, "aadharCard")} />
                      <DocUploadCard label="Entrance Score Card" docKey="entranceScoreCard" icon={<FileText />} color="#D97706" uploading={uploadingDocs["entranceScoreCard"]} uploadedUrl={documents["entranceScoreCard"]} onChange={(e: any) => handleDocumentUpload(e, "entranceScoreCard")} />
                    </div>
                    <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-amber-800 text-sm font-semibold leading-relaxed">
                        All documents must be clearly scanned. Files should be below 2MB each in PDF or JPG format.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Bottom Bar Actions */}
        <div className="bg-white px-6 lg:px-10 py-5 border-t border-slate-200 z-10 flex justify-between items-center">
          {currentStep > 1 ? (
            <button 
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
          ) : <div></div>}
          
          <div className="flex items-center gap-4">
            {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
            {currentStep < 4 ? (
              <button 
                onClick={handleNext}
                className="px-10 py-3.5 bg-[#ce2a4f] text-white font-bold rounded-xl shadow-[0_10px_20px_rgba(206,42,79,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(206,42,79,0.4)] transition-all"
              >
                Next Step
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-10 py-3.5 bg-[#ce2a4f] text-white font-bold rounded-xl shadow-[0_10px_20px_rgba(206,42,79,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(206,42,79,0.4)] transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Submit Application
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Input
function InputGroup({ icon, label, name, type = "text", placeholder = "", value = "", onChange = null, disabled = false }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-[#1B365D] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {icon && <span className="text-[#ce2a4f] [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        </div>
        <input 
          type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-semibold outline-none transition-all text-slate-700 shadow-sm disabled:bg-slate-50 disabled:text-slate-400 placeholder-slate-300" 
        />
      </div>
    </div>
  );
}

// Reusable Dropdown
function DropdownGroup({ icon, label, name, options, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-[#1B365D] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {icon && <span className="text-[#ce2a4f] [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        </div>
        <select 
          name={name} value={value} onChange={onChange}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-semibold outline-none transition-all text-slate-700 shadow-sm appearance-none"
        >
          <option value="">Select...</option>
          {options.map((opt: any) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return <option key={optVal} value={optVal}>{optLabel}</option>
          })}
        </select>
      </div>
    </div>
  );
}

// Reusable Document Upload Card mimicking the Dart GridView item
function DocUploadCard({ label, docKey, icon, color, uploading, uploadedUrl, onChange }: any) {
  const hasDoc = !!uploadedUrl;
  
  return (
    <label className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${hasDoc ? "border-emerald-500 bg-white" : "border-slate-200 bg-white hover:border-slate-300"}`}>
      <input type="file" accept="image/*,.pdf" className="absolute opacity-0 w-0 h-0" onChange={onChange} />
      
      {uploading ? (
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: hasDoc ? "#10b98120" : `${color}15`, color: hasDoc ? "#10b981" : color }}>
          {hasDoc ? <CheckCircle2 className="w-6 h-6" /> : icon}
        </div>
      )}
      
      <h3 className="font-bold text-sm text-center text-slate-800 mb-2 leading-tight h-8">{label}</h3>
      <div className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: hasDoc ? "#10b98115" : `${color}10`, color: hasDoc ? "#10b981" : color }}>
        {hasDoc ? "Uploaded" : "Tap to Upload"}
      </div>
    </label>
  );
}

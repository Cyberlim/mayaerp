"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, 
  ChevronLeft, 
  QrCode, 
  School, 
  Timer, 
  Users, 
  Calculator,
  User,
  Microscope,
  Loader2,
  Edit3
} from "lucide-react";

export default function EditCourse() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [branch, setBranch] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    duration: "",
    intakeCapacity: "",
    totalSemesters: "",
    tuitionFee: "",
    coordinator: "",
    labIndex: "",
  });

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          code: data.code || "",
          name: data.name || "",
          duration: data.duration?.toString() || "",
          intakeCapacity: data.intakeCapacity?.toString() || "",
          totalSemesters: data.totalSemesters?.toString() || "",
          tuitionFee: data.tuitionFee?.toString() || "",
          coordinator: data.coordinator || "",
          labIndex: data.labIndex || "",
        });
        
        // Fetch branch data for styling
        if (data.branchId) {
          const bId = typeof data.branchId === 'object' ? data.branchId._id : data.branchId;
          fetch(`/api/branches/${bId}`)
            .then(bRes => bRes.json())
            .then(bData => setBranch(bData))
            .catch(err => console.error(err));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [courseId]);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const payload = {
        ...formData,
        duration: parseInt(formData.duration) || 4,
        intakeCapacity: parseInt(formData.intakeCapacity) || 60,
        tuitionFee: parseInt(formData.tuitionFee) || 0,
        totalSemesters: parseInt(formData.totalSemesters) || 8,
      };

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update course");

      router.push(`/dashboard/academics/courses/${courseId}`);
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  if (isLoading || !branch) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex relative font-sans text-slate-900">
      
      {/* Left Sidebar Guide */}
      <div className="hidden lg:flex w-[450px] bg-gradient-to-br from-[#F8F6F6] to-white border-r border-slate-100 p-16 flex-col overflow-y-auto">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors self-start mb-16">
          <ChevronLeft className="w-5 h-5 text-slate-600 pr-0.5" />
        </button>

        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-10" style={{ backgroundColor: branch.colorHex ? branch.colorHex + '20' : '#4F46E520' }}>
          <Edit3 className="w-10 h-10" style={{ color: branch.colorHex || '#4F46E5' }} />
        </div>

        <h1 className="text-4xl font-black tracking-tighter leading-tight mb-6">
          EDIT COURSE<br />SCHEME
        </h1>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-16">
          Update the settings for {formData.name}. Changes to tuition fee will not affect the currently enrolled students.
        </p>

        <div className="space-y-10">
          <GuideStep num="01" title="Academic ID" sub="Provision unique identification parameters." color={branch.colorHex} />
          <GuideStep num="02" title="Billing Cycle" sub="Determine total semesters for installment splitting." color={branch.colorHex} />
          <GuideStep num="03" title="Nodes & Coordination" sub="Assign institutional faculty waypoints." color={branch.colorHex} />
        </div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-8 lg:p-20">
          
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Section 1 */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-8">Section 1: General Curricular Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Course Code (e.g., CS-101)" name="code" icon={<QrCode />} value={formData.code} onChange={handleChange} required />
                <InputField label="Full Course Nomenclature" name="name" icon={<School />} value={formData.name} onChange={handleChange} required />
                <InputField label="Duration (Years)" name="duration" type="number" icon={<Timer />} value={formData.duration} onChange={handleChange} required />
                <InputField label="Intake Capacity" name="intakeCapacity" type="number" icon={<Users />} value={formData.intakeCapacity} onChange={handleChange} required />
              </div>
            </motion.div>

            {/* Section 2 */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-8">Section 2: Automated Billing Lifecycle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                <InputField label="Total Semesters" name="totalSemesters" type="number" icon={<Calculator />} value={formData.totalSemesters} onChange={handleChange} required />
                <InputField label="Total Program Fee (₹)" name="tuitionFee" type="number" icon={<Calculator />} value={formData.tuitionFee} onChange={handleChange} required />
              </div>
            </motion.div>

            {/* Section 3 */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-8">Section 3: Accreditation & Node Coordination</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Primary Course Coordinator" name="coordinator" icon={<User />} value={formData.coordinator} onChange={handleChange} required />
                <InputField label="Lab Allocation Index (Optional)" name="labIndex" icon={<Microscope />} value={formData.labIndex} onChange={handleChange} />
              </div>
            </motion.div>

            {error && <p className="text-rose-500 font-bold">{error}</p>}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-8">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black tracking-widest uppercase hover:bg-slate-800 transition-colors flex justify-center items-center gap-3 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "SAVE CHANGES"}
              </button>
            </motion.div>

          </form>
        </div>
      </div>
    </div>
  );
}

function GuideStep({ num, title, sub, color }: any) {
  return (
    <div className="flex gap-6">
      <span className="font-black text-xl" style={{ color: color ? color + '50' : '#00000030' }}>{num}</span>
      <div>
        <h4 className="font-bold text-slate-900 text-base">{title}</h4>
        <p className="text-slate-500 text-sm mt-1">{sub}</p>
      </div>
    </div>
  );
}

function InputField({ label, name, type = "text", icon, value, onChange, required }: any) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <span className="text-slate-400 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      </div>
      <input 
        type={type} name={name} placeholder={label} value={value} onChange={onChange} required={required}
        className="w-full pl-14 pr-6 py-5 bg-[#F8F6F6] border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-medium text-slate-800" 
      />
    </div>
  );
}

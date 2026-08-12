"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, 
  ChevronLeft, 
  QrCode, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Loader2
} from "lucide-react";

export default function CreateBranch() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    deanName: "",
    contactEmail: "",
    contactExt: "",
    location: "",
    establishedYear: "",
    iconName: "business_center_rounded",
    colorHex: "#4F46E5",
  });

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create branch");

      router.push("/dashboard/academics");
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative font-sans text-slate-900">
      
      {/* Left Sidebar Guide (Hidden on mobile) */}
      <div className="hidden lg:flex w-[450px] bg-gradient-to-br from-[#F8F6F6] to-white border-r border-slate-100 p-16 flex-col">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors self-start mb-16">
          <ChevronLeft className="w-5 h-5 text-slate-600 pr-0.5" />
        </button>

        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-10">
          <Building2 className="w-10 h-10 text-rose-600" />
        </div>

        <h1 className="text-4xl font-black tracking-tighter leading-tight mb-6">
          ESTABLISH NEW<br />BRANCH
        </h1>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-16">
          Provide structural details to create a new institutional branch. This will serve as the parent node for upcoming departments and courses.
        </p>

        <div className="space-y-10">
          <GuideStep num="01" title="Branch Identity" sub="Define the unique code and official name." />
          <GuideStep num="02" title="Dean Allocation" sub="Assign a primary administrator for this branch." />
          <GuideStep num="03" title="Operational Capacity" sub="Specify initial course and student limits." />
        </div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-8 lg:p-20">
          
          {/* Mobile Header */}
          <div className="lg:hidden mb-10 flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black">New Branch</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Section 1 */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-8">Section 1: Identity & Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Branch Code (e.g., SOE)" name="code" icon={<QrCode />} value={formData.code} onChange={handleChange} required />
                <InputField label="Official Branch Name" name="name" icon={<Building2 />} value={formData.name} onChange={handleChange} required />
              </div>
            </motion.div>

            {/* Section 2 */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-8">Section 2: Leadership & Coordination</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="md:col-span-2">
                  <InputField label="Primary Dean / HOD Name" name="deanName" icon={<User />} value={formData.deanName} onChange={handleChange} required />
                </div>
                <InputField label="Contact Email" name="contactEmail" type="email" icon={<Mail />} value={formData.contactEmail} onChange={handleChange} required />
                <InputField label="Contact Ext." name="contactExt" icon={<Phone />} value={formData.contactExt} onChange={handleChange} />
              </div>
            </motion.div>

            {/* Section 3 */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-8">Section 3: Establishment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Campus Location" name="location" icon={<MapPin />} value={formData.location} onChange={handleChange} required />
                <InputField label="Established Year" name="establishedYear" type="number" icon={<Calendar />} value={formData.establishedYear} onChange={handleChange} required />
              </div>
            </motion.div>

            {/* UI Settings */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-8">Section 4: Appearance (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 tracking-wider">Theme Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" name="colorHex" value={formData.colorHex} onChange={handleChange} className="w-14 h-14 rounded-xl cursor-pointer" />
                    <span className="text-sm font-bold text-slate-500">{formData.colorHex}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 tracking-wider">Icon Selection</label>
                  <select name="iconName" value={formData.iconName} onChange={handleChange} className="w-full p-4 bg-[#F8F6F6] rounded-2xl border-none font-bold text-slate-700 outline-none">
                    <option value="business_center_rounded">Default (Building)</option>
                    <option value="laptop">Laptop (Engineering)</option>
                    <option value="medical">Medical Briefcase</option>
                    <option value="scale">Justice Scale (Law)</option>
                    <option value="science">Graduation Cap</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {error && <p className="text-rose-500 font-bold">{error}</p>}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-8">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black tracking-widest uppercase hover:bg-slate-800 transition-colors flex justify-center items-center gap-3 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "PROVISION BRANCH"}
              </button>
            </motion.div>

          </form>
        </div>
      </div>
    </div>
  );
}

function GuideStep({ num, title, sub }: any) {
  return (
    <div className="flex gap-6">
      <span className="text-rose-600/30 font-black text-xl">{num}</span>
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
        className="w-full pl-14 pr-6 py-5 bg-[#F8F6F6] border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-base font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-medium text-slate-800" 
      />
    </div>
  );
}

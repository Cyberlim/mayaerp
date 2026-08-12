"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, User, Mail, Lock, Phone, MapPin, Building2, Briefcase, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    dob: "",
    role: "Faculty",
    department: "Academic",
    employeeId: "",
    status: "Active",
    profilePhoto: ""
  });

  const roles = ["Staff", "Faculty", "Accountant", "Librarian", "HOD", "Principal", "Office"];
  const departments = ["Academic", "Administration", "Finance", "Library", "HR", "IT Support"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg("User created successfully!");
        setTimeout(() => {
          router.push("/office/staff");
        }, 1500);
      } else {
        alert(data.error || "Failed to create user.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving user.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Gradient Panel (hidden on mobile) */}
      <div className="hidden lg:flex w-2/5 relative overflow-hidden bg-gradient-to-br from-[#880E4F] via-[#EC1349] to-[#FF4081]">
        {/* Decorative Circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 w-full p-12 flex flex-col justify-between">
          <div>
            <Link href="/office/staff">
              <button className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur-md border border-white/20">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
          </div>
          
          <div className="mt-20 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md mb-8 flex items-center justify-center overflow-hidden relative group">
              {formData.profilePhoto ? (
                <img src={formData.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white/50" />
              )}
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">New Member</h2>
            <p className="text-white/70 font-medium mt-2 max-w-xs">Fill in the required information to onboard a new staff or faculty member to the portal.</p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 lg:p-16">
          <div className="lg:hidden mb-8">
            <Link href="/office/staff">
              <button className="flex items-center justify-center w-10 h-10 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm border border-slate-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create User</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Personal & Institutional Details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                <User className="w-4 h-4 text-rose-500" /> Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">First Name</label>
                  <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="Maya" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Last Name</label>
                  <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} type="text" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="Doe" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email Address</label>
                  <div className="relative mt-1">
                    <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full bg-slate-50 border border-slate-100 py-4 pl-10 pr-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="maya@example.com" />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Password</label>
                  <div className="relative mt-1">
                    <input required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} type="password" className="w-full bg-slate-50 border border-slate-100 py-4 pl-10 pr-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="••••••••" />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Phone Number</label>
                  <div className="relative mt-1">
                    <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-100 py-4 pl-10 pr-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="+1 234 567 890" />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Date of Birth</label>
                  <input value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} type="date" className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Home Address</label>
                  <div className="relative mt-1">
                    <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-100 py-4 pl-10 pr-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="123 Academic Way" />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Profile Photo URL (Optional)</label>
                  <div className="relative mt-1">
                    <input value={formData.profilePhoto} onChange={e => setFormData({...formData, profilePhoto: e.target.value})} type="url" className="w-full bg-slate-50 border border-slate-100 py-4 pl-10 pr-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="https://example.com/avatar.jpg" />
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Building2 className="w-4 h-4 text-rose-500" /> Institutional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Role / Designation</label>
                  <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm appearance-none">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Department</label>
                  <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm appearance-none">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Employee ID</label>
                  <div className="relative mt-1">
                    <input required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-100 py-4 pl-10 pr-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" placeholder="EMP-2026-001" />
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Account Status</label>
                  <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm appearance-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black rounded-xl shadow-xl shadow-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Member Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

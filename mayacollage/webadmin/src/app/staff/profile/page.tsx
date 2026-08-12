"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Building, Briefcase, GraduationCap, Award, Shield, Loader2 } from "lucide-react";

export default function StaffProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/staff/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const res = await fetch("/api/staff/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePhoto: base64String }),
        });
        if (res.ok) {
           setProfile((prev: any) => ({...prev, profilePhoto: base64String}));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-7xl mx-auto">
        <p className="text-slate-500 font-medium">Profile data not available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Profile Card */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-white shadow-2xl border-4 border-slate-900 transition-all hover:shadow-3xl">
        <div 
          className="h-40 bg-contain bg-center bg-no-repeat bg-[#fbfbfb]"
          style={{ backgroundImage: "url('/maya-banner.png')" }}
        ></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-20 mb-6">
            <div className="relative w-40 h-40 rounded-full border-[6px] border-slate-900 bg-white overflow-hidden shadow-2xl transform transition-transform hover:scale-105 group">
              <img src={profile.profilePhoto || "https://ui-avatars.com/api/?name=Staff+Member&background=ecfdf5&color=10b981&bold=true"} alt="Profile" className="w-full h-full object-cover" />
              
              {/* Overlay for uploading */}
              <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <p className="text-xs font-black text-white uppercase tracking-widest text-center px-2">Update Photo</p>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-slate-900/30 transition-all hover:-translate-y-1 active:translate-y-0"
            >
              Edit Profile
            </button>
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-slate-500 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> {profile.designation}, {profile.department}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contact Details */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6">Contact Info</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                  <p className="font-bold text-slate-700">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</p>
                  <p className="font-bold text-slate-700">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Office Location</p>
                  <p className="font-bold text-slate-700">Block A</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Academic Details & Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</p>
                <p className="font-black text-slate-800">{profile.department}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joined Date</p>
                <p className="font-black text-slate-800">{new Date(profile.joinedDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" /> Subjects Handled
            </h3>
            <div className="space-y-4">
              {profile.subjects && profile.subjects.length > 0 ? profile.subjects.map((sub: string, idx: number) => (
                <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all gap-4">
                  <div>
                    <h4 className="font-black text-slate-800">{sub}</h4>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                    Assigned
                  </span>
                </div>
              )) : (
                <p className="text-slate-500 text-sm">No specific subjects assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

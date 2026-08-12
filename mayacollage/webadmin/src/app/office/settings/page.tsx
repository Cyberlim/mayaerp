"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Briefcase, Hash, ShieldCheck, Activity } from "lucide-react";

export default function OfficeSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans bg-[#f8f9fa] min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans bg-[#f8f9fa] min-h-screen">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans bg-[#f8f9fa] min-h-screen text-slate-800">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          View your office account details and configuration provided by the Administrator.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card (Left Column) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] text-center">
            <div className="w-32 h-32 bg-blue-50 rounded-full mx-auto mb-6 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-blue-500">
                  {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-sm font-medium text-slate-500 mb-6 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              {profile?.role} Account
            </p>

            <div className="flex items-center justify-center gap-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                profile?.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {profile?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Card (Right Column) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="text-base font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">
              Identity Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Employee ID</label>
                  <div className="text-sm font-bold text-slate-800">{profile?.employeeId || 'Not Assigned'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Email Address</label>
                  <div className="text-sm font-bold text-slate-800">{profile?.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Phone Number</label>
                  <div className="text-sm font-bold text-slate-800">{profile?.phone || 'Not Provided'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Department</label>
                  <div className="text-sm font-bold text-slate-800">{profile?.department || 'Administration'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Address</label>
                  <div className="text-sm font-bold text-slate-800 leading-relaxed max-w-sm">
                    {profile?.address || 'Not Provided'}
                  </div>
                </div>
              </div>

            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="text-blue-500 mt-0.5">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Administrative Control</h4>
                  <p className="text-xs text-blue-700/80 leading-relaxed">
                    This account was created and is managed by the system administrator. To update any personal information, email, or employee ID, please contact the IT or Admin department.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  Wallet,
  Users,
  GraduationCap,
  MessageSquare,
  Bus,
  BarChart3,
  LogOut,
  Briefcase,
  Calendar,
  HeadphonesIcon,
  CheckSquare,
  Mail,
  Settings,
  FileText,
  Beaker,
  User
} from "lucide-react";
import { motion } from "framer-motion";

export default function OfficeSidebar() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<{name: string, role: string, photo: string, employeeId?: string} | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && (data.firstName || data.name)) {
          const fullName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Office Staff';
          setUserProfile({
            name: fullName,
            role: data.role || 'Office',
            employeeId: data.employeeId || '',
            photo: data.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3B82F6&color=fff&bold=true`
          });
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('mayaerp_user');
      window.location.href = '/login?role=Office';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Simplified flat list to match the reference image exactly
  const navItems = [
    { href: "/office", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/office/admissions", icon: UserPlus, label: "Admission" },
    { href: "/office/students", icon: Users, label: "Student" },
    { href: "/office/attendance", icon: CheckSquare, label: "Attendance" },
    { href: "/office/finance", icon: Wallet, label: "Accounts (Fees)" },

    { href: "/office/timetable", icon: Calendar, label: "Timetable" },
    { href: "/office/lab", icon: Beaker, label: "Lab Details" },
    { href: "/office/exams", icon: FileText, label: "Exams" },
    { href: "/office/notices", icon: MessageSquare, label: "Message" },
    { href: "/office/reports", icon: BarChart3, label: "Reports" },
    { href: "/office/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="w-[300px] h-screen bg-white border-r border-slate-100 flex flex-col sticky top-0 font-sans">
      
      {/* Logo Area */}
      <div className="h-20 px-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
          M
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">Maya Office</h1>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon as any;

          return (
            <Link key={item.href} href={item.href as string}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-slate-400"} />
                <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Upgrade Banner & Help Section */}
      <div className="px-4 pb-6 mt-auto flex flex-col gap-4">


        {/* User Profile Card */}
        <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <img 
            src={userProfile?.photo || "https://ui-avatars.com/api/?name=Office+Staff&background=3B82F6&color=fff&bold=true"} 
            alt="Profile" 
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-slate-800 truncate">
              {userProfile?.name || "Office In-Charge"}
            </h5>
            <p className="text-[10px] font-semibold text-blue-600 truncate">
              {userProfile?.role || "Office"} {userProfile?.employeeId ? `• ${userProfile.employeeId}` : ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors"
        >
          <LogOut size={14} strokeWidth={2.5} />
          Sign Out
        </button>
      </div>

    </aside>
  );
}

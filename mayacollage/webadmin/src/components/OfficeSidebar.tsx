"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Beaker
} from "lucide-react";
import { motion } from "framer-motion";

export default function OfficeSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
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


        {/* Need Help */}
        <div className="flex items-start gap-3 p-2 group cursor-pointer">
          <HeadphonesIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Need Help?</h5>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Visit our help center or contact support.</p>
          </div>
        </div>

        {/* Logout (Small at bottom) */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-rose-500 hover:text-rose-600 text-xs font-bold mt-2 pl-2"
        >
          <LogOut size={14} strokeWidth={2.5} />
          Sign Out
        </button>
      </div>

    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users,
  UserCheck,
  CalendarDays,
  BellRing,
  ShieldAlert,
  User,
  LogOut,
  GraduationCap,
  FileText
} from "lucide-react";

export default function StaffSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login?role=Staff';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: "/staff", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/staff/students", icon: Users, label: "Students" },
    { href: "/staff/attendance", icon: UserCheck, label: "Attendance" },
    { href: "/staff/timetable", icon: CalendarDays, label: "Time Table" },
    { href: "/staff/exams", icon: FileText, label: "Exams" },
    { href: "/staff/notices", icon: BellRing, label: "Notices" },
    { href: "/staff/leave", icon: ShieldAlert, label: "Leave Requests" },
    { href: "/staff/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="w-64 h-full flex-shrink-0 bg-[#10B981] text-white flex flex-col shadow-xl relative overflow-hidden rounded-tr-[40px] rounded-br-[40px]">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-20 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Logo */}
      <div className="h-24 px-8 flex flex-col justify-center relative z-10 mt-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white rounded-xl p-1 shadow-sm shrink-0" />
          <div className="flex flex-col">
            <span className="font-black text-white text-lg leading-tight tracking-tight">Staff Portal</span>
            <span className="text-[10px] font-bold text-emerald-100 tracking-[0.1em]">MAYA INSTITUTE</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 space-y-2 relative z-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/staff' && pathname.startsWith(item.href as string));
          const Icon = item.icon as any;

          return (
            <Link key={item.href} href={item.href as string}>
              <div
                className={`flex items-center gap-4 px-8 py-3.5 transition-all border-l-4 ${
                  isActive 
                    ? "bg-white/10 border-white text-white font-semibold" 
                    : "border-transparent text-emerald-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[15px] tracking-wide">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Profile Section with Cutout */}
      <div className="relative mt-auto p-6 z-10 bg-[#059669] mx-4 mb-4 rounded-3xl overflow-hidden shadow-inner flex flex-col items-center group">
        <div className="w-16 h-16 rounded-full bg-white/20 p-1 mb-3">
          <img 
            src="https://ui-avatars.com/api/?name=Staff+Member&background=ffffff&color=10B981&bold=true" 
            alt="Profile" 
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <span className="text-sm font-bold tracking-wider uppercase mb-3">Faculty Member</span>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 w-full bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all text-sm font-semibold border border-white/10"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

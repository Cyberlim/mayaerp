"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  GraduationCap, 
  LayoutDashboard, 
  UserPlus, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Beaker,
  CreditCard, 
  Users, 
  UserCheck, 
  Library, 
  MessageSquare, 
  Bus, 
  BarChart, 
  LogOut 
} from "lucide-react";
import { useRouter } from "next/navigation";

const menuItems = [
  { section: "MAIN MENU", items: [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Admissions", path: "/dashboard/admissions", icon: UserPlus },
  ]},
  { section: "ACADEMICS", items: [
    { name: "Courses", path: "/dashboard/academics", icon: BookOpen },
    { name: "Time Table", path: "/dashboard/academics/timetable", icon: Calendar },
    { name: "Lab Portal", path: "/dashboard/lab", icon: Beaker },
    { name: "Attendance", path: "/dashboard/academics/attendance", icon: CheckSquare },
    { name: "Batch Promote", path: "/dashboard/students/promote", icon: GraduationCap },
    { name: "Exams", path: "/dashboard/exams", icon: FileText },
  ]},
  { section: "ADMINISTRATION", items: [
    { name: "Finance & Fees", path: "/dashboard/finance", icon: CreditCard },
    { name: "User Management", path: "/dashboard/users", icon: Users },
    { name: "Student Records", path: "/dashboard/students", icon: UserCheck },
    { name: "Library Control", path: "/dashboard/library", icon: Library },
    { name: "Notice Board", path: "/dashboard/notices", icon: MessageSquare },
    { name: "Leave Management", path: "/dashboard/leaves", icon: FileText },
  ]},
  { section: "SUPPORT & LOGS", items: [
    { name: "Inquiries", path: "/dashboard/inquiries", icon: MessageSquare },
    { name: "Transport Hub", path: "/dashboard/transport", icon: Bus },
    { name: "Reports & Logs", path: "/dashboard/reports", icon: BarChart },
  ]}
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    // Implement logout logic here (clear cookies, etc.)
    router.push("/");
  };

  return (
    <div className="w-72 bg-[#1a1f2c] h-screen flex flex-col z-20 sticky top-0 border-r border-slate-800">
      <div className="p-8 pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white text-lg leading-tight uppercase tracking-wide">Maya ERP</span>
          <span className="text-[9px] font-medium text-slate-400 tracking-[0.2em] uppercase mt-0.5">Education</span>
        </div>
      </div>

      {/* Menu Links */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              {section.section}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <div className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                          {item.name}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 mx-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

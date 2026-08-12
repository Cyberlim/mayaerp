"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Do not show sidebar and top header on specific full-screen pages
  const hideSidebarRoutes = [
    "/dashboard/users/create",
    "/dashboard/students/create",
  ];
  
  // Also hide for dynamic edit routes
  const isHiddenRoute = hideSidebarRoutes.includes(pathname) || 
                        (pathname.startsWith("/dashboard/users/") && pathname !== "/dashboard/users") ||
                        (pathname.startsWith("/dashboard/students/") && pathname !== "/dashboard/students");

  if (isHiddenRoute) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 px-8 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-4">
            <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden group-hover:ring-2 group-hover:ring-rose-500 transition-all">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=f43f5e&color=fff" alt="Profile" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Admin User</p>
                <p className="text-xs font-semibold text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

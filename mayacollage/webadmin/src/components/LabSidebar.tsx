"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings,
  PackageSearch,
  ArrowRightLeft,
  BookOpen
} from 'lucide-react';

export default function LabSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/lab",
    },
    {
      title: "Manage Labs",
      icon: Settings,
      path: "/lab/manage",
    },
    {
      title: "Inventory",
      icon: PackageSearch,
      path: "/lab/inventory",
    },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-100 z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain bg-white rounded-lg p-0.5 shadow-sm shrink-0" />
          Lab Portal
        </span>
      </div>

      <div className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 mb-2 px-2 uppercase tracking-wider">
          Main Menu
        </div>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${
                isActive 
                  ? 'text-white font-medium bg-blue-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-lab-nav"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={18} className={isActive ? "text-blue-500" : "text-slate-400 group-hover:text-blue-400 transition-colors"} />
              <span className="text-sm">{item.title}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <Link 
          href="/logout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-sm font-medium"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}

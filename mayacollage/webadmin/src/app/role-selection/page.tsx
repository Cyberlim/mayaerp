"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ChevronLeft,
  Settings,
  Briefcase,
  Users,
  BookOpen,
  FlaskConical
} from "lucide-react";

const roles = [
  { title: "Admin", icon: Settings, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500", shadow: "shadow-indigo-500/20" },
  { title: "Office", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500", shadow: "shadow-blue-500/20" },
  { title: "Staff", icon: Users, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500", shadow: "shadow-teal-500/20" },
  { title: "Library", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500", shadow: "shadow-amber-500/20" },
  { title: "Lab", icon: FlaskConical, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500", shadow: "shadow-purple-500/20" },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex w-full bg-slate-50 overflow-hidden text-slate-900">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-rose-600 to-pink-500 relative overflow-hidden flex-col items-center justify-center">
        <div className="z-10 flex flex-col items-center text-center px-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="p-10 rounded-full bg-white/10 backdrop-blur-md mb-8"
          >
            <ShieldCheck className="text-white w-28 h-28" strokeWidth={1.5} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-4xl font-black mb-4 tracking-tight"
          >
            Identity Gateway
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-rose-100 text-lg"
          >
            Secure Role-Based Access Control
          </motion.p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-7/12 flex flex-col px-6 sm:px-12 lg:px-20 py-10 lg:py-16 relative h-screen overflow-y-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors mb-8"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </motion.button>

        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight"
        >
          Who are you?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-slate-500 mb-10"
        >
          Select your designated department to proceed.
        </motion.p>

        {/* ROLE GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.title;
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                onClick={() => setSelectedRole(role.title)}
                className={`cursor-pointer rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-6 aspect-square bg-white
                  ${isSelected ? `${role.border} shadow-[0_15px_30px_rgba(0,0,0,0.1)] scale-[1.02]` : 'border-transparent shadow-sm hover:shadow-md hover:-translate-y-1'}`}
              >
                <motion.div
                  animate={{ scale: isSelected ? 1.1 : 1 }}
                  className={`p-4 rounded-full mb-4 transition-colors duration-300 ${isSelected ? role.bg : 'bg-slate-50'}`}
                >
                  <Icon className={`w-8 h-8 transition-colors duration-300 ${isSelected ? role.color : 'text-slate-400'}`} />
                </motion.div>
                <span className={`font-bold tracking-tight transition-colors duration-300 ${isSelected ? role.color : 'text-slate-600'}`}>
                  {role.title}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* ACTION BUTTON */}
        <div className="mt-auto pt-8">
          <AnimatePresence mode="wait">
            {selectedRole ? (
              <motion.button
                key="btn-active"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={() => router.push(`/login?role=${selectedRole}`)}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white font-bold text-lg shadow-[0_15px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.4)] hover:-translate-y-1 transition-all duration-300"
              >
                Enter as {selectedRole}
              </motion.button>
            ) : (
              <motion.div
                key="btn-inactive"
                className="w-full h-[68px]" // Placeholder to prevent layout jump
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

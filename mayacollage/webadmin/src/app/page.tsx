"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  ShieldCheck, 
  LineChart, 
  Zap, 
  Award,
  ArrowRight
} from "lucide-react";

export default function ShowcaseScreen() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden text-slate-900">
      {/* LEFT PANEL: ANIMATED BRAND HUB (Desktop Only) */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-rose-600 to-pink-500 relative overflow-hidden flex-col items-center justify-center">
        {/* Animated Background Waves */}
        {isMounted && Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 150 + Math.random() * 200,
              height: 150 + Math.random() * 200,
              background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * 50 - 25, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="p-10 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm"
          >
            <GraduationCap className="text-white w-24 h-24" strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 text-white text-5xl font-black tracking-[0.2em] uppercase"
          >
            Maya Institute
          </motion.h1>
          
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-4 h-1 w-20 bg-white rounded-full origin-left"
          />
        </div>
      </div>

      {/* RIGHT PANEL: AUTH & INFO */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-16 lg:px-12 py-12 relative">
        {/* Mobile Logo Box */}
        <div className="lg:hidden flex justify-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="p-6 rounded-full bg-rose-50"
          >
            <GraduationCap className="text-rose-600 w-16 h-16" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Small Logo Pill */}
        <div className="flex justify-center lg:justify-start mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="px-6 py-3 bg-white rounded-full border border-rose-100 shadow-[0_10px_40px_rgba(225,29,72,0.1)] flex items-center gap-3"
          >
            <GraduationCap className="text-rose-600 w-6 h-6" />
            <span className="font-black text-slate-800 tracking-wider text-sm">MAYA ERP</span>
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight text-center lg:text-left"
        >
          Welcome to <br /> the Future of Academia
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-4 text-base sm:text-lg text-slate-500 text-center lg:text-left"
        >
          Experience the most advanced, secure, and unified ERP platform designed for Maya Institutes.
        </motion.p>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <FeatureCard icon={ShieldCheck} title="Secure SSO" />
          <FeatureCard icon={LineChart} title="Live Insights" />
          <FeatureCard icon={Zap} title="Fast Execution" />
          <FeatureCard icon={Award} title="Best UX" />
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12"
        >
          <button
            onClick={() => router.push("/role-selection")}
            className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-pink-500 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-[0_10px_30px_rgba(244,63,94,0.4)] hover:shadow-[0_15px_40px_rgba(244,63,94,0.5)] hover:-translate-y-1 transition-all duration-300"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:border-rose-100 transition-colors">
      <div className="p-2.5 bg-rose-50 rounded-xl">
        <Icon className="w-5 h-5 text-rose-600" />
      </div>
      <span className="font-bold text-sm text-slate-800">{title}</span>
    </div>
  );
}

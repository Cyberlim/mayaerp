"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Shield, 
  ChevronLeft,
  AtSign,
  Lock,
  Loader2
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "Admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }), // pass role if backend needs it
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to authenticate");
        setIsLoading(false);
        return;
      }

      // Use the actual role from the database for redirection
      const actualRole = data.user.role;

      if (actualRole === "Staff" || actualRole === "Faculty") {
        router.push("/staff");
      } else if (actualRole === "Student") {
        router.push("/student");
      } else if (actualRole === "Office") {
        router.push("/office");
      } else if (actualRole === "Librarian" || actualRole === "Library") {
        router.push("/library");
      } else if (actualRole === "Lab") {
        router.push("/lab");
      } else {
        router.push("/dashboard"); // Admin/Super Admin
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 overflow-hidden text-slate-900">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-rose-600 to-pink-500 relative overflow-hidden flex-col items-center justify-center">
        {/* Animated Background Waves */}
        {isMounted && Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 200 + Math.random() * 200,
              height: 200 + Math.random() * 200,
              background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 40 - 20, 0],
              y: [0, Math.random() * 40 - 20, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="z-10 flex flex-col items-center text-center px-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="p-10 rounded-full border-2 border-white/15 bg-white/10 backdrop-blur-md mb-8"
          >
            <Shield className="text-white w-24 h-24" strokeWidth={1.5} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-5xl font-black mb-4 tracking-tight"
          >
            Access Portal
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-rose-100 text-lg"
          >
            Secure Verification System
          </motion.p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-2/5 flex flex-col px-6 sm:px-12 py-10 lg:py-16 relative">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors mb-10"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </motion.button>

        {/* Role Badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full self-start"
        >
          <Shield className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-black tracking-widest text-rose-600 uppercase">
            {role}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-10"
        >
          Sign In
        </motion.h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <AtSign className="h-5 w-5 text-rose-500" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 focus:border-rose-500 rounded-2xl shadow-[0_8px_15px_rgba(0,0,0,0.02)] outline-none transition-all text-slate-800 placeholder-slate-400"
              placeholder="Email / Username"
              required
            />
          </motion.div>

          {/* Password Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-rose-500" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 focus:border-rose-500 rounded-2xl shadow-[0_8px_15px_rgba(0,0,0,0.02)] outline-none transition-all text-slate-800 placeholder-slate-400"
              placeholder="Password"
              required
            />
          </motion.div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm font-semibold"
            >
              {error}
            </motion.p>
          )}

          {/* Remember me & Forgot Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between my-2"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300" />
              <span className="text-sm text-slate-500">Remember me</span>
            </label>
            <button type="button" className="text-sm font-bold text-rose-600 hover:text-rose-500">
              Forgot Password?
            </button>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white font-bold text-lg shadow-[0_15px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 flex items-center justify-center disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Authenticate"
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}

export default function LoginRoleScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}

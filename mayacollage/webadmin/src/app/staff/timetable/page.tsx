"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Loader2, Users } from "lucide-react";

export default function StaffTimetableScreen() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTimetable() {
      try {
        const res = await fetch("/api/staff/timetable", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSchedule(data.schedule || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTimetable();
  }, []);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Create a structured list even if DB data is missing
  const structuredSchedule = days.map(day => {
    const found = schedule.find(s => s.day === day);
    return found ? found : { day, slots: [] };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Premium Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg border border-emerald-100/50 p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-emerald-500/20 border border-emerald-100">
            <div className="w-full h-full bg-slate-50 rounded-[1.5rem] flex items-center justify-center">
              <Calendar className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-emerald-600 font-bold tracking-widest text-sm uppercase mb-1">Your Schedule</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Weekly Timetable</h1>
          </div>
        </div>

        <div className="relative z-10 bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-xl shadow-emerald-100/50 flex gap-6">
           <div className="px-6 text-center border-r border-emerald-100">
              <p className="text-3xl font-black text-slate-800">{schedule.reduce((acc, curr) => acc + (curr.slots?.length || 0), 0)}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Classes</p>
           </div>
           <div className="px-6 text-center">
              <p className="text-3xl font-black text-emerald-600">{schedule.filter(s => s.slots?.length > 0).length}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Working Days</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {structuredSchedule.map((dayPlan, idx) => (
          <motion.div
            key={dayPlan.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 lg:p-10 flex flex-col md:flex-row gap-8 lg:gap-12 relative overflow-hidden group hover:shadow-xl hover:border-emerald-100 transition-all duration-300"
          >
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-20 -mb-20 pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
            
            <div className="w-full md:w-48 flex-shrink-0 relative z-10">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{dayPlan.day}</h2>
              <div className="inline-block mt-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{dayPlan.slots?.length || 0} Classes</p>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
              {dayPlan.slots && dayPlan.slots.length > 0 ? (
                dayPlan.slots.map((slot: any, sIdx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 + sIdx * 0.05 }}
                    key={sIdx} 
                    className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 flex flex-col gap-3 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-lg font-black text-slate-900 leading-tight">{slot.subject}</h4>
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 shadow-sm shrink-0">
                        {slot.type}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-200/60">
                      <span className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5" /> 
                        </div>
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {slot.classInfo && (
                        <span className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                          <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5" /> 
                          </div>
                          {slot.classInfo}
                        </span>
                      )}
                      <span className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                        <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5" /> 
                        </div>
                        Room {slot.location}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full col-span-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <Calendar className="w-8 h-8 text-slate-300 mb-3" />
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Classes Scheduled</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

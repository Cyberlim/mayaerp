"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Bus, 
  MapPin, 
  Users, 
  CheckCircle,
  XCircle
} from "lucide-react";

export default function TransportDashboard() {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuses = async () => {
    try {
      const res = await fetch("/api/transport/buses");
      if (res.ok) {
        setBuses(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch buses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;
    try {
      const res = await fetch(`/api/transport/bus/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBuses();
    } catch (error) {
      console.error("Failed to delete bus", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
    </div>;
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700';
      case 'Full': return 'bg-rose-100 text-rose-700';
      case 'Service': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-3xl p-8 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Transport Hub</h1>
            <p className="text-amber-50 font-medium max-w-lg text-sm leading-relaxed">
              Manage fleet operations, monitor student assignments, and track bus capacities.
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
             <Bus className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* Fleet Overview Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Active Fleet</h3>
          <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-sm">
            Total Buses: {buses.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-sm font-bold text-slate-400">Bus ID / Route</th>
                <th className="pb-3 text-sm font-bold text-slate-400">Driver & Conductor</th>
                <th className="pb-3 text-sm font-bold text-slate-400">Occupancy</th>
                <th className="pb-3 text-sm font-bold text-slate-400">Status</th>
                <th className="pb-3 text-sm font-bold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.length > 0 ? buses.map((bus: any) => (
                <tr key={bus._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Bus className="w-4 h-4 text-amber-500" /> {bus.busNo}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {bus.routeName}
                    </p>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-bold text-slate-700">Driver: {bus.driverName}</p>
                    <p className="text-xs font-semibold text-slate-500">Cond: {bus.conductorName}</p>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (bus.filled / bus.capacity) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600">
                        {bus.filled}/{bus.capacity}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(bus.status)}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                     <button onClick={() => handleDelete(bus._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Delete Fleet">
                        <XCircle className="w-5 h-5" />
                     </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                    No active buses found in the fleet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal
} from "lucide-react";

export default function InquiriesDashboard() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      const res = await fetch("/api/inquiries");
      if (res.ok) {
        setInquiries(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch inquiries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchInquiries(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchInquiries(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete inquiry", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
    </div>;
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Followup': return 'bg-amber-100 text-amber-700';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700';
      case 'Dropped': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-600 to-indigo-500 rounded-3xl p-8 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Inquiries Management</h1>
            <p className="text-indigo-100 font-medium max-w-lg text-sm leading-relaxed">
              Track, manage, and respond to incoming admission inquiries from various sources.
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
             <MessageSquare className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* Inquiries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Inquiries</h3>
          <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-sm">
            Total: {inquiries.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-sm font-bold text-slate-400">Prospect Info</th>
                <th className="pb-3 text-sm font-bold text-slate-400">Contact Details</th>
                <th className="pb-3 text-sm font-bold text-slate-400">Course & Source</th>
                <th className="pb-3 text-sm font-bold text-slate-400">Status</th>
                <th className="pb-3 text-sm font-bold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length > 0 ? inquiries.map((inquiry: any) => (
                <tr key={inquiry._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {inquiry.avatar ? (
                        <img src={inquiry.avatar} alt={inquiry.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="font-bold text-slate-500">{inquiry.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{inquiry.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {inquiry.city}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> {inquiry.phone}
                    </p>
                    {inquiry.email && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" /> {inquiry.email}
                      </p>
                    )}
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-bold text-indigo-600">{inquiry.course}</p>
                    <p className="text-xs text-slate-500 mt-1">Source: {inquiry.source}</p>
                  </td>
                  <td className="py-4">
                    <select 
                      value={inquiry.status}
                      onChange={(e) => handleStatusChange(inquiry._id, e.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer ${getStatusBadge(inquiry.status)} outline-none ring-2 ring-transparent focus:ring-slate-200 transition-all`}
                    >
                      <option value="New">New</option>
                      <option value="Followup">Followup</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Dropped">Dropped</option>
                    </select>
                  </td>
                  <td className="py-4 text-right">
                     <button onClick={() => handleDelete(inquiry._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Delete">
                        <XCircle className="w-5 h-5" />
                     </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                    No inquiries found.
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

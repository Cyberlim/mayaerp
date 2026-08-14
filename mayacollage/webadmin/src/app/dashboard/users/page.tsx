"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, UserCircle, MoreVertical, Edit2, Trash2, Shield, Loader2, CheckCircle2, Eye, Key, X, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserManagementDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [toastMsg, setToastMsg] = useState("");
  const [passwordModal, setPasswordModal] = useState<{isOpen: boolean, userId: string, name: string}>({isOpen: false, userId: "", name: ""});
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const filters = ["All", "Admin", "Staff", "Accountant", "Librarian"];

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the user: ${name}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToastMsg("User deleted successfully!");
        fetchUsers();
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        alert("Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await fetch(`/api/users/${passwordModal.userId}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      
      if (res.ok) {
        setToastMsg("Password updated successfully!");
        setPasswordModal({ isOpen: false, userId: "", name: "" });
        setNewPassword("");
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating the password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (selectedFilter !== "All") {
      result = result.filter(u => u.role === selectedFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.firstName?.toLowerCase() || "").includes(q) || 
        (u.lastName?.toLowerCase() || "").includes(q) || 
        (u.email?.toLowerCase() || "").includes(q)
      );
    }
    return result;
  }, [users, selectedFilter, searchQuery]);

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    admins: users.filter(u => u.role === 'Admin').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans text-slate-800">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-rose-500/30 flex items-center gap-3">
            <Trash2 className="w-5 h-5" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage portal accounts & permissions</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <input 
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 py-3 pl-10 pr-4 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <Link href="/dashboard/users/create">
              <button className="w-full sm:w-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all">
                <Plus className="w-4 h-4" /> Create User
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 mt-10">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Users", value: stats.total, color: "text-slate-900" },
            { label: "Active", value: stats.active, color: "text-emerald-600" },
            { label: "Inactive", value: stats.inactive, color: "text-amber-500" },
            { label: "Admins", value: stats.admins, color: "text-indigo-600" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</span>
              <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${selectedFilter === filter ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-800">No Users Found</h3>
            <p className="text-sm text-slate-500 font-medium mt-2">No accounts match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredUsers.map((user, idx) => (
                <motion.div 
                  key={user._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:border-rose-100 transition-all flex flex-col"
                >
                  <div className="h-24 bg-gradient-to-r from-rose-50 to-pink-50 group-hover:from-rose-100 group-hover:to-pink-100 transition-colors relative">
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40 shadow-sm">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${user.status === 'Active' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-6 pb-6 flex-1 flex flex-col relative -mt-12">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-md overflow-hidden mb-4 mx-auto flex items-center justify-center">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-1 line-clamp-1">{user.email}</p>
                      
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 text-xs font-black uppercase tracking-wider">
                        <Shield className="w-3.5 h-3.5 text-rose-500" />
                        {user.role}
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                      <Link href={`/dashboard/users/${user._id}/details`} className="col-span-2">
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs rounded-xl transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </Link>
                      <button 
                        onClick={() => setPasswordModal({ isOpen: true, userId: user._id, name: `${user.firstName} ${user.lastName}` })}
                        className="col-span-2 w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold text-xs rounded-xl transition-colors border border-transparent hover:border-amber-200"
                      >
                        <Key className="w-3.5 h-3.5" /> Change Password
                      </button>
                      <Link href={`/dashboard/users/${user._id}`}>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition-colors border border-transparent hover:border-indigo-100">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs rounded-xl transition-colors border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {passwordModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  Change Password
                </h3>
                <button 
                  onClick={() => setPasswordModal({ isOpen: false, userId: "", name: "" })}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-4">
                    Setting new password for <span className="text-rose-600">{passwordModal.name}</span>
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl outline-none transition-all text-slate-700 font-medium"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setPasswordModal({ isOpen: false, userId: "", name: "" })}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

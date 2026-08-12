"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, 
  BookOpen, 
  AlertCircle, 
  IndianRupee,
  MoreHorizontal,
  Search,
  Plus,
  UserCheck
} from "lucide-react";

export default function LibraryDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [circulation, setCirculation] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue Desk State
  const [searchQuery, setSearchQuery] = useState("");
  const [studentResult, setStudentResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [issueBookId, setIssueBookId] = useState("");

  const fetchData = async () => {
    try {
      const [statsRes, circRes, booksRes] = await Promise.all([
        fetch("/api/library/stats"),
        fetch("/api/library/circulation"),
        fetch("/api/library/books")
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (circRes.ok) setCirculation(await circRes.json());
      if (booksRes.ok) setBooks(await booksRes.json());
    } catch (error) {
      console.error("Failed to fetch library data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStudentSearch = async () => {
    if (!searchQuery) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/library/students/search?q=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setStudentResult(data.length > 0 ? data[0] : null);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleIssueBook = async () => {
    if (!studentResult || !issueBookId) return;
    try {
      const res = await fetch("/api/library/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentResult._id,
          bookId: issueBookId,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days default
        })
      });
      if (res.ok) {
        alert("Book issued successfully!");
        fetchData();
        setStudentResult(null);
        setSearchQuery("");
        setIssueBookId("");
        setActiveTab("overview");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to issue book");
      }
    } catch (error) {
      console.error("Issue failed", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
    </div>;
  }

  const kpis = [
    { title: "Total Catalog (Books)", value: stats?.totalStock || 0, icon: Book, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Issues", value: stats?.activeIssues || 0, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Overdue Books", value: stats?.overdue || 0, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Total Fine Dues", value: `₹${stats?.totalFineDues || 0}`, icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-rose-600 to-pink-500 rounded-3xl p-8 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Library Dashboard</h1>
          <p className="text-rose-100 font-medium max-w-lg text-sm leading-relaxed mb-6">
            Manage your books, track student circulation, and easily issue or return library items.
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-white text-rose-600 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab("books")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'books' ? 'bg-white text-rose-600 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Manage Catalog
            </button>
            <button 
              onClick={() => setActiveTab("issue")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'issue' ? 'bg-white text-rose-600 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Issue Desk
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi, idx) => (
                <div key={kpi.title} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                      <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                  </div>
                  <h3 className="text-slate-500 font-bold text-sm mb-1">{kpi.title}</h3>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-slate-800">{kpi.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6">Current Circulation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-sm font-bold text-slate-400">Student</th>
                      <th className="pb-3 text-sm font-bold text-slate-400">Book Title</th>
                      <th className="pb-3 text-sm font-bold text-slate-400">Due Date</th>
                      <th className="pb-3 text-sm font-bold text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {circulation.length > 0 ? circulation.map((issue: any) => (
                      <tr key={issue._id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-4">
                          <p className="font-bold text-slate-800 text-sm">{issue.student?.firstName} {issue.student?.lastName}</p>
                          <p className="text-xs text-slate-500">{issue.student?.admissionNumber || issue.student?.studentId}</p>
                        </td>
                        <td className="py-4 font-semibold text-slate-700 text-sm">{issue.book?.title}</td>
                        <td className="py-4 text-sm text-slate-600">{new Date(issue.dueDate).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${issue.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-500 font-semibold">No active circulation records.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* BOOKS TAB */}
        {activeTab === "books" && (
          <motion.div
            key="books"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Library Catalog</h3>
              <button className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors">
                <Plus className="w-4 h-4" /> Add Book
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-sm font-bold text-slate-400">Title & Author</th>
                    <th className="pb-3 text-sm font-bold text-slate-400">ISBN</th>
                    <th className="pb-3 text-sm font-bold text-slate-400">Location</th>
                    <th className="pb-3 text-sm font-bold text-slate-400">Total Copies</th>
                    <th className="pb-3 text-sm font-bold text-slate-400">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length > 0 ? books.map((book: any) => (
                    <tr key={book._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-4">
                        <p className="font-bold text-slate-800 text-sm">{book.title}</p>
                        <p className="text-xs text-slate-500">{book.author}</p>
                      </td>
                      <td className="py-4 font-semibold text-slate-600 text-sm">{book.isbn || 'N/A'}</td>
                      <td className="py-4 font-semibold text-slate-600 text-sm">{book.shelf || 'Unassigned'}</td>
                      <td className="py-4 font-semibold text-slate-800 text-sm">{book.total}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${book.available > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {book.available > 0 ? `${book.available} Available` : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">No books in catalog.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ISSUE DESK TAB */}
        {activeTab === "issue" && (
          <motion.div
            key="issue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Search Student Panel */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] h-fit">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">1. Find Student</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Search by Admission No., Student ID, or Name</p>
              
              <div className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
                  placeholder="Enter admission no..."
                  className="flex-1 bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all"
                />
                <button 
                  onClick={handleStudentSearch}
                  disabled={searchLoading}
                  className="bg-rose-600 text-white p-3 rounded-2xl hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {studentResult && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">{studentResult.firstName} {studentResult.lastName}</h4>
                    <p className="text-sm font-bold text-emerald-700 mb-1">Admn No: {studentResult.admissionNumber || studentResult.studentId}</p>
                    <p className="text-xs text-slate-500 font-semibold">{studentResult.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Select Book Panel */}
            <div className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-opacity ${!studentResult ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">2. Select Book</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Choose a book to issue to the student</p>
              
              <select 
                value={issueBookId}
                onChange={(e) => setIssueBookId(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all mb-6"
              >
                <option value="">-- Select an available book --</option>
                {books.filter(b => b.available > 0).map((book: any) => (
                  <option key={book._id} value={book._id}>{book.title} (ISBN: {book.isbn})</option>
                ))}
              </select>

              <button 
                onClick={handleIssueBook}
                disabled={!issueBookId}
                className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 shadow-lg shadow-rose-500/20"
              >
                Issue Book Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

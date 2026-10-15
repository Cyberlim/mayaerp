"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, Search, Loader2, CheckCircle2, AlertTriangle, Zap, RefreshCw, Clock, RotateCcw } from "lucide-react";
import dayjs from "dayjs";

export default function Circulation() {
  const [issues, setIssues] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  
  // Issue Form State
  const [isIssuing, setIsIssuing] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [issuedToModel, setIssuedToModel] = useState("Student");
  const [issuedTo, setIssuedTo] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Return Form State
  const [returnId, setReturnId] = useState("");
  const [returnStatus, setReturnStatus] = useState("Returned");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  // Search Filter for History
  const [searchHistory, setSearchHistory] = useState("");

  // 0ms Cache Hydration on mount
  useEffect(() => {
    try {
      const cachedIssues = localStorage.getItem("maya_lab_issues_cache");
      const cachedItems = localStorage.getItem("maya_lab_inventory_cache");
      const cachedStudents = localStorage.getItem("maya_students_cache");
      const cachedStaff = localStorage.getItem("maya_faculty_cache");

      if (cachedIssues) {
        const parsed = JSON.parse(cachedIssues);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIssues(parsed);
          setFromCache(true);
          setIsLoading(false);
        }
      }
      if (cachedItems) {
        const parsed = JSON.parse(cachedItems);
        if (Array.isArray(parsed)) setItems(parsed.filter((i: any) => (i.availableQuantity || 0) > 0));
      }
      if (cachedStudents) {
        setStudents(JSON.parse(cachedStudents));
      }
      if (cachedStaff) {
        setStaff(JSON.parse(cachedStaff));
      }
    } catch (_) {}

    fetchData(false);
  }, []);

  const fetchData = async (showRefresh = true) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [issuesRes, itemsRes, studentsRes, staffRes] = await Promise.all([
        fetch("/api/lab-issues"),
        fetch("/api/lab-inventory"),
        fetch("/api/students"),
        fetch("/api/users/staff")
      ]);
      const iData = await issuesRes.json();
      const itData = await itemsRes.json();
      const stData = await studentsRes.json();
      const sfData = await staffRes.json();
      
      const issueList = Array.isArray(iData) ? iData : [];
      const itemList = Array.isArray(itData) ? itData.filter((i: any) => (i.availableQuantity || 0) > 0) : [];
      const studentList = Array.isArray(stData) ? stData : [];
      const staffList = Array.isArray(sfData) ? sfData : [];

      setIssues(issueList);
      setItems(itemList);
      setStudents(studentList);
      setStaff(staffList);

      try {
        localStorage.setItem("maya_lab_issues_cache", JSON.stringify(issueList));
        localStorage.setItem("maya_students_cache", JSON.stringify(studentList));
        localStorage.setItem("maya_faculty_cache", JSON.stringify(staffList));
      } catch (_) {}
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return alert("Please select an available inventory item.");
    if (!issuedTo) return alert("Please select a student or staff member.");

    setIsIssuing(true);
    try {
      let issuedToName = "";
      let issuedToId = "";
      if (issuedToModel === 'Student') {
        const student = students.find(s => (s.id === issuedTo || s._id === issuedTo));
        if (student) {
          issuedToName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name;
          issuedToId = student.studentId || student.rollNumber || student.id;
        }
      } else {
        const user = staff.find(s => (s.id === issuedTo || s._id === issuedTo));
        if (user) {
          issuedToName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          issuedToId = user.email || user.id;
        }
      }

      const res = await fetch("/api/lab-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: selectedItem,
          issuedTo,
          issuedToModel,
          issuedToName,
          issuedToId,
          quantityIssued: parseInt(quantity) || 1,
          expectedReturnDate,
          remarks
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newIssue = data.issue;

        // Optimistic cache update
        setIssues(prev => {
          const updated = [newIssue, ...prev];
          try {
            localStorage.setItem("maya_lab_issues_cache", JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });

        // Reduce available quantity in local item list
        setItems(prev => prev.map(it => {
          const itId = it.id || it._id;
          if (itId === selectedItem) {
            return { ...it, availableQuantity: Math.max(0, it.availableQuantity - (parseInt(quantity) || 1)) };
          }
          return it;
        }));

        setSelectedItem("");
        setIssuedTo("");
        setQuantity("1");
        setExpectedReturnDate("");
        setRemarks("");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to issue item");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnId) return alert("Select an active issue record first.");
    setIsReturning(true);
    try {
      const res = await fetch(`/api/lab-issues/${returnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnStatus,
          remarks: returnRemarks
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedIssue = data.issue;

        // Optimistic update in issues
        setIssues(prev => {
          const updated = prev.map(iss => (iss.id === returnId || iss._id === returnId) ? updatedIssue : iss);
          try {
            localStorage.setItem("maya_lab_issues_cache", JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });

        setReturnId("");
        setReturnStatus("Returned");
        setReturnRemarks("");
        fetchData(false);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to return item");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReturning(false);
    }
  };

  const activeIssues = issues.filter(i => i.status === 'Issued' || i.status === 'Overdue');
  const filteredHistory = issues.filter(iss => {
    if (!searchHistory) return true;
    const q = searchHistory.toLowerCase();
    const itemName = (iss.item?.itemName || iss.itemName || '').toLowerCase();
    const recipient = (iss.issuedToName || '').toLowerCase();
    const trx = (iss.transactionId || '').toLowerCase();
    return itemName.includes(q) || recipient.includes(q) || trx.includes(q);
  });

  return (
    <div className="font-sans text-slate-800 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lab Circulation Desk</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
            </span>
          </div>
          <p className="text-slate-500 font-medium mt-1">Issue apparatus to students & faculty, manage borrowings, and inspect return conditions</p>
        </div>

        <button 
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl shadow-sm transition-all self-start md:self-auto"
          title="Refresh from PostgreSQL"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <CirculationSkeleton />
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            
            {/* Issue Card */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/70 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4" />
                  </span>
                  Issue Laboratory Asset
                </h2>

                <form onSubmit={handleIssue} className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Equipment / Asset</label>
                    <select required value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                      <option value="">Select Item (In-Stock)</option>
                      {items.map(item => {
                        const itemId = item.id || item._id;
                        return (
                          <option key={itemId} value={itemId}>
                            {item.itemName} — {item.itemCode || ''} (Avail: {item.availableQuantity})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Recipient Role</label>
                      <select value={issuedToModel} onChange={e => { setIssuedToModel(e.target.value); setIssuedTo(""); }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                        <option value="Student">Student</option>
                        <option value="User">Faculty / Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Person</label>
                      <select required value={issuedTo} onChange={e => setIssuedTo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                        <option value="">Choose Recipient...</option>
                        {issuedToModel === 'Student' ? (
                          students.map(s => {
                            const sid = s.id || s._id;
                            return (
                              <option key={sid} value={sid}>
                                {s.firstName} {s.lastName} ({s.studentId || s.rollNumber || sid})
                              </option>
                            );
                          })
                        ) : (
                          staff.map(s => {
                            const sid = s.id || s._id;
                            return (
                              <option key={sid} value={sid}>
                                {s.firstName} {s.lastName} ({s.department || 'Faculty'})
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quantity</label>
                      <input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Expected Return Date</label>
                      <input type="date" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Remarks / Practical Purpose</label>
                    <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" placeholder="e.g. Lab Experiment 4 / Capstone project" />
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={isIssuing} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70 text-sm">
                      {isIssuing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Asset Issue"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Return Card */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-50/70 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    Process Asset Return
                  </h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {activeIssues.length} Active Borrows
                  </span>
                </div>

                <form onSubmit={handleReturn} className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Active Borrow Record</label>
                    <select required value={returnId} onChange={e => setReturnId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-semibold">
                      <option value="">Select Borrow Record...</option>
                      {activeIssues.map(issue => {
                        const issId = issue.id || issue._id;
                        return (
                          <option key={issId} value={issId}>
                            {issue.item?.itemName || 'Asset'} (Qty: {issue.quantityIssued}) — {issue.issuedToName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Asset Condition Upon Return</label>
                    <select value={returnStatus} onChange={e => setReturnStatus(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-semibold">
                      <option value="Returned">Good & Functional (Returned)</option>
                      <option value="Damaged">Damaged / Needs Servicing</option>
                      <option value="Lost">Lost / Missing Component</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Return Inspection Remarks</label>
                    <input type="text" value={returnRemarks} onChange={e => setReturnRemarks(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-semibold" placeholder="Inspected by lab tech, all accessories intact..." />
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={isReturning || activeIssues.length === 0} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 text-sm">
                      {isReturning ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Asset Return"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Transaction History Section */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">Circulation Records</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Historical logs of equipment issues and returns</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter transactions..." 
                  value={searchHistory}
                  onChange={e => setSearchHistory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <th className="px-6 py-4 border-b border-slate-100">Transaction ID & Asset</th>
                    <th className="px-6 py-4 border-b border-slate-100">Recipient</th>
                    <th className="px-6 py-4 border-b border-slate-100">Issue Date</th>
                    <th className="px-6 py-4 border-b border-slate-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((issue, idx) => {
                      const issId = issue.id || issue._id;
                      return (
                        <motion.tr 
                          key={issId || idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.02 * idx }}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">
                              {issue.item?.itemName || issue.itemName || 'Asset'}
                              <span className="text-slate-400 text-xs ml-1.5 font-normal">(x{issue.quantityIssued})</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {issue.transactionId || 'TRX-DEFAULT'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                            {issue.issuedToName}
                            <span className="text-slate-400 text-xs block font-normal">{issue.issuedToModel} • {issue.issuedToId}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                            {dayjs(issue.createdAt || issue.issueDate).format('DD MMM YYYY')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              issue.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              issue.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              issue.status === 'Damaged' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {issue.status}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CirculationSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm h-80 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-44 mb-6" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm h-80 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-44 mb-6" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
      </div>
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-44 mb-4" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

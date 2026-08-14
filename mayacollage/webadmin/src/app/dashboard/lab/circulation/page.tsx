"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, Search, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";

export default function Circulation() {
  const [issues, setIssues] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [issuesRes, itemsRes, studentsRes, staffRes] = await Promise.all([
        fetch("/api/lab-issues"),
        fetch("/api/lab-inventory"),
        fetch("/api/students"),
        fetch("/api/staff")
      ]);
      const iData = await issuesRes.json();
      const itData = await itemsRes.json();
      const stData = await studentsRes.json();
      const sfData = await staffRes.json();
      
      setIssues(Array.isArray(iData) ? iData : []);
      setItems(Array.isArray(itData) ? itData.filter((i:any) => i.availableQuantity > 0) : []);
      setStudents(Array.isArray(stData) ? stData : []);
      setStaff(Array.isArray(sfData) ? sfData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    try {
      let issuedToName = "";
      let issuedToId = "";
      if (issuedToModel === 'Student') {
        const student = students.find(s => s._id === issuedTo);
        if (student) {
          issuedToName = `${student.firstName} ${student.lastName}`;
          issuedToId = student.admissionNumber || student.rollNumber;
        }
      } else {
        const user = staff.find(s => s._id === issuedTo);
        if (user) {
          issuedToName = `${user.firstName} ${user.lastName}`;
          issuedToId = user.email;
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
          quantityIssued: parseInt(quantity),
          expectedReturnDate,
          remarks
        })
      });

      if (res.ok) {
        setSelectedItem("");
        setIssuedTo("");
        setQuantity("1");
        setExpectedReturnDate("");
        setRemarks("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to issue");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnId) return alert("Select an issue record first.");
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
        setReturnId("");
        setReturnStatus("Returned");
        setReturnRemarks("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to return");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReturning(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Lab Circulation</h1>
        <p className="text-slate-500 font-medium">Issue and return laboratory equipment</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Issue Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Issue Item
          </h2>
          <form onSubmit={handleIssue} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Item</label>
              <select required value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                <option value="">Select Item (Available Stock)</option>
                {items.map(item => (
                  <option key={item._id} value={item._id}>{item.itemName} - {item.itemCode || ''} (Avail: {item.availableQuantity})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">User Type</label>
                <select value={issuedToModel} onChange={e => setIssuedToModel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                  <option value="Student">Student</option>
                  <option value="User">Faculty / Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select User</label>
                <select required value={issuedTo} onChange={e => setIssuedTo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                  <option value="">Search...</option>
                  {issuedToModel === 'Student' ? (
                    students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)
                  ) : (
                    staff.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.department})</option>)
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quantity</label>
                <input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Expected Return</label>
                <input type="date" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Remarks (Optional)</label>
              <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" placeholder="Purpose or notes..." />
            </div>

            <button type="submit" disabled={isIssuing} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {isIssuing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Issue"}
            </button>
          </form>
        </div>

        {/* Return Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Process Return
          </h2>
          <form onSubmit={handleReturn} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Active Issue Record</label>
              <select required value={returnId} onChange={e => setReturnId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none">
                <option value="">Select a record...</option>
                {issues.filter(i => i.status === 'Issued' || i.status === 'Overdue').map(issue => (
                  <option key={issue._id} value={issue._id}>
                    {issue.item?.itemName} - Issued to {issue.issuedToName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Return Condition</label>
              <select value={returnStatus} onChange={e => setReturnStatus(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none">
                <option value="Returned">Good (Returned)</option>
                <option value="Damaged">Damaged</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Remarks (Optional)</label>
              <input type="text" value={returnRemarks} onChange={e => setReturnRemarks(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none" placeholder="Notes on damage or fines..." />
            </div>

            <button type="submit" disabled={isReturning} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-auto disabled:opacity-70">
              {isReturning ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Return"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-slate-100">Item</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Issued To</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Date</th>
                <th className="px-6 py-4 font-bold border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">No transactions found.</td>
                </tr>
              ) : (
                issues.map(issue => (
                  <tr key={issue._id} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{issue.item?.itemName} <span className="text-slate-400 text-sm ml-1">(x{issue.quantityIssued})</span></td>
                    <td className="px-6 py-4 text-sm font-medium">{issue.issuedToName} <span className="text-slate-400 text-xs">({issue.issuedToModel})</span></td>
                    <td className="px-6 py-4 text-sm text-slate-600">{dayjs(issue.createdAt).format('DD MMM YYYY')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        issue.status === 'Returned' ? 'bg-emerald-50 text-emerald-600' :
                        issue.status === 'Overdue' ? 'bg-rose-50 text-rose-600' :
                        issue.status === 'Damaged' ? 'bg-orange-50 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

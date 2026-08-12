"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRightLeft, UserCheck, BookOpen, 
  Calendar, CheckCircle2, AlertCircle, Loader2, Search
} from "lucide-react";

export default function Circulation() {
  const [activeTab, setActiveTab] = useState<"issue" | "return">("issue");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-800">
      <div className="bg-white border-b border-slate-100 px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ArrowRightLeft className="text-violet-600" /> Circulation Desk
          </h1>
          <p className="text-slate-500 font-medium mt-1">Issue and return books to students</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("issue")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'issue' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Issue Book
          </button>
          <button 
            onClick={() => setActiveTab("return")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'return' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Return Book
          </button>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto mt-8">
        {activeTab === "issue" ? <IssueBookPanel /> : <ReturnBookPanel />}
      </div>
    </div>
  );
}

function SearchableSelect({ options, placeholder, value, onChange, icon: Icon }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedOption = options.find((o: any) => o.value === value);
  const filteredOptions = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()) || (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {placeholder}
      </label>
      <div 
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center cursor-pointer font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : `-- Choose --`}
        </span>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-50">
            <input 
              autoFocus
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-lg outline-none text-sm font-medium"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400 font-medium">No results found</div>
            ) : (
              filteredOptions.map((opt: any) => (
                <div 
                  key={opt.value}
                  className="px-4 py-3 hover:bg-violet-50 cursor-pointer flex flex-col"
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(""); }}
                >
                  <span className="font-bold text-slate-800 text-sm">{opt.label}</span>
                  {opt.subLabel && <span className="text-xs font-medium text-slate-500 mt-0.5">{opt.subLabel}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IssueBookPanel() {
  const [students, setStudents] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const [isIssuing, setIsIssuing] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [issueId, setIssueId] = useState("");
  const [otpSent, setOtpSent] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then(res => res.ok ? res.json() : [])
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(e => console.error(e));
      
    fetch("/api/library/books")
      .then(res => res.ok ? res.json() : [])
      .then(data => setBooks(Array.isArray(data) ? data : []))
      .catch(e => console.error(e));
    
    // Default due date: 14 days from now
    const date = new Date();
    date.setDate(date.getDate() + 14);
    setDueDate(date.toISOString().split('T')[0]);
  }, []);

  const handleIssue = async () => {
    if (!selectedStudent || !selectedBook) return alert("Select student and book");
    setIsIssuing(true);
    try {
      const res = await fetch("/api/library/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student: selectedStudent, book: selectedBook, dueDate })
      });
      const data = await res.json();
      if (res.ok) {
        setIssueId(data.issueId);
        setOtpSent(data.otp);
        setVerificationStep(true);
      } else {
        alert(data.message || "Error issuing book");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleVerify = async () => {
    if (!enteredOtp) return;
    setIsIssuing(true);
    try {
      const res = await fetch("/api/library/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, otp: enteredOtp })
      });
      if (res.ok) {
        setSuccess(true);
        setVerificationStep(false);
      } else {
        const data = await res.json();
        alert(data.message || "Invalid OTP");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsIssuing(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] p-12 text-center shadow-xl shadow-emerald-500/10 border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Book Issued Successfully!</h2>
        <p className="text-slate-500 font-medium mb-8">The book has been assigned to the student's account.</p>
        <button onClick={() => { setSuccess(false); setSelectedStudent(""); setSelectedBook(""); setEnteredOtp(""); }} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all">
          Issue Another Book
        </button>
      </motion.div>
    );
  }

  const studentOptions = students.map(s => ({
    value: s._id,
    label: `${s.firstName} ${s.lastName}`,
    subLabel: `ID: ${s.studentId || s.enrollmentNo || s.email} | Adm No: ${s.admissionNumber || 'N/A'}`
  }));

  const bookOptions = books.filter(b => b.available > 0).map(b => ({
    value: b._id,
    label: b.title,
    subLabel: `ISBN: ${b.isbn || 'N/A'} | Available: ${b.available}`
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-visible">
      {!verificationStep ? (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect 
              options={studentOptions} 
              placeholder="Select Student" 
              value={selectedStudent} 
              onChange={setSelectedStudent} 
              icon={UserCheck} 
            />
            <SearchableSelect 
              options={bookOptions} 
              placeholder="Select Book" 
              value={selectedBook} 
              onChange={setSelectedBook} 
              icon={BookOpen} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none transition-all font-medium" />
          </div>
          <div className="pt-6 border-t border-slate-100">
            <button onClick={handleIssue} disabled={isIssuing || !selectedStudent || !selectedBook} className="w-full md:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {isIssuing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Proceed to Issue"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 relative z-10 max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Verify OTP</h3>
          <p className="text-slate-500 font-medium mb-6">Ask the student for the OTP sent to their device. (For testing: <strong>{otpSent}</strong>)</p>
          <input 
            type="text" 
            placeholder="Enter 6-digit OTP" 
            value={enteredOtp} 
            onChange={e => setEnteredOtp(e.target.value)} 
            className="w-full text-center text-2xl tracking-[0.5em] font-black px-4 py-4 bg-slate-50 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none transition-all mb-6" 
            maxLength={6} 
          />
          <button onClick={handleVerify} disabled={isIssuing || enteredOtp.length < 6} className="w-full px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
            {isIssuing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Issue Book"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ReturnBookPanel() {
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/library/circulation")
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setActiveIssues(data.filter(i => i.status === 'Active' || i.status === 'Overdue'));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleReturn = async () => {
    if (!selectedIssueId) return alert("Please select a book to return");
    setIsReturning(true);
    try {
      const res = await fetch(`/api/library/return/${selectedIssueId}`, {
        method: "PUT"
      });
      const data = await res.json();
      if (res.ok) {
        alert("Book returned successfully!");
        setSelectedIssueId("");
        // Remove from list
        setActiveIssues(prev => prev.filter(i => i._id !== selectedIssueId));
      } else {
        alert(data.message || "Error returning book");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReturning(false);
    }
  };

  const issueOptions = activeIssues.map(i => ({
    value: i._id,
    label: `${i.student?.firstName} ${i.student?.lastName} - ${i.book?.title}`,
    subLabel: `ID: ${i.student?.studentId} | Adm No: ${i.student?.admissionNumber || 'N/A'} | Borrowed: ${new Date(i.createdAt).toLocaleDateString()}`
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-visible">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <ArrowRightLeft className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Process Book Return</h3>
          <p className="text-slate-500 font-medium text-sm">Search for the student or book to return it.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="space-y-6">
          <SearchableSelect 
            options={issueOptions} 
            placeholder="Search Active Borrows (Name, ID, Book Title)" 
            value={selectedIssueId} 
            onChange={setSelectedIssueId} 
            icon={Search} 
          />
          
          {selectedIssueId && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Selected Issue Record</h4>
              {(() => {
                const issue = activeIssues.find(i => i._id === selectedIssueId);
                return issue ? (
                  <div className="text-sm font-medium text-slate-600 space-y-1">
                    <p><strong>Student:</strong> {issue.student?.firstName} {issue.student?.lastName}</p>
                    <p><strong>Book:</strong> {issue.book?.title}</p>
                    <p><strong>Due Date:</strong> {new Date(issue.dueDate).toLocaleDateString()}</p>
                    {issue.fine > 0 && <p className="text-rose-500 font-bold mt-2">Note: This book has a pending fine of ₹{issue.fine}. Return it now, and collect the fine via the Fines tab.</p>}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100">
            <button onClick={handleReturn} disabled={isReturning || !selectedIssueId} className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {isReturning ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Return"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

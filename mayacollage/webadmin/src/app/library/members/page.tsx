"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, BookOpen, AlertCircle, ChevronDown, ChevronUp, Loader2
} from "lucide-react";

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library/members")
      .then(res => res.json())
      .then(data => {
        setMembers(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const filteredMembers = members.filter(m => 
    m.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    m.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    m.student?.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="text-violet-600" /> Library Members
          </h1>
          <p className="text-slate-500 font-medium mt-1">View student borrowing history and fines</p>
        </div>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No members found</h3>
            <p className="text-slate-500 mt-1">Students will appear here once they borrow a book.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member, i) => (
              <MemberCard 
                key={member.student?._id || i} 
                member={member} 
                isExpanded={expandedMemberId === member.student?._id}
                onToggle={() => setExpandedMemberId(expandedMemberId === member.student?._id ? null : member.student?._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, isExpanded, onToggle }: { member: any, isExpanded: boolean, onToggle: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-violet-200">
      <div 
        className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-black text-lg">
            {member.student?.firstName?.[0]}{member.student?.lastName?.[0]}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {member.student?.firstName} {member.student?.lastName}
            </h3>
            <p className="text-sm font-medium text-slate-500">ID: {member.student?.studentId || member.student?.enrollmentNo || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="block text-2xl font-black text-slate-700">{member.activeBorrows}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Books</span>
          </div>
          <div className="text-center">
            <span className={`block text-2xl font-black ${member.totalFines > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>₹{member.totalFines}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Fines</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50"
          >
            <div className="p-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Borrow History
              </h4>
              <div className="space-y-3">
                {member.history.map((hist: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div>
                      <p className="font-bold text-slate-800">{hist.book || 'Unknown Book'}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Issued: {new Date(hist.issueDate).toLocaleDateString()} • Due: {new Date(hist.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider mb-1 ${
                        hist.status === 'Returned' ? 'bg-emerald-100 text-emerald-700' : 
                        hist.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {hist.status}
                      </span>
                      {hist.fine > 0 && <p className="text-xs font-bold text-rose-500 flex items-center justify-end gap-1"><AlertCircle className="w-3 h-3" /> ₹{hist.fine} Fine</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

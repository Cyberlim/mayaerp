"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, 
  BookOpen, 
  BookPlus,
  BookCheck,
  BookX,
  AlertCircle, 
  IndianRupee,
  Search,
  Plus,
  UserCheck,
  RefreshCw,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Grid,
  List,
  MapPin,
  Calendar,
  CheckCircle2,
  Filter,
  X,
  Layers,
  ArrowRight,
  User
} from "lucide-react";

interface BookItem {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  total: number;
  available: number;
  shelf?: string;
  publisher?: string;
  price?: number;
  description?: string;
  remarks?: string;
  createdAt?: string;
}

interface CirculationRecord {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    admissionNumber?: string;
    email?: string;
    selectedProgram?: string;
    selectedBranch?: string;
    contactNumber?: string;
  };
  book: {
    _id: string;
    title: string;
    author: string;
    isbn?: string;
    category?: string;
    shelf?: string;
    price?: number;
    total?: number;
    available?: number;
  };
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Active' | 'Overdue' | 'Returned' | 'Lost';
  fine: number;
  isOverdue?: boolean;
  daysRemaining?: number;
  displayStatus?: string;
  remarks?: string;
}

export default function LibraryDashboard() {
  const [activeTab, setActiveTab] = useState<"catalog" | "circulation" | "issue" | "analytics">("catalog");
  const [stats, setStats] = useState<any>(null);
  const [circulation, setCirculation] = useState<CirculationRecord[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Catalog Filter / Search States
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState<"all" | "available" | "out">("all");
  const [catalogViewMode, setCatalogViewMode] = useState<"cards" | "table">("cards");

  // Circulation Filter / Search States
  const [circSearch, setCircSearch] = useState("");
  const [circStatusFilter, setCircStatusFilter] = useState<"all" | "Active" | "Overdue" | "Returned" | "Lost">("all");

  // Issue Desk State
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [issueBookId, setIssueBookId] = useState("");
  const [issueLoanDays, setIssueLoanDays] = useState(14);
  const [issueRemarks, setIssueRemarks] = useState("");

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [bookFormData, setBookFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "Computer Science & IT",
    total: 5,
    available: 5,
    shelf: "CS-Rack-A1",
    publisher: "",
    price: 500,
    description: "",
    remarks: ""
  });

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, circRes, booksRes] = await Promise.all([
        fetch("/api/library/stats"),
        fetch("/api/library/circulation?status=all"),
        fetch("/api/library/books")
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (circRes.ok) setCirculation(await circRes.json());
      if (booksRes.ok) setBooks(await booksRes.json());
    } catch (error) {
      console.error("Failed to fetch library data", error);
      showToast('error', 'Failed to load library database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => { if (b.category) set.add(b.category); });
    return ["All", ...Array.from(set)];
  }, [books]);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const q = catalogSearch.toLowerCase().trim();
      const matchesQuery = !q || 
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q)) ||
        (b.shelf && b.shelf.toLowerCase().includes(q)) ||
        (b.publisher && b.publisher.toLowerCase().includes(q));

      const matchesCat = selectedCategory === "All" || b.category === selectedCategory;
      const matchesStock = 
        stockFilter === "all" ? true :
        stockFilter === "available" ? b.available > 0 :
        b.available <= 0;

      return matchesQuery && matchesCat && matchesStock;
    });
  }, [books, catalogSearch, selectedCategory, stockFilter]);

  // Filtered Circulation
  const filteredCirculation = useMemo(() => {
    return circulation.filter(c => {
      const q = circSearch.toLowerCase().trim();
      const sName = `${c.student?.firstName || ''} ${c.student?.lastName || ''}`.toLowerCase();
      const sId = (c.student?.studentId || '').toLowerCase();
      const sAdm = (c.student?.admissionNumber || '').toLowerCase();
      const bTitle = (c.book?.title || '').toLowerCase();
      const bIsbn = (c.book?.isbn || '').toLowerCase();

      const matchesQuery = !q || sName.includes(q) || sId.includes(q) || sAdm.includes(q) || bTitle.includes(q) || bIsbn.includes(q);
      const matchesStatus = circStatusFilter === "all" || c.status === circStatusFilter || (circStatusFilter === 'Overdue' && c.displayStatus === 'Overdue');

      return matchesQuery && matchesStatus;
    });
  }, [circulation, circSearch, circStatusFilter]);

  // Quick Seed 10 Demo Books
  const handleSeedBooks = async () => {
    if (!confirm("Seed or update 10 curated university demo books in the database?")) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/library/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || "10 Demo books successfully populated in database!");
        await fetchData();
      } else {
        showToast('error', data.message || "Failed to seed demo books");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error seeding books");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Add Book Modal
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookFormData({
      title: "",
      author: "",
      isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: "Computer Science & IT",
      total: 5,
      available: 5,
      shelf: "CS-Rack-A1",
      publisher: "University Press",
      price: 650,
      description: "",
      remarks: "Curriculum Reference"
    });
    setShowBookModal(true);
  };

  // Open Edit Book Modal
  const handleOpenEditBook = (book: BookItem) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      category: book.category,
      total: book.total,
      available: book.available,
      shelf: book.shelf || "",
      publisher: book.publisher || "",
      price: book.price || 0,
      description: book.description || "",
      remarks: book.remarks || ""
    });
    setShowBookModal(true);
  };

  // Save Book (Add or Edit)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.title || !bookFormData.author) {
      alert("Please provide book title and author.");
      return;
    }

    try {
      setActionLoading(true);
      let res;
      if (editingBook) {
        res = await fetch("/api/library/books", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: editingBook._id,
            ...bookFormData,
            total: Number(bookFormData.total),
            available: Number(bookFormData.available),
            price: Number(bookFormData.price)
          })
        });
      } else {
        res = await fetch("/api/library/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...bookFormData,
            total: Number(bookFormData.total),
            available: Number(bookFormData.available),
            price: Number(bookFormData.price)
          })
        });
      }

      if (res.ok) {
        showToast('success', editingBook ? "Book details updated successfully!" : "New book cataloged successfully!");
        setShowBookModal(false);
        await fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.message || "Failed to save book");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error saving book");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Stock Adjustment (+1 or -1 copies)
  const handleAdjustStock = async (book: BookItem, delta: number) => {
    const newTotal = Math.max(1, book.total + delta);
    const newAvailable = Math.max(0, Math.min(newTotal, book.available + delta));

    try {
      const res = await fetch("/api/library/books", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: book._id,
          total: newTotal,
          available: newAvailable
        })
      });
      if (res.ok) {
        setBooks(prev => prev.map(b => b._id === book._id ? { ...b, total: newTotal, available: newAvailable } : b));
        showToast('info', `Stock updated for "${book.title}" (${newAvailable}/${newTotal} copies)`);
      }
    } catch (err) {
      showToast('error', "Failed to adjust stock");
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the library catalog?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/library/books/${bookId}`, { method: "DELETE" });
      if (res.ok) {
        showToast('success', `"${title}" was deleted from the catalog.`);
        await fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.message || "Failed to delete book");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error deleting book");
    } finally {
      setActionLoading(false);
    }
  };

  // Student Search in Issue Desk
  const handleStudentSearch = async () => {
    if (!studentSearchQuery.trim()) return;
    try {
      setStudentSearchLoading(true);
      const res = await fetch(`/api/library/students/search?q=${encodeURIComponent(studentSearchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setStudentSearchResults(data);
        if (data.length === 1) {
          setSelectedStudent(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('error', "Student lookup failed");
    } finally {
      setStudentSearchLoading(false);
    }
  };

  // Issue Book Handler
  const handleIssueBook = async () => {
    if (!selectedStudent || !issueBookId) {
      alert("Please select both a student and an available book.");
      return;
    }

    try {
      setActionLoading(true);
      const dueDate = new Date(Date.now() + issueLoanDays * 24 * 60 * 60 * 1000);
      const res = await fetch("/api/library/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent._id,
          bookId: issueBookId,
          dueDate: dueDate.toISOString(),
          remarks: issueRemarks
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || "Book successfully issued to student!");
        setSelectedStudent(null);
        setStudentSearchQuery("");
        setStudentSearchResults([]);
        setIssueBookId("");
        setIssueRemarks("");
        await fetchData();
        setActiveTab("circulation");
      } else {
        showToast('error', data.message || "Failed to issue book");
      }
    } catch (err: any) {
      showToast('error', err.message || "Issue transaction failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Return Book Handler
  const handleReturnBook = async (circulationId: string, bookTitle: string) => {
    if (!confirm(`Confirm return of "${bookTitle}"? Stock will be restored automatically.`)) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/library/return/${circulationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return" })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || `"${bookTitle}" returned successfully!`);
        await fetchData();
      } else {
        showToast('error', data.message || "Failed to record return");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error returning book");
    } finally {
      setActionLoading(false);
    }
  };

  // Renew Loan Handler
  const handleRenewLoan = async (circulationId: string, bookTitle: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/library/return/${circulationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew", days: 14 })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || `Loan renewed for 14 days!`);
        await fetchData();
      } else {
        showToast('error', data.message || "Failed to renew loan");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error renewing loan");
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Lost Handler
  const handleMarkLost = async (circulationId: string, bookTitle: string) => {
    const penaltyStr = prompt(`Mark "${bookTitle}" as LOST. Enter replacement / penalty fee in ₹:`, "500");
    if (penaltyStr === null) return;
    const penalty = Number(penaltyStr) || 500;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/library/return/${circulationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lost", fine: penalty })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('info', `Book marked as Lost. ₹${penalty} penalty registered.`);
        await fetchData();
      } else {
        showToast('error', data.message || "Failed to update record");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error updating record");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Issue from Catalog
  const handleStartIssueForBook = (bookId: string) => {
    setIssueBookId(bookId);
    setActiveTab("issue");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-sm tracking-wide animate-pulse">Synchronizing College Library & Catalog Database...</p>
      </div>
    );
  }

  // Summary Metrics
  const totalCatalogStock = stats?.totalStock || books.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalAvailable = stats?.availableBooksCount || books.reduce((acc, b) => acc + (b.available || 0), 0);
  const totalActiveIssues = circulation.filter(c => c.status === 'Active').length;
  const totalOverdue = circulation.filter(c => c.status === 'Overdue' || c.displayStatus === 'Overdue' || (c.status === 'Active' && new Date(c.dueDate) < new Date())).length;
  const totalFines = circulation.reduce((acc, c) => acc + (c.fine || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-sans text-slate-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border backdrop-blur-md ${
              toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
              toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-500' :
              'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-200" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-200" />}
            {toastMessage.type === 'info' && <Sparkles className="w-5 h-5 text-amber-200" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-rose-700 via-pink-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-rose-900/10 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-rose-100 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Maya College ERP
              </span>
              <span className="text-rose-200 text-xs font-semibold">• Central Library Control</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2">
              Library Management & Circulation Desk
            </h1>
            <p className="text-rose-100 font-medium max-w-2xl text-sm leading-relaxed">
              Complete catalog oversight, real-time book loan tracking, student issuance, barcode & shelf location mapping, and fine settlement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button 
              onClick={handleSeedBooks}
              disabled={actionLoading}
              title="Populate 10 high-quality college demo books across CS, AI, Mech, ECE, Civil, Math, Mgmt, & Pharmacy"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Seed 10 Demo Books</span>
            </button>

            <button 
              onClick={fetchData}
              disabled={actionLoading}
              className="p-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 rounded-2xl transition-all shadow-sm"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={handleOpenAddBook}
              className="px-5 py-2.5 bg-white text-rose-700 hover:bg-rose-50 active:scale-95 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-black/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher Bar */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/15">
          {[
            { id: "catalog", label: "Catalog & Books", icon: Book, badge: books.length },
            { id: "circulation", label: "Circulation & Loans", icon: BookCheck, badge: circulation.length },
            { id: "issue", label: "Fast Issue Desk", icon: UserCheck },
            { id: "analytics", label: "Shelf Map & Analytics", icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs lg:text-sm transition-all flex items-center gap-2.5 ${
                  isActive 
                    ? "bg-white text-rose-700 shadow-md scale-100 font-black" 
                    : "bg-white/10 text-white hover:bg-white/20 scale-95 hover:scale-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-rose-100 text-rose-700" : "bg-white/20 text-white"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Book className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{books.length} Titles</span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Total Physical Copies</p>
          <div className="text-2xl lg:text-3xl font-black text-slate-800">{totalCatalogStock}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <BookCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {totalCatalogStock ? Math.round((totalAvailable / totalCatalogStock) * 100) : 0}% In Shelf
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Available to Issue</p>
          <div className="text-2xl lg:text-3xl font-black text-emerald-600">{totalAvailable}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Currently Borrowed</p>
          <div className="text-2xl lg:text-3xl font-black text-indigo-600">{totalActiveIssues}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            {totalOverdue > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full animate-pulse">Action req.</span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Overdue Loans</p>
          <div className={`text-2xl lg:text-3xl font-black ${totalOverdue > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {totalOverdue}
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Dues</span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Accumulated Fines</p>
          <div className="text-2xl lg:text-3xl font-black text-purple-700">₹{totalFines.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* WORKSPACE TABS CONTENT */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: CATALOG & INVENTORY */}
        {activeTab === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filter and Search Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search by title, author, ISBN, shelf location..."
                  className="w-full bg-slate-50 border-0 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all"
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Category Select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none ring-2 ring-transparent focus:ring-rose-200 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c === 'All' ? 'All Disciplines' : c}</option>
                  ))}
                </select>

                {/* Stock Select */}
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none ring-2 ring-transparent focus:ring-rose-200 cursor-pointer"
                >
                  <option value="all">All Availability</option>
                  <option value="available">Available in Shelf Only</option>
                  <option value="out">Out of Stock Only</option>
                </select>

                {/* View Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button 
                    onClick={() => setCatalogViewMode("cards")}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${catalogViewMode === 'cards' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Card Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCatalogViewMode("table")}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${catalogViewMode === 'table' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Table Inventory View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Result Counter */}
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing {filteredBooks.length} of {books.length} Books
              </span>
              {(catalogSearch || selectedCategory !== "All" || stockFilter !== "all") && (
                <button 
                  onClick={() => { setCatalogSearch(""); setSelectedCategory("All"); setStockFilter("all"); }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Empty State */}
            {filteredBooks.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <BookX className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">No Matching Books Found</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Try adjusting your search criteria or add new titles to the central university catalog.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button 
                    onClick={handleSeedBooks}
                    className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Seed 10 Demo Books
                  </button>
                  <button 
                    onClick={handleOpenAddBook}
                    className="px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Book
                  </button>
                </div>
              </div>
            )}

            {/* CARDS VIEW */}
            {catalogViewMode === "cards" && filteredBooks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => {
                  const isOutOfStock = book.available <= 0;
                  const percentAvailable = book.total > 0 ? Math.round((book.available / book.total) * 100) : 0;

                  return (
                    <motion.div 
                      key={book._id}
                      layout
                      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold tracking-wide">
                            {book.category}
                          </span>
                          <span className={`px-3 py-1 rounded-xl text-[11px] font-black tracking-wide ${
                            isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : `${book.available} / ${book.total} Available`}
                          </span>
                        </div>

                        {/* Title & Author */}
                        <h3 className="text-base font-black text-slate-800 leading-snug mb-1 group-hover:text-rose-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mb-3">
                          By <span className="text-slate-700">{book.author}</span>
                        </p>

                        {/* Description snippet */}
                        {book.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                            {book.description}
                          </p>
                        )}

                        {/* Key Specs Matrix */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl mb-4 font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="text-[11px] truncate font-bold text-slate-800">{book.shelf || 'Unassigned'}</span>
                          </div>
                          <div className="text-right text-[11px] font-mono text-slate-500 truncate">
                            {book.isbn || 'No ISBN'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {book.publisher || 'Maya Publications'}
                          </div>
                          <div className="text-right text-[11px] font-bold text-slate-800">
                            ₹{book.price || 0}
                          </div>
                        </div>

                        {/* Availability Bar */}
                        <div className="space-y-1 mb-4">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Shelf Storage</span>
                            <span className={percentAvailable > 20 ? 'text-emerald-600' : 'text-rose-600'}>
                              {percentAvailable}% In Stock
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                percentAvailable > 50 ? 'bg-emerald-500' :
                                percentAvailable > 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${percentAvailable}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Stock +/- Stepper */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button 
                            onClick={() => handleAdjustStock(book, -1)}
                            disabled={book.available <= 0}
                            title="Decrease available stock by 1"
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="text-xs font-black px-1.5 text-slate-800">{book.available}</span>
                          <button 
                            onClick={() => handleAdjustStock(book, 1)}
                            title="Increase available stock by 1"
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleOpenEditBook(book)}
                            title="Edit Book Details"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDeleteBook(book._id, book.title)}
                            title="Delete Book"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleStartIssueForBook(book._id)}
                            disabled={isOutOfStock}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-rose-50 disabled:hover:text-rose-700 flex items-center gap-1.5"
                          >
                            <span>Issue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* TABLE VIEW */}
            {catalogViewMode === "table" && filteredBooks.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Title & Author</th>
                        <th className="py-4 px-4">Category</th>
                        <th className="py-4 px-4">ISBN</th>
                        <th className="py-4 px-4">Shelf Location</th>
                        <th className="py-4 px-4 text-center">Total / Available</th>
                        <th className="py-4 px-4">Price</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredBooks.map((book) => (
                        <tr key={book._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-black text-slate-800 text-sm">{book.title}</p>
                            <p className="text-xs font-semibold text-slate-500">{book.author}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                              {book.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs text-slate-500">{book.isbn || 'N/A'}</td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold">
                              {book.shelf || 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              book.available > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {book.available} / {book.total}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">₹{book.price || 0}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleStartIssueForBook(book._id)}
                                disabled={book.available <= 0}
                                className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-30"
                              >
                                Issue
                              </button>
                              <button 
                                onClick={() => handleOpenEditBook(book)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBook(book._id, book.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: CIRCULATION & ACTIVE LOANS */}
        {activeTab === "circulation" && (
          <motion.div
            key="circulation"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search & Status Filter */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={circSearch}
                  onChange={(e) => setCircSearch(e.target.value)}
                  placeholder="Filter student name, ID, book title..."
                  className="w-full bg-slate-50 border-0 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {[
                  { id: "all", label: "All Records" },
                  { id: "Active", label: "Active Loans" },
                  { id: "Overdue", label: "Overdue Dues" },
                  { id: "Returned", label: "Returned History" }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setCircStatusFilter(st.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      circStatusFilter === st.id 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of Circulation */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Student Dossier</th>
                      <th className="py-4 px-4">Issued Book</th>
                      <th className="py-4 px-4">Issue Date</th>
                      <th className="py-4 px-4">Due Date</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Overdue Fine</th>
                      <th className="py-4 px-6 text-right">Circulation Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredCirculation.length > 0 ? (
                      filteredCirculation.map((issue) => {
                        const isReturned = issue.status === 'Returned';
                        const isOverdue = issue.status === 'Overdue' || issue.displayStatus === 'Overdue' || (!isReturned && new Date(issue.dueDate) < new Date());
                        
                        return (
                          <tr key={issue._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-sm border border-indigo-100">
                                  {issue.student?.firstName?.[0] || 'S'}
                                </div>
                                <div>
                                  <p className="font-black text-slate-800 text-sm">
                                    {issue.student?.firstName} {issue.student?.lastName}
                                  </p>
                                  <p className="text-xs font-semibold text-slate-400">
                                    ID: {issue.student?.studentId || issue.student?.admissionNumber || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800 text-sm max-w-xs truncate">
                                {issue.book?.title || 'Unknown Title'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                <span>Shelf: <strong className="text-slate-600">{issue.book?.shelf || 'N/A'}</strong></span>
                                <span>•</span>
                                <span className="font-mono">{issue.book?.isbn || ''}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-xs font-medium text-slate-600">
                              {new Date(issue.issueDate).toLocaleDateString()}
                            </td>

                            <td className="py-4 px-4">
                              <span className={`text-xs font-bold block ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                                {new Date(issue.dueDate).toLocaleDateString()}
                              </span>
                              {!isReturned && (
                                <span className={`text-[10px] font-semibold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                  {isOverdue ? 'Expired Due Date' : `${issue.daysRemaining || 0} days remaining`}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                isReturned ? 'bg-slate-100 text-slate-700' :
                                isOverdue ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                issue.status === 'Lost' ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isReturned ? 'Returned' : isOverdue ? 'Overdue' : issue.status}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-black">
                              {(issue.fine || 0) > 0 ? (
                                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                                  ₹{issue.fine}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">₹0 (Nil)</span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {!isReturned ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleReturnBook(issue._id, issue.book?.title)}
                                    disabled={actionLoading}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1"
                                  >
                                    <BookCheck className="w-3.5 h-3.5" />
                                    <span>Return</span>
                                  </button>

                                  <button
                                    onClick={() => handleRenewLoan(issue._id, issue.book?.title)}
                                    disabled={actionLoading}
                                    title="Renew for 14 days"
                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
                                  >
                                    Renew
                                  </button>

                                  <button
                                    onClick={() => handleMarkLost(issue._id, issue.book?.title)}
                                    disabled={actionLoading}
                                    title="Mark Lost & apply fine"
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all"
                                  >
                                    Lost
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  Returned on {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : 'Record'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                          No circulation records matching current criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: FAST ISSUE DESK */}
        {activeTab === "issue" && (
          <motion.div
            key="issue"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Step 1: Student Lookup */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-6">
              <div>
                <span className="text-xs font-black text-rose-600 uppercase tracking-wider block mb-1">Step 1</span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select Student</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Search by Admission Number, Student ID, or Student Name
                </p>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
                  placeholder="e.g. BPH23001, Abhishek, or admission no..."
                  className="flex-1 bg-slate-50 border-0 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all"
                />
                <button 
                  onClick={handleStudentSearch}
                  disabled={studentSearchLoading || !studentSearchQuery.trim()}
                  className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>

              {/* Student Search Candidates */}
              {studentSearchResults.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Found Candidates:</p>
                  {studentSearchResults.map((st) => (
                    <div 
                      key={st._id}
                      onClick={() => setSelectedStudent(st)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedStudent?._id === st._id 
                          ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-300' 
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <h4 className="font-black text-slate-800 text-sm">{st.firstName} {st.lastName}</h4>
                        <p className="text-xs text-slate-500 font-medium">ID: {st.studentId || st.admissionNumber}</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600">{st.email}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Student Card Dossier */}
              {selectedStudent && (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center">
                      {selectedStudent.firstName?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base">
                          {selectedStudent.firstName} {selectedStudent.lastName}
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                          Verified Student
                        </span>
                      </div>
                      <p className="text-xs font-bold text-emerald-800">
                        Student ID: {selectedStudent.studentId || selectedStudent.admissionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/60 font-semibold text-emerald-900">
                    <div>Email: <span className="font-bold">{selectedStudent.email}</span></div>
                    <div className="text-right">Active Loans: <span className="font-bold">
                      {circulation.filter(c => c.student?._id === selectedStudent._id && c.status === 'Active').length}
                    </span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 & 3: Book Selection & Terms */}
            <div className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-6 transition-opacity ${
              !selectedStudent ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <div>
                <span className="text-xs font-black text-rose-600 uppercase tracking-wider block mb-1">Step 2 & 3</span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select Book & Loan Terms</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Choose an available title from the central catalog and specify duration
                </p>
              </div>

              {/* Book Select Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Available Book *</label>
                <select 
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all cursor-pointer"
                >
                  <option value="">-- Choose an available book from catalog --</option>
                  {books.filter(b => b.available > 0).map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.title} — Shelf: {b.shelf || 'N/A'} ({b.available} copies free)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Book Quick Preview */}
              {issueBookId && (() => {
                const book = books.find(b => b._id === issueBookId);
                if (!book) return null;
                return (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1 text-xs">
                    <p className="font-black text-slate-800 text-sm">{book.title}</p>
                    <p className="text-slate-500 font-semibold">Author: {book.author}</p>
                    <div className="flex gap-4 pt-1 text-[11px] font-bold text-slate-600">
                      <span>ISBN: {book.isbn || 'N/A'}</span>
                      <span>Shelf: <strong className="text-rose-600">{book.shelf || 'N/A'}</strong></span>
                      <span>Price: ₹{book.price || 0}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Loan Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Loan Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: 7, label: "7 Days" },
                    { days: 14, label: "14 Days (Standard)" },
                    { days: 21, label: "21 Days" },
                    { days: 30, label: "30 Days (Semester)" }
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setIssueLoanDays(p.days)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        issueLoanDays === p.days 
                          ? 'border-rose-600 bg-rose-50 text-rose-700 font-black' 
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Due date will be set to: <strong>{new Date(Date.now() + issueLoanDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
                </p>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Admin Remarks (Optional)</label>
                <input 
                  type="text"
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  placeholder="e.g. Reference for Mid-term Exam project"
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                />
              </div>

              {/* Submit Button */}
              <button 
                onClick={handleIssueBook}
                disabled={actionLoading || !issueBookId || !selectedStudent}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 active:scale-98 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <BookCheck className="w-5 h-5" />
                <span>Confirm & Issue Book to Student</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 4: SHELF MAP & ANALYTICS */}
        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Top Row: Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Category distribution */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Discipline Stock Distribution</h3>
                  <p className="text-xs text-slate-400 font-medium">Breakdown of books by academic field & faculty</p>
                </div>

                <div className="space-y-4">
                  {categories.filter(c => c !== "All").map((cat) => {
                    const catBooks = books.filter(b => b.category === cat);
                    const catStock = catBooks.reduce((acc, b) => acc + (b.total || 0), 0);
                    const catPercent = totalCatalogStock > 0 ? Math.round((catStock / totalCatalogStock) * 100) : 0;

                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{cat} ({catBooks.length} Titles)</span>
                          <span className="text-slate-500 font-mono">{catStock} Copies ({catPercent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${Math.max(5, catPercent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shelf Inventory Map */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Physical Shelf Location Matrix</h3>
                  <p className="text-xs text-slate-400 font-medium">Mapped shelf aisles in Central Library</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from(new Set(books.map(b => b.shelf || 'Unassigned'))).map((sh) => {
                    const shelfBooks = books.filter(b => (b.shelf || 'Unassigned') === sh);
                    const shelfTotal = shelfBooks.reduce((acc, b) => acc + b.total, 0);
                    const shelfAvail = shelfBooks.reduce((acc, b) => acc + b.available, 0);

                    return (
                      <div key={sh} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-600 font-black text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{sh}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700">{shelfBooks.length} Titles</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {shelfAvail} / {shelfTotal} Copies Ready
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ADD / EDIT BOOK MODAL */}
      <AnimatePresence>
        {showBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center pb-6 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {editingBook ? "Edit Book Catalog Details" : "Add New Book to Central Library"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Maintain accurate university catalog, ISBN barcode, and physical shelf coordinates
                  </p>
                </div>
                <button 
                  onClick={() => setShowBookModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBook} className="space-y-4 text-xs font-bold text-slate-700">
                {/* Title */}
                <div>
                  <label className="block mb-1">Book Title *</label>
                  <input 
                    type="text"
                    required
                    value={bookFormData.title}
                    onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                  />
                </div>

                {/* Author & ISBN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Author(s) *</label>
                    <input 
                      type="text"
                      required
                      value={bookFormData.author}
                      onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                      placeholder="e.g. Thomas H. Cormen"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">ISBN / Barcode</label>
                    <input 
                      type="text"
                      value={bookFormData.isbn}
                      onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                      placeholder="e.g. 978-0262033848"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                    />
                  </div>
                </div>

                {/* Category & Shelf */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Discipline / Category *</label>
                    <select
                      value={bookFormData.category}
                      onChange={(e) => setBookFormData({ ...bookFormData, category: e.target.value })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200 cursor-pointer"
                    >
                      <option value="Computer Science & IT">Computer Science & IT</option>
                      <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical & Electronics">Electrical & Electronics</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Management & Business">Management & Business</option>
                      <option value="Pharmacy & Medical Sciences">Pharmacy & Medical Sciences</option>
                      <option value="General Reference">General Reference</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Shelf Location Code</label>
                    <input 
                      type="text"
                      value={bookFormData.shelf}
                      onChange={(e) => setBookFormData({ ...bookFormData, shelf: e.target.value })}
                      placeholder="e.g. CS-Rack-A1, MECH-Rack-C2"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                    />
                  </div>
                </div>

                {/* Stock copies & Price */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">Total Copies *</label>
                    <input 
                      type="number"
                      min={1}
                      required
                      value={bookFormData.total}
                      onChange={(e) => setBookFormData({ ...bookFormData, total: Number(e.target.value) })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Available Copies *</label>
                    <input 
                      type="number"
                      min={0}
                      max={bookFormData.total}
                      required
                      value={bookFormData.available}
                      onChange={(e) => setBookFormData({ ...bookFormData, available: Number(e.target.value) })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Price (₹)</label>
                    <input 
                      type="number"
                      min={0}
                      value={bookFormData.price}
                      onChange={(e) => setBookFormData({ ...bookFormData, price: Number(e.target.value) })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                    />
                  </div>
                </div>

                {/* Publisher */}
                <div>
                  <label className="block mb-1">Publisher & Edition</label>
                  <input 
                    type="text"
                    value={bookFormData.publisher}
                    onChange={(e) => setBookFormData({ ...bookFormData, publisher: e.target.value })}
                    placeholder="e.g. MIT Press, 4th Edition"
                    className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1">Syllabus Overview / Description</label>
                  <textarea 
                    rows={3}
                    value={bookFormData.description}
                    onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                    placeholder="Provide a brief summary of subjects and modules covered..."
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-xs font-semibold text-slate-800 outline-none ring-2 ring-transparent focus:ring-rose-200"
                  />
                </div>

                {/* Submit & Cancel */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-black shadow-lg shadow-rose-600/20 transition-all"
                  >
                    {actionLoading ? "Saving..." : editingBook ? "Update Book" : "Add to Catalog"}
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

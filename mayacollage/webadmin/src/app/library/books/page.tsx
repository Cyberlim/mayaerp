"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Library, Plus, Search, BookOpen, 
  Edit, Trash2, X, Loader2, RefreshCw, AlertTriangle
} from "lucide-react";

export default function BookCatalog() {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/library/books");
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch books", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the library?`)) return;
    try {
      const res = await fetch(`/api/library/books?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBooks(prev => prev.filter(b => b._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete book");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting book");
    }
  };

  const handleClearAllBooks = async () => {
    if (!confirm("Are you sure you want to remove ALL books from the library? This will clear the entire book catalog so you can update fresh books.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/library/books?all=true", { method: "DELETE" });
      if (res.ok) {
        setBooks([]);
        alert("All books have been successfully removed from the library catalog.");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to clear library books");
      }
    } catch (err) {
      console.error(err);
      alert("Error clearing library catalog");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title?.toLowerCase().includes(search.toLowerCase()) || 
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Library className="text-violet-600" /> Book Catalog
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage library inventory, update books, and assign shelves</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title, author, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl outline-none transition-all text-sm font-medium"
            />
          </div>

          {books.length > 0 && (
            <button
              onClick={handleClearAllBooks}
              disabled={isDeleting}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 text-sm disabled:opacity-50"
              title="Remove all books from library"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Clear All
            </button>
          )}

          <button 
            onClick={() => {
              setEditingBook(null);
              setIsModalOpen(true);
            }}
            className="flex-shrink-0 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Book
          </button>
        </div>
      </div>

      <div className="px-8 mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto p-8">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-100">
              <BookOpen className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Library Catalog is Empty</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
              All previous books have been cleared. As the librarian, you can now add and update your catalog with fresh books, ISBNs, quantities, and shelf locations.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button 
                onClick={() => {
                  setEditingBook(null);
                  setIsModalOpen(true);
                }}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Add First Book
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredBooks.map((book) => (
                <BookCard 
                  key={book._id} 
                  book={book} 
                  onEdit={() => {
                    setEditingBook(book);
                    setIsModalOpen(true);
                  }}
                  onDelete={() => handleDeleteBook(book._id, book.title)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddBookModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingBook(null);
        }} 
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingBook(null);
          fetchBooks();
        }}
        initialData={editingBook}
      />
    </div>
  );
}

function BookCard({ book, onEdit, onDelete }: { book: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 group hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-16 bg-violet-50 rounded-lg border border-violet-100 flex items-center justify-center text-violet-500 shrink-0 shadow-sm font-bold text-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onEdit} 
              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Edit Book"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete} 
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Book"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <h3 className="font-bold text-slate-900 text-base leading-snug mb-1 line-clamp-2" title={book.title}>
          {book.title}
        </h3>
        <p className="text-xs font-medium text-slate-500 mb-4">{book.author}</p>
        
        <div className="space-y-1.5 mb-6 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">ISBN</span>
            <span className="text-slate-700 font-mono font-semibold">{book.isbn || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Category</span>
            <span className="text-slate-700 font-semibold">{book.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Shelf</span>
            <span className="text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{book.shelf || 'Unassigned'}</span>
          </div>
          {book.price > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Price</span>
              <span className="text-slate-700 font-semibold">₹{book.price}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${book.available > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-sm font-bold text-slate-700">
            {book.available} <span className="font-medium text-slate-400">/ {book.total}</span>
          </span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
          book.available > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
        }`}>
          {book.available > 0 ? 'Available' : 'Out of Stock'}
        </span>
      </div>
    </motion.div>
  );
}

function AddBookModal({ isOpen, onClose, onSuccess, initialData }: any) {
  const [formData, setFormData] = useState({
    title: "", 
    author: "", 
    isbn: "", 
    category: "General", 
    total: 1, 
    available: 1, 
    shelf: "",
    publisher: "",
    price: 0,
    description: "",
    remarks: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        author: initialData.author || "",
        isbn: initialData.isbn || "",
        category: initialData.category || "General",
        total: initialData.total !== undefined ? initialData.total : 1,
        available: initialData.available !== undefined ? initialData.available : 1,
        shelf: initialData.shelf || "",
        publisher: initialData.publisher || "",
        price: initialData.price || 0,
        description: initialData.description || "",
        remarks: initialData.remarks || ""
      });
    } else {
      setFormData({
        title: "", 
        author: "", 
        isbn: "", 
        category: "General", 
        total: 1, 
        available: 1, 
        shelf: "",
        publisher: "",
        price: 0,
        description: "",
        remarks: ""
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEdit = !!initialData;
      const payload: any = {
        ...formData,
        total: Number(formData.total) || 1,
        available: Math.min(Number(formData.total) || 1, Number(formData.available) || 1),
        price: Number(formData.price) || 0
      };

      if (isEdit) {
        payload._id = initialData._id;
      }

      const res = await fetch("/api/library/books", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSuccess();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to save book");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving book");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Library className="text-violet-600 w-5 h-5" /> {initialData ? 'Update Book Details' : 'Add New Book'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="addBookForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Book Title <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="e.g. Introduction to Algorithms" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Author(s) <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="e.g. Thomas H. Cormen" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">ISBN</label>
                <input type="text" placeholder="e.g. 978-0262046305" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800">
                  <option>General</option>
                  <option>Computer Science & IT</option>
                  <option>Artificial Intelligence & ML</option>
                  <option>Mechanical Engineering</option>
                  <option>Civil Engineering</option>
                  <option>Electrical & Electronics</option>
                  <option>Pharmacy & Health Sciences</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Management & Business</option>
                  <option>Literature & Humanities</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Total Copies <span className="text-red-500">*</span></label>
                <input required type="number" min="1" value={formData.total} onChange={e => {
                  const tot = parseInt(e.target.value) || 1;
                  setFormData(prev => ({
                    ...prev, 
                    total: tot,
                    available: Math.min(prev.available, tot)
                  }));
                }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Available Copies</label>
                <input type="number" min="0" max={formData.total} value={formData.available} onChange={e => setFormData({...formData, available: Math.min(formData.total, parseInt(e.target.value) || 0)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Shelf Location</label>
                <input type="text" placeholder="e.g. CS-Rack-A1" value={formData.shelf} onChange={e => setFormData({...formData, shelf: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Publisher</label>
                <input type="text" placeholder="e.g. MIT Press" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price (₹)</label>
                <input type="number" min="0" placeholder="e.g. 850" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Remarks / Prescribed For</label>
              <input type="text" placeholder="e.g. Prescribed for 2nd Year B.Tech CSE" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description / Summary</label>
              <textarea rows={2} placeholder="Brief summary of the book contents..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium text-sm text-slate-800 resize-none" />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" form="addBookForm" disabled={isSubmitting} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 disabled:opacity-70 text-sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
            {initialData ? 'Update Book' : 'Save Book'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

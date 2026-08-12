"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Library, Plus, Search, BookOpen, 
  MoreVertical, Edit, Trash2, X, Loader2
} from "lucide-react";

export default function BookCatalog() {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
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

  const filteredBooks = books.filter(b => 
    b.title?.toLowerCase().includes(search.toLowerCase()) || 
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Library className="text-violet-600" /> Book Catalog
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage library inventory and shelves</p>
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
          <button 
            onClick={() => setIsAddModalOpen(true)}
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
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No books found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search or add a new book.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddBookModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchBooks();
        }}
      />
    </div>
  );
}

function BookCard({ book }: { book: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 group hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
          <BookOpen className="w-6 h-6" />
        </div>
        <button className="text-slate-400 hover:text-slate-700 p-1">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      
      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 line-clamp-2" title={book.title}>
        {book.title}
      </h3>
      <p className="text-sm font-medium text-slate-500 mb-4">{book.author}</p>
      
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400 uppercase tracking-wider">ISBN</span>
          <span className="text-slate-700">{book.isbn || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400 uppercase tracking-wider">Category</span>
          <span className="text-slate-700">{book.category}</span>
        </div>
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400 uppercase tracking-wider">Shelf</span>
          <span className="text-slate-700">{book.shelf || 'Unassigned'}</span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${book.available > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-sm font-bold text-slate-700">
            {book.available} <span className="font-medium text-slate-400">/ {book.total}</span>
          </span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
          book.available > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {book.available > 0 ? 'Available' : 'Out of Stock'}
        </span>
      </div>
    </motion.div>
  );
}

function AddBookModal({ isOpen, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: "", author: "", isbn: "", category: "General", total: 1, shelf: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/library/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) onSuccess();
    } catch (err) {
      console.error(err);
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
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Library className="text-violet-600 w-5 h-5" /> Add New Book
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="addBookForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Author</label>
              <input required type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ISBN</label>
                <input type="text" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium appearance-none">
                  <option>General</option>
                  <option>Computer Science</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Literature</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Copies</label>
                <input required type="number" min="1" value={formData.total} onChange={e => setFormData({...formData, total: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Shelf Location</label>
                <input type="text" placeholder="e.g. A-12" value={formData.shelf} onChange={e => setFormData({...formData, shelf: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white outline-none transition-all font-medium" />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Cancel
          </button>
          <button type="submit" form="addBookForm" disabled={isSubmitting} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 disabled:opacity-70">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save Book
          </button>
        </div>
      </motion.div>
    </div>
  );
}

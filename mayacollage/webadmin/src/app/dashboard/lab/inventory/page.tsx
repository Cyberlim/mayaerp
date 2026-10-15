"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, PackageSearch, Loader2, AlertCircle, Search, Zap, RefreshCw, Layers } from "lucide-react";

export default function InventoryManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [itemName, setItemName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [category, setCategory] = useState("Equipment");
  const [quantity, setQuantity] = useState("1");
  const [lab, setLab] = useState("");
  const [condition, setCondition] = useState("Good");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  // 0ms Cache Hydration on mount
  useEffect(() => {
    try {
      const cachedInv = localStorage.getItem("maya_lab_inventory_cache");
      const cachedLabs = localStorage.getItem("maya_labs_cache");
      if (cachedInv) {
        const parsed = JSON.parse(cachedInv);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setFromCache(true);
          setIsLoading(false);
        }
      }
      if (cachedLabs) {
        setLabs(JSON.parse(cachedLabs));
      }
    } catch (_) {}

    fetchData(false);
  }, [search, selectedLab]);

  const fetchData = async (showRefresh = true) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      let url = "/api/lab-inventory?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedLab) url += `lab=${encodeURIComponent(selectedLab)}&`;

      const [itemsRes, labsRes] = await Promise.all([
        fetch(url),
        fetch("/api/labs")
      ]);
      const itemsData = await itemsRes.json();
      const labsData = await labsRes.json();
      
      const invList = Array.isArray(itemsData) ? itemsData : [];
      const labList = Array.isArray(labsData) ? labsData : [];

      setItems(invList);
      if (labList.length > 0) setLabs(labList);

      try {
        localStorage.setItem("maya_lab_inventory_cache", JSON.stringify(invList));
        if (labList.length > 0) localStorage.setItem("maya_labs_cache", JSON.stringify(labList));
        sessionStorage.setItem("maya_lab_inventory_cache", JSON.stringify(invList));
      } catch (_) {}
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const openModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.itemName || "");
      setItemCode(item.itemCode || "");
      setCategory(item.category || "Equipment");
      setQuantity((item.quantity || 1).toString());
      setLab(typeof item.lab === 'object' ? (item.lab?.id || item.lab?._id) : (item.lab || ""));
      setCondition(item.condition || "Good");
      setLowStockThreshold((item.lowStockThreshold || 5).toString());
    } else {
      setEditingItem(null);
      setItemName("");
      setItemCode("");
      setCategory("Equipment");
      setQuantity("1");
      setLab(labs.length > 0 ? (labs[0].id || labs[0]._id) : "");
      setCondition("Good");
      setLowStockThreshold("5");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        itemName, 
        itemCode, 
        category, 
        quantity: parseInt(quantity) || 1, 
        lab, 
        condition, 
        lowStockThreshold: parseInt(lowStockThreshold) || 5
      };
      
      const itemId = editingItem?.id || editingItem?._id;
      const url = editingItem ? `/api/lab-inventory/${itemId}` : "/api/lab-inventory";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        const savedItem = data.item;

        // Optimistic local cache update
        setItems(prev => {
          let updated;
          if (editingItem) {
            updated = prev.map(it => (it.id === itemId || it._id === itemId) ? { ...it, ...savedItem } : it);
          } else {
            updated = [savedItem, ...prev];
          }
          try {
            localStorage.setItem("maya_lab_inventory_cache", JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });

        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.message || "An error occurred");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: any) => {
    const id = item.id || item._id;
    if (confirm(`Are you sure you want to delete ${item.itemName}?`)) {
      setItems(prev => {
        const updated = prev.filter(it => (it.id !== id && it._id !== id));
        try {
          localStorage.setItem("maya_lab_inventory_cache", JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      await fetch(`/api/lab-inventory/${id}`, { method: "DELETE" });
    }
  };

  const filteredItems = items.filter(it => {
    if (selectedCategory !== "All" && it.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="font-sans text-slate-800 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Stock</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{fromCache ? "0ms Instant Cache" : "PostgreSQL • Neon"}</span>
            </span>
          </div>
          <p className="text-slate-500 font-medium mt-1">Track precision equipment, microcontrollers, chemicals, and consumable assets</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl shadow-sm transition-all"
            title="Refresh from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search items by name or SKU code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedLab} 
            onChange={(e) => setSelectedLab(e.target.value)}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold"
          >
            <option value="">All Labs</option>
            {labs.map(l => {
              const lid = l.id || l._id;
              return <option key={lid} value={lid}>{l.labName} ({l.roomNumber})</option>;
            })}
          </select>

          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold"
          >
            <option value="All">All Categories</option>
            <option value="Equipment">Equipment</option>
            <option value="Electronics">Electronics</option>
            <option value="Microcontroller">Microcontroller</option>
            <option value="Computer">Computer</option>
            <option value="Chemical">Chemical</option>
            <option value="Consumable">Consumable</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <InventorySkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <PackageSearch className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">No inventory items found.</p>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or add a new equipment item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-6 py-4 border-b border-slate-100">Item Name & SKU</th>
                  <th className="px-6 py-4 border-b border-slate-100">Facility / Room</th>
                  <th className="px-6 py-4 border-b border-slate-100">Category</th>
                  <th className="px-6 py-4 border-b border-slate-100">Stock (Available / Total)</th>
                  <th className="px-6 py-4 border-b border-slate-100">Condition</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const itemId = item.id || item._id;
                  const labTitle = typeof item.lab === 'object' ? item.lab?.labName : item.lab;
                  const roomStr = typeof item.lab === 'object' && item.lab?.roomNumber ? `(${item.lab.roomNumber})` : '';

                  return (
                    <motion.tr 
                      key={itemId || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.02 * idx }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        <div className="text-[11px] font-mono font-bold text-slate-400 mt-0.5 tracking-wider uppercase">
                          {item.itemCode || 'NO-CODE'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {labTitle || 'Unallocated'} <span className="text-slate-400 text-xs font-normal">{roomStr}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2 font-bold">
                          <span className={item.availableQuantity <= (item.lowStockThreshold || 5) ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                            {item.availableQuantity}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-600">{item.quantity}</span>
                          {item.availableQuantity <= (item.lowStockThreshold || 5) && (
                            <span title="Low stock alert" className="inline-flex items-center text-rose-500">
                              <AlertCircle className="w-4 h-4 ml-1" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          item.condition === 'Good' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          item.condition === 'Needs Repair' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors ml-1" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-black text-slate-900">{editingItem ? "Edit Asset" : "Add Inventory Asset"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="inventoryForm" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Name</label>
                      <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" placeholder="e.g. Oscilloscope" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Code (SKU)</label>
                      <input type="text" value={itemCode} onChange={e => setItemCode(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold font-mono" placeholder="e.g. OSC-001" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
                      <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                        <option value="Equipment">Equipment</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Microcontroller">Microcontroller</option>
                        <option value="Chemical">Chemical</option>
                        <option value="Computer">Computer</option>
                        <option value="Consumable">Consumable</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Total Quantity</label>
                      <input type="number" required min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assign to Facility</label>
                    <select required value={lab} onChange={e => setLab(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                      <option value="">Select Lab</option>
                      {labs.map(l => {
                        const lid = l.id || l._id;
                        return <option key={lid} value={lid}>{l.labName} (Room {l.roomNumber})</option>;
                      })}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Condition</label>
                      <select required value={condition} onChange={e => setCondition(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold">
                        <option value="Good">Good</option>
                        <option value="Needs Repair">Needs Repair</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Lost">Lost</option>
                        <option value="Disposed">Disposed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Low Stock Threshold</label>
                      <input type="number" required min="1" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-semibold" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" form="inventoryForm" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-70 transition-colors text-sm shadow-md shadow-blue-500/20">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "Save Changes" : "Add to Stock"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div className="p-4 divide-y divide-slate-100 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="py-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-100 rounded w-24" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-36" />
          <div className="h-5 bg-slate-100 rounded-md w-20" />
          <div className="h-4 bg-slate-100 rounded w-16" />
          <div className="h-5 bg-slate-100 rounded-md w-16" />
          <div className="h-6 bg-slate-100 rounded w-12" />
        </div>
      ))}
    </div>
  );
}

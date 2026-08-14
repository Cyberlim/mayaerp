"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, PackageSearch, Loader2, AlertCircle } from "lucide-react";
import dayjs from "dayjs";

export default function InventoryManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  
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

  useEffect(() => {
    fetchData();
  }, [search, selectedLab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let url = "/api/lab-inventory?";
      if (search) url += `search=${search}&`;
      if (selectedLab) url += `lab=${selectedLab}&`;

      const [itemsRes, labsRes] = await Promise.all([
        fetch(url),
        fetch("/api/labs")
      ]);
      const itemsData = await itemsRes.json();
      const labsData = await labsRes.json();
      
      setItems(Array.isArray(itemsData) ? itemsData : []);
      if(labs.length === 0) setLabs(Array.isArray(labsData) ? labsData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.itemName);
      setItemCode(item.itemCode || "");
      setCategory(item.category);
      setQuantity(item.quantity.toString());
      setLab(item.lab?._id || item.lab || "");
      setCondition(item.condition);
      setLowStockThreshold((item.lowStockThreshold || 5).toString());
    } else {
      setEditingItem(null);
      setItemName("");
      setItemCode("");
      setCategory("Equipment");
      setQuantity("1");
      setLab(labs.length > 0 ? labs[0]._id : "");
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
        itemName, itemCode, category, quantity: parseInt(quantity), lab, condition, lowStockThreshold: parseInt(lowStockThreshold)
      };
      
      const url = editingItem ? `/api/lab-inventory/${editingItem._id}` : "/api/lab-inventory";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await fetch(`/api/lab-inventory/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  return (
    <div className="font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Inventory Stock</h1>
          <p className="text-slate-500 font-medium">Track equipment, materials, and consumables</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Item
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Search items by name or code..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all"
        />
        <select 
          value={selectedLab} 
          onChange={(e) => setSelectedLab(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all"
        >
          <option value="">All Labs</option>
          {labs.map(l => (
            <option key={l._id} value={l._id}>{l.labName}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <PackageSearch className="w-12 h-12 mb-3 text-slate-300" />
            <p>No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Item Name</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Lab</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Category</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Stock (Available / Total)</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Condition</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.itemName}</div>
                      <div className="text-xs text-slate-500 mt-1 uppercase">{item.itemCode || 'NO-CODE'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{item.lab?.labName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2 font-bold">
                        <span className={item.availableQuantity <= item.lowStockThreshold ? "text-rose-600" : "text-emerald-600"}>
                          {item.availableQuantity}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-600">{item.quantity}</span>
                        {item.availableQuantity <= item.lowStockThreshold && (
                          <AlertCircle className="w-4 h-4 text-rose-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        item.condition === 'Good' ? 'bg-emerald-50 text-emerald-600' :
                        item.condition === 'Needs Repair' ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors ml-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">{editingItem ? "Edit Item" : "Add Inventory Item"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="inventoryForm" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Name</label>
                      <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Oscilloscope" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Code (SKU)</label>
                      <input type="text" value={itemCode} onChange={e => setItemCode(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. OSC-001" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
                      <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                        {['Equipment', 'Electronics', 'Microcontroller', 'Chemical', 'Computer', 'Consumable', 'Furniture', 'Other'].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assign Lab</label>
                      <select required value={lab} onChange={e => setLab(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                        <option value="">Select Lab</option>
                        {labs.map(l => (
                          <option key={l._id} value={l._id}>{l.labName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Total Quantity</label>
                      <input type="number" required min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Low Stock Threshold</label>
                      <input type="number" required min="0" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Condition</label>
                    <select required value={condition} onChange={e => setCondition(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                      {['Good', 'Needs Repair', 'Damaged', 'Lost', 'Disposed'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" form="inventoryForm" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-70 transition-colors">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

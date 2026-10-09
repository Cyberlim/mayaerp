"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, Loader2, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PREDEFINED_FEES = [
  "Admission Fee",
  "Tuition Fee",
  "Exam Fee",
  "Practical Fee",
  "Bag Fee",
  "Uniform Fee",
  "Tie Fee",
  "Lab Coat Fee",
  "Book Fee",
  "Blazer Fee",
  "T-Shirt Fee",
  "Transport Fee",
  "Breakage Fine",
  "Other Fee"
];

export default function CourseFeeStructureBuilder({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  const [feeStructureTemplate, setFeeStructureTemplate] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/courses/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setCourse(data);
        if (data.feeStructureTemplate && data.feeStructureTemplate.length > 0) {
          setFeeStructureTemplate(data.feeStructureTemplate);
          setExpandedYears([data.feeStructureTemplate[0].year]);
        } else {
          // Initialize empty years based on course duration
          const yearsCount = data.duration || Math.ceil((data.totalSemesters || 8) / 2);
          const initialTemplate = Array.from({ length: yearsCount }).map((_, idx) => ({
            year: idx + 1,
            totalYearlyFee: 0,
            components: [
              { category: "Tuition Fee", amount: 0, isMandatory: true, frequency: "Annual" }
            ]
          }));
          if (initialTemplate.length > 0) {
              initialTemplate[0].components.unshift({ category: "Admission Fee", amount: 0, isMandatory: true, frequency: "One-Time" });
          }
          setFeeStructureTemplate(initialTemplate);
          setExpandedYears([1]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleAddComponent = (yearIndex: number, category: string) => {
    const newTemplate = [...feeStructureTemplate];
    const newComponent: any = {
      category,
      amount: 0,
      isMandatory: true,
      frequency: "Annual"
    };

    if (category === "Transport Fee") {
      newComponent.frequency = "Quarterly";
      newComponent.months = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"];
      // Note: we can expand this to have 4 distinct inputs or just multiply by 4. 
      // For simplicity, we'll keep amount as per quarter.
    } else if (["Admission Fee", "Bag Fee", "Uniform Fee", "Tie Fee", "Blazer Fee", "T-Shirt Fee"].includes(category)) {
      newComponent.frequency = "One-Time";
    }

    newTemplate[yearIndex].components.push(newComponent);
    recalculateTotals(newTemplate);
  };

  const handleRemoveComponent = (yearIndex: number, compIndex: number) => {
    const newTemplate = [...feeStructureTemplate];
    newTemplate[yearIndex].components.splice(compIndex, 1);
    recalculateTotals(newTemplate);
  };

  const handleUpdateComponent = (yearIndex: number, compIndex: number, field: string, value: any) => {
    const newTemplate = [...feeStructureTemplate];
    newTemplate[yearIndex].components[compIndex][field] = value;
    recalculateTotals(newTemplate);
  };

  const recalculateTotals = (template: any[]) => {
    template.forEach(yearObj => {
      let total = 0;
      yearObj.components.forEach((c: any) => {
        if (c.frequency === "Quarterly") {
          total += (Number(c.amount) || 0) * 4;
        } else {
          total += Number(c.amount) || 0;
        }
      });
      yearObj.totalYearlyFee = total;
    });
    setFeeStructureTemplate(template);
  };

  const grandTotal = feeStructureTemplate.reduce((sum, y) => sum + (y.totalYearlyFee || 0), 0);

  const [applyToStudents, setApplyToStudents] = useState(true);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/courses/${params.id}/fees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeStructureTemplate, applyToStudents })
      });
      if (res.ok) {
        showToast("Fee structure template saved successfully!");
      } else {
        alert("Failed to save fee structure.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving fee structure.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] font-sans text-slate-800 pb-20">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-slate-700 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard/finance")} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Master Fee Structure</h1>
              <p className="text-sm font-semibold text-indigo-600">{course?.name} ({course?.code})</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total (Course)</p>
              <p className="text-2xl font-black text-slate-900">₹{grandTotal.toLocaleString()}</p>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Template
              </button>
              
              <label className="flex items-center gap-2 cursor-pointer mt-1 group">
                <input 
                  type="checkbox" 
                  checked={applyToStudents}
                  onChange={(e) => setApplyToStudents(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                  Sync with Enrolled Students
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {feeStructureTemplate.map((yearObj, yearIndex) => {
          const isExpanded = expandedYears.includes(yearObj.year);

          return (
            <div key={yearObj.year} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Year Header (Accordion Toggle) */}
              <button 
                onClick={() => toggleYear(yearObj.year)}
                className="w-full px-6 py-5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-black text-slate-900">Academic Year {yearObj.year}</h2>
                    <p className="text-xs font-semibold text-slate-500">{yearObj.components.length} Fee Components</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Yearly Total</p>
                  <p className="text-xl font-black text-slate-800">₹{(yearObj.totalYearlyFee || 0).toLocaleString()}</p>
                </div>
              </button>

              {/* Year Content */}
              {isExpanded && (
                <div className="p-6 border-t border-slate-200">
                  <div className="space-y-4">
                    {/* Headers */}
                    <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <div className="col-span-4">Fee Category</div>
                      <div className="col-span-3">Frequency</div>
                      <div className="col-span-3">Amount (₹)</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {yearObj.components.map((comp: any, compIndex: number) => (
                      <div key={compIndex} className="grid grid-cols-12 gap-4 items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        
                        <div className="col-span-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <select 
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                              value={comp.category}
                              onChange={e => handleUpdateComponent(yearIndex, compIndex, "category", e.target.value)}
                            >
                              <option value={comp.category}>{comp.category}</option>
                              {PREDEFINED_FEES.filter(f => f !== comp.category).map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={comp.frequency}
                            onChange={e => handleUpdateComponent(yearIndex, compIndex, "frequency", e.target.value)}
                          >
                            <option value="Annual">Annual (Once a year)</option>
                            <option value="Quarterly">Quarterly (4 times a year)</option>
                            <option value="One-Time">One-Time (Admission/Kit)</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                          {comp.frequency === "Quarterly" && (
                            <p className="text-[10px] font-semibold text-slate-400 mt-1 ml-1">* Multiplied by 4 for yearly total</p>
                          )}
                        </div>

                        <div className="col-span-3 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input 
                            type="number" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-black rounded-xl pl-8 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={comp.amount}
                            onChange={e => handleUpdateComponent(yearIndex, compIndex, "amount", Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <button 
                            onClick={() => handleRemoveComponent(yearIndex, compIndex)}
                            className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Component Dropdown */}
                    <div className="pt-4 flex justify-center">
                      <div className="relative group">
                        <select
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value=""
                          onChange={e => handleAddComponent(yearIndex, e.target.value)}
                        >
                          <option value="" disabled>Add new fee...</option>
                          {PREDEFINED_FEES.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        <div className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl flex items-center gap-2 transition-colors cursor-pointer pointer-events-none">
                          <Plus className="w-4 h-4" />
                          Add Fee Component
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

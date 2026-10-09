"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Briefcase, 
  Loader2, 
  Calendar, 
  FileText, 
  Save, 
  FileCheck2, 
  Calculator, 
  BarChart, 
  Download, 
  CreditCard, 
  Receipt, 
  ShieldAlert, 
  UserCog, 
  AlertTriangle, 
  ChevronDown, 
  Printer,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  Trash2,
  GraduationCap,
  DollarSign,
  X,
  BadgeCheck,
  Copy,
  ExternalLink,
  RefreshCw,
  Undo2,
  BookOpen,
  Award,
  Fingerprint,
  HeartHandshake,
  Bus,
  Tag,
  ShoppingBag,
  Shirt,
  Package,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import IdCardModal, { IdCardFront } from "@/components/IdCardModal";
import ReceiptModal from "@/components/ReceiptModal";
import { useSocket } from "@/components/SocketProvider";

export default function StudentDetailScreen() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Personal" | "Academics" | "Fees" | "Documents" | "Administration">("Personal");
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
  
  const [studentData, setStudentData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [assignedBus, setAssignedBus] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Category filter in fees tab
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Quick Edit States: Personal Details
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState<any>({});
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // Quick Edit States: Academics Details
  const [isEditingAcademics, setIsEditingAcademics] = useState(false);
  const [academicsForm, setAcademicsForm] = useState<any>({});
  const [isSavingAcademics, setIsSavingAcademics] = useState(false);

  // Fee Payment Modal State
  const [isPayFeeModalOpen, setIsPayFeeModalOpen] = useState(false);
  const [payFeeForm, setPayFeeForm] = useState({
    year: 1,
    category: "tuition",
    amount: "",
    paymentMethod: "Cash",
    transactionId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: ""
  });
  const [isSubmittingFeePay, setIsSubmittingFeePay] = useState(false);

  // Edit Fee Structure Modal State
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [editFeeYears, setEditFeeYears] = useState<any[]>([]);
  const [isSavingFeeEdit, setIsSavingFeeEdit] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const [studentStatementData, setStudentStatementData] = useState<any>(null);

  const fetchStudentData = async () => {
    try {
      const [branchesData, coursesData, student, txnsData, busesData, categoriesData, statementData] = await Promise.all([
        fetch("/api/branches").then(res => res.json()).catch(() => []),
        fetch("/api/courses").then(res => res.json()).catch(() => []),
        fetch(`/api/students/${studentId}`).then(res => res.json()).catch(() => null),
        fetch(`/api/finance/transactions?studentId=${studentId}`).then(res => res.json()).catch(() => []),
        fetch("/api/transport/buses").then(res => res.json()).catch(() => []),
        fetch("/api/finance/categories").then(res => res.json()).catch(() => []),
        fetch(`/api/finance/student-account/${studentId}`).then(res => res.json()).catch(() => null)
      ]);

      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setTransactions(Array.isArray(txnsData) ? txnsData : []);
      setFeeCategories(Array.isArray(categoriesData) ? categoriesData : []);
      if (statementData && !statementData.error) {
        setStudentStatementData(statementData);
      }

      if (Array.isArray(busesData)) {
        const foundBus = busesData.find((b: any) => 
          b.students?.some((s: any) => (s.student?._id || s.student) === studentId)
        );
        if (foundBus) {
          const studentEntry = foundBus.students.find((s: any) => (s.student?._id || s.student) === studentId);
          setAssignedBus({ bus: foundBus, assignment: studentEntry });
        } else {
          setAssignedBus(null);
        }
      }

      if (student && !student.error) {
        setStudentData(student);
        setEditStatus(student.studentStatus || student.status || "Active");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleStudentUpdated = (payload: any) => {
      if (payload.studentId === studentId && payload.data) {
        setStudentData(payload.data);
        if (payload.data.studentStatus || payload.data.status) {
           setEditStatus(payload.data.studentStatus || payload.data.status || "Active");
        }
      }
    };
    
    socket.on('student_updated', handleStudentUpdated);
    
    return () => {
      socket.off('student_updated', handleStudentUpdated);
    };
  }, [socket, studentId]);

  // Handle Quick Edit Personal Details
  const handleStartEditPersonal = () => {
    setPersonalForm({
      firstName: studentData.firstName || "",
      middleName: studentData.middleName || "",
      lastName: studentData.lastName || "",
      dob: studentData.dob || "",
      gender: studentData.gender || "Male",
      category: studentData.category || "General",
      admissionNumber: studentData.admissionNumber || "",
      studentId: studentData.studentId || "",
      enrollmentNumber: studentData.enrollmentNumber || "",
      aadharNumber: studentData.aadharNumber || "",
      religion: studentData.religion || "",
      email: studentData.email || "",
      mobile: studentData.mobile || studentData.phone || studentData.mobileNumber || "",
      parentMobile: studentData.parentMobile || "",
      alternateMobile: studentData.alternateMobile || "",
      address: studentData.address || "",
      city: studentData.city || "",
      state: studentData.state || "",
      pinCode: studentData.pinCode || ""
    });
    setIsEditingPersonal(true);
  };

  const handleSavePersonal = async () => {
    setIsSavingPersonal(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalForm)
      });
      const updated = await res.json();
      if (res.ok && !updated.error) {
        setStudentData(updated);
        setIsEditingPersonal(false);
        showToast("Personal details updated and saved successfully!");
      } else {
        alert(updated.error || "Failed to update personal details.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving personal details.");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Handle Quick Edit Academics Details
  const handleStartEditAcademics = () => {
    setAcademicsForm({
      selectedProgram: typeof studentData.selectedProgram === 'object' ? studentData.selectedProgram?._id : (studentData.selectedProgram || ""),
      selectedBranch: typeof studentData.selectedBranch === 'object' ? studentData.selectedBranch?._id : (studentData.selectedBranch || ""),
      sessionYear: studentData.sessionYear || "",
      selectedSemester: studentData.selectedSemester || 1,
      selectedSection: studentData.selectedSection || "",
      batch: studentData.batch || "",
      entryType: studentData.entryType || "Direct",
      highestQualification: studentData.highestQualification || "",
      boardUniversity: studentData.boardUniversity || "",
      institutionName: studentData.institutionName || "",
      percentageCGPA: studentData.percentageCGPA || "",
      yearOfPassing: studentData.yearOfPassing || "",
      entranceExam: studentData.entranceExam || "",
      entranceScore: studentData.entranceScore || ""
    });
    setIsEditingAcademics(true);
  };

  const handleSaveAcademics = async () => {
    setIsSavingAcademics(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(academicsForm)
      });
      const updated = await res.json();
      if (res.ok && !updated.error) {
        setStudentData(updated);
        setIsEditingAcademics(false);
        showToast("Academic details updated and saved successfully!");
      } else {
        alert(updated.error || "Failed to update academic details.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving academic details.");
    } finally {
      setIsSavingAcademics(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!studentData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentStatus: editStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setStudentData(updated);
        showToast("Student status updated successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (docKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    const payload = docKey === 'studentPhoto'
      ? { profilePhoto: "", applicantPhoto: "", documents: { ...studentData.documents, studentPhoto: "" } }
      : { documents: { ...studentData.documents, [docKey]: "" } };
      
    setIsSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setStudentData(updated);
        showToast("Document deleted successfully");
      }
    } catch(e) {
      console.error(e);
      alert("Error deleting document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadDocument = (docKey: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      const payload = docKey === 'studentPhoto' 
        ? { profilePhoto: base64Data, applicantPhoto: base64Data, documents: { ...studentData.documents, studentPhoto: base64Data } }
        : { documents: { ...studentData.documents, [docKey]: base64Data } };
        
      setIsSaving(true);
      try {
        const res = await fetch(`/api/students/${studentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setStudentData(updated);
          showToast("Document uploaded successfully");
        }
      } catch (e) {
        console.error(e);
        alert("Error uploading document");
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(amount || 0);
  };

  // Student Fee Calculations
  const feeSummary = useMemo(() => {
    if (!studentStatementData || !studentStatementData.ledger) {
      return { isConfigured: false, total: 0, paid: 0, balance: 0, status: "not_configured", percentage: 0 };
    }

    const ledger = studentStatementData.ledger;
    const total = ledger.totalAssessed || 0;
    const paid = ledger.totalPaid || 0;
    const balance = ledger.outstandingAmount || 0;
    
    // Check if it's configured by checking if we have any years or total > 0
    const isConfigured = Boolean(ledger.years && ledger.years.length > 0);

    let status: "not_configured" | "paid" | "partial" | "unpaid" = "not_configured";
    
    if (isConfigured) {
      if (total === 0 || paid >= total) status = "paid";
      else if (paid > 0) status = "partial";
      else status = "unpaid";
    }

    const percentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    return { isConfigured, total, paid, balance, status, percentage };
  }, [studentStatementData]);

  // Open Edit Fee Modal
  const handleOpenEditFeeModal = () => {
    if (studentStatementData?.ledger?.years && studentStatementData.ledger.years.length > 0) {
      const clonedYears = studentStatementData.ledger.years.map((y: any, idx: number) => {
        let components = y.components || [];
        if (components.length === 0 && y.categories) {
           components = Object.entries(y.categories).map(([k, c]: any) => ({
              category: k.charAt(0).toUpperCase() + k.slice(1) + " Fee",
              amount: c.total || 0,
              paid: c.paid || 0,
              frequency: 'Annual'
           }));
        }
        return {
          year: y.year || idx + 1,
          components: components.map((c: any) => ({
             category: c.category || '',
             amount: c.amount || 0,
             paid: c.paid || 0,
             frequency: c.frequency || 'Annual'
          }))
        };
      });
      setEditFeeYears(clonedYears);
    } else {
      const selectedCourse = courses.find(c => c._id === (typeof studentData.selectedProgram === 'object' ? studentData.selectedProgram?._id : studentData.selectedProgram));
      const duration = selectedCourse?.durationYears || 4;
      setEditFeeYears(Array.from({ length: duration }).map((_, idx) => ({
        year: idx + 1,
        components: [{ category: 'Tuition Fee', amount: 0, paid: 0, frequency: 'Annual' }]
      })));
    }

    setIsEditFeeModalOpen(true);
  };

  // Open Add Fee Payment Modal
  const handleOpenPayFeeModal = (defaultYear = 1, defaultCategory = "tuition", defaultAmount?: number) => {
    const matchedCategory = feeCategories.find(c => c.code === defaultCategory || c.name?.toLowerCase() === defaultCategory.toLowerCase());
    let initialAmount = "";
    if (defaultAmount !== undefined && defaultAmount > 0) {
      initialAmount = String(defaultAmount);
    } else if (matchedCategory && matchedCategory.defaultAmount > 0) {
      initialAmount = String(matchedCategory.defaultAmount);
    } else if (feeSummary.balance > 0 && (defaultCategory === "tuition" || defaultCategory === "all")) {
      initialAmount = String(feeSummary.balance);
    }

    setPayFeeForm({
      year: defaultYear,
      category: matchedCategory?.code || defaultCategory,
      amount: initialAmount,
      paymentMethod: "Cash",
      transactionId: `RCP-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toISOString().split("T")[0],
      notes: ""
    });
    setIsPayFeeModalOpen(true);
  };

  // Submit Fee Payment
  const handleSubmitFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFeeForm.amount || Number(payFeeForm.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsSubmittingFeePay(true);
    try {
      const matchedCat = feeCategories.find(c => c.code === payFeeForm.category);
      const categoryName = matchedCat?.name || (payFeeForm.category.charAt(0).toUpperCase() + payFeeForm.category.slice(1) + " Fee");

      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amount: Number(payFeeForm.amount),
          paymentDate: payFeeForm.paymentDate,
          paymentMethod: payFeeForm.paymentMethod,
          transactionId: payFeeForm.transactionId,
          year: Number(payFeeForm.year),
          category: payFeeForm.category,
          categoryName: categoryName,
          notes: payFeeForm.notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Fee payment recorded successfully!");
        setIsPayFeeModalOpen(false);
        if (data.student) setStudentData(data.student);
        fetchStudentData();
      } else {
        alert(data.error || "Failed to record payment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error recording payment.");
    } finally {
      setIsSubmittingFeePay(false);
    }
  };

  const handleDeleteTransaction = async (txnId: string) => {
    if (!confirm("Are you sure you want to delete this receipt? This will reverse the payment from the student's balance.")) return;

    try {
      const res = await fetch(`/api/finance/transactions/${txnId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Receipt deleted and fee reversed successfully!");
        fetchStudentData();
      } else {
        alert(data.error || "Failed to delete receipt.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting receipt.");
    }
  };

  // Handle Edit Fee Field Changes
  const handleEditFeeChange = (yearIndex: number, componentIndex: number, field: "amount" | "paid" | "category", value: string) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];
    
    if (field === "category") {
      comps[componentIndex] = { ...comps[componentIndex], [field]: value };
    } else {
      const numVal = Math.max(0, Number(value) || 0);
      comps[componentIndex] = { ...comps[componentIndex], [field]: numVal };
    }
    
    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleAddFeeComponent = (yearIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];
    comps.push({ category: 'Custom Charge', amount: 0, paid: 0, frequency: 'Annual' });
    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleRemoveFeeComponent = (yearIndex: number, componentIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];
    comps.splice(componentIndex, 1);
    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleQuickMarkCategoryPaid = (yearIndex: number, componentIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    const comps = [...(yearObj.components || [])];
    comps[componentIndex] = { ...comps[componentIndex], paid: comps[componentIndex].amount || 0 };
    yearObj.components = comps;
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleQuickMarkYearPaid = (yearIndex: number) => {
    const updated = [...editFeeYears];
    const yearObj = { ...updated[yearIndex] };
    yearObj.components = (yearObj.components || []).map((c: any) => ({ ...c, paid: c.amount || 0 }));
    updated[yearIndex] = yearObj;
    setEditFeeYears(updated);
  };

  const handleMarkAllAsPaid = () => {
    const updated = editFeeYears.map(yr => ({
      ...yr,
      components: (yr.components || []).map((c: any) => ({ ...c, paid: c.amount || 0 }))
    }));
    setEditFeeYears(updated);
  };

  const handleResetAllPaid = () => {
    const updated = editFeeYears.map(yr => ({
      ...yr,
      components: (yr.components || []).map((c: any) => ({ ...c, paid: 0 }))
    }));
    setEditFeeYears(updated);
  };

  const handleAddAcademicYear = () => {
    const nextYearNum = editFeeYears.length + 1;
    setEditFeeYears([
      ...editFeeYears,
      {
        year: nextYearNum,
        components: [{ category: 'Tuition Fee', amount: 0, paid: 0, frequency: 'Annual' }]
      }
    ]);
  };

  const handleRemoveAcademicYear = (index: number) => {
    if (editFeeYears.length <= 1) return;
    const updated = editFeeYears.filter((_, i) => i !== index).map((y, idx) => ({ ...y, year: idx + 1 }));
    setEditFeeYears(updated);
  };

  const handleSaveStudentFeeStructure = async () => {
    setIsSavingFeeEdit(true);
    try {
      const payload = {
        fees: {
          isConfigured: true,
          years: editFeeYears
        }
      };

      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const updatedStudent = await res.json();
      if (res.ok && !updatedStudent.error) {
        setStudentData(updatedStudent);
        showToast("Fee structure and payment status saved to database!");
        setIsEditFeeModalOpen(false);
      } else {
        alert(updatedStudent.error || "Failed to update fees.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving fee structure.");
    } finally {
      setIsSavingFeeEdit(false);
    }
  };

  const editModalTotals = useMemo(() => {
    let total = 0;
    let paid = 0;
    editFeeYears.forEach(y => {
      (y.components || []).forEach((c: any) => {
        total += Number(c.amount) || 0;
        paid += Number(c.paid) || 0;
      });
    });
    return { total, paid, balance: Math.max(0, total - paid) };
  }, [editFeeYears]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Student Profile...</p>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC]">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Student not found.</h2>
        <Link href="/dashboard/students">
          <button className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs">
            Return to Student Directory
          </button>
        </Link>
      </div>
    );
  }

  const selectedCourse = courses.find(c => c._id === (typeof studentData.selectedProgram === 'object' ? studentData.selectedProgram?._id : studentData.selectedProgram));
  const selectedBranch = branches.find(b => b._id === (typeof studentData.selectedBranch === 'object' ? studentData.selectedBranch?._id : studentData.selectedBranch));

  const tabs: Array<"Personal" | "Academics" | "Fees" | "Documents" | "Administration"> = [
    "Personal", 
    "Academics", 
    "Fees", 
    "Documents", 
    "Administration"
  ];

  // Modern Key-Value List Row Component
  const DetailListRow = ({ icon: Icon, label, value, badge, isCopyable }: { icon?: any, label: string, value: any, badge?: string, isCopyable?: boolean }) => {
    return (
      <div className="py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-50/80 transition-colors rounded-xl group">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-xs font-bold text-slate-500">{label}</span>
        </div>
        <div className="flex items-center gap-2 pl-10 sm:pl-0">
          {badge ? (
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-md border border-indigo-100">
              {badge}
            </span>
          ) : (
            <span className="text-xs font-black text-slate-900">
              {value || <span className="text-slate-400 font-normal italic">Not specified</span>}
            </span>
          )}
          {isCopyable && value && (
            <button 
              onClick={() => { navigator.clipboard.writeText(String(value)); showToast(`Copied ${label} to clipboard!`); }}
              title="Copy to clipboard"
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }} 
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PROFILE SIDEBAR */}
      <div className="w-full md:w-[330px] bg-slate-900 flex flex-col z-10 sticky top-0 md:h-screen shadow-2xl overflow-y-auto border-r border-slate-800 text-white">
        <div className="p-6">
          <Link href="/dashboard/students">
            <button className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xs transition-colors mb-6 w-fit">
              <ChevronLeft className="w-4 h-4" /> Student Directory
            </button>
          </Link>

          {/* Student Dossier Badge & Photo */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 mb-6 text-center">
            <div className="w-24 h-24 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/40 mx-auto overflow-hidden flex items-center justify-center font-black text-2xl text-indigo-300 mb-3 shadow-lg">
              {studentData.profilePhoto || studentData.documents?.studentPhoto ? (
                <img 
                  src={studentData.profilePhoto || studentData.documents?.studentPhoto} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span>{studentData.firstName?.[0]}{studentData.lastName?.[0]}</span>
              )}
            </div>

            <h2 className="text-base font-black text-white leading-tight">
              {studentData.firstName} {studentData.lastName}
            </h2>
            <p className="text-xs font-bold text-indigo-400 mt-0.5">
              {studentData.admissionNumber || studentData.studentId || "No Admission ID"}
            </p>

            <div className="mt-3 flex justify-center">
              <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                studentData.studentStatus === 'Active' || studentData.status === 'Active'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                ● {studentData.studentStatus || studentData.status || 'Active'} Profile
              </span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40 space-y-2.5 text-xs font-semibold mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">Program</span>
              <span className="font-bold text-white text-right line-clamp-1 max-w-[150px]">{selectedCourse?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">Branch</span>
              <span className="font-bold text-white text-right">{selectedBranch?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">Semester</span>
              <span className="font-bold text-white">Sem {studentData.selectedSemester || 1}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">Batch</span>
              <span className="font-bold text-white">{studentData.batch || studentData.sessionYear || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
              <span className="text-slate-400 text-[11px]">Fee Status</span>
              <span className={`font-black text-xs ${
                feeSummary.status === 'paid' ? 'text-emerald-400' : feeSummary.status === 'partial' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {feeSummary.status === 'paid' ? 'Cleared' : feeSummary.status === 'partial' ? `Due ${formatCurrency(feeSummary.balance)}` : 'Unpaid'}
              </span>
            </div>
          </div>

          {/* Sidebar Action Buttons */}
          <div className="space-y-2.5">
            <button 
              onClick={() => handleOpenPayFeeModal()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex justify-center items-center gap-2 rounded-xl transition-all shadow-md shadow-indigo-600/25"
            >
              <Plus className="w-4 h-4" /> Record Fee Payment
            </button>

            <button 
              onClick={() => {
                setActiveTab("Personal");
                handleStartEditPersonal();
              }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex justify-center items-center gap-2 rounded-xl transition-all"
            >
              <Edit3 className="w-4 h-4" /> Quick Edit Details
            </button>

            <button 
              onClick={() => setIsIdModalOpen(true)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex justify-center items-center gap-2 rounded-xl transition-all"
            >
              <Printer className="w-4 h-4" /> Print Student ID Card
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* TAB BAR */}
        <div className="bg-white border-b border-slate-200 px-8 py-3.5 flex gap-6 overflow-x-auto sticky top-0 z-10 shadow-sm items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === tab 
                  ? "border-indigo-600 text-indigo-600 font-black" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "Personal" && <User className="w-3.5 h-3.5" />}
                {tab === "Academics" && <GraduationCap className="w-3.5 h-3.5" />}
                {tab === "Fees" && <Receipt className="w-3.5 h-3.5" />}
                {tab === "Documents" && <FileCheck2 className="w-3.5 h-3.5" />}
                {tab === "Administration" && <ShieldAlert className="w-3.5 h-3.5" />}
                <span>{tab}</span>
                {tab === "Fees" && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                    feeSummary.status === "paid" 
                      ? "bg-emerald-100 text-emerald-700" 
                      : feeSummary.status === "partial" 
                      ? "bg-amber-100 text-amber-700" 
                      : "bg-rose-100 text-rose-700"
                  }`}>
                    {feeSummary.status === "paid" ? "Paid" : feeSummary.status === "partial" ? "Due" : "Unpaid"}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Edit button on top bar if on Personal or Academics */}
          {activeTab === "Personal" && (
            <button
              onClick={() => isEditingPersonal ? setIsEditingPersonal(false) : handleStartEditPersonal()}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                isEditingPersonal 
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100"
              }`}
            >
              {isEditingPersonal ? <Undo2 className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditingPersonal ? "Cancel Edit" : "Edit Personal Info"}
            </button>
          )}

          {activeTab === "Academics" && (
            <button
              onClick={() => isEditingAcademics ? setIsEditingAcademics(false) : handleStartEditAcademics()}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                isEditingAcademics 
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100"
              }`}
            >
              {isEditingAcademics ? <Undo2 className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditingAcademics ? "Cancel Edit" : "Edit Academic Info"}
            </button>
          )}
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            
            {/* ================================================================= */}
            {/* 1. PERSONAL DETAILS TAB (LIST VIEW & QUICK EDIT)                  */}
            {/* ================================================================= */}
            {activeTab === "Personal" && (
              <motion.div key="Personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6">
                
                {/* Mode Indicator / Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Personal Details</h3>
                    <p className="text-xs font-semibold text-slate-400">
                      {isEditingPersonal ? "Editing personal information directly on this page" : "Official identity, demographics and contact records"}
                    </p>
                  </div>
                  {!isEditingPersonal && (
                    <button 
                      onClick={handleStartEditPersonal}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Quick Edit & Save
                    </button>
                  )}
                </div>

                {/* EDIT MODE: PERSONAL DETAILS FORM */}
                {isEditingPersonal ? (
                  <div className="bg-white p-7 rounded-3xl border border-indigo-100 shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Edit Personal Profile</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Make changes and click Save</span>
                    </div>

                    {/* Section 1: Names & Identity */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Identity & Identification</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">First Name *</label>
                          <input 
                            type="text"
                            required
                            value={personalForm.firstName || ""}
                            onChange={e => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Middle Name</label>
                          <input 
                            type="text"
                            value={personalForm.middleName || ""}
                            onChange={e => setPersonalForm({ ...personalForm, middleName: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Last Name *</label>
                          <input 
                            type="text"
                            required
                            value={personalForm.lastName || ""}
                            onChange={e => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Date of Birth</label>
                          <input 
                            type="date"
                            value={personalForm.dob || ""}
                            onChange={e => setPersonalForm({ ...personalForm, dob: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Gender</label>
                          <select 
                            value={personalForm.gender || "Male"}
                            onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Category / Social</label>
                          <input 
                            type="text"
                            placeholder="e.g. General, OBC, SC, ST"
                            value={personalForm.category || ""}
                            onChange={e => setPersonalForm({ ...personalForm, category: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Admission Number</label>
                          <input 
                            type="text"
                            value={personalForm.admissionNumber || ""}
                            onChange={e => setPersonalForm({ ...personalForm, admissionNumber: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Student ID / Roll No</label>
                          <input 
                            type="text"
                            value={personalForm.studentId || ""}
                            onChange={e => setPersonalForm({ ...personalForm, studentId: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Aadhar Card Number</label>
                          <input 
                            type="text"
                            placeholder="12 digit number"
                            value={personalForm.aadharNumber || ""}
                            onChange={e => setPersonalForm({ ...personalForm, aadharNumber: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Contact Numbers & Email */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h5 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Contact & Communication</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email Address</label>
                          <input 
                            type="email"
                            value={personalForm.email || ""}
                            onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Primary Mobile Number</label>
                          <input 
                            type="text"
                            value={personalForm.mobile || ""}
                            onChange={e => setPersonalForm({ ...personalForm, mobile: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Parent / Guardian Phone</label>
                          <input 
                            type="text"
                            value={personalForm.parentMobile || ""}
                            onChange={e => setPersonalForm({ ...personalForm, parentMobile: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Alternate Phone</label>
                          <input 
                            type="text"
                            value={personalForm.alternateMobile || ""}
                            onChange={e => setPersonalForm({ ...personalForm, alternateMobile: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Address */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h5 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Address Details</h5>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Full Street Address</label>
                        <textarea 
                          rows={2}
                          value={personalForm.address || ""}
                          onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })}
                          className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">City</label>
                          <input 
                            type="text"
                            value={personalForm.city || ""}
                            onChange={e => setPersonalForm({ ...personalForm, city: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">State</label>
                          <input 
                            type="text"
                            value={personalForm.state || ""}
                            onChange={e => setPersonalForm({ ...personalForm, state: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">PIN Code</label>
                          <input 
                            type="text"
                            value={personalForm.pinCode || ""}
                            onChange={e => setPersonalForm({ ...personalForm, pinCode: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingPersonal(false)}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        disabled={isSavingPersonal}
                        onClick={handleSavePersonal}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Personal Details
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE: BEAUTIFUL EXECUTIVE LIST VIEW */
                  <div className="space-y-6">
                    
                    {/* List Group 1: Identity & Enrolment */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Identity & Basic Records</h4>
                        </div>
                        <button 
                          onClick={handleStartEditPersonal}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        <DetailListRow icon={User} label="Full Legal Name" value={`${studentData.firstName || ''} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName || ''}`.trim()} />
                        <DetailListRow icon={BadgeCheck} label="Admission Number" value={studentData.admissionNumber} isCopyable={true} />
                        <DetailListRow icon={FileText} label="Student ID / Roll No" value={studentData.studentId} isCopyable={true} />
                        <DetailListRow icon={Calendar} label="Date of Birth" value={studentData.dob} />
                        <DetailListRow icon={User} label="Gender" value={studentData.gender} />
                        <DetailListRow icon={Award} label="Category / Quota" value={studentData.category || "General"} />
                        <DetailListRow icon={Fingerprint} label="Aadhar Number" value={studentData.aadharNumber} isCopyable={true} />
                      </div>
                    </div>

                    {/* List Group 2: Contact Details */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Contact & Communication</h4>
                        </div>
                        <button 
                          onClick={handleStartEditPersonal}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        <DetailListRow icon={Mail} label="Email Address" value={studentData.email} isCopyable={true} />
                        <DetailListRow icon={Phone} label="Primary Mobile" value={studentData.phone || studentData.mobile || studentData.mobileNumber} isCopyable={true} />
                        <DetailListRow icon={Phone} label="Parent / Guardian Mobile" value={studentData.parentMobile} isCopyable={true} />
                        <DetailListRow icon={Phone} label="Alternate Phone" value={studentData.alternateMobile} isCopyable={true} />
                      </div>
                    </div>

                    {/* List Group 3: Residential Address */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Address & Location</h4>
                        </div>
                        <button 
                          onClick={handleStartEditPersonal}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        <DetailListRow icon={MapPin} label="Permanent Street Address" value={studentData.address} />
                        <DetailListRow icon={Building2} label="City / Town" value={studentData.city} />
                        <DetailListRow icon={MapPin} label="State / Province" value={studentData.state} />
                        <DetailListRow icon={MapPin} label="Postal PIN Code" value={studentData.pinCode} />
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* 2. ACADEMICS DETAILS TAB (LIST VIEW & QUICK EDIT)                 */}
            {/* ================================================================= */}
            {activeTab === "Academics" && (
              <motion.div key="Academics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Academic Dossier</h3>
                    <p className="text-xs font-semibold text-slate-400">
                      {isEditingAcademics ? "Editing academic enrollment setup directly on this page" : "Program enrollment, semester status and qualification records"}
                    </p>
                  </div>
                  {!isEditingAcademics && (
                    <button 
                      onClick={handleStartEditAcademics}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Quick Edit & Save
                    </button>
                  )}
                </div>

                {/* EDIT MODE: ACADEMICS FORM */}
                {isEditingAcademics ? (
                  <div className="bg-white p-7 rounded-3xl border border-indigo-100 shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Edit Academic Setup</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Update program, branch or semester</span>
                    </div>

                    {/* Program & Branch dropdowns */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Program & Enrollment</h5>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Course / Program *</label>
                          <select 
                            value={academicsForm.selectedProgram || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, selectedProgram: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          >
                            <option value="">-- Select Course --</option>
                            {courses.map(c => (
                              <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Branch / Department *</label>
                          <select 
                            value={academicsForm.selectedBranch || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, selectedBranch: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          >
                            <option value="">-- Select Branch --</option>
                            {branches.map(b => (
                              <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Current Semester</label>
                          <select 
                            value={academicsForm.selectedSemester || 1}
                            onChange={e => setAcademicsForm({ ...academicsForm, selectedSemester: Number(e.target.value) })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(s => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Assigned Section</label>
                          <input 
                            type="text"
                            placeholder="e.g. A, B"
                            value={academicsForm.selectedSection || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, selectedSection: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Batch</label>
                          <input 
                            type="text"
                            placeholder="e.g. 2024-2028"
                            value={academicsForm.batch || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, batch: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Session Year</label>
                          <input 
                            type="text"
                            placeholder="e.g. 2026-2027"
                            value={academicsForm.sessionYear || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, sessionYear: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Admission Entry Type</label>
                        <select 
                          value={academicsForm.entryType || "Direct"}
                          onChange={e => setAcademicsForm({ ...academicsForm, entryType: e.target.value })}
                          className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                        >
                          <option value="Direct">Direct Entry (Year 1)</option>
                          <option value="Lateral">Lateral Entry (Year 2)</option>
                        </select>
                      </div>
                    </div>

                    {/* Prior Qualifications */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h5 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Prior Qualification Records</h5>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Highest Qualification</label>
                          <input 
                            type="text"
                            placeholder="e.g. 12th Standard, Diploma"
                            value={academicsForm.highestQualification || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, highestQualification: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Board / University</label>
                          <input 
                            type="text"
                            placeholder="e.g. CBSE, State Board"
                            value={academicsForm.boardUniversity || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, boardUniversity: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Institution Name</label>
                          <input 
                            type="text"
                            placeholder="Previous School / College"
                            value={academicsForm.institutionName || ""}
                            onChange={e => setAcademicsForm({ ...academicsForm, institutionName: e.target.value })}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Percentage / CGPA</label>
                            <input 
                              type="text"
                              placeholder="e.g. 85.5%"
                              value={academicsForm.percentageCGPA || ""}
                              onChange={e => setAcademicsForm({ ...academicsForm, percentageCGPA: e.target.value })}
                              className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Passing Year</label>
                            <input 
                              type="text"
                              placeholder="e.g. 2024"
                              value={academicsForm.yearOfPassing || ""}
                              onChange={e => setAcademicsForm({ ...academicsForm, yearOfPassing: e.target.value })}
                              className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingAcademics(false)}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        disabled={isSavingAcademics}
                        onClick={handleSaveAcademics}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingAcademics ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Academic Setup
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE: BEAUTIFUL EXECUTIVE ACADEMICS LIST VIEW */
                  <div className="space-y-6">
                    
                    {/* List Group 1: Program & Enrolment */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Current Program Enrollment</h4>
                        </div>
                        <button 
                          onClick={handleStartEditAcademics}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        <DetailListRow icon={BookOpen} label="Course / Degree Program" value={selectedCourse?.name ? `${selectedCourse.name} (${selectedCourse.code})` : null} />
                        <DetailListRow icon={Building2} label="Branch / Department" value={selectedBranch?.name} />
                        <DetailListRow icon={Clock} label="Current Semester" value={studentData.selectedSemester ? `Semester ${studentData.selectedSemester}` : null} />
                        <DetailListRow icon={BadgeCheck} label="Assigned Section" value={studentData.selectedSection ? `Section ${studentData.selectedSection}` : null} />
                        <DetailListRow icon={Calendar} label="Batch" value={studentData.batch} />
                        <DetailListRow icon={Calendar} label="Session Year" value={studentData.sessionYear} />
                        <DetailListRow icon={Award} label="Entry Type" value={studentData.entryType || "Direct Entry"} />
                      </div>
                    </div>

                    {/* List Group 2: Prior Qualification */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Past Academic Qualifications</h4>
                        </div>
                        <button 
                          onClick={handleStartEditAcademics}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        <DetailListRow icon={FileText} label="Highest Qualification" value={studentData.highestQualification} />
                        <DetailListRow icon={Building2} label="Board / University" value={studentData.boardUniversity} />
                        <DetailListRow icon={Building2} label="Institution Name" value={studentData.institutionName} />
                        <DetailListRow icon={Calculator} label="Percentage / CGPA" value={studentData.percentageCGPA ? `${studentData.percentageCGPA}%` : null} />
                        <DetailListRow icon={Calendar} label="Year of Passing" value={studentData.yearOfPassing?.toString()} />
                      </div>
                    </div>

                    {/* List Group 3: Entrance Assessment */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Entrance Exam & Assessment</h4>
                        </div>
                        <button 
                          onClick={handleStartEditAcademics}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        <DetailListRow icon={FileText} label="Entrance Exam" value={studentData.entranceExam || "Direct Admission"} />
                        <DetailListRow icon={Award} label="Entrance Score" value={studentData.entranceScore?.toString()} />
                        <DetailListRow icon={Check} label="Subject 1 Marks" value={studentData.subjectMarks?.subject1} />
                        <DetailListRow icon={Check} label="Subject 2 Marks" value={studentData.subjectMarks?.subject2} />
                        <DetailListRow icon={Check} label="Subject 3 Marks" value={studentData.subjectMarks?.subject3} />
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* ================================================================= */}
            {/* 3. FEES TAB (FULLY INTERACTIVE & EDITABLE)                        */}
            {/* ================================================================= */}
            {activeTab === "Fees" && (
              <motion.div key="Fees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6">
                
                {/* Top Financial Dashboard Hero */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Ledger</span>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">Student Fee Dossier</h3>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        Manage fee structure, log payments and update status directly into the database.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleOpenPayFeeModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Fee / Collect
                      </button>

                      <button 
                        onClick={handleOpenEditFeeModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all"
                      >
                        <Edit3 className="w-4 h-4 text-slate-600" /> Edit Fee Structure
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Structured</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(feeSummary.total)}</div>
                      <span className="text-[11px] font-semibold text-slate-400">All Academic Years</span>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Paid</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(feeSummary.paid)}</div>
                      <span className="text-[11px] font-semibold text-emerald-700">{feeSummary.percentage}% Completed</span>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Outstanding Due</span>
                      <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(feeSummary.balance)}</div>
                      <span className="text-[11px] font-semibold text-amber-700">
                        {feeSummary.balance === 0 ? "Account Cleared" : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {feeSummary.isConfigured && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5">
                        <span>Payment Clearance Progress</span>
                        <span>{feeSummary.percentage}% Cleared</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${feeSummary.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* IF NOT CONFIGURED BANNER */}
                {!feeSummary.isConfigured ? (
                  <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
                      <Receipt className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Fees Not Configured</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm">
                      Fee breakdown has not been set up for this student. Click below to initialize and configure the fee structure.
                    </p>
                    <button
                      onClick={handleOpenEditFeeModal}
                      className="mt-6 px-6 py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Configure Fee Structure Now
                    </button>
                  </div>
                ) : (
                  /* YEAR-BY-YEAR DETAILED CARDS */
                  <div className="space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Academic Year Breakdown</h4>
                      <button 
                        onClick={handleOpenEditFeeModal}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Modify All Years
                      </button>
                    </div>

                    {studentStatementData?.ledger?.years?.map((fy: any) => {
                      const yrTotal = fy.yearTotal || 0;
                      const yrPaid = fy.yearPaid || 0;
                      const yrDue = fy.yearOS || 0;

                      return (
                        <div key={fy.year} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                          
                          {/* Year Header */}
                          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                {fy.year}
                              </span>
                              <div>
                                <h5 className="font-black text-slate-900 text-sm">Academic Year {fy.year}</h5>
                                <div className="text-xs font-semibold text-slate-400">
                                  Total: {formatCurrency(yrTotal)} • Paid: {formatCurrency(yrPaid)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {yrDue === 0 && yrTotal > 0 ? (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-100 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" /> Fully Paid
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-100">
                                  Due: {formatCurrency(yrDue)}
                                </span>
                              )}

                              <button 
                                onClick={() => handleOpenPayFeeModal(fy.year)}
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-all border border-indigo-100 hover:border-indigo-600"
                              >
                                + Collect
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Categories / Components */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {fy.components && fy.components.length > 0 ? (
                              fy.components.map((cat: any, idx: number) => {
                                // Since we don't track paid amount per sub-component easily yet, we just show the component
                                const total = cat.amount || 0;
                                return (
                                  <div key={`${cat.category}-${idx}`} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800">{cat.category}</span>
                                    </div>
                                    <div className="text-sm font-black text-slate-900">{formatCurrency(total)}</div>
                                  </div>
                                );
                              })
                            ) : (
                              Object.entries(fy.categories || {}).map(([key, cat]: any) => {
                                const title = key.charAt(0).toUpperCase() + key.slice(1) + " Fee";
                                const total = cat.total || 0;
                                const paid = cat.paid || 0;
                                const catDue = cat.os || Math.max(0, total - paid);
                                
                                return (
                                  <div key={title} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800">{title}</span>
                                      {catDue === 0 && total > 0 ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : catDue > 0 ? (
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                      ) : null}
                                    </div>
                                    <div className="text-sm font-black text-slate-900">{formatCurrency(total)}</div>
                                    <div className="text-[11px] font-semibold flex justify-between">
                                      <span className="text-emerald-600">Paid: {formatCurrency(paid)}</span>
                                      {catDue > 0 && <span className="text-amber-600">Due: {formatCurrency(catDue)}</span>}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CAMPUS TRANSPORT ROUTE DOSSIER */}
                {assignedBus && (
                  <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-amber-600 text-white rounded-2xl shadow-md shadow-amber-600/20">
                        <Bus className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">
                            {assignedBus.bus?.busNo}
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            assignedBus.assignment?.paymentStatus === 'Paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {assignedBus.assignment?.paymentStatus === 'Paid' ? '✓ Transport Fee Paid' : '✗ Transport Fee Due'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          Route: <strong className="text-slate-800">{assignedBus.bus?.routeName}</strong> • Pickup Stop: <strong className="text-amber-800">{assignedBus.assignment?.stopName}</strong>
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                          Assessed Transport Fare: <strong className="text-slate-800">{formatCurrency(assignedBus.assignment?.fare || 0)}</strong>
                        </p>
                      </div>
                    </div>

                    <Link href="/dashboard/transport">
                      <button className="px-4 py-2.5 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm">
                        <span>Manage in Transport Hub</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                )}

                {/* RECENT FEE TRANSACTIONS FOR THIS STUDENT */}
                {transactions.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Payment Receipts & History</h4>
                      <span className="text-xs font-bold text-slate-400">{transactions.length} Receipts</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="p-3">Receipt / Txn ID</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Method</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-slate-50">
                          {transactions.map(txn => {
                            const matchedCat = feeCategories.find(c => c.code === txn.category);
                            const displayCatName = txn.categoryName || matchedCat?.name || (txn.category ? txn.category.toUpperCase() : "Tuition Fee");

                            return (
                              <tr key={txn._id} className="hover:bg-slate-50/60">
                                <td className="p-3 font-bold text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{txn.receiptNumber || txn.transactionId}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-semibold text-slate-700">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold">
                                    {displayCatName}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-500">
                                  {txn.paymentDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(txn.paymentDate)) : "-"}
                                </td>
                                <td className="p-3 font-semibold text-slate-600">{txn.paymentMethod || "Cash"}</td>
                                <td className="p-3 text-right font-black text-emerald-600">{formatCurrency(txn.amount)}</td>
                                <td className="p-3 text-center">
                                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full">
                                    {txn.status || "Completed"}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedReceipt({
                                          ...txn,
                                          type: "student",
                                          name: `${studentData.firstName} ${studentData.lastName}`.trim(),
                                          studentId: studentData.studentId || studentData.admissionNumber,
                                          course: selectedCourse?.name,
                                          branch: selectedBranch?.name,
                                          categoryName: displayCatName,
                                          amount: txn.amount,
                                          date: txn.paymentDate || txn.createdAt,
                                          transactionId: txn.transactionId,
                                          receiptNumber: txn.receiptNumber || txn.transactionId,
                                          paymentMethod: txn.paymentMethod || "Cash",
                                          notes: txn.notes
                                        });
                                        setIsReceiptModalOpen(true);
                                      }}
                                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all"
                                      title="Print Receipt"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTransaction(txn._id)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                      title="Delete Receipt & Reverse Payment"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* ================================================================= */}
            {/* 4. DOCUMENTS TAB                                                  */}
            {/* ================================================================= */}
            {activeTab === "Documents" && (
              <motion.div key="Documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6">
                
                <div className="bg-gradient-to-br from-[#1B3E5F] to-[#2E6B9E] rounded-3xl p-8 text-white shadow-xl flex items-center">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mr-6">
                    <FileCheck2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">Document Dossier</h3>
                    <p className="text-xs font-bold text-white/70 mt-1 uppercase tracking-widest">
                      Certificates, marksheets and verification files
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {[
                    {key: 'studentPhoto', label: 'Student Photo', icon: User},
                    {key: 'marksheet10', label: '10th Marksheet', icon: FileText},
                    {key: 'marksheet12', label: '12th Marksheet', icon: FileText},
                    {key: 'aadharCard', label: 'Aadhar Card', icon: Briefcase},
                    {key: 'transferCertificate', label: 'Transfer Certificate', icon: FileCheck2},
                    {key: 'casteCertificate', label: 'Caste Certificate', icon: FileText},
                  ].map(doc => {
                    const hasDoc = doc.key === 'studentPhoto' 
                      ? (studentData.profilePhoto || studentData.applicantPhoto || studentData.documents?.[doc.key]) 
                      : studentData.documents?.[doc.key];
                      
                    return (
                      <div 
                        key={doc.key} 
                        className={`p-6 rounded-3xl border text-center transition-all relative ${
                          hasDoc ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-100'
                        }`}
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={() => hasDoc && window.open(hasDoc, '_blank')}
                        >
                          {hasDoc && doc.key === 'studentPhoto' ? (
                            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden mb-3 border-2 border-emerald-200 shadow-sm">
                               <img src={hasDoc} alt={doc.label} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                              hasDoc ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                              <doc.icon className="w-6 h-6" />
                            </div>
                          )}
                          
                          <h4 className="text-xs font-black text-slate-800 mb-1">{doc.label}</h4>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${hasDoc ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {hasDoc ? 'Uploaded' : 'Pending'}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors">
                                {hasDoc ? 'Update' : 'Upload'}
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept={doc.key === 'studentPhoto' ? "image/*" : "application/pdf,image/*"}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadDocument(doc.key, file);
                                  }}
                                />
                            </label>
                            {hasDoc && (
                                <button 
                                  onClick={(e) => handleDeleteDocument(doc.key, e)}
                                  className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </motion.div>
            )}

            {/* ================================================================= */}
            {/* 5. ADMINISTRATION TAB                                             */}
            {/* ================================================================= */}
            {activeTab === "Administration" && (
              <motion.div key="Administration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6">
                
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex items-center">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mr-6">
                    <ShieldAlert className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">Administrative Controls</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                      Manage student enrollment standing and account privileges
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Management */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Enrollment Standing</h4>
                      <p className="text-xs font-semibold text-slate-400 mb-6">Modify the student's status across the ERP platform.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 block mb-1.5">Current Status</label>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${studentData.studentStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            <span className="text-sm font-black text-slate-800">{studentData.studentStatus || studentData.status || 'Active'}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 block mb-1.5">Select New Status</label>
                          <select 
                            value={editStatus} 
                            onChange={e => setEditStatus(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Graduated">Graduated</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleUpdateStatus}
                      disabled={isSaving || editStatus === (studentData.studentStatus || studentData.status)}
                      className="w-full mt-6 py-3 bg-slate-900 text-white font-black text-xs rounded-xl shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Status
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-rose-50/60 p-6 rounded-3xl border border-rose-100 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black text-rose-900 uppercase tracking-wider mb-1">Access Management</h4>
                      <p className="text-xs font-semibold text-rose-700/60 mb-6">Manage login credentials and system authorizations.</p>
                      
                      <div className="space-y-3">
                        <div className="bg-white p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between">
                          <div>
                            <h5 className="text-xs font-black text-rose-900">Reset Portal Password</h5>
                            <p className="text-[10px] font-semibold text-rose-600">Send password reset token</p>
                          </div>
                          <button 
                            onClick={() => alert('Password reset token dispatched to student registered email.')} 
                            className="px-3 py-1.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-lg hover:bg-rose-200 transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD FEE PAYMENT                                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPayFeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsPayFeeModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Record Fee Payment</h3>
                    <p className="text-xs font-bold text-slate-400">
                      {studentData.firstName} {studentData.lastName} ({studentData.admissionNumber || studentData.studentId})
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPayFeeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitFeePayment} className="p-7 space-y-4">
                
                {/* Academic Year & Fee Category Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Academic Year</label>
                    <select 
                      value={payFeeForm.year}
                      onChange={e => setPayFeeForm({ ...payFeeForm, year: Number(e.target.value) })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                      <option value={5}>Year 5</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Fee Category</label>
                    <select 
                      value={payFeeForm.category}
                      onChange={e => {
                        const selectedCode = e.target.value;
                        const foundCat = feeCategories.find((c: any) => c.code === selectedCode);
                        setPayFeeForm(prev => ({
                          ...prev,
                          category: selectedCode,
                          amount: foundCat && foundCat.defaultAmount > 0 ? String(foundCat.defaultAmount) : prev.amount
                        }));
                      }}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {feeCategories.length > 0 ? (
                        <>
                          <optgroup label="Academic Fees">
                            {feeCategories.filter(c => c.type === 'Academic').map(cat => (
                              <option key={cat.code || cat._id} value={cat.code}>
                                {cat.name} {cat.defaultAmount ? `(₹${cat.defaultAmount.toLocaleString('en-IN')})` : ''}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Kit & Uniform Items">
                            {feeCategories.filter(c => c.type === 'Kit/Uniform').map(cat => (
                              <option key={cat.code || cat._id} value={cat.code}>
                                {cat.name} {cat.defaultAmount ? `(₹${cat.defaultAmount.toLocaleString('en-IN')})` : ''}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Facility & Labs">
                            {feeCategories.filter(c => c.type === 'Facility/Lab').map(cat => (
                              <option key={cat.code || cat._id} value={cat.code}>
                                {cat.name} {cat.defaultAmount ? `(₹${cat.defaultAmount.toLocaleString('en-IN')})` : ''}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Fines & Penalties">
                            {feeCategories.filter(c => c.type === 'Fine/Penalty').map(cat => (
                              <option key={cat.code || cat._id} value={cat.code}>
                                {cat.name} {cat.defaultAmount ? `(₹${cat.defaultAmount.toLocaleString('en-IN')})` : ''}
                              </option>
                            ))}
                          </optgroup>
                          {feeCategories.some(c => !['Academic', 'Kit/Uniform', 'Facility/Lab', 'Fine/Penalty'].includes(c.type)) && (
                            <optgroup label="Other Categories">
                              {feeCategories.filter(c => !['Academic', 'Kit/Uniform', 'Facility/Lab', 'Fine/Penalty'].includes(c.type)).map(cat => (
                                <option key={cat.code || cat._id} value={cat.code}>
                                  {cat.name} {cat.defaultAmount ? `(₹${cat.defaultAmount.toLocaleString('en-IN')})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      ) : (
                        <>
                          <option value="tuition">Tuition Fee</option>
                          <option value="exam">Examination Fee</option>
                          <option value="book">Books & Course Material</option>
                          <option value="blazer">College Blazer</option>
                          <option value="uniform">College Uniform (Pair)</option>
                          <option value="tshirt">College T-Shirt</option>
                          <option value="bag">College Bag / Backpack</option>
                          <option value="labcoat">Lab Coat & Apron</option>
                          <option value="fine">Disciplinary / Library Fine</option>
                          <option value="late_fee">Late Fee / Surcharge</option>
                          <option value="transport">Transport Fee</option>
                          <option value="other">Other / Misc Fee</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                      Payment Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    {feeSummary.balance > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setPayFeeForm({ ...payFeeForm, amount: String(feeSummary.balance) })}
                        className="text-[11px] font-black text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Fill Due (₹{feeSummary.balance})
                      </button>
                    )}
                  </div>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 35000"
                    value={payFeeForm.amount}
                    onChange={e => setPayFeeForm({ ...payFeeForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Payment Method & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Payment Mode</label>
                    <select 
                      value={payFeeForm.paymentMethod}
                      onChange={e => setPayFeeForm({ ...payFeeForm, paymentMethod: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online / UPI</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Payment Date</label>
                    <input 
                      type="date"
                      required
                      value={payFeeForm.paymentDate}
                      onChange={e => setPayFeeForm({ ...payFeeForm, paymentDate: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Receipt / Txn ID */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Receipt / Txn ID</label>
                  <input 
                    type="text"
                    value={payFeeForm.transactionId}
                    onChange={e => setPayFeeForm({ ...payFeeForm, transactionId: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-xs outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Remarks / Note</label>
                  <textarea 
                    value={payFeeForm.notes}
                    onChange={e => setPayFeeForm({ ...payFeeForm, notes: e.target.value })}
                    rows={2}
                    placeholder="e.g. Paid at college counter"
                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-semibold text-slate-700 text-xs outline-none resize-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingFeePay}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingFeePay ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm & Record Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT FEE STRUCTURE & PAID AMOUNTS                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditFeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsEditFeeModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-600">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">Edit Fee Structure & Paid Amounts</h3>
                    <p className="text-xs font-bold text-slate-400">
                      Configure or modify fee records for {studentData.firstName} {studentData.lastName}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditFeeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-8 py-3 bg-indigo-50/50 border-b border-indigo-100/50 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-6 text-xs font-bold">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Total: </span>
                    <span className="font-black text-slate-900">{formatCurrency(editModalTotals.total)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Paid: </span>
                    <span className="font-black text-emerald-600">{formatCurrency(editModalTotals.paid)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px]">Due: </span>
                    <span className="font-black text-amber-600">{formatCurrency(editModalTotals.balance)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleMarkAllAsPaid}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark All as Paid
                  </button>
                  <button 
                    type="button" 
                    onClick={handleResetAllPaid}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all"
                  >
                    Reset Paid
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {editFeeYears.map((yr, yIdx) => {
                  let yrTotal = 0;
                  let yrPaid = 0;
                  (yr.components || []).forEach((c: any) => {
                    yrTotal += Number(c.amount) || 0;
                    yrPaid += Number(c.paid) || 0;
                  });
                  const yrDue = Math.max(0, yrTotal - yrPaid);

                  return (
                    <div key={yIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      
                      <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs">
                            {yr.year}
                          </span>
                          <span className="font-black text-slate-800 text-sm">Academic Year {yr.year}</span>
                          <span className="text-xs font-semibold text-slate-400">
                            (Total: {formatCurrency(yrTotal)} | Paid: {formatCurrency(yrPaid)} | Due: {formatCurrency(yrDue)})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => handleQuickMarkYearPaid(yIdx)}
                            className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark Year Paid
                          </button>
                          {editFeeYears.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveAcademicYear(yIdx)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(yr.components || []).map((comp: any, cIdx: number) => (
                          <div key={cIdx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-center">
                              <input 
                                type="text"
                                value={comp.category || ""}
                                onChange={e => handleEditFeeChange(yIdx, cIdx, "category", e.target.value)}
                                className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 hover:bg-slate-100 rounded px-1 -ml-1 transition-colors w-[60%]"
                              />
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button" 
                                  onClick={() => handleQuickMarkCategoryPaid(yIdx, cIdx)}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline whitespace-nowrap"
                                >
                                  Set Paid = Total
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveFeeComponent(yIdx, cIdx)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                  title="Remove Component"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total (₹)</span>
                                <input 
                                  type="number"
                                  value={comp.amount ?? 0}
                                  onChange={e => handleEditFeeChange(yIdx, cIdx, "amount", e.target.value)}
                                  className="w-full mt-0.5 bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-slate-800 text-xs"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Paid (₹)</span>
                                <input 
                                  type="number"
                                  value={comp.paid ?? 0}
                                  onChange={e => handleEditFeeChange(yIdx, cIdx, "paid", e.target.value)}
                                  className="w-full mt-0.5 bg-slate-50 border border-slate-200 p-2 rounded-lg font-bold text-emerald-700 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => handleAddFeeComponent(yIdx)}
                        className="w-full mt-4 py-2 border border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-indigo-50/50"
                      >
                        <Plus className="w-4 h-4" /> Add Extra Charge
                      </button>
                    </div>
                  );
                })}

                <button 
                  type="button" 
                  onClick={handleAddAcademicYear}
                  className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-indigo-50/50"
                >
                  <Plus className="w-4 h-4" /> Add Another Academic Year
                </button>
              </div>

              <div className="px-8 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                <button 
                  type="button" 
                  onClick={() => setIsEditFeeModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  disabled={isSavingFeeEdit}
                  onClick={handleSaveStudentFeeStructure}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingFeeEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Fee Structure & Payments
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student ID Card Modal */}
      <IdCardModal
        isOpen={isIdModalOpen}
        onClose={() => setIsIdModalOpen(false)}
        studentData={studentData}
        branchName={selectedBranch?.name}
        courseName={selectedCourse?.name}
      />

      {/* Student Fee Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={selectedReceipt}
      />
    </div>
  );
}

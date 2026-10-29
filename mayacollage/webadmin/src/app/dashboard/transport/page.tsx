"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bus, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserX, 
  IndianRupee, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  X, 
  CreditCard,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  User
} from "lucide-react";
import Link from "next/link";

interface RouteStop {
  stationName: string;
  price: number;
}

interface AssignedStudent {
  _id?: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    mobile?: string;
    studentId?: string;
    admissionNumber?: string;
    selectedBranch?: string;
    selectedProgram?: string;
    courseYear?: number;
    fees?: any;
  };
  stopName: string;
  fare: number;
  paymentStatus: 'Paid' | 'Pending';
  paymentDate?: string;
  transactionId?: string;
}

interface BusFleet {
  _id: string;
  busNo: string;
  driverName: string;
  conductorName: string;
  capacity: number;
  filled: number;
  routeName: string;
  status: 'Active' | 'Full' | 'Service';
  stops: RouteStop[];
  students: AssignedStudent[];
  createdAt?: string;
  updatedAt?: string;
}

function TransportSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-sans text-slate-800 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="bg-gradient-to-r from-amber-600/30 via-orange-500/20 to-rose-600/30 rounded-3xl p-8 border border-amber-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-32 bg-amber-400/30 rounded-full" />
              <div className="h-4 w-40 bg-amber-300/20 rounded-lg" />
            </div>
            <div className="h-9 w-80 bg-amber-400/40 rounded-2xl" />
            <div className="h-4 w-full max-w-lg bg-amber-300/30 rounded-xl" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-36 bg-white/20 rounded-2xl" />
            <div className="h-10 w-10 bg-white/20 rounded-2xl" />
            <div className="h-10 w-32 bg-white/30 rounded-2xl" />
            <div className="h-10 w-28 bg-white/80 rounded-2xl" />
          </div>
        </div>

        {/* Tab Switcher Skeleton */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/20">
          <div className="h-10 w-40 bg-white/90 rounded-2xl" />
          <div className="h-10 w-48 bg-white/20 rounded-2xl" />
          <div className="h-10 w-44 bg-white/20 rounded-2xl" />
        </div>
      </div>

      {/* 5 KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-amber-50" />
              <div className="h-4 w-14 bg-slate-100 rounded-full" />
            </div>
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-7 w-28 bg-slate-300 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Toolbar / Search Filter Skeleton */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full">
          <div className="h-12 w-full max-w-md bg-slate-100 rounded-2xl" />
          <div className="h-12 w-36 bg-slate-100 rounded-2xl" />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-12 w-32 bg-slate-100 rounded-2xl" />
        </div>
      </div>

      {/* Fleet Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((card) => (
          <div key={card} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-amber-500/20 rounded-xl" />
                <div className="h-4 w-44 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-20 bg-emerald-100 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-200 rounded" />
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400/40 w-1/2 rounded-full" />
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-300 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-300 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className="h-6 w-20 bg-slate-100 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <div className="h-9 flex-1 bg-slate-100 rounded-xl" />
              <div className="h-9 w-24 bg-amber-100/60 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState<"fleet" | "students" | "routes">("fleet");
  const [buses, setBuses] = useState<BusFleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filters
  const [fleetSearch, setFleetSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedBusFilter, setSelectedBusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "Paid" | "Pending">("all");
  const [expandedBusId, setExpandedBusId] = useState<string | null>(null);

  // Modals
  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBus, setEditingBus] = useState<BusFleet | null>(null);
  const [busForm, setBusForm] = useState({
    busNo: "",
    driverName: "",
    conductorName: "",
    capacity: 40,
    routeName: "",
    status: "Active" as 'Active' | 'Full' | 'Service',
    stops: [{ stationName: "", price: 10000 }]
  });

  // Assign Student Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignBusId, setAssignBusId] = useState("");
  const [assignStopName, setAssignStopName] = useState("");
  const [assignCustomFare, setAssignCustomFare] = useState<number | "">("");
  const [assignPaymentStatus, setAssignPaymentStatus] = useState<"Pending" | "Paid">("Pending");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);

  // Local cache memory for student search (prevents heavy database hits & enables 0ms search)
  const [cachedStudents, setCachedStudents] = useState<any[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [isPreloadingStudents, setIsPreloadingStudents] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load / Preload all students into local cache memory
  const loadStudentsIntoCache = async (forceRefresh = false) => {
    try {
      // 1. Check in-memory state first if not forced
      if (!forceRefresh && cachedStudents.length > 0) {
        return cachedStudents;
      }

      // 2. Check browser sessionStorage cache (valid for 20 mins)
      if (!forceRefresh && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem("maya_transport_students_cache");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.timestamp && Date.now() - parsed.timestamp < 20 * 60 * 1000 && Array.isArray(parsed.data)) {
              setCachedStudents(parsed.data);
              setCacheLoaded(true);
              return parsed.data;
            }
          }
        } catch (e) {
          console.warn("Session cache read error:", e);
        }
      }

      // 3. Fetch from PostgreSQL endpoint with Redis caching
      setIsPreloadingStudents(true);
      const res = await fetch(`/api/transport/students/search?all=true${forceRefresh ? '&refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setCachedStudents(data);
        setCacheLoaded(true);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("maya_transport_students_cache", JSON.stringify({
              timestamp: Date.now(),
              data
            }));
          } catch (e) {}
        }
        return data;
      }
    } catch (err) {
      console.error("Failed to load students into local cache memory:", err);
    } finally {
      setIsPreloadingStudents(false);
    }
    return [];
  };

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transport/buses");
      if (res.ok) {
        const data = await res.json();
        setBuses(data);
      } else {
        showToast('error', 'Failed to fetch transport fleet records');
      }
    } catch (error) {
      console.error("Failed to fetch buses", error);
      showToast('error', 'Network error connecting to transport database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
    loadStudentsIntoCache(); // Warm up local cache memory in background
  }, []);

  // Seed Demo Buses
  const handleSeedBuses = async () => {
    if (!confirm("Seed or update 3 college fleet buses with routes & stops?")) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/transport/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || "College buses seeded successfully!");
        await fetchBuses();
      } else {
        showToast('error', data.message || "Failed to seed buses");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error seeding buses");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Add Bus Modal
  const handleOpenAddBus = () => {
    setEditingBus(null);
    setBusForm({
      busNo: `BUS-0${buses.length + 1} (UP-14-BT-${Math.floor(1000 + Math.random() * 9000)})`,
      driverName: "",
      conductorName: "",
      capacity: 40,
      routeName: "",
      status: "Active",
      stops: [
        { stationName: "Main City Center", price: 12000 },
        { stationName: "Metro Interchange", price: 10000 }
      ]
    });
    setShowBusModal(true);
  };

  // Open Edit Bus Modal
  const handleOpenEditBus = (bus: BusFleet) => {
    setEditingBus(bus);
    setBusForm({
      busNo: bus.busNo,
      driverName: bus.driverName,
      conductorName: bus.conductorName,
      capacity: bus.capacity,
      routeName: bus.routeName,
      status: bus.status,
      stops: bus.stops && bus.stops.length > 0 ? bus.stops.map(s => ({ ...s })) : [{ stationName: "", price: 0 }]
    });
    setShowBusModal(true);
  };

  // Save Bus (Add/Edit)
  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busForm.busNo.trim() || !busForm.routeName.trim() || !busForm.driverName.trim()) {
      alert("Please enter Bus Number, Route Name, and Driver Name.");
      return;
    }

    const validStops = busForm.stops.filter(s => s.stationName.trim().length > 0);
    if (validStops.length === 0) {
      alert("Please add at least one station stop with fare.");
      return;
    }

    try {
      setActionLoading(true);
      let res;
      if (editingBus) {
        res = await fetch(`/api/transport/bus/${editingBus._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...busForm,
            capacity: Number(busForm.capacity),
            stops: validStops.map(s => ({ stationName: s.stationName.trim(), price: Number(s.price) || 0 }))
          })
        });
      } else {
        res = await fetch("/api/transport/bus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...busForm,
            capacity: Number(busForm.capacity),
            stops: validStops.map(s => ({ stationName: s.stationName.trim(), price: Number(s.price) || 0 }))
          })
        });
      }

      const data = await res.json();
      if (res.ok) {
        showToast('success', editingBus ? `Bus ${busForm.busNo} updated successfully!` : `Bus ${busForm.busNo} added to fleet!`);
        setShowBusModal(false);
        await fetchBuses();
      } else {
        showToast('error', data.message || "Failed to save bus fleet record");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error saving bus");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Bus
  const handleDeleteBus = async (busId: string, busNo: string) => {
    if (!confirm(`Are you sure you want to delete ${busNo}? This will remove all assigned students from this fleet.`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/transport/bus/${busId}`, { method: "DELETE" });
      if (res.ok) {
        showToast('success', `${busNo} was deleted from the fleet.`);
        await fetchBuses();
      } else {
        const data = await res.json();
        showToast('error', data.message || "Failed to delete bus");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error deleting bus");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Assign Modal
  const handleOpenAssignModal = (busId?: string) => {
    const targetBusId = busId || (buses[0]?._id || "");
    const targetBus = buses.find(b => b._id === targetBusId);
    setAssignBusId(targetBusId);
    setAssignStopName(targetBus?.stops[0]?.stationName || "");
    setAssignCustomFare(targetBus?.stops[0]?.price ?? "");
    setAssignPaymentStatus("Pending");
    setSelectedStudent(null);
    setStudentSearchQuery("");
    setShowAssignModal(true);
    // Ensure students are loaded in local cache memory
    loadStudentsIntoCache();
  };

  // On Bus selection change in Assign Modal
  const handleAssignBusChange = (newBusId: string) => {
    setAssignBusId(newBusId);
    const bus = buses.find(b => b._id === newBusId);
    if (bus && bus.stops.length > 0) {
      setAssignStopName(bus.stops[0].stationName);
      setAssignCustomFare(bus.stops[0].price);
    } else {
      setAssignStopName("");
      setAssignCustomFare("");
    }
  };

  // On Stop selection change in Assign Modal
  const handleAssignStopChange = (newStopName: string) => {
    setAssignStopName(newStopName);
    const bus = buses.find(b => b._id === assignBusId);
    const stop = bus?.stops.find(s => s.stationName === newStopName);
    if (stop) {
      setAssignCustomFare(stop.price);
    }
  };

  // Character-by-character instant suggestions directly from local cache memory (0ms search, 0 DB queries)
  const studentSuggestions = useMemo(() => {
    if (!cachedStudents || cachedStudents.length === 0) return [];
    const q = studentSearchQuery.trim().toLowerCase();
    
    // If no query typed yet, suggest first 25 students from local cache
    if (!q) {
      return cachedStudents.slice(0, 25);
    }

    const tokens = q.split(/\s+/).filter(Boolean);
    return cachedStudents.filter(st => {
      const name = `${st.firstName || ''} ${st.middleName || ''} ${st.lastName || ''}`.toLowerCase();
      const sId = (st.studentId || '').toLowerCase();
      const adm = (st.admissionNumber || '').toLowerCase();
      const enr = (st.enrollmentNumber || '').toLowerCase();
      const father = (st.fatherName || '').toLowerCase();
      const mob = (st.mobile || '').toLowerCase();
      const email = (st.email || '').toLowerCase();
      const prog = (st.courseName || st.selectedProgram || '').toLowerCase();
      const branch = (st.branchName || st.selectedBranch || '').toLowerCase();

      const haystack = `${name} ${sId} ${adm} ${enr} ${father} ${mob} ${email} ${prog} ${branch}`;
      return tokens.every(tok => haystack.includes(tok));
    }).slice(0, 50);
  }, [cachedStudents, studentSearchQuery]);

  // Fallback search directly against PostgreSQL if user explicitly clicks Search button
  const handleSearchStudent = async () => {
    if (!studentSearchQuery.trim()) return;
    try {
      setStudentSearchLoading(true);
      const res = await fetch(`/api/transport/students/search?q=${encodeURIComponent(studentSearchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        // Merge into local cache if new
        if (Array.isArray(data) && data.length > 0) {
          setCachedStudents(prev => {
            const existingIds = new Set(prev.map(p => p.id || p._id));
            const newOnes = data.filter(d => !existingIds.has(d.id || d._id));
            return [...prev, ...newOnes];
          });
          if (data.length === 1 && !selectedStudent) {
            setSelectedStudent(data[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Student search error in PostgreSQL database');
    } finally {
      setStudentSearchLoading(false);
    }
  };

  // Submit Assign Student
  const handleSubmitAssignStudent = async () => {
    if (!assignBusId || !selectedStudent || !assignStopName) {
      alert("Please select a bus, stop, and student.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/transport/assign-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busId: assignBusId,
          studentId: selectedStudent._id || selectedStudent.id,
          stopName: assignStopName,
          customFare: assignCustomFare !== "" ? Number(assignCustomFare) : undefined,
          paymentStatus: assignPaymentStatus
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || "Student assigned to bus & fee updated in student ledger!");
        setShowAssignModal(false);
        await fetchBuses();
      } else {
        showToast('error', data.message || "Failed to assign student");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error assigning student");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Payment Status from Transport Desk (Paid vs Unpaid)
  const handleTogglePaymentStatus = async (busId: string, studentId: string, currentStatus: string, studentName: string) => {
    const markPaid = currentStatus !== 'Paid';
    const actionText = markPaid ? "MARK AS PAID" : "MARK AS UNPAID (Pending)";
    if (!confirm(`Confirm ${actionText} for ${studentName}'s transport fee? This will synchronize with the student dossier and finance ledger.`)) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/transport/toggle-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busId,
          studentId,
          markPaid,
          paymentMode: 'Cash'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || `Transport fee updated for ${studentName}!`);
        await fetchBuses();
      } else {
        showToast('error', data.message || "Failed to update payment status");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error toggling payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Unassign Student
  const handleUnassignStudent = async (busId: string, studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this bus? Their transport fee will be reset in student records.`)) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/transport/unassign-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busId, studentId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || "Student unassigned and transport fee cleared.");
        await fetchBuses();
      } else {
        showToast('error', data.message || "Failed to unassign student");
      }
    } catch (err: any) {
      showToast('error', err.message || "Error unassigning student");
    } finally {
      setActionLoading(false);
    }
  };

  // High-performance multi-token search algorithm for fleet
  const filteredBuses = useMemo(() => {
    const rawQuery = fleetSearch.toLowerCase().trim();
    const tokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

    return buses.filter(b => {
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      if (!matchesStatus) return false;
      if (tokens.length === 0) return true;

      const stopsText = b.stops?.map(s => s.stationName).join(" ") || "";
      const studentsText = b.students?.map(s => `${s.student?.firstName || ''} ${s.student?.lastName || ''} ${s.student?.studentId || ''}`).join(" ") || "";
      const haystack = `${b.busNo} ${b.routeName} ${b.driverName} ${b.conductorName} ${stopsText} ${studentsText}`.toLowerCase();

      return tokens.every(token => haystack.includes(token));
    });
  }, [buses, fleetSearch, statusFilter]);

  // All Assigned Students flattened for Student Commuters table
  const allAssignedStudents = useMemo(() => {
    const list: Array<{ bus: BusFleet; assignment: AssignedStudent }> = [];
    buses.forEach(b => {
      if (Array.isArray(b.students)) {
        b.students.forEach(s => {
          if (s && s.student) {
            list.push({ bus: b, assignment: s });
          }
        });
      }
    });
    return list;
  }, [buses]);

  // High-performance multi-token search algorithm for student commuters
  const filteredStudents = useMemo(() => {
    const rawQuery = studentSearch.toLowerCase().trim();
    const tokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

    return allAssignedStudents.filter(({ bus, assignment }) => {
      const matchesBus = selectedBusFilter === "all" || bus._id === selectedBusFilter;
      const matchesPayment = paymentFilter === "all" || assignment.paymentStatus === paymentFilter;
      if (!matchesBus || !matchesPayment) return false;
      if (tokens.length === 0) return true;

      const s = assignment.student;
      const haystack = [
        s?.firstName,
        s?.lastName,
        `${s?.firstName || ''} ${s?.lastName || ''}`,
        s?.studentId,
        s?.admissionNumber,
        s?.email,
        s?.mobile,
        s?.selectedBranch,
        s?.selectedProgram,
        assignment?.stopName,
        bus?.busNo,
        bus?.routeName,
        assignment?.paymentStatus
      ].filter(Boolean).join(" ").toLowerCase();

      return tokens.every(token => haystack.includes(token));
    });
  }, [allAssignedStudents, studentSearch, selectedBusFilter, paymentFilter]);

  // Metrics
  const totalCapacity = buses.reduce((acc, b) => acc + (b.capacity || 0), 0);
  const totalEnrolled = allAssignedStudents.length;
  const totalTransportFeesAssessed = allAssignedStudents.reduce((acc, { assignment }) => acc + (assignment.fare || 0), 0);
  const totalTransportFeesCollected = allAssignedStudents
    .filter(({ assignment }) => assignment.paymentStatus === 'Paid')
    .reduce((acc, { assignment }) => acc + (assignment.fare || 0), 0);
  const totalTransportFeesPending = Math.max(0, totalTransportFeesAssessed - totalTransportFeesCollected);

  if (loading) {
    return <TransportSkeleton />;
  }

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

      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-600 via-orange-500 to-rose-600 rounded-3xl p-8 text-white shadow-xl shadow-amber-900/10 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-amber-100 flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5" /> Fleet & Mobility
              </span>
              <span className="text-amber-200 text-xs font-semibold">• Central Transport Hub</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2">
              Campus Transport & Route Control
            </h1>
            <p className="text-amber-100 font-medium max-w-2xl text-sm leading-relaxed">
              Add buses with pickup routes and station stops, assign students with automatic fee synchronization, and manage paid/unpaid transport fees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button 
              onClick={handleSeedBuses}
              disabled={actionLoading}
              title="Populate 3 college buses with full routes, station stops & prices"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Seed 3 Demo Buses</span>
            </button>

            <button 
              onClick={fetchBuses}
              disabled={actionLoading}
              className="p-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 rounded-2xl transition-all shadow-sm"
              title="Refresh Fleet Records"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => handleOpenAssignModal()}
              className="px-4 py-2.5 bg-amber-900/40 hover:bg-amber-900/60 active:scale-95 text-white border border-white/30 rounded-2xl font-bold text-xs lg:text-sm transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Student</span>
            </button>

            <button 
              onClick={handleOpenAddBus}
              className="px-5 py-2.5 bg-white text-amber-700 hover:bg-amber-50 active:scale-95 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-black/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Bus</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/15">
          {[
            { id: "fleet", label: "Fleet & Routes", icon: Bus, badge: buses.length },
            { id: "students", label: "Assigned Students & Fees", icon: Users, badge: allAssignedStudents.length },
            { id: "routes", label: "Route Stops & Fee Matrix", icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs lg:text-sm transition-all flex items-center gap-2.5 ${
                  isActive 
                    ? "bg-white text-amber-700 shadow-md scale-100 font-black" 
                    : "bg-white/10 text-white hover:bg-white/20 scale-95 hover:scale-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-amber-100 text-amber-700" : "bg-white/20 text-white"
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
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <Bus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{buses.length} Fleet</span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Total Capacity</p>
          <div className="text-2xl lg:text-3xl font-black text-slate-800">{totalCapacity} Seats</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {totalCapacity ? Math.round((totalEnrolled / totalCapacity) * 100) : 0}% Filled
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Enrolled Commuters</p>
          <div className="text-2xl lg:text-3xl font-black text-indigo-600">{totalEnrolled}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Annual</span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Total Transport Fees</p>
          <div className="text-2xl lg:text-3xl font-black text-blue-700">₹{totalTransportFeesAssessed.toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {totalTransportFeesAssessed ? Math.round((totalTransportFeesCollected / totalTransportFeesAssessed) * 100) : 0}% Paid
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Fees Collected</p>
          <div className="text-2xl lg:text-3xl font-black text-emerald-600">₹{totalTransportFeesCollected.toLocaleString('en-IN')}</div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            {totalTransportFeesPending > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Due</span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-400 mb-0.5">Pending Dues</p>
          <div className={`text-2xl lg:text-3xl font-black ${totalTransportFeesPending > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            ₹{totalTransportFeesPending.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* WORKSPACE CONTENT */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: FLEET & ROUTES */}
        {activeTab === "fleet" && (
          <motion.div
            key="fleet"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  placeholder="Search by bus number, route name, driver, or stop..."
                  className="w-full bg-slate-50 border-0 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-amber-200 transition-all"
                />
              </div>

              <div className="flex gap-2">
                {['all', 'Active', 'Full', 'Service'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === st 
                        ? 'bg-amber-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'All Status' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Bus Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBuses.map((bus) => {
                const isExpanded = expandedBusId === bus._id;
                const assignedCount = bus.students ? bus.students.length : 0;
                const percentFilled = bus.capacity > 0 ? Math.round((assignedCount / bus.capacity) * 100) : 0;
                const busPaidCount = bus.students?.filter(s => s.paymentStatus === 'Paid').length || 0;

                return (
                  <motion.div
                    key={bus._id}
                    layout
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Bus No & Status */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Bus className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-800">{bus.busNo}</h3>
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              <span>{bus.routeName}</span>
                            </p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                          bus.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                          bus.status === 'Full' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {bus.status}
                        </span>
                      </div>

                      {/* Driver / Conductor Bar */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl my-4 text-xs font-semibold text-slate-700">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Driver</p>
                          <p className="font-bold text-slate-900">{bus.driverName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Conductor</p>
                          <p className="font-bold text-slate-900">{bus.conductorName}</p>
                        </div>
                      </div>

                      {/* Occupancy & Fees Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Occupancy Capacity</span>
                          <span className={percentFilled >= 100 ? 'text-rose-600' : 'text-slate-800'}>
                            {assignedCount} / {bus.capacity} Seats ({percentFilled}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentFilled >= 90 ? 'bg-rose-500' :
                              percentFilled >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percentFilled)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 pt-1">
                          <span>Fee Status: <strong className="text-emerald-600">{busPaidCount} Paid</strong> / <strong className="text-rose-600">{assignedCount - busPaidCount} Unpaid</strong></span>
                          <span>{bus.stops?.length || 0} Station Stops</span>
                        </div>
                      </div>

                      {/* Route Stops Pills */}
                      <div className="space-y-2 mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Route Stops & Fares</p>
                        <div className="flex flex-wrap gap-1.5">
                          {bus.stops?.map((st, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200/60">
                              <span>{st.stationName}</span>
                              <strong className="text-amber-700 font-bold">₹{st.price}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Expandable Assigned Students Preview */}
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 border-t border-slate-100 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                              Assigned Students ({assignedCount})
                            </h4>
                            <button 
                              onClick={() => handleOpenAssignModal(bus._id)}
                              className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Assign New
                            </button>
                          </div>

                          {assignedCount > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {bus.students.map((stObj, idx) => {
                                const st = stObj.student;
                                if (!st) return null;
                                const isPaid = stObj.paymentStatus === 'Paid';

                                return (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs border border-slate-100">
                                    <div>
                                      <p className="font-bold text-slate-800">{st.firstName} {st.lastName}</p>
                                      <p className="text-[11px] text-slate-500 font-medium">
                                        Stop: <strong>{stObj.stopName}</strong> • Fare: <strong>₹{stObj.fare}</strong>
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleTogglePaymentStatus(bus._id, st._id, stObj.paymentStatus, `${st.firstName} ${st.lastName}`)}
                                        className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all ${
                                          isPaid 
                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                        }`}
                                      >
                                        {isPaid ? '✓ Paid' : '✗ Mark Paid'}
                                      </button>

                                      <button
                                        onClick={() => handleUnassignStudent(bus._id, st._id, `${st.firstName} ${st.lastName}`)}
                                        title="Unassign from bus"
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-semibold py-2">No students currently assigned to this bus.</p>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                      <button 
                        onClick={() => setExpandedBusId(isExpanded ? null : bus._id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>{isExpanded ? "Collapse" : `Students (${assignedCount})`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenAssignModal(bus._id)}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>

                        <button 
                          onClick={() => handleOpenEditBus(bus)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Edit Route & Bus"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleDeleteBus(bus._id, bus.busNo)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Bus Fleet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredBuses.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                  <Bus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">No Buses Found</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Create new bus fleet routes or seed demo buses for the campus.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button 
                    onClick={handleSeedBuses}
                    className="px-5 py-2.5 bg-amber-50 text-amber-700 rounded-2xl text-xs font-bold hover:bg-amber-100 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Seed 3 Demo Buses
                  </button>
                  <button 
                    onClick={handleOpenAddBus}
                    className="px-5 py-2.5 bg-amber-600 text-white rounded-2xl text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add New Bus
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: ASSIGNED STUDENTS & TRANSPORT FEES */}
        {activeTab === "students" && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Filter student name, ID, stop name, or bus..."
                  className="w-full bg-slate-50 border-0 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-amber-200 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Bus Select */}
                <select
                  value={selectedBusFilter}
                  onChange={(e) => setSelectedBusFilter(e.target.value)}
                  className="bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none ring-2 ring-transparent focus:ring-amber-200 cursor-pointer"
                >
                  <option value="all">All Bus Fleets</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>{b.busNo}</option>
                  ))}
                </select>

                {/* Payment Filter */}
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  {[
                    { id: "all", label: "All Fees" },
                    { id: "Paid", label: "Paid Only" },
                    { id: "Pending", label: "Unpaid Only" }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPaymentFilter(p.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        paymentFilter === p.id 
                          ? 'bg-white text-amber-700 shadow-sm font-black' 
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenAssignModal()}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Student</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Student Dossier</th>
                      <th className="py-4 px-4">Bus Fleet & Route</th>
                      <th className="py-4 px-4">Pickup / Drop Station</th>
                      <th className="py-4 px-4">Transport Fee (₹)</th>
                      <th className="py-4 px-4">Payment Clearance</th>
                      <th className="py-4 px-6 text-right">Fee Management Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(({ bus, assignment }) => {
                        const st = assignment.student;
                        if (!st) return null;
                        const isPaid = assignment.paymentStatus === 'Paid';

                        return (
                          <tr key={`${bus._id}-${st._id}`} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 font-black flex items-center justify-center text-sm border border-amber-100">
                                  {st.firstName?.[0] || 'S'}
                                </div>
                                <div>
                                  <Link href={`/dashboard/students/${st._id}`}>
                                    <p className="font-black text-slate-800 text-sm hover:text-amber-600 transition-colors">
                                      {st.firstName} {st.lastName}
                                    </p>
                                  </Link>
                                  <p className="text-xs font-semibold text-slate-400">
                                    ID: {st.studentId || st.admissionNumber || 'N/A'} {st.mobile && `• 📞 ${st.mobile}`}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <Bus className="w-3.5 h-3.5 text-amber-500" />
                                <span>{bus.busNo}</span>
                              </p>
                              <p className="text-xs text-slate-400 truncate max-w-xs">{bus.routeName}</p>
                            </td>

                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                {assignment.stopName}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-black text-slate-800 text-sm">
                              ₹{assignment.fare?.toLocaleString('en-IN') || 0}
                            </td>

                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                                <span>{isPaid ? 'Paid' : 'Unpaid / Pending'}</span>
                              </span>
                              {isPaid && assignment.paymentDate && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  {new Date(assignment.paymentDate).toLocaleDateString()}
                                </p>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleTogglePaymentStatus(bus._id, st._id, assignment.paymentStatus, `${st.firstName} ${st.lastName}`)}
                                  disabled={actionLoading}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 ${
                                    isPaid 
                                      ? 'bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700' 
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  {isPaid ? (
                                    <>
                                      <X className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Mark Unpaid</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Mark Paid</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleUnassignStudent(bus._id, st._id, `${st.firstName} ${st.lastName}`)}
                                  disabled={actionLoading}
                                  title="Unassign from bus"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                          No student transport assignments found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: ROUTE STOPS & FEE MATRIX */}
        {activeTab === "routes" && (
          <motion.div
            key="routes"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buses.map((bus) => (
                <div key={bus._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-800 text-base">{bus.busNo}</h3>
                      <p className="text-xs font-semibold text-slate-500">{bus.routeName}</p>
                    </div>
                    <button 
                      onClick={() => handleOpenEditBus(bus)}
                      className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Stops
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {bus.stops?.map((s, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 font-black text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-700">{s.stationName}</span>
                        </div>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                          ₹{s.price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ADD / EDIT BUS MODAL */}
      <AnimatePresence>
        {showBusModal && (
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
                    {editingBus ? "Edit Bus Fleet & Route" : "Add New Bus to Campus Fleet"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure bus number, driver credentials, passenger capacity, and route station fares
                  </p>
                </div>
                <button 
                  onClick={() => setShowBusModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBus} className="space-y-4 text-xs font-bold text-slate-700">
                {/* Bus No & Route Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Bus Fleet Number *</label>
                    <input 
                      type="text"
                      required
                      value={busForm.busNo}
                      onChange={(e) => setBusForm({ ...busForm, busNo: e.target.value })}
                      placeholder="e.g. BUS-01 (UP-14-BT-9821)"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Route Name *</label>
                    <input 
                      type="text"
                      required
                      value={busForm.routeName}
                      onChange={(e) => setBusForm({ ...busForm, routeName: e.target.value })}
                      placeholder="e.g. South Delhi - Noida Express Line"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200"
                    />
                  </div>
                </div>

                {/* Driver & Conductor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Driver Name & Phone *</label>
                    <input 
                      type="text"
                      required
                      value={busForm.driverName}
                      onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })}
                      placeholder="e.g. Ramesh Chandra (9876543210)"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Conductor Name & Phone *</label>
                    <input 
                      type="text"
                      required
                      value={busForm.conductorName}
                      onChange={(e) => setBusForm({ ...busForm, conductorName: e.target.value })}
                      placeholder="e.g. Mohan Lal (9876543211)"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200"
                    />
                  </div>
                </div>

                {/* Capacity & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Passenger Capacity (Seats) *</label>
                    <input 
                      type="number"
                      min={1}
                      required
                      value={busForm.capacity}
                      onChange={(e) => setBusForm({ ...busForm, capacity: Number(e.target.value) })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Fleet Operational Status</label>
                    <select
                      value={busForm.status}
                      onChange={(e) => setBusForm({ ...busForm, status: e.target.value as any })}
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200 cursor-pointer"
                    >
                      <option value="Active">Active (In Operation)</option>
                      <option value="Full">Full (No More Seats)</option>
                      <option value="Service">Service (Maintenance)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Route Stops with Fares */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="block font-black text-slate-800 uppercase tracking-wider text-xs">
                      Route Station Stops & Transport Fares
                    </label>
                    <button
                      type="button"
                      onClick={() => setBusForm({
                        ...busForm,
                        stops: [...busForm.stops, { stationName: "", price: 10000 }]
                      })}
                      className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Stop
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {busForm.stops.map((stop, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <input 
                          type="text"
                          required
                          value={stop.stationName}
                          onChange={(e) => {
                            const newStops = [...busForm.stops];
                            newStops[sIdx].stationName = e.target.value;
                            setBusForm({ ...busForm, stops: newStops });
                          }}
                          placeholder={`Station / Stop #${sIdx + 1}`}
                          className="flex-1 bg-slate-50 border-0 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200"
                        />
                        <div className="relative w-36">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                          <input 
                            type="number"
                            min={0}
                            required
                            value={stop.price}
                            onChange={(e) => {
                              const newStops = [...busForm.stops];
                              newStops[sIdx].price = Number(e.target.value);
                              setBusForm({ ...busForm, stops: newStops });
                            }}
                            placeholder="Fare"
                            className="w-full bg-slate-50 border-0 rounded-2xl pl-7 pr-3 py-2.5 text-xs font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-amber-200"
                          />
                        </div>
                        {busForm.stops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newStops = busForm.stops.filter((_, idx) => idx !== sIdx);
                              setBusForm({ ...busForm, stops: newStops });
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit / Cancel */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowBusModal(false)}
                    className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="px-8 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-2xl font-black shadow-lg shadow-amber-600/20 transition-all"
                  >
                    {actionLoading ? "Saving..." : editingBus ? "Update Bus Fleet" : "Add to Fleet"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN STUDENT TO BUS MODAL (LARGE SCREEN WITH COMPLETE STUDENT DOSSIER) */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 my-auto overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black shrink-0">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      Assign Student to Bus Fleet
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Enrolls student in campus transport, designates pickup stop, and registers fee in the student dossier.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - 2 Columns on Large Screens */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-5 overflow-y-auto pr-1 flex-1">
                
                {/* Left Column (5 Cols): Fleet, Stop, Fee Configuration & Selected Student Dossier */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-100 space-y-3.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Bus className="w-3.5 h-3.5 text-amber-500" />
                      Fleet & Station Settings
                    </h4>

                    {/* 1. Fleet Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Bus Fleet *
                      </label>
                      <select
                        value={assignBusId}
                        onChange={(e) => handleAssignBusChange(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs"
                      >
                        {buses.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.busNo} — {b.routeName} ({b.students?.length || 0}/{b.capacity} Seats)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Stop Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pickup / Drop Stop *
                      </label>
                      <select
                        value={assignStopName}
                        onChange={(e) => handleAssignStopChange(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs"
                      >
                        {buses.find(b => b._id === assignBusId)?.stops.map((s, idx) => (
                          <option key={idx} value={s.stationName}>
                            {s.stationName} (Standard: ₹{s.price?.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Fare & Payment Status */}
                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Assessed Fee (₹) *
                        </label>
                        <input 
                          type="number"
                          min={0}
                          value={assignCustomFare}
                          onChange={(e) => setAssignCustomFare(e.target.value ? Number(e.target.value) : "")}
                          placeholder="Amount in ₹"
                          className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Initial Status
                        </label>
                        <select
                          value={assignPaymentStatus}
                          onChange={(e) => setAssignPaymentStatus(e.target.value as any)}
                          className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs"
                        >
                          <option value="Pending">Unpaid (Due)</option>
                          <option value="Paid">Mark Paid</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Selected Student Complete Profile Showcase Card */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        Selected Student Dossier
                      </span>
                      {selectedStudent && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200/60 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ready for Fleet
                        </span>
                      )}
                    </h4>

                    {selectedStudent ? (
                      <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border-2 border-emerald-300/80 rounded-2xl p-4 space-y-3 shadow-xs">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm uppercase">
                            {(selectedStudent.firstName?.[0] || 'S').toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-900 text-sm tracking-tight truncate uppercase">
                              {selectedStudent.firstName} {selectedStudent.lastName}
                            </h4>
                            {selectedStudent.fatherName ? (
                              <p className="text-xs text-slate-700 font-semibold truncate mt-0.5">
                                <span className="text-slate-400 font-normal">S/O:</span> {selectedStudent.fatherName}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">Father details not specified</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-black">
                                Adm No: {selectedStudent.admissionNumber || selectedStudent.studentId || 'N/A'}
                              </span>
                              {selectedStudent.enrollmentNumber && (
                                <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">
                                  Roll: {selectedStudent.enrollmentNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Badges Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                          <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Course & Branch</span>
                            <span className="font-black text-slate-900 block truncate">
                              {selectedStudent.courseName || selectedStudent.selectedProgram || 'Course'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block truncate">
                              {selectedStudent.branchName || selectedStudent.selectedBranch || 'Branch'}
                            </span>
                          </div>

                          <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Academic Year</span>
                            <span className="font-black text-slate-900 block">
                              Year {selectedStudent.courseYear || 1} • Sem {selectedStudent.selectedSemester || 1}
                            </span>
                            {selectedStudent.batch && (
                              <span className="text-[10px] text-slate-500 font-medium block">
                                Batch {selectedStudent.batch}
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedStudent.mobile && (
                          <div className="flex items-center gap-2 text-xs text-slate-700 bg-white/70 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold">{selectedStudent.mobile}</span>
                            {selectedStudent.parentMobile && (
                              <span className="text-slate-400 text-[11px]">
                                • Parent: {selectedStudent.parentMobile}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 space-y-1.5">
                        <Users className="w-7 h-7 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">No Student Selected</p>
                        <p className="text-[11px] text-slate-400">
                          Click "Select" on any student in the right directory to view their complete admission dossier.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (7 Cols): Search & Large Rich Student Selection List */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  
                  {/* Search Bar & Instant Cache Indicator */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block font-black text-slate-800 uppercase tracking-wider text-xs">
                      Student Directory
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {cachedStudents.length} Students Available
                      </span>
                      <button 
                        type="button"
                        onClick={() => loadStudentsIntoCache(true)}
                        disabled={isPreloadingStudents}
                        title="Refresh student cache from PostgreSQL"
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPreloadingStudents ? 'animate-spin text-amber-600' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Search Input Box */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Search by student name, father's name, admission no, roll, course..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white shadow-2xs transition-all"
                    />
                    {studentSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setStudentSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Student Directory List (Tall & Spacious) */}
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 p-2 max-h-[460px] overflow-y-auto space-y-2 flex-1 shadow-inner">
                    {isPreloadingStudents && cachedStudents.length === 0 ? (
                      <div className="p-6 space-y-3">
                        <div className="h-16 bg-slate-200/70 rounded-2xl animate-pulse" />
                        <div className="h-16 bg-slate-200/70 rounded-2xl animate-pulse" />
                        <div className="h-16 bg-slate-200/70 rounded-2xl animate-pulse" />
                      </div>
                    ) : studentSuggestions.length > 0 ? (
                      studentSuggestions.map((st) => {
                        const isSelected = (selectedStudent?._id || selectedStudent?.id) === (st._id || st.id);
                        const father = st.fatherName || '';
                        const course = st.courseName || st.selectedProgram || 'Course';
                        const branch = st.branchName || st.selectedBranch || 'General';
                        const admNo = st.admissionNumber || st.studentId || 'N/A';
                        const rollNo = st.enrollmentNumber;

                        return (
                          <div
                            key={st._id || st.id}
                            onClick={() => setSelectedStudent(st)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected 
                                ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-300/80 shadow-sm' 
                                : 'border-white bg-white hover:border-amber-200 hover:bg-amber-50/30 shadow-2xs'
                            }`}
                          >
                            {/* Left: Avatar & Details */}
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 uppercase shadow-2xs ${
                                isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {(st.firstName?.[0] || 'S').toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-black text-slate-900 text-xs tracking-tight uppercase">
                                    {st.firstName} {st.lastName}
                                  </p>
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-bold text-[10px]">
                                    Adm: {admNo}
                                  </span>
                                  {rollNo && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold text-[10px] hidden sm:inline">
                                      Roll: {rollNo}
                                    </span>
                                  )}
                                </div>

                                {father && (
                                  <p className="text-[11px] text-slate-600 font-semibold truncate mt-0.5">
                                    <span className="text-slate-400 font-normal">S/O:</span> {father}
                                  </p>
                                )}

                                <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-amber-800 font-black">{course}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600">{branch}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500 font-medium">Year {st.courseYear || 1} (Sem {st.selectedSemester || 1})</span>
                                </p>
                              </div>
                            </div>

                            {/* Right: Phone & Action Button */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              {st.mobile && (
                                <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-300" />
                                  {st.mobile}
                                </span>
                              )}

                              <button
                                type="button"
                                className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                  isSelected 
                                    ? 'bg-amber-600 text-white' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    <span>Selected</span>
                                  </>
                                ) : (
                                  <span>Select</span>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs font-semibold space-y-1">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p>No students matching "{studentSearchQuery}"</p>
                        <p className="text-[11px] text-slate-400 font-normal">
                          Try searching by student name, roll number, father's name, or mobile.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <div className="text-xs text-slate-500 font-medium truncate w-full sm:w-auto">
                  {selectedStudent ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>Assigning <strong className="text-slate-900 font-black">{selectedStudent.firstName} {selectedStudent.lastName}</strong> to <strong className="text-amber-700 font-black">{buses.find(b => b._id === assignBusId)?.busNo}</strong> at <strong className="text-slate-800">{assignStopName}</strong></span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Please select a student from the directory above.</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSubmitAssignStudent}
                    disabled={actionLoading || !selectedStudent || !assignStopName}
                    className="px-7 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{actionLoading ? "Enrolling..." : "Confirm & Enroll Student"}</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

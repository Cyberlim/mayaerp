"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  Calendar,
  ShieldCheck,
  FileText,
  BadgeCheck,
  QrCode,
  Copy,
  Receipt as ReceiptIcon
} from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: any;
}

export default function ReceiptModal({ isOpen, onClose, receiptData }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [thermalMode, setThermalMode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !receiptData) return null;

  const isStudent = receiptData.type === "student" || receiptData.receiptType?.toLowerCase().includes("student");
  const receiptNo = receiptData.receiptNumber || `RCP-${receiptData._id?.slice(-8).toUpperCase() || "2026-001"}`;
  const txnId = receiptData.transactionId || `TXN-${receiptData._id?.slice(-6) || "98765"}`;
  const dateStr = receiptData.date ? new Date(receiptData.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const amount = Number(receiptData.amount) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `Institutional Receipt: ${receiptNo}\nName: ${receiptData.name}\nAmount: ₹${amount.toLocaleString("en-IN")}\nTxn ID: ${txnId}\nDate: ${dateStr}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Convert amount to words
  const numberToWords = (num: number): string => {
    if (!num || isNaN(num)) return "Zero Rupees Only";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      let str = '';
      if (n > 9999999) {
        str += inWords(Math.floor(n / 10000000)) + 'Crore ';
        n %= 10000000;
      }
      if (n > 99999) {
        str += inWords(Math.floor(n / 100000)) + 'Lakh ';
        n %= 100000;
      }
      if (n > 999) {
        str += inWords(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
      }
      if (n > 99) {
        str += inWords(Math.floor(n / 100)) + 'Hundred ';
        n %= 100;
      }
      if (n > 0) {
        if (str !== '') str += 'and ';
        if (n < 20) str += a[n];
        else str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      }
      return str;
    };

    return `Rupees ${inWords(Math.floor(num)).trim()} Only`;
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 print:p-0 print:bg-white">
      <style type="text/css" media="print">
        {`
          @page { margin: 0; }
          html, body {
            height: 100vh !important;
            overflow: hidden !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
          }
        `}
      </style>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden w-full printable-receipt ${
          thermalMode ? "max-w-md font-mono" : "max-w-3xl"
        } print:max-w-none print:shadow-none print:border-none print:m-0`}
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ReceiptIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                {isStudent ? "STUDENT FEE RECEIPT" : "EMPLOYEE PAYMENT VOUCHER"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">{receiptNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setThermalMode(!thermalMode)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                thermalMode
                  ? "bg-amber-500 text-slate-900 border-amber-400"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {thermalMode ? "A4 Standard View" : "Thermal Slip"}
            </button>

            <button
              onClick={handleCopy}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Copy Summary"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RECEIPT CONTENT AREA (PRINTABLE)                                */}
        {/* ============================================================== */}
        <div ref={printRef} className={`p-8 ${thermalMode ? "p-4 text-xs" : "p-8 text-slate-800"}`}>
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-800 pb-5 mb-6 text-center relative">
            <div className="flex justify-center items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                M
              </div>
              <div className="text-left">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                  Maya Group of Institutions
                </h1>
                <p className="text-[11px] font-bold text-slate-600 tracking-wider uppercase mt-1">
                  Department of Accounts & Institutional Finance
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 max-w-lg mx-auto">
              Campus Road, Education Hub • Affiliated to State Technical University & AICTE Approved
            </p>

            <div className="mt-3 inline-block px-4 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-xs font-black tracking-widest uppercase">
              {isStudent ? "OFFICIAL STUDENT FEE RECEIPT" : "STAFF SALARY / DISBURSAL VOUCHER"}
            </div>
          </div>

          {/* Receipt Meta Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receipt No</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{receiptNo}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date & Time</span>
              <span className="font-semibold text-slate-800">{dateStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-700 truncate block">{txnId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Mode</span>
              <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {receiptData.paymentMethod || "Cash"}
              </span>
            </div>
          </div>

          {/* Beneficiary Information (Student vs Employee) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              {isStudent ? "Student Academic Profile" : "Employee & Remuneration Details"}
            </h4>

            {isStudent ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Student Full Name</span>
                  <span className="font-black text-slate-900 text-sm">{receiptData.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Enrollment / Roll No</span>
                  <span className="font-mono font-bold text-indigo-900">{receiptData.idNumber || receiptData.enrollmentNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Admission No</span>
                  <span className="font-mono font-semibold text-slate-700">{receiptData.admissionNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Course</span>
                  <span className="font-bold text-slate-800">{receiptData.program || "Course"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Semester / Year</span>
                  <span className="font-semibold text-slate-700">Semester {receiptData.semester || 1} ({receiptData.academicYear || "Year 1"})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Department / Branch</span>
                  <span className="font-semibold text-slate-700">{receiptData.branch || "Main Campus"}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Employee Name</span>
                  <span className="font-black text-slate-900 text-sm">{receiptData.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Employee Code</span>
                  <span className="font-mono font-bold text-indigo-900">{receiptData.idNumber || "EMP-001"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Designation / Role</span>
                  <span className="font-semibold text-slate-700">{receiptData.designation || "Staff Member"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Department</span>
                  <span className="font-semibold text-slate-700">{receiptData.department || "Academics"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Voucher Type</span>
                  <span className="font-bold text-slate-800">{receiptData.payoutType || "Salary"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Disbursed By</span>
                  <span className="font-semibold text-slate-700">{receiptData.disbursedBy || "Finance Controller"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Itemized Fee Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">#</th>
                  <th className="p-3.5">Fee Category / Description</th>
                  <th className="p-3.5">Category Type</th>
                  <th className="p-3.5 pr-5 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receiptData.items && receiptData.items.length > 0 ? (
                  receiptData.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3.5 pl-5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-800">{item.description}</td>
                      <td className="p-3.5 text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-[10px]">
                          {receiptData.categoryName || receiptData.category || "Institutional"}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right font-mono font-bold text-slate-900">
                        ₹{Number(item.amount || amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3.5 pl-5 text-slate-400 font-mono">1</td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {receiptData.categoryName || receiptData.category || (isStudent ? "Tuition & Institutional Fee" : "Remuneration Disbursal")}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-[10px]">Standard</span>
                    </td>
                    <td className="p-3.5 pr-5 text-right font-mono font-bold text-slate-900">
                      ₹{amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                <tr>
                  <td colSpan={3} className="p-4 pl-5 text-slate-900 text-sm uppercase tracking-wide">
                    Total Amount Received
                  </td>
                  <td className="p-4 pr-5 text-right font-mono text-base font-black text-indigo-900">
                    ₹{amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <BadgeCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Amount in Words</span>
              <p className="text-xs font-bold text-indigo-950 italic">{numberToWords(amount)}</p>
            </div>
          </div>

          {/* Signatures & Verification Footer */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 items-end gap-6 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center p-1">
                <QrCode className="w-10 h-10 text-slate-700" />
              </div>
              <div className="text-[10px] text-slate-400">
                <p className="font-bold text-slate-600 uppercase">Tamper Proof</p>
                <p>Digitally Logged in ERP</p>
              </div>
            </div>

            <div className="text-center">
              <div className="h-10 flex items-center justify-center text-slate-300 italic text-[11px]">
                [ Institutional Seal ]
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase border-t border-slate-200 pt-1">
                College Accounts Office
              </p>
            </div>

            <div className="text-right">
              <div className="h-10 flex items-end justify-end pb-1">
                <span className="font-mono text-[11px] font-bold text-slate-700 underline">
                  {receiptData.collectedBy || receiptData.disbursedBy || "Finance Officer"}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase border-t border-slate-200 pt-1">
                Authorized Signatory
              </p>
            </div>
          </div>

          <p className="text-[9px] text-center text-slate-400 mt-6 tracking-wider uppercase">
            This is a computer generated institutional transaction receipt. No physical signature is required.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

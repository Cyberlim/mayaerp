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
  const receiptNo = receiptData.receiptNumber || receiptData.receiptId || (receiptData._id ? `RCP-${receiptData._id.slice(-8).toUpperCase()}` : "2026-001");
  const txnId = receiptData.transactionId || (receiptData._id ? `TXN-${receiptData._id.slice(-6)}` : "98765");
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

  // Calculate table totals dynamically from breakdown if present
  let tableTotalDue = 0;
  let tableTotalPaid = 0;
  if (Array.isArray(receiptData.breakdown) && receiptData.breakdown.length > 0) {
    receiptData.breakdown.forEach((item: any, idx: number) => {
      tableTotalDue += Number(item.due ?? item.amount ?? 0);
      tableTotalPaid += Number(item.paid ?? item.received ?? (idx === 0 ? amount : 0));
    });
  } else {
    tableTotalDue = Number(receiptData.totalDue || amount);
    tableTotalPaid = Number(receiptData.totalPaid || amount);
  }
  const tableTotalBal = Math.max(0, tableTotalDue - tableTotalPaid);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) {
      window.print();
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }
    doc.open();
    doc.write('<!DOCTYPE html><html><head><title>Payment Receipt - ' + receiptNo + '</title><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><script src="https://cdn.tailwindcss.com"></script><style>@page { size: auto; margin: 10mm; } html, body { background: #fff !important; color: #000 !important; margin: 0; padding: 16px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .print\\:hidden { display: none !important; }</style></head><body>' + printContent.innerHTML + '</body></html>');
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 400);
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

  // Helper to format ISO date strings cleanly into DD/MM/YYYY
  const formatDate = (d: any) => {
    if (!d) return dateStr;
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return String(d);
      return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return String(d);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <style type="text/css" media="print">
        {`
          @page { margin: 8mm; size: A4 portrait; }
          html, body {
            height: auto !important;
            overflow: visible !important;
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
        className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden w-full printable-receipt max-h-[96vh] flex flex-col ${
          thermalMode ? "max-w-md font-mono" : "max-w-3xl"
        } print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0`}
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                {isStudent ? "STUDENT FEE RECEIPT" : "EMPLOYEE PAYMENT VOUCHER"}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">{receiptNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setThermalMode(!thermalMode)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                thermalMode
                  ? "bg-amber-500 text-slate-900 border-amber-400"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {thermalMode ? "A4 View" : "Thermal Slip"}
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Copy Summary"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RECEIPT CONTENT AREA (PRINTABLE)                                */}
        {/* ============================================================== */}
        <div ref={printRef} className={`overflow-y-auto flex-1 p-5 sm:p-6 ${thermalMode ? "p-3 text-xs" : "text-slate-800"}`}>
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-800 pb-3 mb-3 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  M
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                    Maya Group of Institutions
                  </h1>
                  <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-0.5">
                    Maya Institute of Technology & Management
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Mendu Road, Near Police Line, Hathras, U.P. 204101 • Phone: +91 9058479966, 9528077808
                  </p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-3">
                <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-mono font-black text-[11px] uppercase tracking-widest rounded-md shadow-xs">
                  Fee Receipt
                </span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Student Copy / Office Record
                </p>
              </div>
            </div>

            {/* Barcode / Reference Strip */}
            <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span className="tracking-widest">||||||||||||||||||||||||||||||||||||||||||||||||||||||||</span>
              <span className="font-bold text-slate-700">REF: {receiptNo}</span>
              <span className="tracking-widest">||||||||||||||||||||||||||||||||||||||||||||||||||||||||</span>
            </div>
          </div>

          {/* Student & Academic Profile Grid (ABESIT Format) */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-3 mb-3 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {/* Left Column */}
              <div className="space-y-1.5">
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Receipt No</span>
                  <span className="font-mono font-bold text-slate-900">: {receiptNo}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Admission No</span>
                  <span className="font-mono font-bold text-slate-900">: {receiptData.admissionNumber || receiptData.idNumber || "N/A"}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Student Name</span>
                  <span className="font-black text-slate-900 uppercase">: {receiptData.name}</span>
                </div>
                {receiptData.fatherName && (
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-semibold">Guardian&apos;s Name</span>
                    <span className="font-bold text-slate-800 uppercase">: {receiptData.fatherName}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Address</span>
                  <span className="font-medium text-slate-700 truncate">: {receiptData.address || "Hathras (Uttar Pradesh)"}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-1.5">
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Receipt Date</span>
                  <span className="font-bold text-slate-900">: {dateStr}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Enrollment / Roll No</span>
                  <span className="font-mono font-bold text-slate-800">: {receiptData.enrollmentNumber || receiptData.rollNumber || receiptData.idNumber || "N/A"}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Session / Batch</span>
                  <span className="font-bold text-indigo-700">: {receiptData.batch || receiptData.sessionYear || receiptData.session || "2023-2026"}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Program / Course</span>
                  <span className="font-bold text-slate-900">: {receiptData.program || "Course"}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Semester / Year</span>
                  <span className="font-bold text-slate-800">: Sem {receiptData.semester || 1} ({receiptData.academicYear || "Year 1"})</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-500 font-semibold">Fee Category</span>
                  <span className="font-bold text-slate-800">: {receiptData.categoryName || receiptData.category || "General"}</span>
                </div>
                {receiptData.lastSlipNumber && (
                  <div className="flex">
                    <span className="w-36 text-slate-500 font-semibold">Previous Receipt</span>
                    <span className="font-mono text-slate-700 font-bold">: {receiptData.lastSlipNumber} {receiptData.lastSlipDate ? `(${formatDate(receiptData.lastSlipDate)})` : ""}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Fee Breakdown Table (Dues, Received, Balance) */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-3">
            <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-300 font-black text-xs text-slate-800 uppercase tracking-wider flex justify-between items-center">
              <span>Fee Detail ({receiptData.academicYear || "Current Year"})</span>
              <span className="text-[10px] text-slate-500 font-bold lowercase">all values in INR (₹)</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 w-10 text-center">S No</th>
                  <th className="py-2 px-3 w-28">Due Date</th>
                  <th className="py-2 px-3">Particulars</th>
                  <th className="py-2 px-3 text-right">Dues (Rs.)</th>
                  <th className="py-2 px-3 text-right">Received (Rs.)</th>
                  <th className="py-2 px-3 text-right">Balance (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receiptData.breakdown && receiptData.breakdown.length > 0 ? (
                  receiptData.breakdown.map((item: any, idx: number) => {
                    const itemDue = Number(item.due ?? item.amount ?? 0);
                    const itemPaid = Number(item.paid ?? item.received ?? (idx === 0 ? amount : 0));
                    const itemBal = Math.max(0, itemDue - itemPaid);
                    const formattedDueDate = item.dueDate ? formatDate(item.dueDate) : dateStr;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 font-medium text-slate-800">
                        <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-1.5 px-3 text-slate-500 font-mono text-[11px]">{formattedDueDate}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{item.particulars || item.description || item.category}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {itemDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {itemPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                          {itemBal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="hover:bg-slate-50/70 font-medium text-slate-800">
                    <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[11px]">1</td>
                    <td className="py-1.5 px-3 text-slate-500 font-mono text-[11px]">{dateStr}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">
                      {receiptData.categoryName || receiptData.category || "Tuition & Institutional Fee"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {tableTotalDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {tableTotalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                      {tableTotalBal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-xs">
                <tr>
                  <td colSpan={3} className="py-2 px-3 uppercase tracking-wider text-slate-800 text-right">
                    Total :
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">
                    {tableTotalDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-800">
                    {tableTotalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">
                    {tableTotalBal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Details Table (Mode, Bank, Cheque / UPI Ref, Amount) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
            <div className="md:col-span-8 border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 font-black text-[11px] text-slate-800 uppercase tracking-wider flex justify-between items-center">
                <span>Payment Details</span>
                <span className="text-[10px] text-slate-500 font-normal">Recent Payments</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2.5">S No</th>
                    <th className="py-1.5 px-2.5">Mode</th>
                    <th className="py-1.5 px-2.5">Chq / Txn Ref</th>
                    <th className="py-1.5 px-2.5">Date</th>
                    <th className="py-1.5 px-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {receiptData.paymentsList && receiptData.paymentsList.length > 0 ? (
                    receiptData.paymentsList.map((p: any, pIdx: number) => (
                      <tr key={pIdx} className={p.isCurrent ? "bg-emerald-50/50 font-bold" : ""}>
                        <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[11px]">{p.sNo || pIdx + 1}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{p.mode || "Online"}</td>
                        <td className="py-1.5 px-2.5 font-mono text-slate-700 truncate max-w-[130px]">{p.txnRef || "-"}</td>
                        <td className="py-1.5 px-2.5 text-slate-600 font-mono text-[11px]">{p.date ? formatDate(p.date) : dateStr}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-800">
                          ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[11px]">1</td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-900">{receiptData.paymentMethod || "Cash"}</td>
                      <td className="py-1.5 px-2.5 font-mono text-slate-700 truncate max-w-[130px]">{txnId}</td>
                      <td className="py-1.5 px-2.5 text-slate-600 font-mono text-[11px]">{dateStr}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-800">
                        ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:col-span-4 border border-slate-300 rounded-xl p-3 flex flex-col justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                  Adjusted / Paid Now
                </span>
                <span className="font-mono text-base font-black text-emerald-700">
                  ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Remaining Year Due
                </span>
                <span className="font-mono text-base font-black text-rose-600">
                  ₹{tableTotalBal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Formal Acknowledgement & Amount in Words */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-indigo-50/40 mb-4 space-y-1.5">
            {receiptData.notes && (
              <p className="text-xs text-slate-700">
                <strong className="font-bold text-slate-900">Remark:</strong> {receiptData.notes}
              </p>
            )}
            <p className="text-xs font-black text-indigo-950 uppercase tracking-wide">
              WE THANKFULLY ACKNOWLEDGE THE RECEIPT OF ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-bold text-indigo-900 italic">
              ({numberToWords(amount)})
            </p>
          </div>

          {/* Signatures & Seal Block */}
          <div className="pt-3 border-t border-slate-300 flex justify-between items-end text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-500">
                (Accountant / Accounts Officer)
              </p>
              <p className="text-[11px] font-black text-slate-800">
                For Maya Group of Institutions
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[9px] text-slate-400 mx-auto mb-1">
                SEAL
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Campus Accounts</p>
            </div>

            <div className="text-right">
              <div className="h-8 flex items-end justify-end">
                <span className="font-mono text-xs font-bold text-slate-800 border-b border-slate-400 pb-0.5">
                  {receiptData.collectedBy || "Authorized Signatory"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Authorized Signature</p>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 text-center mt-3 pt-2 border-t border-slate-100">
            &quot;Note: Merely depositing the fee online or on counter of the Institute by cheque or cash does not give candidate claim/make entitle for admission if otherwise not eligible.&quot;
          </p>
        </div>
      </motion.div>
    </div>
  );
}

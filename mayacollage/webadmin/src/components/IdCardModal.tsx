"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface IdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: any;
  branchName?: string;
  courseName?: string;
}

export default function IdCardModal({ isOpen, onClose, studentData, branchName, courseName }: IdCardModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `${studentData.firstName}_${studentData.lastName}_ID_Card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe data extraction
  const fullName = `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
  const department = courseName || branchName || studentData.department || "N/A";
  const mobile = studentData.mobile || studentData.phone || "N/A";
  const email = studentData.email || "N/A";
  const address = [studentData.address, studentData.city, studentData.state].filter(Boolean).join(', ') || "N/A";
  const designation = studentData.role === "Student" ? "Student" : (studentData.designation || studentData.role || "Student");
  
  // Try to find a valid photo, else fallback to a placeholder
  const photoUrl = studentData.profilePhoto || studentData.documents?.studentPhoto || "/placeholder-avatar.jpg";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:bg-white print:p-0 print:block">
        
        {/* MODAL CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-100 p-8 rounded-[2rem] shadow-2xl flex flex-col max-w-4xl w-full max-h-[90vh] overflow-y-auto print:bg-white print:p-0 print:shadow-none print:max-h-none print:overflow-visible"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8 print:hidden">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Student ID Card</h2>
              <p className="text-slate-500 font-bold text-sm">Preview, Download, or Print</p>
            </div>
            <div className="flex gap-4">
              <button onClick={handlePrint} className="px-4 py-2 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleDownload} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Image
              </button>
              <button onClick={onClose} className="p-2 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Card Preview Area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center bg-slate-200/50 p-8 rounded-[1.5rem] overflow-x-auto">
            
            {/* The printable reference area */}
            <div ref={cardRef} className="flex flex-col lg:flex-row gap-4 bg-transparent print:gap-4 shrink-0">
              {/* FRONT OF CARD */}
              <IdCardFront 
                photoUrl={photoUrl} 
                fullName={fullName} 
                department={department} 
                designation={designation}
                mobile={mobile} 
                email={email} 
                address={address} 
              />

              {/* BACK OF CARD */}
              <IdCardBack />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper components
export function IdCardFront({ 
  photoUrl, 
  fullName, 
  department, 
  designation = "Student", // Default to Student
  mobile, 
  email, 
  address 
}: { 
  photoUrl: string, 
  fullName: string, 
  department: string, 
  designation?: string,
  mobile: string, 
  email: string, 
  address: string 
}) {
  return (
    <div className="w-[54mm] h-[86mm] bg-white rounded-[8px] shadow-lg relative overflow-hidden flex flex-col border border-slate-300 shrink-0 print:border-none print:shadow-none mx-auto id-card-container">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-end justify-center pb-[10mm] opacity-[0.15] z-0 overflow-hidden pointer-events-none">
        <img src="/logo.png" alt="Watermark" className="w-[45mm] h-auto object-contain" />
      </div>

      {/* Header using maya-banner.png */}
      <div className="relative z-10 pt-2 px-1 text-center flex flex-col items-center">
        <div className="w-full h-14 flex items-center justify-center">
          <img 
            src="/maya-banner.png" 
            alt="Maya Group of Institution Header" 
            className="w-full h-full object-contain" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.classList.remove('hidden');
              }
            }} 
          />
          {/* Simple Fallback if maya-banner.png fails */}
          <div className="hidden w-full text-center">
             <h1 className="text-xl font-black text-red-600">MAYA</h1>
             <h2 className="text-[7px] font-bold text-red-600">GROUP OF INSTITUTION</h2>
          </div>
        </div>
        <div className="mt-[1px]">
          <p className="text-[5.5px] font-bold text-[#D04332] inline-block border-b-[0.5px] border-[#D04332] px-1 pb-[0.5px]">
            विद्या सर्वार्थ सिद्धये | EDUCATION FOR LIFE
          </p>
        </div>
      </div>

      {/* Photo */}
      <div className="relative z-10 flex justify-center mt-[3px]">
        <div className="w-[17mm] h-[21mm] border-[1px] border-slate-700 rounded-md overflow-hidden bg-slate-100 shadow-sm p-[1px]">
          <div className="w-full h-full rounded-[4px] overflow-hidden">
            {photoUrl !== "/placeholder-avatar.jpg" ? (
              <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <UserPlaceholder />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="relative z-10 mt-[3px] px-2 flex-1 flex flex-col gap-[2px]">
        <DetailRow label="Name" value={fullName} valueColor="text-red-500" isBold />
        {designation === "Student" && <DetailRow label="Course" value={department} />}
        <DetailRow label="Designation" value={designation} />
        <DetailRow label="Contact No." value={mobile} />
        <DetailRow label="Email" value={email} />
        <DetailRow label="Address" value={address} />
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-auto pb-[2px] px-2 flex justify-between items-end h-12">
        <div className="flex flex-col items-center justify-end h-full w-14">
          {/* Signature squiggle */}
          <div className="w-12 h-12 flex items-end justify-center mb-0.5">
            <svg viewBox="0 0 100 100" className="w-10 h-10 text-red-600" stroke="currentColor" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 30,80 C 50,50 50,10 30,10 C 10,10 10,70 20,85 C 30,105 50,90 35,75 C 25,65 10,80 25,95 C 40,110 50,85 55,70 L 60,95 L 67,83 C 70,95 75,95 95,90" />
            </svg>
          </div>
          <p className="text-[6px] font-bold text-slate-800 whitespace-nowrap mt-0.5 mr-1">Authority Sig.</p>
        </div>
        

      </div>
    </div>
  );
}

export function IdCardBack() {
  return (
    <div className="w-[54mm] h-[86mm] bg-white rounded-xl shadow-lg relative overflow-hidden flex flex-col border border-slate-200 shrink-0 print:border-none print:shadow-none mx-auto id-card-container">
      {/* Top Half: Building Image */}
      <div className="w-full h-32 relative shrink-0 bg-slate-100">
        <img src="/building.png" alt="Building Header" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
        {/* Optional gradient fade at bottom of image if they want a smooth transition */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.15] pointer-events-none z-0 mt-24">
        <img src="/logo.png" alt="Watermark" className="w-[45mm] h-auto object-contain" />
      </div>

      {/* Bottom Half: Instructions & Footer */}
      <div className="px-3 pt-2 pb-4 flex-1 flex flex-col relative z-10 justify-start gap-2">
        <div>
          <h4 className="text-[7px] font-black text-teal-800/80 mb-1">INSTRUCTIONS:</h4>
          <ul className="text-[6px] font-bold text-slate-800 space-y-[2.5px] pl-2 list-disc ml-1 leading-snug">
            <li>This Card is non-transferable.</li>
            <li>Loss of this card must be reported to the issuing authority immediately.</li>
            <li>Replacement will be at charge of Rs. 100/-</li>
            <li>This card must be returned to the institute authority at the time of leaving the institute.</li>
            <li>If found, please return to:</li>
          </ul>
        </div>
        
        <div className="text-[6.5px] font-bold text-slate-800 space-y-[1.5px]">
          <p className="font-black text-[7.5px]">MAYA GROUP OF INSTITUTION</p>
          <p>Mendu Road, Near Police Line, Hathras</p>
          <p>Email: <span className="text-blue-700 underline">mayainstitution@gmail.com</span></p>
          <p>Phone: +91 9058479966, 9528077808</p>
          <p>Website: www.mayainstituts.com</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueColor = "text-slate-800", isBold = false }: { label: string, value: string, valueColor?: string, isBold?: boolean }) {
  return (
    <div className="flex text-[7.5px] leading-[1.3] mb-[1px]">
      <div className="w-[19mm] font-bold text-slate-700 shrink-0">{label}</div>
      <div className="w-1.5 shrink-0 text-slate-700 text-center">:</div>
      <div className={`flex-1 ${valueColor} ${isBold ? 'font-black' : 'font-bold'} pl-0.5 break-words whitespace-pre-wrap`} style={{ wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

function UserPlaceholder() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

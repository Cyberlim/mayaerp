"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, User, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import IdCardModal, { IdCardFront } from "@/components/IdCardModal";

export default function OfficeStaffDetailScreen() {
  const params = useParams();
  const userId = params.id as string;

  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setUserData(data);
        }
      } catch (err) {
        console.error("Error fetching user", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-[#F8F6F6] flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  // Helper for rendering grids
  const InfoGrid = ({ title, data }: { title?: string, data: {label: string, value: string}[] }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8 overflow-hidden">
      {title && <h3 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-50 pb-4">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {data.map((item, idx) => (
          <div key={idx}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
            <p className="text-sm font-bold text-slate-800">{item.value || "N/A"}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
  const department = userData.department || "N/A";
  const mobile = userData.mobile || userData.phone || "N/A";
  const email = userData.email || "N/A";
  const address = `${userData.city || ''} ${userData.state || ''}`.trim() || userData.address || "N/A";
  const designation = userData.role === "Student" ? "Student" : (userData.designation || userData.role || "Staff");
  const photoUrl = userData.profilePhoto || userData.documents?.studentPhoto || "/placeholder-avatar.jpg";

  return (
    <div className="min-h-screen bg-[#F8F6F6] flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* LEFT PROFILE SIDEBAR */}
      <div className="w-full md:w-[320px] bg-[#1E1E2D] flex flex-col z-10 sticky top-0 md:h-screen shadow-2xl overflow-y-auto">
        <div className="p-8">
          <Link href="/office/staff">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xs transition-colors mb-10 w-fit">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </Link>

          <div className="flex flex-col items-center justify-center w-full transform scale-90 origin-top">
            <IdCardFront
              photoUrl={photoUrl}
              fullName={fullName}
              department={department}
              designation={designation}
              mobile={mobile}
              email={email}
              address={address}
            />
          </div>
        </div>
        <div className="px-8 space-y-6">
          <div className="pt-2 flex flex-col gap-3 pb-8">
            <Link href={`/office/staff/${userId}`}>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex justify-center items-center gap-2 rounded-xl transition-all">
                <User className="w-4 h-4" /> Edit Profile
              </button>
            </Link>
            <button 
              onClick={() => setIsIdModalOpen(true)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex justify-center items-center gap-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4" /> Print / Download ID Card
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="p-8 lg:p-12">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Staff Profile</h1>
          <p className="text-slate-500 font-bold mb-8">View details and information for {fullName}</p>
          
          <InfoGrid title="Personal Information" data={[
            { label: "Full Name", value: fullName },
            { label: "Email", value: email },
            { label: "Phone", value: mobile },
            { label: "Date of Birth", value: userData.dob ? new Date(userData.dob).toLocaleDateString() : "N/A" },
            { label: "Gender", value: userData.gender },
            { label: "Address", value: address },
          ]} />

          <InfoGrid title="Professional Details" data={[
            { label: "Employee ID", value: userData.employeeId || userData._id?.substring(0,8).toUpperCase() },
            { label: "Role", value: userData.role },
            { label: "Designation", value: userData.designation || userData.role },
            { label: "Status", value: userData.status },
          ]} />
        </div>
      </div>

      {/* ID Card Modal */}
      <IdCardModal
        isOpen={isIdModalOpen}
        onClose={() => setIsIdModalOpen(false)}
        studentData={userData} // Pass user data instead of student data
      />
    </div>
  );
}

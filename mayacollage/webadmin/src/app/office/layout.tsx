import OfficeSidebar from "@/components/OfficeSidebar";

export const metadata = {
  title: "Office Portal | Maya ERP",
  description: "Maya Office Portal",
};

export default function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden lg:block z-50">
        <OfficeSidebar />
      </div>
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center text-white font-black">
              M
            </div>
            <span className="font-black text-slate-800">Maya Office</span>
          </div>
          {/* We'd add a mobile menu button here in a real app */}
        </div>

        {/* Content Area */}
        <div className="p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

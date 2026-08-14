import StaffSidebar from "@/components/StaffSidebar";

export const metadata = {
  title: "Maya Staff | ERP Portal",
  description: "Maya Staff Portal",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <StaffSidebar />
      <main className="flex-1 w-full h-full relative overflow-y-auto overflow-x-hidden p-6 md:p-8 pb-24">
        {children}
      </main>
    </div>
  );
}

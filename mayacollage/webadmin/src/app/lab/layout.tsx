import LabSidebar from "@/components/LabSidebar";

export const metadata = {
  title: "Lab Portal - Maya ERP",
  description: "Laboratory management and inventory system",
};

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <LabSidebar />
      <main className="flex-1 ml-64 min-w-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

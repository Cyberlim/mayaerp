import { Metadata } from "next";
import LibrarySidebar from "@/components/LibrarySidebar";

export const metadata: Metadata = {
  title: "Maya Library | Admin Portal",
  description: "Library management system for Maya ERP",
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <LibrarySidebar />
      <main className="flex-1 ml-0 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

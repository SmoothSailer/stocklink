"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Admin login page renders without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-4 pb-20 lg:p-6 lg:pb-6">{children}</div>
      </main>
    </div>
  );
}

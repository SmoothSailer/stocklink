import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Rep Dashboard — Ristoka",
  robots: { index: false, follow: false },
};

export default function SalesRepDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

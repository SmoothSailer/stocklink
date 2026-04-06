import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Rep Login — Ristoka",
  robots: { index: false, follow: false },
};

export default function SalesRepLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

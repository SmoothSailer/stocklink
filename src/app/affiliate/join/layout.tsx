import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Program — Earn with Ristoka",
  description:
    "Join the Ristoka affiliate program. Earn commissions by referring retailers to Kenya's wholesale supply platform. Share via WhatsApp and earn on every order.",
};

export default function AffiliateJoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

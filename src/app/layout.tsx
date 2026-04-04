import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ReferralTracker } from "@/components/affiliate/referral-tracker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ristoka — Wholesale Brokerage Platform",
    template: "%s | Ristoka",
  },
  description:
    "Connect with wholesalers, browse products, and order via WhatsApp. Real-time stock visibility and fast delivery.",
  keywords: ["wholesale", "retail", "brokerage", "inventory", "WhatsApp ordering"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16A34A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Suspense>
          <ReferralTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

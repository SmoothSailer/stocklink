import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ReferralTracker } from "@/components/affiliate/referral-tracker";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ristoka.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ristoka — Wholesale Supply Made Easy",
    template: "%s | Ristoka",
  },
  description:
    "Kenya's wholesale supply platform. Browse products from wholesalers and manufacturers, compare prices, and order via WhatsApp. Real-time stock visibility, fast delivery, and M-Pesa payments.",
  keywords: [
    "wholesale",
    "retail",
    "supply chain",
    "wholesale Kenya",
    "wholesale products",
    "bulk buying",
    "WhatsApp ordering",
    "inventory management",
    "M-Pesa",
    "wholesale rice",
    "wholesale sugar",
    "wholesale oil",
    "wholesale flour",
    "Ristoka",
  ],
  authors: [{ name: "Ristoka" }],
  creator: "Ristoka",
  publisher: "Ristoka",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: "Ristoka",
    title: "Ristoka — Stocking You Up, Backing You Up",
    description:
      "Browse wholesale products, compare prices, and order via WhatsApp. Real-time stock visibility, fast delivery, and M-Pesa payments.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ristoka — Stocking You Up, Backing You Up",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ristoka — Stocking You Up, Backing You Up",
    description:
      "Browse wholesale products, compare prices, and order via WhatsApp. Real-time stock, fast delivery.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16A34A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans" suppressHydrationWarning>
        <Suspense>
          <ReferralTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

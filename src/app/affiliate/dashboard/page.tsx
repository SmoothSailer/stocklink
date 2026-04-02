"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  MousePointerClick,
  Users,
  Wallet,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AffiliateShare } from "@/components/affiliate/affiliate-share";
import { mockAffiliates, mockReferrals } from "@/lib/mock-data";
import { formatPrice, timeAgo } from "@/lib/utils";
import { APP_NAME, AFFILIATE_COMMISSION_RATE } from "@/lib/constants";
import type { ReferralStatus } from "@/types/database";

const REFERRAL_STATUS_MAP: Record<
  ReferralStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
};

type Tab = "overview" | "referrals" | "share";

export default function AffiliateDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // In production: fetch from Supabase by user_id
  const affiliate = mockAffiliates[0];
  const referrals = mockReferrals.filter(
    (r) => r.affiliate_id === affiliate.id
  );

  const pendingEarnings = referrals
    .filter((r) => r.status === "pending" || r.status === "approved")
    .reduce((sum, r) => sum + r.commission, 0);

  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : "https://stocklink.co"}/?ref=${affiliate.code}`;

  const stats = [
    {
      label: "Total Earnings",
      value: formatPrice(affiliate.total_earnings),
      icon: DollarSign,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Pending",
      value: formatPrice(pendingEarnings),
      icon: Wallet,
      color: "bg-orange-100 text-orange-700",
    },
    {
      label: "Total Clicks",
      value: affiliate.total_clicks.toString(),
      icon: MousePointerClick,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Referrals",
      value: affiliate.total_referrals.toString(),
      icon: Users,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  const conversionRate =
    affiliate.total_clicks > 0
      ? ((affiliate.total_referrals / affiliate.total_clicks) * 100).toFixed(1)
      : "0";

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "referrals", label: "Referrals" },
    { id: "share", label: "Share & Earn" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <p className="text-sm font-bold">{APP_NAME} Affiliates</p>
            <p className="text-[10px] text-muted-foreground">
              Welcome, {affiliate.name}
            </p>
          </div>
          <Badge variant="default" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {AFFILIATE_COMMISSION_RATE * 100}% rate
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Tab navigation */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance summary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Conversion Rate
                    </span>
                    <span className="font-bold text-primary">
                      {conversionRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Avg Order Value
                    </span>
                    <span className="font-bold">
                      {referrals.length > 0
                        ? formatPrice(
                            Math.round(
                              referrals.reduce((s, r) => s + r.order_total, 0) /
                                referrals.length
                            )
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Avg Commission
                    </span>
                    <span className="font-bold">
                      {referrals.length > 0
                        ? formatPrice(
                            Math.round(
                              referrals.reduce((s, r) => s + r.commission, 0) /
                                referrals.length
                            )
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-bold text-primary">
                      {formatPrice(affiliate.total_paid)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab("share")}
                  >
                    <Users className="h-4 w-4 text-primary" />
                    Share Referral Link
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab("referrals")}
                  >
                    <DollarSign className="h-4 w-4 text-primary" />
                    View Referral History
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    disabled
                  >
                    <Wallet className="h-4 w-4 text-primary" />
                    Request Payout (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent referrals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">
                  Recent Referrals
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setActiveTab("referrals")}
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Order</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.slice(0, 3).map((ref) => {
                      const statusInfo = REFERRAL_STATUS_MAP[ref.status];
                      return (
                        <TableRow key={ref.id}>
                          <TableCell className="text-sm">
                            {timeAgo(ref.created_at)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatPrice(ref.order_total)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-primary">
                            +{formatPrice(ref.commission)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Referrals tab */}
        {activeTab === "referrals" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referral History</CardTitle>
              <p className="text-sm text-muted-foreground">
                All orders placed through your referral link
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="text-right">Order Total</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No referrals yet. Share your link to start earning!
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map((ref) => {
                      const statusInfo = REFERRAL_STATUS_MAP[ref.status];
                      return (
                        <TableRow key={ref.id}>
                          <TableCell className="text-sm">
                            {new Date(ref.created_at).toLocaleDateString(
                              "en-KE",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {ref.order_id ? `#${ref.order_id.slice(0, 8)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatPrice(ref.order_total)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-primary">
                            +{formatPrice(ref.commission)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusInfo.variant}
                              className="text-xs"
                            >
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Share tab */}
        {activeTab === "share" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share & Earn</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Share your unique referral link and earn{" "}
                  {AFFILIATE_COMMISSION_RATE * 100}% on every order.
                </p>
              </CardHeader>
              <CardContent>
                <AffiliateShare
                  referralUrl={referralUrl}
                  affiliateCode={affiliate.code}
                />
              </CardContent>
            </Card>

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Share Your Link",
                      desc: "Post your referral link on TikTok, WhatsApp, Instagram, or any social platform.",
                    },
                    {
                      step: "2",
                      title: "Someone Clicks & Orders",
                      desc: "When a retailer clicks your link and places a wholesale order, it's tracked to you.",
                    },
                    {
                      step: "3",
                      title: "Earn Commission",
                      desc: `You earn ${AFFILIATE_COMMISSION_RATE * 100}% of the total order value. Commissions are paid monthly via M-Pesa.`,
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

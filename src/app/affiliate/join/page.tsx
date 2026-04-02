"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  Share2,
  DollarSign,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME, AFFILIATE_COMMISSION_RATE } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

const BENEFITS = [
  {
    icon: DollarSign,
    title: `Earn ${AFFILIATE_COMMISSION_RATE * 100}% Commission`,
    description: "On every order placed through your referral link",
  },
  {
    icon: Share2,
    title: "Share Anywhere",
    description: "One-click share to TikTok, WhatsApp, Instagram & more",
  },
  {
    icon: TrendingUp,
    title: "Track Earnings",
    description: "Real-time dashboard for clicks, referrals & payouts",
  },
  {
    icon: Users,
    title: "No Limits",
    description: "Refer as many people as you want — earn on every sale",
  },
];

export default function AffiliateJoinPage() {
  const router = useRouter();
  const { user, email } = useAuth();
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState(email ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleJoin = () => {
    if (!name.trim()) return;

    startTransition(async () => {
      // In production: insert into affiliates table via server action
      // For now, simulate success
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">You&apos;re In!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to the {APP_NAME} Affiliate Program. Head to your dashboard
            to grab your referral link and start earning.
          </p>
          <Button
            className="mt-6 w-full gap-2"
            onClick={() => router.push("/affiliate/dashboard")}
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-green-700 px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold">
            Earn with {APP_NAME}
          </h1>
          <p className="mt-3 text-base text-white/90">
            Join our affiliate program and earn{" "}
            <strong>{AFFILIATE_COMMISSION_RATE * 100}% commission</strong> on
            every wholesale order placed through your link.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="mx-auto -mt-8 max-w-lg px-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <Card key={benefit.title} className="border-border/60">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sign-up form */}
      <div className="mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-bold">Join the Program</h2>
            {!user && (
              <p className="text-sm text-muted-foreground">
                You&apos;ll need to{" "}
                <a href="/login?next=/affiliate/join" className="text-primary hover:underline">
                  sign in
                </a>{" "}
                first to become an affiliate.
              </p>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="aff-name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="aff-name"
                  placeholder="e.g. Sarah Wanjiku"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="aff-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="aff-email"
                  type="email"
                  placeholder="you@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={isPending || !!email}
                />
              </div>
            </div>

            <Button
              onClick={handleJoin}
              disabled={isPending || !name.trim() || !user}
              className="w-full gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isPending ? "Joining..." : "Become an Affiliate"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

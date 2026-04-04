"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2, Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "sent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/";
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const handleSendLink = () => {
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    startTransition(async () => {
      const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(nextUrl)}`;

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setEmail(trimmed);
      setStep("sent");
    });
  };

  const handleResend = () => {
    setError(null);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    startTransition(async () => {
      const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(nextUrl)}`;

      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (resendError) {
        setError(resendError.message);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <span className="text-3xl font-bold text-primary-foreground">S</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wholesale prices for retailers
        </p>
      </div>

      <Card className="w-full max-w-sm">
        {step === "email" ? (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Sign in to your account</CardTitle>
              <p className="text-sm text-muted-foreground">
                We&apos;ll email you a magic link to sign in instantly.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    disabled={isPending}
                    onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                  />
                </div>
              </div>

              <Button
                onClick={handleSendLink}
                disabled={isPending || !email.trim()}
                className="w-full gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {isPending ? "Sending link..." : "Send Magic Link"}
              </Button>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Check your email</CardTitle>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-foreground">
                  Click the link in your email to sign in.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The link will expire in 1 hour. Check your spam folder if you
                  don&apos;t see it.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  {isPending ? "Sending..." : "Resend link"}
                </button>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

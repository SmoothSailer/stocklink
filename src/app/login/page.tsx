"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { signIn, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { error: null };

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
  const justRegistered = searchParams.get("registered") === "true";
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <span className="text-3xl font-bold text-primary-foreground">R</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stocking you up, backing you up
        </p>
      </div>

      {justRegistered && (
        <div className="mb-4 flex w-full max-w-sm items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Account created! Sign in with your credentials.
        </div>
      )}

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Sign in to your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email and password
          </p>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={nextUrl} />

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  autoComplete="email"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {state.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
                {state.error}
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

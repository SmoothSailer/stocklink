"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, UserPlus, Loader2, Store, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { signUp, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { error: null };

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const searchParams = useSearchParams();

  // Pre-fill from sales rep onboarding link
  const prefill = {
    retailerId: searchParams.get("retailer_id") ?? "",
    name: searchParams.get("name") ?? "",
    businessName: searchParams.get("business_name") ?? "",
    phone: searchParams.get("phone") ?? "",
    email: searchParams.get("email") ?? "",
    location: searchParams.get("location") ?? "",
  };
  const isInvited = !!prefill.retailerId;

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

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            {isInvited ? "Complete your registration" : "Create your account"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isInvited
              ? "Your details are pre-filled — just set a password"
              : "Start ordering wholesale in minutes"}
          </p>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Hidden field for linking to existing retailer */}
            {prefill.retailerId && (
              <input type="hidden" name="retailerId" value={prefill.retailerId} />
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  autoComplete="name"
                  defaultValue={prefill.name}
                  readOnly={isInvited && !!prefill.name}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">
                Business Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  placeholder="Mama Mboga Store"
                  className="pl-10"
                  defaultValue={prefill.businessName}
                  readOnly={isInvited && !!prefill.businessName}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0712 345 678"
                  className="pl-10"
                  autoComplete="tel"
                  defaultValue={prefill.phone}
                  readOnly={isInvited && !!prefill.phone}
                  disabled={isPending}
                />
              </div>
            </div>

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
                  defaultValue={prefill.email}
                  readOnly={isInvited && !!prefill.email}
                  disabled={isPending}
                />
              </div>
            </div>

            {isInvited && prefill.location && (
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    className="pl-10"
                    defaultValue={prefill.location}
                    readOnly
                    disabled={isPending}
                  />
                </div>
              </div>
            )}

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
                  autoComplete="new-password"
                  required
                  minLength={6}
                  autoFocus={isInvited}
                  disabled={isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  autoComplete="new-password"
                  required
                  minLength={6}
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
                <UserPlus className="h-4 w-4" />
              )}
              {isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

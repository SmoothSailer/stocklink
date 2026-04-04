"use client";

import { useActionState } from "react";
import { Mail, Lock, ShieldAlert, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { adminSignIn, type AdminSignInState } from "@/app/admin/auth/actions";

const initialState: AdminSignInState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(adminSignIn, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 shadow-lg">
          <ShoppingBag className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin Dashboard</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <ShieldAlert className="h-5 w-5 text-orange-600" />
          </div>
          <CardTitle className="text-lg">Admin Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Authorized personnel only
          </p>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@ristoka.co"
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
                <Lock className="h-4 w-4" />
              )}
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        This area is restricted. All access attempts are logged.
      </p>
    </div>
  );
}

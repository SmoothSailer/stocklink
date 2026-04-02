"use client";

import Link from "next/link";
import { ShoppingBag, LogOut, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { user, signOut, email } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile where BottomNav is used */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Products
          </Link>
          <Link
            href="/deals"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Deals
          </Link>
          <Link
            href="/orders"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Orders
          </Link>
          <Link
            href="/affiliate/join"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Earn
          </Link>
        </nav>

        {/* Auth: sign in / user info */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/affiliate/dashboard"
              className="hidden items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 sm:flex"
            >
              <Users className="h-3 w-3" />
              Affiliate
            </Link>
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
              <User className="h-3.5 w-3.5" />
              <span>{email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signOut()}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <User className="h-3.5 w-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

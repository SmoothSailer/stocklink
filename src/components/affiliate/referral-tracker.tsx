"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AFFILIATE_COOKIE_NAME, AFFILIATE_COOKIE_DAYS } from "@/lib/constants";

/**
 * Reads ?ref= query param and stores the affiliate code in a cookie.
 * Drop this component in the root layout so every page visit is tracked.
 */
export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (!refCode) return;

    // Don't overwrite an existing referral cookie (first-touch attribution)
    const existing = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${AFFILIATE_COOKIE_NAME}=`));

    if (!existing) {
      const expires = new Date();
      expires.setDate(expires.getDate() + AFFILIATE_COOKIE_DAYS);
      document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(refCode)};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
    }
  }, [searchParams]);

  // This component renders nothing
  return null;
}

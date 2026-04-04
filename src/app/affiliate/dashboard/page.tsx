import Link from "next/link";
import { getAffiliateByUserId, getAffiliateReferrals } from "@/app/(retailer)/actions";
import AffiliateDashboardClient from "./affiliate-dashboard-client";
import { createClient } from "@/lib/supabase/server";

export default async function AffiliateDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <span className="text-5xl">🔒</span>
        <p className="mt-3 text-lg font-semibold">Please sign in</p>
        <p className="text-sm text-muted-foreground">
          You need to be logged in to view your affiliate dashboard.
        </p>
        <Link href="/auth/login" className="mt-3 text-sm text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const affiliate = await getAffiliateByUserId(user.id);

  if (!affiliate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <span className="text-5xl">📊</span>
        <p className="mt-3 text-lg font-semibold">No affiliate account</p>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have an affiliate account yet. Contact us to get started.
        </p>
        <Link href="/" className="mt-3 text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const referrals = await getAffiliateReferrals(affiliate.id);

  return <AffiliateDashboardClient affiliate={affiliate} referrals={referrals} />;
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSalesRep,
  getRepWholesalers,
  getRepOrders,
  getRepDashboardStats,
  getRepProducts,
  getCategories,
  getProductUnits,
} from "@/app/sales-rep/actions";
import SalesRepDashboardClient from "./sales-rep-dashboard-client";

export default async function SalesRepDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4">
        <span className="text-5xl">🔒</span>
        <p className="mt-3 text-lg font-semibold">Please sign in</p>
        <p className="text-sm text-muted-foreground">
          You need to be logged in to view your dashboard.
        </p>
        <Link
          href="/sales-rep/login"
          className="mt-3 text-sm text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const rep = await getCurrentSalesRep();

  if (!rep) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4">
        <span className="text-5xl">👤</span>
        <p className="mt-3 text-lg font-semibold">No sales rep account</p>
        <p className="text-center text-sm text-muted-foreground">
          Your account is not linked to a sales rep profile. Contact the admin
          team.
        </p>
        <Link
          href="/sales-rep/login"
          className="mt-3 text-sm text-primary hover:underline"
        >
          Try another account
        </Link>
      </div>
    );
  }

  const [wholesalers, orders, stats, products, categories, units] =
    await Promise.all([
      getRepWholesalers(rep.id),
      getRepOrders(rep.id),
      getRepDashboardStats(rep.id),
      getRepProducts(rep.id),
      getCategories(),
      getProductUnits(),
    ]);

  return (
    <SalesRepDashboardClient
      rep={rep}
      wholesalers={wholesalers}
      orders={orders}
      stats={stats}
      products={products}
      categories={categories}
      units={units}
    />
  );
}

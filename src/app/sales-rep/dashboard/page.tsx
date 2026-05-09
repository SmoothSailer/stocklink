import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSalesRep,
  getRepWholesalers,
  getRepOrders,
  getRepDashboardStats,
  getRepProducts,
  getRepManufacturers,
  getCategories,
  getProductUnits,
  getRepRetailersWithStats,
  getRepLeads,
  getRestockAlerts,
  getRepActivities,
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

  const [wholesalersResult, ordersResult, statsResult, productsResult, manufacturersResult, categoriesResult, unitsResult, retailersResult, leadsResult, restockResult, activitiesResult] =
    await Promise.allSettled([
      getRepWholesalers(rep.id),
      getRepOrders(rep.id),
      getRepDashboardStats(rep.id),
      getRepProducts(rep.id),
      getRepManufacturers(rep.id),
      getCategories(),
      getProductUnits(),
      getRepRetailersWithStats(rep.id),
      getRepLeads(rep.id),
      getRestockAlerts(rep.id),
      getRepActivities(rep.id),
    ]);

  const wholesalers = wholesalersResult.status === "fulfilled" ? wholesalersResult.value : [];
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const stats = statsResult.status === "fulfilled" ? statsResult.value : { totalWholesalers: 0, totalManufacturers: 0, totalProducts: 0, lowStockProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0 };
  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const manufacturers = manufacturersResult.status === "fulfilled" ? manufacturersResult.value : [];
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const units = unitsResult.status === "fulfilled" ? unitsResult.value : [];
  const retailers = retailersResult.status === "fulfilled" ? retailersResult.value : [];
  const leads = leadsResult.status === "fulfilled" ? leadsResult.value : [];
  const restockAlerts = restockResult.status === "fulfilled" ? restockResult.value : [];
  const activities = activitiesResult.status === "fulfilled" ? activitiesResult.value : [];

  return (
    <SalesRepDashboardClient
      rep={rep}
      wholesalers={wholesalers}
      orders={orders}
      stats={stats}
      products={products}
      manufacturers={manufacturers}
      categories={categories}
      units={units}
      retailers={retailers}
      leads={leads}
      restockAlerts={restockAlerts}
      activities={activities}
    />
  );
}

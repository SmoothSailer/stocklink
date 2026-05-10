import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSalesRep,
  getRepOrders,
  getRepDashboardStats,
  getRepRetailersWithStats,
  getRepLeads,
  getRestockAlerts,
  getRepActivities,
  getRepInvites,
  getRepUpcomingBnplPayments,
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

  const [ordersResult, statsResult, retailersResult, leadsResult, restockResult, activitiesResult, invitesResult, bnplResult] =
    await Promise.allSettled([
      getRepOrders(rep.id),
      getRepDashboardStats(rep.id),
      getRepRetailersWithStats(rep.id),
      getRepLeads(rep.id),
      getRestockAlerts(rep.id),
      getRepActivities(rep.id),
      getRepInvites(rep.id),
      getRepUpcomingBnplPayments(rep.id),
    ]);

  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const stats = statsResult.status === "fulfilled" ? statsResult.value : { totalOrders: 0, pendingOrders: 0, totalRevenue: 0 };
  const retailers = retailersResult.status === "fulfilled" ? retailersResult.value : [];
  const leads = leadsResult.status === "fulfilled" ? leadsResult.value : [];
  const restockAlerts = restockResult.status === "fulfilled" ? restockResult.value : [];
  const activities = activitiesResult.status === "fulfilled" ? activitiesResult.value : [];
  const invites = invitesResult.status === "fulfilled" ? invitesResult.value : [];
  const upcomingPayments = bnplResult.status === "fulfilled" ? bnplResult.value : [];

  return (
    <SalesRepDashboardClient
      rep={rep}
      orders={orders}
      stats={stats}
      retailers={retailers}
      leads={leads}
      invites={invites}
      restockAlerts={restockAlerts}
      activities={activities}
      upcomingPayments={upcomingPayments}
    />
  );
}

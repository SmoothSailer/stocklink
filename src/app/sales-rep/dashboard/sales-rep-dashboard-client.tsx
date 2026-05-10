"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  TrendingUp,
  MessageCircle,
  Phone,
  MapPin,
  LogOut,
  Send,
  ChevronRight,
  Plus,
  Edit,
  Minus,
  User,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  Loader2,
  Banknote,
  Calendar,
  Users,
  UserPlus,
  Target,
  Activity,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, buildWhatsAppLink, timeAgo } from "@/lib/utils";
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { salesRepSignOut } from "@/app/sales-rep/auth/actions";
import {
  repUpdateOrderStatus,
  repRecordPayment,
  getOrderPayments,
  repCreateBnplPlan,
  getOrderBnplPlan,
  repPayBnplInstallment,
  repRecordDownPayment,
  repOnboardRetailer,
  repUpdateRetailer,
  repCreateLead,
  repUpdateLead,
  repConvertLead,
  repLogActivity,
  repCancelInvite,
  repResendInvite,
} from "@/app/sales-rep/actions";
import type { SalesRep, Order, OrderStatus, PaymentRecord, BnplPlan, BnplInstallment, Lead, Retailer, RepActivity, RetailerInvite } from "@/types/database";

interface OrderWithItems extends Order {
  retailers: {
    id: string;
    name: string;
    business_name: string | null;
    phone: string;
    location: string | null;
  } | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
      unit: string;
      wholesaler_id: string | null;
      wholesalers: { name: string } | null;
    } | null;
  }[];
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface RetailerWithStats extends Retailer {
  lastOrder: string | null;
  totalSpent: number;
  orderCount: number;
}

interface RestockAlert {
  retailer_id: string;
  retailer_name: string;
  retailer_phone: string;
  retailer_location: string | null;
  product_id: string;
  product_name: string;
  avg_interval_days: number;
  days_since_last: number;
  urgency: number;
}

interface ActivityWithRelations extends RepActivity {
  retailers: { id: string; name: string } | null;
  leads: { id: string; name: string } | null;
}

interface UpcomingPayment {
  id: string;
  plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: "upcoming" | "due" | "paid" | "overdue";
  paid_at: string | null;
  payment_record_id: string | null;
  created_at: string;
  order_id: string;
  retailer_name: string;
  retailer_phone: string;
  total_with_markup: number;
}

interface Props {
  rep: SalesRep;
  orders: OrderWithItems[];
  stats: DashboardStats;
  retailers: RetailerWithStats[];
  leads: Lead[];
  invites: RetailerInvite[];
  restockAlerts: RestockAlert[];
  activities: ActivityWithRelations[];
  upcomingPayments: UpcomingPayment[];
}

type Tab = "overview" | "retailers" | "leads" | "orders" | "payments";

export default function SalesRepDashboardClient({
  rep,
  orders,
  stats,
  retailers,
  leads,
  invites,
  restockAlerts,
  activities,
  upcomingPayments,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const initials = rep.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="min-h-dvh bg-background pb-20 sm:pb-6">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{rep.name}</p>
              <p className="text-xs text-muted-foreground">Sales Rep</p>
            </div>
          </div>
          <form action={salesRepSignOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-4">
        {/* ─── Tabs ─── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Tab)}
          className="mb-4"
        >
          <TabsList className="h-10 w-full overflow-x-auto">
            <TabsTrigger value="overview" className="flex-1 text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="retailers"
              className="flex-1 text-xs sm:text-sm"
            >
              Retailers
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="flex-1 text-xs sm:text-sm"
            >
              Leads
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 text-xs sm:text-sm">
              Orders
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 text-xs sm:text-sm">
              Payments
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ─── Tab Content ─── */}
        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            orders={orders}
            retailers={retailers}
            restockAlerts={restockAlerts}
            activities={activities}
            upcomingPayments={upcomingPayments}
            rep={rep}
          />
        )}
        {activeTab === "retailers" && (
          <RetailersTab retailers={retailers} invites={invites} rep={rep} />
        )}
        {activeTab === "leads" && (
          <LeadsTab leads={leads} rep={rep} />
        )}
        {activeTab === "orders" && <OrdersTab orders={orders} rep={rep} autoOpenOrderId={pendingOrderId} onAutoOpenConsumed={() => setPendingOrderId(null)} />}
        {activeTab === "payments" && <PaymentsTab upcomingPayments={upcomingPayments} rep={rep} onViewOrder={(orderId) => { setPendingOrderId(orderId); setActiveTab("orders"); }} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Overview Tab
   ════════════════════════════════════════════════════════════════ */

function OverviewTab({
  stats,
  orders,
  retailers,
  restockAlerts,
  activities,
  upcomingPayments,
  rep,
}: {
  stats: DashboardStats;
  orders: OrderWithItems[];
  retailers: RetailerWithStats[];
  restockAlerts: RestockAlert[];
  activities: ActivityWithRelations[];
  upcomingPayments: UpcomingPayment[];
  rep: SalesRep;
}) {
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <StatCard
          icon={<ClipboardList className="h-4 w-4 text-orange-600" />}
          label="Pending"
          value={stats.pendingOrders}
          bgColor="bg-orange-100"
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4 text-green-600" />}
          label="Total Orders"
          value={stats.totalOrders}
          bgColor="bg-green-100"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          label="Revenue"
          value={formatPrice(stats.totalRevenue)}
          bgColor="bg-emerald-100"
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-indigo-600" />}
          label="Retailers"
          value={retailers.length}
          bgColor="bg-indigo-100"
        />
      </div>

      {/* Upcoming BNPL Payments */}
      {upcomingPayments.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-semibold text-purple-800">
                Upcoming BNPL Payments ({upcomingPayments.length})
              </p>
            </div>
            <div className="space-y-2">
              {upcomingPayments.map((payment) => {
                const dueDate = new Date(payment.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={payment.id}
                    className={`flex items-center justify-between rounded-lg border bg-white p-2 ${
                      payment.status === "overdue"
                        ? "border-red-200"
                        : payment.status === "due"
                          ? "border-yellow-200"
                          : "border-purple-100"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{payment.retailer_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Order #{payment.order_id.slice(0, 8)} · Installment #{payment.installment_number}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        {payment.status === "overdue" && ` · ${Math.abs(daysUntil)} days overdue`}
                        {payment.status === "due" && " · Due today"}
                        {payment.status === "upcoming" && daysUntil <= 7 && ` · in ${daysUntil} days`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-foreground">
                          {formatPrice(payment.amount)}
                        </p>
                        <Badge
                          className={`text-[10px] ${
                            payment.status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : payment.status === "due"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {payment.status === "overdue" ? "Overdue" : payment.status === "due" ? "Due" : "Upcoming"}
                        </Badge>
                      </div>
                      <a
                        href={buildWhatsAppLink(
                          `Hello ${payment.retailer_name}, this is ${rep.name} from Ristoka. This is a reminder about your BNPL installment #${payment.installment_number} of ${formatPrice(payment.amount)} for order #${payment.order_id.slice(0, 8)}, ${payment.status === "overdue" ? "which is overdue" : `due on ${dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`}. Please arrange payment at your earliest convenience.`,
                          payment.retailer_phone
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]">
                          <MessageCircle className="h-3 w-3 text-[#25D366]" />
                          Remind
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restock Alerts */}
      {restockAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">
                Retailers Running Low ({restockAlerts.length})
              </p>
            </div>
            <div className="space-y-2">
              {restockAlerts.slice(0, 5).map((alert, i) => (
                <div
                  key={`${alert.retailer_id}-${alert.product_id}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{alert.retailer_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {alert.product_name} — {Math.round(alert.days_since_last)} days since last order
                    </p>
                  </div>
                  <a
                    href={buildWhatsAppLink(
                      `Hello ${alert.retailer_name}, this is ${rep.name} from Ristoka. I noticed it's been about ${Math.round(alert.days_since_last)} days since your last ${alert.product_name} order. Would you like me to arrange a restock for you?`,
                      alert.retailer_phone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 shrink-0"
                  >
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]">
                      <MessageCircle className="h-3 w-3 text-[#25D366]" />
                      Remind
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Recent Activity</p>
            <div className="space-y-2">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-2 text-xs">
                  <Activity className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium capitalize">{act.type.replace(/_/g, " ")}</span>
                    {act.retailers && (
                      <span className="text-muted-foreground"> — {act.retailers.name}</span>
                    )}
                    {act.leads && (
                      <span className="text-muted-foreground"> — {act.leads.name}</span>
                    )}
                    {act.notes && (
                      <p className="mt-0.5 text-muted-foreground">{act.notes}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {timeAgo(act.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Recent Orders</p>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Retailers Tab
   ════════════════════════════════════════════════════════════════ */

function RetailersTab({
  retailers,
  invites,
  rep,
}: {
  retailers: RetailerWithStats[];
  invites: RetailerInvite[];
  rep: SalesRep;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RetailerWithStats | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "dormant" | "unverified">("all");

  const pendingInvites = invites.filter((i) => i.status === "pending");

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const filteredRetailers = retailers.filter((r) => {
    if (filter === "all") return true;
    if (filter === "active") return r.lastOrder && new Date(r.lastOrder).getTime() > thirtyDaysAgo;
    if (filter === "dormant") return !r.lastOrder || new Date(r.lastOrder).getTime() <= thirtyDaysAgo;
    if (filter === "unverified") return r.verification_status !== "verified";
    return true;
  });

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(r: RetailerWithStats) {
    setEditing(r);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = editing
        ? await repUpdateRetailer(rep.id, editing.id, formData)
        : await repOnboardRetailer(rep.id, formData);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setDialogOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  async function handleCancelInvite(inviteId: string) {
    startTransition(async () => {
      const result = await repCancelInvite(rep.id, inviteId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleResendInvite(inviteId: string) {
    startTransition(async () => {
      const result = await repResendInvite(rep.id, inviteId);
      if (result.error) {
        alert(result.error);
        return;
      }
      alert("Invite email resent!");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button className="gap-2" onClick={openAdd}>
          <UserPlus className="h-4 w-4" />
          Invite Retailer
        </Button>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <Send className="h-3.5 w-3.5 text-orange-600" />
              <p className="text-xs font-semibold text-orange-800">
                Pending Invites ({pendingInvites.length})
              </p>
            </div>
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md border border-orange-200 bg-white p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{inv.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {inv.phone}
                      </span>
                      {inv.email && <span>{inv.email}</span>}
                      {inv.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {inv.location}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Invited {timeAgo(inv.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <a
                      href={buildWhatsAppLink(
                        `Hello ${inv.business_name || inv.name}, this is ${rep.name} from Ristoka. I've sent you an invite to join our wholesale platform. You can sign up at https://ristoka.com/signup?invite_id=${inv.id} to start placing orders!`,
                        inv.phone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                      </Button>
                    </a>
                    {inv.email && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={isPending}
                        onClick={() => handleResendInvite(inv.id)}
                        title="Resend invite email"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      disabled={isPending}
                      onClick={() => handleCancelInvite(inv.id)}
                      title="Cancel invite"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        {(["all", "active", "dormant", "unverified"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs capitalize"
            onClick={() => setFilter(f)}
          >
            {f} {f === "all" ? `(${retailers.length})` : `(${retailers.filter((r) => {
              if (f === "active") return r.lastOrder && new Date(r.lastOrder).getTime() > thirtyDaysAgo;
              if (f === "dormant") return !r.lastOrder || new Date(r.lastOrder).getTime() <= thirtyDaysAgo;
              if (f === "unverified") return r.verification_status !== "verified";
              return true;
            }).length})`}
          </Button>
        ))}
      </div>

      {/* Retailer List */}
      {filteredRetailers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === "all" ? "No retailers yet — invite your first one!" : `No ${filter} retailers`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredRetailers.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{r.name}</p>
                      <Badge
                        variant="outline"
                        className={
                          r.verification_status === "verified"
                            ? "border-green-200 bg-green-50 text-green-700 text-[10px]"
                            : r.verification_status === "pending"
                            ? "border-yellow-200 bg-yellow-50 text-yellow-700 text-[10px]"
                            : "border-gray-200 text-[10px]"
                        }
                      >
                        {r.verification_status}
                      </Badge>
                    </div>
                    {r.business_name && (
                      <p className="text-xs text-muted-foreground">{r.business_name}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {r.phone}
                      </span>
                      {r.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {r.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      <span>Orders: {r.orderCount}</span>
                      <span>Spent: {formatPrice(r.totalSpent)}</span>
                      {r.lastOrder && <span>Last: {timeAgo(r.lastOrder)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <a
                      href={buildWhatsAppLink(
                        r.orderCount > 0
                          ? `Hello ${r.business_name || r.name}, this is ${rep.name} from Ristoka. Just checking in — how is your stock looking? Let me know if you'd like to place a reorder.`
                          : `Hello ${r.business_name || r.name}, this is ${rep.name} from Ristoka. Welcome aboard! I'm your dedicated sales rep and I'm here to help you access quality wholesale products at the best prices. Feel free to reach out anytime you need to place an order or have questions about our catalog. You can also browse our products at https://ristoka.com/`,
                        r.phone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MessageCircle className="h-4 w-4 text-[#25D366]" />
                      </Button>
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(r)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Retailer" : "Invite New Retailer"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <Input name="name" placeholder="Name *" defaultValue={editing?.name ?? ""} required />
            <Input name="business_name" placeholder="Business name" defaultValue={editing?.business_name ?? ""} />
            <Input name="phone" placeholder="Phone *" defaultValue={editing?.phone ?? ""} required />
            <Input name="email" placeholder="Email (for invite link)" defaultValue={editing?.email ?? ""} />
            <Input name="location" placeholder="Location" defaultValue={editing?.location ?? ""} />
            {!editing && (
              <p className="text-[10px] text-muted-foreground">
                An invite will be created. The retailer will be added once they sign up.
              </p>
            )}
            {formError && (
              <p className="text-xs text-destructive">{formError}</p>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Update" : "Send Invite"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Leads Tab
   ════════════════════════════════════════════════════════════════ */

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  interested: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-gray-100 text-gray-800",
};

const LEAD_SOURCES = [
  { value: "field_visit", label: "Field Visit" },
  { value: "referral", label: "Referral" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "walk_in", label: "Walk In" },
  { value: "other", label: "Other" },
];

function LeadsTab({
  leads,
  rep,
}: {
  leads: Lead[];
  rep: SalesRep;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLeads = statusFilter === "all"
    ? leads
    : leads.filter((l) => l.status === statusFilter);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(l: Lead) {
    setEditing(l);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = editing
        ? await repUpdateLead(rep.id, editing.id, formData)
        : await repCreateLead(rep.id, formData);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setDialogOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  async function handleConvert(leadId: string) {
    startTransition(async () => {
      const result = await repConvertLead(rep.id, leadId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-1">
        {["all", "new", "contacted", "interested", "converted", "lost"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs capitalize"
            onClick={() => setStatusFilter(s)}
          >
            {s} ({s === "all" ? leads.length : leads.filter((l) => l.status === s).length})
          </Button>
        ))}
      </div>

      {/* Follow-up due today/overdue */}
      {(() => {
        const today = new Date().toISOString().split("T")[0];
        const followUps = leads.filter(
          (l) => l.follow_up_date && l.follow_up_date <= today && l.status !== "converted" && l.status !== "lost"
        );
        if (followUps.length === 0) return null;
        return (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-3">
              <div className="mb-1 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <p className="text-xs font-semibold text-blue-800">
                  Follow-ups due ({followUps.length})
                </p>
              </div>
              <div className="space-y-1">
                {followUps.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-muted-foreground">{l.follow_up_date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Lead List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Target className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {statusFilter === "all" ? "No leads yet — add your first one!" : `No ${statusFilter} leads`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{l.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${LEAD_STATUS_COLORS[l.status] ?? ""}`}
                      >
                        {l.status}
                      </Badge>
                    </div>
                    {l.business_name && (
                      <p className="text-xs text-muted-foreground">{l.business_name}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {l.phone}
                      </span>
                      {l.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {l.location}
                        </span>
                      )}
                    </div>
                    {l.notes && (
                      <p className="mt-1 text-[10px] text-muted-foreground">{l.notes}</p>
                    )}
                    <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                      <span className="capitalize">{l.source.replace(/_/g, " ")}</span>
                      {l.follow_up_date && <span>Follow-up: {l.follow_up_date}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <a
                      href={buildWhatsAppLink(`Hello ${l.name}, this is ${rep.name} from Ristoka. I'd like to discuss how we can help supply your business with quality wholesale products at great prices. Would you have a moment to chat?`, l.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                      </Button>
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(l)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {l.status !== "converted" && l.status !== "lost" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleConvert(l.id)}
                        disabled={isPending}
                        title="Convert to retailer"
                      >
                        <UserPlus className="h-3 w-3 text-primary" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-3">
            <Input name="name" placeholder="Name *" defaultValue={editing?.name ?? ""} required />
            <Input name="business_name" placeholder="Business name" defaultValue={editing?.business_name ?? ""} />
            <Input name="phone" placeholder="Phone *" defaultValue={editing?.phone ?? ""} required />
            <Input name="location" placeholder="Location" defaultValue={editing?.location ?? ""} />
            <select
              name="source"
              defaultValue={editing?.source ?? "field_visit"}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {editing && (
              <select
                name="status"
                defaultValue={editing.status}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {["new", "contacted", "interested", "converted", "lost"].map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            )}
            <Input
              name="follow_up_date"
              type="date"
              placeholder="Follow-up date"
              defaultValue={editing?.follow_up_date ?? ""}
            />
            <textarea
              name="notes"
              placeholder="Notes"
              defaultValue={editing?.notes ?? ""}
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {formError && (
              <p className="text-xs text-destructive">{formError}</p>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Update" : "Add Lead"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Payments Tab
   ════════════════════════════════════════════════════════════════ */

function PaymentsTab({
  upcomingPayments,
  rep,
  onViewOrder,
}: {
  upcomingPayments: UpcomingPayment[];
  rep: SalesRep;
  onViewOrder?: (orderId: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "due" | "upcoming">("all");

  const overdue = upcomingPayments.filter((p) => p.status === "overdue");
  const due = upcomingPayments.filter((p) => p.status === "due");
  const upcoming = upcomingPayments.filter((p) => p.status === "upcoming");

  const filtered =
    statusFilter === "all"
      ? upcomingPayments
      : upcomingPayments.filter((p) => p.status === statusFilter);

  const totalDue = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);
  const overdueDue = overdue.reduce((sum, p) => sum + p.amount, 0);

  if (upcomingPayments.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-10 w-10" />}
        title="No upcoming payments"
        description="BNPL installment payments will appear here when plans are active."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{upcomingPayments.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-lg font-bold text-red-700">{overdue.length}</p>
          <p className="text-[10px] text-red-600">Overdue</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{formatPrice(totalDue)}</p>
          <p className="text-[10px] text-muted-foreground">Expected</p>
        </div>
      </div>

      {overdueDue > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-800">
            {formatPrice(overdueDue)} overdue across {overdue.length} installment{overdue.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {([
          { key: "all" as const, label: "All", count: upcomingPayments.length },
          { key: "overdue" as const, label: "Overdue", count: overdue.length },
          { key: "due" as const, label: "Due", count: due.length },
          { key: "upcoming" as const, label: "Upcoming", count: upcoming.length },
        ]).map(({ key, label, count }) => {
          if (key !== "all" && count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Payment list */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No payments with this status
        </p>
      ) : (
        filtered.map((payment) => {
          const dueDate = new Date(payment.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <Card
              key={payment.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                payment.status === "overdue"
                  ? "border-red-200"
                  : payment.status === "due"
                    ? "border-yellow-200"
                    : ""
              }`}
              onClick={() => onViewOrder?.(payment.order_id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{payment.retailer_name}</p>
                      <Badge
                        className={`text-[10px] ${
                          payment.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : payment.status === "due"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {payment.status === "overdue" ? "Overdue" : payment.status === "due" ? "Due Today" : "Upcoming"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Order #{payment.order_id.slice(0, 8)} · Installment #{payment.installment_number}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {payment.status === "overdue" && (
                        <span className="font-medium text-red-600">{Math.abs(daysUntil)} days overdue</span>
                      )}
                      {payment.status === "upcoming" && daysUntil <= 7 && (
                        <span className="text-purple-600">in {daysUntil} day{daysUntil !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="text-sm font-semibold">{formatPrice(payment.amount)}</p>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={buildWhatsAppLink(
                          `Hello ${payment.retailer_name}, this is ${rep.name} from Ristoka. This is a reminder about your BNPL installment #${payment.installment_number} of ${formatPrice(payment.amount)} for order #${payment.order_id.slice(0, 8)}, ${payment.status === "overdue" ? "which is overdue" : `due on ${dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`}. Please arrange payment at your earliest convenience.`,
                          payment.retailer_phone
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]">
                          <MessageCircle className="h-3 w-3 text-[#25D366]" />
                          Remind
                        </Button>
                      </a>
                      <a
                        href={`tel:${payment.retailer_phone}`}
                      >
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Phone className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Orders Tab
   ════════════════════════════════════════════════════════════════ */

function OrdersTab({ orders, rep, autoOpenOrderId, onAutoOpenConsumed }: { orders: OrderWithItems[]; rep: SalesRep; autoOpenOrderId?: string | null; onAutoOpenConsumed?: () => void }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [detailOrder, setDetailOrder] = useState<OrderWithItems | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Auto-open order from payments tab
  useEffect(() => {
    if (autoOpenOrderId) {
      const order = orders.find((o) => o.id === autoOpenOrderId);
      if (order) setDetailOrder(order);
      onAutoOpenConsumed?.();
    }
  }, [autoOpenOrderId, orders, onAutoOpenConsumed]);

  // Payment recording state
  const [paymentDialogOrder, setPaymentDialogOrder] = useState<OrderWithItems | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash" | "card">("mpesa");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // BNPL state
  type BnplPlanWithInstallments = BnplPlan & { bnpl_installments: BnplInstallment[] };
  const [bnplPlan, setBnplPlan] = useState<BnplPlanWithInstallments | null>(null);
  const [showBnplSetup, setShowBnplSetup] = useState(false);
  const [bnplCostPrice, setBnplCostPrice] = useState("");
  const [bnplMarkup, setBnplMarkup] = useState("");
  const [bnplInstallments, setBnplInstallments] = useState("3");
  const [bnplFirstDue, setBnplFirstDue] = useState("");
  const [bnplInterval, setBnplInterval] = useState("30");
  const [creatingBnpl, setCreatingBnpl] = useState(false);
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);
  const [instPayMethod, setInstPayMethod] = useState<"mpesa" | "cash" | "card">("mpesa");
  const [instPayRef, setInstPayRef] = useState("");
  const [showInstPayForm, setShowInstPayForm] = useState<string | null>(null);
  const [recordingDownPayment, setRecordingDownPayment] = useState(false);
  const [showDownPayForm, setShowDownPayForm] = useState(false);
  const [downPayMethod, setDownPayMethod] = useState<"mpesa" | "cash" | "card">("mpesa");
  const [downPayRef, setDownPayRef] = useState("");

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  async function handleStatusUpdate(orderId: string, status: "confirmed" | "out_for_delivery" | "delivered" | "cancelled") {
    setUpdatingId(orderId);
    await repUpdateOrderStatus(rep.id, orderId, status);
    router.refresh();
    setUpdatingId(null);
    setDetailOrder(null);
  }

  async function openPaymentDialog(order: OrderWithItems) {
    setPaymentDialogOrder(order);
    setPaymentAmount("");
    setPaymentMethod("mpesa");
    setPaymentReference("");
    setPaymentNotes("");
    setBnplPlan(null);
    setShowBnplSetup(false);
    setShowInstPayForm(null);
    setLoadingRecords(true);

    const records = await getOrderPayments(order.id);
    setPaymentRecords(records as PaymentRecord[]);

    // Load BNPL plan if applicable
    if (order.payment_method === "bnpl") {
      const plan = await getOrderBnplPlan(order.id);
      if (plan) {
        setBnplPlan(plan as BnplPlanWithInstallments);
      } else {
        setShowBnplSetup(true);
        setBnplCostPrice(String(order.total));
      }
    }

    setLoadingRecords(false);
  }

  async function handleRecordPayment() {
    if (!paymentDialogOrder) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    setRecordingPayment(true);
    const result = await repRecordPayment(rep.id, paymentDialogOrder.id, {
      amount,
      method: paymentMethod,
      reference: paymentReference.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });

    if (!result.error) {
      // Refresh records
      const records = await getOrderPayments(paymentDialogOrder.id);
      setPaymentRecords(records as PaymentRecord[]);
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      router.refresh();
    }
    setRecordingPayment(false);
  }

  async function handleCreateBnplPlan() {
    if (!paymentDialogOrder) return;
    const costPrice = parseFloat(bnplCostPrice);
    const markup = parseFloat(bnplMarkup);
    const numInst = parseInt(bnplInstallments);
    const interval = parseInt(bnplInterval);
    if (!costPrice || isNaN(markup) || markup < 0 || !numInst || !bnplFirstDue || !interval) return;

    setCreatingBnpl(true);
    const result = await repCreateBnplPlan(rep.id, paymentDialogOrder.id, {
      cost_price: costPrice,
      markup_amount: markup,
      num_installments: numInst,
      first_due_date: bnplFirstDue,
      interval_days: interval,
    });

    if (result.error) {
      alert(result.error);
      setCreatingBnpl(false);
      return;
    }

    const plan = await getOrderBnplPlan(paymentDialogOrder.id);
    if (plan) {
      setBnplPlan(plan as BnplPlanWithInstallments);
      setShowBnplSetup(false);
    }
    router.refresh();
    setCreatingBnpl(false);
  }

  async function handlePayInstallment(installmentId: string) {
    setPayingInstallmentId(installmentId);
    const result = await repPayBnplInstallment(rep.id, installmentId, {
      method: instPayMethod,
      reference: instPayRef.trim() || undefined,
    });

    if (!result.error && paymentDialogOrder) {
      const plan = await getOrderBnplPlan(paymentDialogOrder.id);
      if (plan) setBnplPlan(plan as BnplPlanWithInstallments);
      const records = await getOrderPayments(paymentDialogOrder.id);
      setPaymentRecords(records as PaymentRecord[]);
      setShowInstPayForm(null);
      setInstPayRef("");
      router.refresh();
    }
    setPayingInstallmentId(null);
  }

  async function handleRecordDownPayment() {
    if (!paymentDialogOrder) return;
    setRecordingDownPayment(true);
    const result = await repRecordDownPayment(rep.id, paymentDialogOrder.id, {
      method: downPayMethod,
      reference: downPayRef.trim() || undefined,
    });

    if (result.error) {
      alert(result.error);
    } else {
      // Refresh plan & payment records
      const plan = await getOrderBnplPlan(paymentDialogOrder.id);
      if (plan) setBnplPlan(plan as BnplPlanWithInstallments);
      const records = await getOrderPayments(paymentDialogOrder.id);
      setPaymentRecords(records as PaymentRecord[]);
      setShowDownPayForm(false);
      setDownPayRef("");
      router.refresh();
    }
    setRecordingDownPayment(false);
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-10 w-10" />}
        title="No orders yet"
        description="Orders for your wholesalers' products will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            "all",
            "placed",
            "confirmed",
            "out_for_delivery",
            "delivered",
            "cancelled",
          ] as const
        ).map((s) => {
          const count =
            s === "all"
              ? orders.length
              : orders.filter((o) => o.status === s).length;
          if (s !== "all" && count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "all" ? "All" : ORDER_STATUSES[s].label}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {filteredOrders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No orders with this status
        </p>
      ) : (
        filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            expanded
            onView={() => setDetailOrder(order)}
            onStatusUpdate={handleStatusUpdate}
            onRecordPayment={() => openPaymentDialog(order)}
            updating={updatingId === order.id}
          />
        ))
      )}

      {/* Order detail dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Order #{detailOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              {/* Retailer info */}
              {detailOrder.retailers && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Customer</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{detailOrder.retailers.name}</p>
                    {detailOrder.retailers.business_name && (
                      <p className="text-xs text-muted-foreground">{detailOrder.retailers.business_name}</p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {detailOrder.retailers.phone}
                    </p>
                    {detailOrder.retailers.location && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {detailOrder.retailers.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={buildWhatsAppLink(
                        `Hi ${detailOrder.retailers.name}, following up on your order #${detailOrder.id.slice(0, 6).toUpperCase()} (${formatPrice(detailOrder.total)}). ${
                          detailOrder.payment_status === "pending"
                            ? "Kindly confirm payment."
                            : detailOrder.payment_status === "partial"
                              ? `Balance remaining: ${formatPrice(detailOrder.total - detailOrder.amount_paid)}.`
                              : "Thank you for your payment!"
                        }`,
                        detailOrder.retailers.phone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Follow Up
                    </a>
                    <a
                      href={`tel:${detailOrder.retailers.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </a>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={`text-xs ${ORDER_STATUSES[detailOrder.status as keyof typeof ORDER_STATUSES]?.color ?? ""}`}>
                  {ORDER_STATUSES[detailOrder.status as keyof typeof ORDER_STATUSES]?.label ?? detailOrder.status}
                </Badge>
              </div>

              {/* Order info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatPrice(detailOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize">{detailOrder.payment_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge className={`text-[10px] ${PAYMENT_STATUSES[detailOrder.payment_status as keyof typeof PAYMENT_STATUSES]?.color ?? ""}`}>
                    {PAYMENT_STATUSES[detailOrder.payment_status as keyof typeof PAYMENT_STATUSES]?.label ?? detailOrder.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold">{formatPrice(detailOrder.amount_paid)} / {formatPrice(detailOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-right max-w-[200px]">{detailOrder.delivery_address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placed</span>
                  <span>{timeAgo(detailOrder.created_at)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground">Items</p>
                {detailOrder.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.products?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>

              {/* Record payment button */}
              {detailOrder.payment_status !== "paid" && (
                <div className="border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => {
                      setDetailOrder(null);
                      openPaymentDialog(detailOrder);
                    }}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                </div>
              )}

              {/* Status actions */}
              {detailOrder.status !== "delivered" && detailOrder.status !== "cancelled" && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {detailOrder.status === "placed" && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={updatingId === detailOrder.id}
                        onClick={() => handleStatusUpdate(detailOrder.id, "confirmed")}
                      >
                        {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm Order
                      </Button>
                    )}
                    {detailOrder.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={updatingId === detailOrder.id}
                        onClick={() => handleStatusUpdate(detailOrder.id, "out_for_delivery")}
                      >
                        {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                        Out for Delivery
                      </Button>
                    )}
                    {detailOrder.status === "out_for_delivery" && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={updatingId === detailOrder.id}
                        onClick={() => handleStatusUpdate(detailOrder.id, "delivered")}
                      >
                        {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Mark Delivered
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={updatingId === detailOrder.id}
                      onClick={() => handleStatusUpdate(detailOrder.id, "cancelled")}
                    >
                      {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment recording dialog */}
      <Dialog open={!!paymentDialogOrder} onOpenChange={() => setPaymentDialogOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              {paymentDialogOrder?.payment_method === "bnpl" ? "Murabaha Plan" : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          {paymentDialogOrder && (
            <div className="space-y-4">
              {/* Order summary */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-mono">#{paymentDialogOrder.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatPrice(paymentDialogOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid so far</span>
                  <span className="font-semibold text-primary">{formatPrice(paymentDialogOrder.amount_paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold text-destructive">
                    {formatPrice(Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid))}
                  </span>
                </div>
              </div>

              {/* ─── BNPL Section ─── */}
              {paymentDialogOrder.payment_method === "bnpl" && (
                <>
                  {loadingRecords ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : showBnplSetup ? (
                    /* BNPL Plan Setup Form */
                    <div className="space-y-3 border-t pt-3">
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <p className="text-xs font-semibold text-orange-800">🕌 Murabaha Financing</p>
                        <p className="text-xs text-orange-700 mt-1">
                          30% down payment required upfront. The remaining 70% (cost + markup) is split into equal installments.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Cost Price (KSh)</label>
                        <Input
                          type="number"
                          value={bnplCostPrice}
                          onChange={(e) => setBnplCostPrice(e.target.value)}
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Markup / Profit (KSh)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={bnplMarkup}
                          onChange={(e) => setBnplMarkup(e.target.value)}
                          min={0}
                        />
                      </div>

                      {/* Price breakdown preview */}
                      {bnplCostPrice && bnplMarkup !== "" && (
                        <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total (cost + markup)</span>
                            <span className="font-semibold">{formatPrice(parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0"))}</span>
                          </div>
                          <div className="flex justify-between text-primary">
                            <span>⬇ 30% Down Payment</span>
                            <span className="font-semibold">{formatPrice(Math.ceil((parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0")) * 0.3 * 100) / 100)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining (70%)</span>
                            <span>{formatPrice(Math.floor((parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0")) * 0.7 * 100) / 100)}</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Installments</label>
                          <Input
                            type="number"
                            value={bnplInstallments}
                            onChange={(e) => setBnplInstallments(e.target.value)}
                            min={2}
                            max={24}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Interval (days)</label>
                          <Input
                            type="number"
                            value={bnplInterval}
                            onChange={(e) => setBnplInterval(e.target.value)}
                            min={7}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">First Installment Due</label>
                        <Input
                          type="date"
                          value={bnplFirstDue}
                          onChange={(e) => setBnplFirstDue(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      {bnplCostPrice && bnplMarkup !== "" && bnplInstallments && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatPrice(Math.ceil(((parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0")) * 0.7 / parseInt(bnplInstallments)) * 100) / 100)} per installment × {bnplInstallments} payments
                        </p>
                      )}
                      <Button
                        className="w-full gap-1.5"
                        disabled={creatingBnpl || !bnplCostPrice || bnplMarkup === "" || !bnplFirstDue}
                        onClick={handleCreateBnplPlan}
                      >
                        {creatingBnpl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                        Create Installment Plan
                      </Button>
                    </div>
                  ) : bnplPlan ? (
                    /* BNPL Installment Schedule */
                    <div className="space-y-3 border-t pt-3">
                      <div className="rounded-lg bg-muted/50 p-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost Price</span>
                          <span>{formatPrice(bnplPlan.cost_price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Markup</span>
                          <span>{formatPrice(bnplPlan.markup_amount)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total (Murabaha)</span>
                          <span>{formatPrice(bnplPlan.total_with_markup)}</span>
                        </div>
                        <div className="flex justify-between text-primary">
                          <span>30% Down Payment</span>
                          <span className="font-semibold">{formatPrice(bnplPlan.down_payment)}</span>
                        </div>
                      </div>

                      {/* Down Payment Recording */}
                      <div className="rounded border p-2 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium">⬇ Down Payment (30%)</p>
                            <p className="text-muted-foreground">{formatPrice(bnplPlan.down_payment)}</p>
                          </div>
                          <Badge className={`text-[10px] ${
                            bnplPlan.down_payment_paid_at
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {bnplPlan.down_payment_paid_at ? "Paid" : "Required"}
                          </Badge>
                        </div>
                        {!bnplPlan.down_payment_paid_at && (
                          <>
                            {showDownPayForm ? (
                              <div className="space-y-2 pt-1 border-t">
                                <div className="flex gap-1.5">
                                  {(["mpesa", "cash", "card"] as const).map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => setDownPayMethod(m)}
                                      className={`flex-1 rounded border px-1.5 py-1 text-[10px] font-medium ${
                                        downPayMethod === m ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                                      }`}
                                    >
                                      {m === "mpesa" ? "M-Pesa" : m === "cash" ? "Cash" : "Card"}
                                    </button>
                                  ))}
                                </div>
                                {downPayMethod !== "cash" && (
                                  <Input
                                    className="h-8 text-xs"
                                    placeholder={downPayMethod === "mpesa" ? "M-Pesa code" : "Receipt ref"}
                                    value={downPayRef}
                                    onChange={(e) => setDownPayRef(e.target.value.toUpperCase())}
                                  />
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="h-7 flex-1 gap-1 text-xs"
                                    disabled={recordingDownPayment}
                                    onClick={handleRecordDownPayment}
                                  >
                                    {recordingDownPayment ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                    Confirm {formatPrice(bnplPlan.down_payment)}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowDownPayForm(false)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-full gap-1 text-xs"
                                onClick={() => { setShowDownPayForm(true); setDownPayRef(""); setDownPayMethod("mpesa"); }}
                              >
                                <Banknote className="h-3 w-3" />
                                Record Down Payment
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-muted-foreground">
                        Installment Schedule ({bnplPlan.num_installments} payments of remaining 70%)
                      </p>
                      {(bnplPlan.bnpl_installments ?? [])
                        .sort((a, b) => a.installment_number - b.installment_number)
                        .map((inst) => (
                        <div key={inst.id} className="rounded border p-2 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-medium">#{inst.installment_number} — {formatPrice(inst.amount)}</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(inst.due_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <Badge className={`text-[10px] ${
                              inst.status === "paid" ? "bg-green-100 text-green-800" :
                              inst.status === "overdue" ? "bg-red-100 text-red-800" :
                              inst.status === "due" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {inst.status === "paid" ? "Paid" : inst.status === "overdue" ? "Overdue" : inst.status === "due" ? "Due" : "Upcoming"}
                            </Badge>
                          </div>

                          {inst.status !== "paid" && (
                            <>
                              {showInstPayForm === inst.id ? (
                                <div className="space-y-2 pt-1 border-t">
                                  <div className="flex gap-1.5">
                                    {(["mpesa", "cash", "card"] as const).map((m) => (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => setInstPayMethod(m)}
                                        className={`flex-1 rounded border px-1.5 py-1 text-[10px] font-medium ${
                                          instPayMethod === m ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                                        }`}
                                      >
                                        {m === "mpesa" ? "M-Pesa" : m === "cash" ? "Cash" : "Card"}
                                      </button>
                                    ))}
                                  </div>
                                  {instPayMethod !== "cash" && (
                                    <Input
                                      className="h-8 text-xs"
                                      placeholder={instPayMethod === "mpesa" ? "M-Pesa code" : "Receipt ref"}
                                      value={instPayRef}
                                      onChange={(e) => setInstPayRef(e.target.value.toUpperCase())}
                                    />
                                  )}
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="h-7 flex-1 gap-1 text-xs"
                                      disabled={payingInstallmentId === inst.id}
                                      onClick={() => handlePayInstallment(inst.id)}
                                    >
                                      {payingInstallmentId === inst.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                      Confirm
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowInstPayForm(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-full gap-1 text-xs"
                                  onClick={() => { setShowInstPayForm(inst.id); setInstPayRef(""); setInstPayMethod("mpesa"); }}
                                >
                                  <Banknote className="h-3 w-3" />
                                  Mark Paid
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}

              {/* ─── Regular Payment Section (non-BNPL) ─── */}
              {paymentDialogOrder.payment_method !== "bnpl" && (
                <>
                  {/* Payment history */}
                  {loadingRecords ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentRecords.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Payment History</p>
                      {paymentRecords.map((rec) => (
                        <div key={rec.id} className="flex items-center justify-between rounded border p-2 text-xs">
                          <div>
                            <p className="font-medium capitalize">{rec.method}</p>
                            {rec.reference && <p className="text-muted-foreground font-mono">{rec.reference}</p>}
                            {rec.notes && <p className="text-muted-foreground">{rec.notes}</p>}
                            <p className="text-muted-foreground">{timeAgo(rec.created_at)}</p>
                          </div>
                          <span className="font-semibold text-primary">{formatPrice(rec.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Record new payment form */}
                  {paymentDialogOrder.amount_paid < paymentDialogOrder.total && (
                    <div className="space-y-3 border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground">New Payment</p>

                      <div>
                        <label className="text-xs text-muted-foreground">Amount (KSh)</label>
                        <Input
                          type="number"
                          placeholder={`Max: ${Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid)}`}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          min={1}
                          max={paymentDialogOrder.total - paymentDialogOrder.amount_paid}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPaymentAmount(String(Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid)))}
                      >
                        Fill full balance ({formatPrice(Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid))})
                      </Button>

                      <div>
                        <label className="text-xs text-muted-foreground">Method</label>
                        <div className="flex gap-2 mt-1">
                          {(["mpesa", "cash", "card"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPaymentMethod(m)}
                              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                                paymentMethod === m
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {m === "mpesa" ? "📱 M-Pesa" : m === "cash" ? "💵 Cash" : "💳 Card"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {paymentMethod !== "cash" && (
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {paymentMethod === "mpesa" ? "M-Pesa Transaction Code" : "Card Receipt / Reference"}
                          </label>
                          <Input
                            placeholder={paymentMethod === "mpesa" ? "e.g. SJK7ABCDEF" : "e.g. TXN-12345"}
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value.toUpperCase())}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-muted-foreground">Notes (optional)</label>
                        <Input
                          placeholder="e.g. Installment 2 of 4"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>

                      <Button
                        className="w-full gap-1.5"
                        disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                        onClick={handleRecordPayment}
                      >
                        {recordingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                        Confirm Payment
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Shared UI Pieces
   ════════════════════════════════════════════════════════════════ */

function StatCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bgColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{value}</p>
          <p className="truncate text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({
  order,
  expanded = false,
  onView,
  onStatusUpdate,
  onRecordPayment,
  updating = false,
}: {
  order: OrderWithItems;
  expanded?: boolean;
  onView?: () => void;
  onStatusUpdate?: (orderId: string, status: "confirmed" | "out_for_delivery" | "delivered" | "cancelled") => void;
  onRecordPayment?: () => void;
  updating?: boolean;
}) {
  const statusInfo =
    ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
  const paymentInfo =
    PAYMENT_STATUSES[order.payment_status as keyof typeof PAYMENT_STATUSES];

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">
            #{order.id.slice(0, 8)}
          </p>
          {order.retailers && (
            <p className="mt-0.5 text-xs font-medium truncate">
              {order.retailers.business_name ?? order.retailers.name}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {timeAgo(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
          <Badge className={`text-[10px] ${statusInfo?.color ?? ""}`}>
            {statusInfo?.label ?? order.status}
          </Badge>
          <Badge className={`text-[10px] ${paymentInfo?.color ?? ""}`}>
            {paymentInfo?.label ?? order.payment_status}
          </Badge>
        </div>
      </div>

      {expanded && order.order_items.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2">
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">
                {item.products?.name ?? "Unknown Product"} x{item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.total_price)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {(onView || onStatusUpdate || onRecordPayment) && (
        <div className="mt-2 flex items-center gap-1 border-t pt-2">
          {onView && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onView}>
              <Eye className="h-3 w-3" />
              View
            </Button>
          )}
          {onRecordPayment && order.payment_status !== "paid" && (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onRecordPayment}>
              <Banknote className="h-3 w-3" />
              Pay
            </Button>
          )}
          {onStatusUpdate && order.status === "placed" && (
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "confirmed")}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Confirm
            </Button>
          )}
          {onStatusUpdate && order.status === "confirmed" && (
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "out_for_delivery")}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
              Dispatch
            </Button>
          )}
          {onStatusUpdate && order.status === "out_for_delivery" && (
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "delivered")}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Delivered
            </Button>
          )}
          {onStatusUpdate && order.status !== "delivered" && order.status !== "cancelled" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "cancelled")}
            >
              <XCircle className="h-3 w-3" />
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-muted-foreground/40">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

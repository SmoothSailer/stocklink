"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CreditCard,
  AlertTriangle,
  Search,
  Phone,
  MessageCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminUpcomingBnplPayments } from "@/app/admin/actions";
import { formatPrice, buildWhatsAppLink } from "@/lib/utils";

type AdminPayment = Awaited<ReturnType<typeof getAdminUpcomingBnplPayments>>[number];

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "due" | "upcoming">("all");

  const loadPayments = useCallback(async () => {
    try {
      const data = await getAdminUpcomingBnplPayments();
      setPayments(data);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const overdue = payments.filter((p) => p.status === "overdue");
  const due = payments.filter((p) => p.status === "due");
  const upcoming = payments.filter((p) => p.status === "upcoming");
  const totalDue = payments.reduce((sum, p) => sum + p.amount, 0);
  const overdueDue = overdue.reduce((sum, p) => sum + p.amount, 0);

  const filtered = payments.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesSearch =
      !search ||
      p.retailer_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.retailer_business_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sales_rep_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.order_id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  function navigateToOrder(orderId: string) {
    router.push(`/admin/orders?order=${orderId}`);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">BNPL Payments</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Track upcoming, due, and overdue BNPL installments
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3 text-center">
            <CreditCard className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
            <p className="text-lg font-bold">{payments.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Installments</p>
          </CardContent>
        </Card>
        <Card className={overdue.length > 0 ? "border-red-200" : ""}>
          <CardContent className="p-3 text-center">
            <AlertTriangle className={`mx-auto mb-1 h-5 w-5 ${overdue.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <p className={`text-lg font-bold ${overdue.length > 0 ? "text-red-700" : ""}`}>{overdue.length}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
            <p className="text-lg font-bold">{formatPrice(totalDue)}</p>
            <p className="text-[10px] text-muted-foreground">Expected Total</p>
          </CardContent>
        </Card>
        <Card className={overdueDue > 0 ? "border-red-200" : ""}>
          <CardContent className="p-3 text-center">
            <AlertTriangle className={`mx-auto mb-1 h-5 w-5 ${overdueDue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <p className={`text-lg font-bold ${overdueDue > 0 ? "text-red-700" : ""}`}>{formatPrice(overdueDue)}</p>
            <p className="text-[10px] text-muted-foreground">Overdue Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by retailer, rep, or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            { key: "all" as const, label: "All", count: payments.length },
            { key: "overdue" as const, label: "Overdue", count: overdue.length },
            { key: "due" as const, label: "Due Today", count: due.length },
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
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No payments match your filters"
                : "No BNPL installments yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Mobile Card List ─── */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((payment) => {
              const dueDate = new Date(payment.due_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysUntil = Math.ceil(
                (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );

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
                  onClick={() => navigateToOrder(payment.order_id)}
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
                            {payment.status === "overdue"
                              ? "Overdue"
                              : payment.status === "due"
                                ? "Due Today"
                                : "Upcoming"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Order #{payment.order_id.slice(0, 8)} · Installment #
                          {payment.installment_number}
                        </p>
                        {payment.sales_rep_name && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {payment.sales_rep_name}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dueDate.toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {payment.status === "overdue" && (
                            <span className="font-medium text-red-600">
                              {Math.abs(daysUntil)} days overdue
                            </span>
                          )}
                          {payment.status === "upcoming" && daysUntil <= 7 && (
                            <span className="text-purple-600">
                              in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <p className="text-sm font-semibold">
                          {formatPrice(payment.amount)}
                        </p>
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={buildWhatsAppLink(
                              `Hello ${payment.retailer_name}, this is a reminder about your BNPL installment #${payment.installment_number} of ${formatPrice(payment.amount)} for order #${payment.order_id.slice(0, 8)}, ${payment.status === "overdue" ? "which is overdue" : `due on ${dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`}. Please arrange payment at your earliest convenience.`,
                              payment.retailer_phone
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-[10px]"
                            >
                              <MessageCircle className="h-3 w-3 text-[#25D366]" />
                              Remind
                            </Button>
                          </a>
                          <a href={`tel:${payment.retailer_phone}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ─── Desktop Table ─── */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Installment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sales Rep</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment) => {
                    const dueDate = new Date(payment.due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = Math.ceil(
                      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <TableRow
                        key={payment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigateToOrder(payment.order_id)}
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {payment.retailer_name}
                            </p>
                            {payment.retailer_business_name && (
                              <p className="text-xs text-muted-foreground">
                                {payment.retailer_business_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          #{payment.order_id.slice(0, 6).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm">
                          #{payment.installment_number}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <p>
                              {dueDate.toLocaleDateString("en-KE", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            {payment.status === "overdue" && (
                              <p className="text-xs font-medium text-red-600">
                                {Math.abs(daysUntil)} days overdue
                              </p>
                            )}
                            {payment.status === "upcoming" && daysUntil <= 7 && (
                              <p className="text-xs text-purple-600">
                                in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              payment.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : payment.status === "due"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {payment.status === "overdue"
                              ? "Overdue"
                              : payment.status === "due"
                                ? "Due Today"
                                : "Upcoming"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.sales_rep_name ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {payment.sales_rep_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(payment.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={buildWhatsAppLink(
                                `Hello ${payment.retailer_name}, this is a reminder about your BNPL installment #${payment.installment_number} of ${formatPrice(payment.amount)} for order #${payment.order_id.slice(0, 8)}, ${payment.status === "overdue" ? "which is overdue" : `due on ${dueDate.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`}. Please arrange payment at your earliest convenience.`,
                                payment.retailer_phone
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-[10px]"
                              >
                                <MessageCircle className="h-3 w-3 text-[#25D366]" />
                                Remind
                              </Button>
                            </a>
                            <a href={`tel:${payment.retailer_phone}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

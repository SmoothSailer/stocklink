"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Store,
  Phone,
  MapPin,
  UserCheck,
  MessageCircle,
  Send,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getWholesalers,
  getSalesReps,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
} from "@/app/admin/actions";
import { buildWholesalerWelcome } from "@/lib/welcome-messages";
import { buildWhatsAppLink } from "@/lib/utils";
import type { SalesRep } from "@/types/database";

interface WholesalerWithRep {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  sales_rep_id: string | null;
  created_at: string;
  sales_reps: { id: string; name: string; whatsapp_phone: string } | null;
}

export default function WholesalersPage() {
  const [wholesalers, setWholesalers] = useState<WholesalerWithRep[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWholesaler, setEditingWholesaler] =
    useState<WholesalerWithRep | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [welcomeWholesaler, setWelcomeWholesaler] =
    useState<WholesalerWithRep | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [whs, reps] = await Promise.all([
        getWholesalers(),
        getSalesReps(),
      ]);
      setWholesalers(whs as WholesalerWithRep[]);
      setSalesReps(reps);
    } catch {
      // Empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = wholesalers.filter(
    (w) =>
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location?.toLowerCase().includes(search.toLowerCase()) ||
      w.sales_reps?.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setFormError(null);

    try {
      const result = editingWholesaler
        ? await updateWholesaler(editingWholesaler.id, formData)
        : await createWholesaler(formData);

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setEditingWholesaler(null);
      await loadData();

      // Show welcome dialog for newly created wholesalers
      if (!editingWholesaler && result.data) {
        setWelcomeWholesaler(result.data as WholesalerWithRep);
      }
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteWholesaler(id);
    if (!result.error) {
      setDeleteConfirmId(null);
      await loadData();
    }
  }

  function sendWelcome(wholesaler: WholesalerWithRep) {
    const message = buildWholesalerWelcome({
      id: wholesaler.id,
      name: wholesaler.name,
      sales_reps: wholesaler.sales_reps,
    });
    const phone = wholesaler.phone?.replace(/[\s\-+]/g, "");
    if (!phone) return;
    const link = buildWhatsAppLink(message, phone);
    window.open(link, "_blank", "noopener,noreferrer");
  }

  function openEdit(wholesaler: WholesalerWithRep) {
    setEditingWholesaler(wholesaler);
    setFormError(null);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingWholesaler(null);
    setFormError(null);
    setDialogOpen(true);
  }

  const assignedCount = wholesalers.filter((w) => w.sales_rep_id).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wholesalers</h1>
          <p className="text-sm text-muted-foreground">
            Manage wholesaler partners and assign sales representatives
          </p>
        </div>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Wholesaler
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Store className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{wholesalers.length}</p>
              <p className="text-xs text-muted-foreground">
                Total Wholesalers
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assignedCount}</p>
              <p className="text-xs text-muted-foreground">With Sales Rep</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {
                  new Set(
                    wholesalers.map((w) => w.location).filter(Boolean)
                  ).size
                }
              </p>
              <p className="text-xs text-muted-foreground">Locations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Phone className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {wholesalers.filter((w) => w.phone).length}
              </p>
              <p className="text-xs text-muted-foreground">With Contact</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search wholesalers or reps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Store className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No wholesalers found" : "No wholesalers yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "Add your first wholesaler to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((wholesaler) => (
                  <TableRow key={wholesaler.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                          <Store className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium">
                          {wholesaler.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wholesaler.location ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wholesaler.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      {wholesaler.sales_reps ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {wholesaler.sales_reps.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-medium">
                              {wholesaler.sales_reps.name}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MessageCircle className="h-2.5 w-2.5 text-[#25D366]" />
                              {wholesaler.sales_reps.whatsapp_phone}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] text-orange-600 bg-orange-50"
                        >
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(wholesaler.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {deleteConfirmId === wholesaler.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-destructive">
                            Delete?
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleDelete(wholesaler.id)}
                          >
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          {wholesaler.phone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#25D366] hover:text-[#25D366]"
                              title="Send Welcome via WhatsApp"
                              onClick={() => sendWelcome(wholesaler)}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(wholesaler)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(wholesaler.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingWholesaler(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWholesaler ? "Edit Wholesaler" : "Add Wholesaler"}
            </DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Nairobi Wholesale Co."
                defaultValue={editingWholesaler?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                placeholder="e.g. Industrial Area, Nairobi"
                defaultValue={editingWholesaler?.location ?? ""}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="phone"
                placeholder="e.g. +254 712 345 678"
                defaultValue={editingWholesaler?.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Assigned Sales Rep
              </label>
              <select
                name="sales_rep_id"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={editingWholesaler?.sales_rep_id ?? ""}
              >
                <option value="">No sales rep assigned</option>
                {salesReps
                  .filter((r) => r.is_active)
                  .map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} — {rep.whatsapp_phone}
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                The assigned rep&apos;s WhatsApp will receive all orders for
                this wholesaler&apos;s products
              </p>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingWholesaler
                    ? "Update"
                    : "Add Wholesaler"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Welcome Message Dialog */}
      <Dialog
        open={!!welcomeWholesaler}
        onOpenChange={(open) => {
          if (!open) setWelcomeWholesaler(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              Welcome {welcomeWholesaler?.name}!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {welcomeWholesaler?.name} has been added as a wholesaler
              {welcomeWholesaler?.sales_reps
                ? ` with ${welcomeWholesaler.sales_reps.name} as their sales rep`
                : ""}
              . Send them a welcome message via WhatsApp with their inventory
              link and team info.
            </p>
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Preview:
              </p>
              <p className="whitespace-pre-line text-xs">
                {welcomeWholesaler &&
                  buildWholesalerWelcome({
                    id: welcomeWholesaler.id,
                    name: welcomeWholesaler.name,
                    sales_reps: welcomeWholesaler.sales_reps,
                  }).slice(0, 250)}
                ...
              </p>
            </div>
            {!welcomeWholesaler?.phone && (
              <p className="text-xs text-orange-600">
                No phone number set for this wholesaler. Add one first to send
                via WhatsApp.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setWelcomeWholesaler(null)}
              >
                Skip
              </Button>
              <Button
                className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
                disabled={!welcomeWholesaler?.phone}
                onClick={() => {
                  if (welcomeWholesaler) sendWelcome(welcomeWholesaler);
                  setWelcomeWholesaler(null);
                }}
              >
                <Send className="h-4 w-4" />
                Send via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

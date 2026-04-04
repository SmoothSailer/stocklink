"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  Phone,
  MessageCircle,
  Mail,
  UserX,
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
  getSalesReps,
  createSalesRep,
  updateSalesRep,
  deleteSalesRep,
} from "@/app/admin/actions";
import type { SalesRep } from "@/types/database";

export default function SalesRepsPage() {
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadReps = useCallback(async () => {
    try {
      const data = await getSalesReps();
      setReps(data);
    } catch {
      // Empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReps();
  }, [loadReps]);

  const filtered = reps.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = reps.filter((r) => r.is_active).length;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setFormError(null);

    try {
      if (editingRep) {
        // Preserve is_active toggle — use the hidden input value
        formData.set("is_active", editingRep.is_active ? "true" : "false");
      }

      const result = editingRep
        ? await updateSalesRep(editingRep.id, formData)
        : await createSalesRep(formData);

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setEditingRep(null);
      await loadReps();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteSalesRep(id);
    if (!result.error) {
      setDeleteConfirmId(null);
      await loadReps();
    }
  }

  async function toggleActive(rep: SalesRep) {
    const formData = new FormData();
    formData.set("name", rep.name);
    formData.set("phone", rep.phone);
    formData.set("whatsapp_phone", rep.whatsapp_phone);
    formData.set("email", rep.email ?? "");
    formData.set("bio", rep.bio ?? "");
    formData.set("is_active", rep.is_active ? "false" : "true");
    await updateSalesRep(rep.id, formData);
    await loadReps();
  }

  function openEdit(rep: SalesRep) {
    setEditingRep(rep);
    setFormError(null);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingRep(null);
    setFormError(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Representatives</h1>
          <p className="text-sm text-muted-foreground">
            Manage sales reps who handle wholesaler relationships and retailer
            orders via WhatsApp
          </p>
        </div>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Sales Rep
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reps.length}</p>
              <p className="text-xs text-muted-foreground">Total Reps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reps.length - activeCount}
              </p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email..."
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
              <UserCheck className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No sales reps found" : "No sales reps yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search
                  ? "Try a different search"
                  : "Add your first sales representative to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rep) => (
                  <TableRow
                    key={rep.id}
                    className={!rep.is_active ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {rep.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{rep.name}</p>
                          {rep.bio && (
                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                              {rep.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {rep.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MessageCircle className="h-3 w-3 text-[#25D366]" />
                        <span className="font-mono text-xs">
                          {rep.whatsapp_phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rep.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {rep.email}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rep.is_active ? "default" : "secondary"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleActive(rep)}
                      >
                        {rep.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {deleteConfirmId === rep.id ? (
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
                            onClick={() => handleDelete(rep.id)}
                          >
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(rep)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(rep.id)}
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
            setEditingRep(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRep ? "Edit Sales Rep" : "Add Sales Rep"}
            </DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Amina Hassan"
                defaultValue={editingRep?.name ?? ""}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Phone <span className="text-destructive">*</span>
                </label>
                <Input
                  name="phone"
                  placeholder="+254712345678"
                  defaultValue={editingRep?.phone ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  WhatsApp # <span className="text-destructive">*</span>
                </label>
                <Input
                  name="whatsapp_phone"
                  placeholder="254712345678"
                  defaultValue={editingRep?.whatsapp_phone ?? ""}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Country code, no + or spaces
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                placeholder="amina@stocklink.co"
                defaultValue={editingRep?.email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio / Notes</label>
              <Input
                name="bio"
                placeholder="Region, speciality, etc."
                defaultValue={editingRep?.bio ?? ""}
              />
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
                  : editingRep
                    ? "Update"
                    : "Add Sales Rep"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

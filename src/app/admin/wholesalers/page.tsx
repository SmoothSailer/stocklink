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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getWholesalers,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
} from "@/app/admin/actions";
import type { Wholesaler } from "@/types/database";

export default function WholesalersPage() {
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWholesaler, setEditingWholesaler] = useState<Wholesaler | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadWholesalers = useCallback(async () => {
    try {
      const data = await getWholesalers();
      setWholesalers(data);
    } catch {
      // Silently handle — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWholesalers();
  }, [loadWholesalers]);

  const filtered = wholesalers.filter(
    (w) =>
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location?.toLowerCase().includes(search.toLowerCase())
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
      await loadWholesalers();
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
      await loadWholesalers();
    }
  }

  function openEdit(wholesaler: Wholesaler) {
    setEditingWholesaler(wholesaler);
    setFormError(null);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingWholesaler(null);
    setFormError(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wholesalers</h1>
          <p className="text-sm text-muted-foreground">
            Manage wholesaler partners and their details
          </p>
        </div>
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
          <DialogTrigger render={<Button className="gap-2" onClick={openAdd} />}>
            <Plus className="h-4 w-4" />
            Add Wholesaler
          </DialogTrigger>
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
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(wholesalers.map((w) => w.location).filter(Boolean)).size}
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
          placeholder="Search wholesalers..."
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
              <p className="text-xs text-muted-foreground mt-1">
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
                        <p className="text-sm font-medium">{wholesaler.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wholesaler.location ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wholesaler.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(wholesaler.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {deleteConfirmId === wholesaler.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-destructive">Delete?</span>
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
    </div>
  );
}

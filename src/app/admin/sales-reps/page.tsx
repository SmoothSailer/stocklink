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
  Send,
  MoreVertical,
  KeyRound,
  ShieldOff,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getSalesReps,
  createSalesRep,
  updateSalesRep,
  deleteSalesRep,
  resetSalesRepPassword,
  revokeSalesRepAccess,
} from "@/app/admin/actions";
import { buildSalesRepWelcome } from "@/lib/welcome-messages";
import { buildWhatsAppLink } from "@/lib/utils";
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
  const [welcomeRep, setWelcomeRep] = useState<SalesRep | null>(null);
  const [welcomeCredentials, setWelcomeCredentials] = useState<{ email: string; password: string } | null>(null);
  const [passwordRep, setPasswordRep] = useState<SalesRep | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [revokeRep, setRevokeRep] = useState<SalesRep | null>(null);
  const [revoking, setRevoking] = useState(false);

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

      // Show welcome dialog for newly created reps
      if (!editingRep && result.data) {
        setWelcomeRep(result.data);
        // Capture credentials so the welcome message can include login details
        const repEmail = formData.get("email") as string;
        const repPassword = formData.get("password") as string;
        if (repEmail?.trim() && repPassword?.trim()) {
          setWelcomeCredentials({ email: repEmail.trim(), password: repPassword.trim() });
        } else {
          setWelcomeCredentials(null);
        }
      }
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

  function sendWelcome(rep: SalesRep, credentials?: { email: string; password: string } | null) {
    const message = buildSalesRepWelcome({
      name: rep.name,
      whatsapp_phone: rep.whatsapp_phone,
      email: credentials?.email,
      password: credentials?.password,
    });
    const link = buildWhatsAppLink(message, rep.whatsapp_phone);
    window.open(link, "_blank", "noopener,noreferrer");
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

  async function handlePasswordReset(formData: FormData) {
    if (!passwordRep) return;
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      const newPassword = formData.get("new_password") as string;
      const result = await resetSalesRepPassword(passwordRep.id, newPassword);
      if (result.error) {
        setPasswordError(result.error);
      } else {
        setPasswordSuccess(true);
      }
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleRevoke() {
    if (!revokeRep) return;
    setRevoking(true);
    try {
      const result = await revokeSalesRepAccess(revokeRep.id);
      if (!result.error) {
        setRevokeRep(null);
        await loadReps();
      }
    } catch {
      // handled silently
    } finally {
      setRevoking(false);
    }
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

  /** Initials for the avatar circle */
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
  }

  return (
    <div className="space-y-4 pb-20 sm:space-y-6 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Sales Representatives</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage reps who handle wholesaler relationships &amp; orders via
            WhatsApp
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Sales Rep
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
              <UserCheck className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{reps.length}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                Total
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10">
              <MessageCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{activeCount}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                Active
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 sm:h-10 sm:w-10">
              <UserX className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">
                {reps.length - activeCount}
              </p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                Inactive
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 sm:max-w-sm"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No sales reps found" : "No sales reps yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search
                ? "Try a different search"
                : "Add your first sales representative to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Mobile Card List ─── */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((rep) => (
              <Card
                key={rep.id}
                className={rep.is_active ? "" : "opacity-60"}
              >
                <CardContent className="p-4">
                  {/* Top Row: Avatar + Name + Status + Menu */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {getInitials(rep.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {rep.name}
                        </p>
                        <Badge
                          variant={rep.is_active ? "default" : "secondary"}
                          className="shrink-0 cursor-pointer text-[10px]"
                          onClick={() => toggleActive(rep)}
                        >
                          {rep.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {rep.user_id && (
                          <Badge variant="outline" className="shrink-0 text-[10px] border-primary/30 text-primary">
                            Login
                          </Badge>
                        )}
                      </div>
                      {rep.bio && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {rep.bio}
                        </p>
                      )}
                    </div>

                    {/* Overflow menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(rep)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(rep)}>
                          {rep.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        {rep.user_id && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setPasswordError(null);
                              setPasswordSuccess(false);
                              setPasswordRep(rep);
                            }}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRevokeRep(rep)}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Revoke Access
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteConfirmId(rep.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{rep.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-3 w-3 shrink-0 text-[#25D366]" />
                      <span className="truncate font-mono">
                        {rep.whatsapp_phone}
                      </span>
                    </div>
                    {rep.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{rep.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 flex-1 gap-1.5 text-xs"
                      onClick={() => sendWelcome(rep)}
                    >
                      <Send className="h-3.5 w-3.5 text-[#25D366]" />
                      WhatsApp Welcome
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 flex-1 gap-1.5 text-xs"
                      onClick={() => openEdit(rep)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── Desktop Table ─── */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
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
                            {getInitials(rep.name)}
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
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#25D366] hover:text-[#25D366]"
                            title="Send Welcome via WhatsApp"
                            onClick={() => sendWelcome(rep)}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(rep)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {rep.user_id && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Reset Password"
                                onClick={() => {
                                  setPasswordError(null);
                                  setPasswordSuccess(false);
                                  setPasswordRep(rep);
                                }}
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Revoke Dashboard Access"
                                onClick={() => setRevokeRep(rep)}
                              >
                                <ShieldOff className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(rep.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Add / Edit Dialog ─── */}
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
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
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
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Phone <span className="text-destructive">*</span>
                </label>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="+254712345678"
                  defaultValue={editingRep?.phone ?? ""}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  WhatsApp # <span className="text-destructive">*</span>
                </label>
                <Input
                  name="whatsapp_phone"
                  type="tel"
                  placeholder="254712345678"
                  defaultValue={editingRep?.whatsapp_phone ?? ""}
                  required
                  className="h-11"
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
                placeholder="amina@ristoka.co"
                defaultValue={editingRep?.email ?? ""}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio / Notes</label>
              <Input
                name="bio"
                placeholder="Region, speciality, etc."
                defaultValue={editingRep?.bio ?? ""}
                className="h-11"
              />
            </div>
            {/* Password field — only when creating a new rep (for dashboard login) */}
            {!editingRep && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <label className="text-sm font-medium">
                  Dashboard Password
                </label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Min 6 characters (optional)"
                  className="h-11"
                  minLength={6}
                />
                <p className="text-[10px] text-muted-foreground">
                  If email &amp; password are set, the rep can log in at{" "}
                  <span className="font-mono">/sales-rep/login</span> to access
                  their dashboard.
                </p>
              </div>
            )}
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-11 sm:h-9">
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

      {/* ─── Welcome Message Dialog ─── */}
      <Dialog
        open={!!welcomeRep}
        onOpenChange={(open) => {
          if (!open) {
            setWelcomeRep(null);
            setWelcomeCredentials(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              Welcome {welcomeRep?.name}!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {welcomeRep?.name} has been added as a sales rep. Send them a
              welcome message via WhatsApp with their team details.
            </p>
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Preview:
              </p>
              <p className="whitespace-pre-line text-xs">
                {welcomeRep &&
                  buildSalesRepWelcome({
                    name: welcomeRep.name,
                    whatsapp_phone: welcomeRep.whatsapp_phone,
                    email: welcomeCredentials?.email,
                    password: welcomeCredentials?.password,
                  }).slice(0, 350)}
                ...
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => setWelcomeRep(null)}
              >
                Skip
              </Button>
              <Button
                className="h-11 gap-2 bg-[#25D366] text-white hover:bg-[#1da851] sm:h-9"
                onClick={() => {
                  if (welcomeRep) sendWelcome(welcomeRep, welcomeCredentials);
                  setWelcomeRep(null);
                  setWelcomeCredentials(null);
                }}
              >
                <Send className="h-4 w-4" />
                Send via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Password Dialog ─── */}
      <Dialog
        open={!!passwordRep}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordRep(null);
            setPasswordError(null);
            setPasswordSuccess(false);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          {passwordSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-800">
                  Password updated successfully for {passwordRep?.name}.
                </p>
              </div>
              <div className="flex justify-end">
                <Button className="h-11 sm:h-9" onClick={() => setPasswordRep(null)}>Done</Button>
              </div>
            </div>
          ) : (
            <form action={handlePasswordReset} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set a new dashboard password for <span className="font-medium text-foreground">{passwordRep?.name}</span>.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  name="new_password"
                  type="password"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="h-11"
                  autoFocus
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 sm:h-9"
                  onClick={() => setPasswordRep(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={passwordSaving} className="h-11 sm:h-9">
                  {passwordSaving ? "Saving..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Revoke Access Confirmation Dialog ─── */}
      <Dialog
        open={!!revokeRep}
        onOpenChange={(open) => {
          if (!open) setRevokeRep(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              Revoke Dashboard Access
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the login for{" "}
            <span className="font-medium text-foreground">{revokeRep?.name}</span>{" "}
            and remove their ability to access the sales rep dashboard. The sales rep record itself will be kept.
          </p>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              onClick={() => setRevokeRep(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:h-9"
              disabled={revoking}
              onClick={handleRevoke}
            >
              {revoking ? "Revoking..." : "Revoke Access"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Sales Rep?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The rep will be permanently removed.
          </p>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:h-9"
              onClick={() => {
                if (deleteConfirmId) handleDelete(deleteConfirmId);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

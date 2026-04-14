"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Phone,
  MapPin,
  Store,
  CreditCard,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getRetailers,
  verifyRetailer,
  updateRetailerCredit,
} from "@/app/admin/actions";
import { formatPrice } from "@/lib/utils";
import type { Retailer } from "@/types/database";

const VERIFICATION_BADGES: Record<string, { label: string; className: string; icon: typeof ShieldCheck }> = {
  unverified: { label: "Unverified", className: "bg-gray-100 text-gray-800", icon: ShieldAlert },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800", icon: ShieldAlert },
  verified: { label: "Verified", className: "bg-green-100 text-green-800", icon: ShieldCheck },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800", icon: ShieldX },
};

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  // Verify dialog state
  const [verifyAction, setVerifyAction] = useState<"verify" | "reject">("verify");
  const [creditLimit, setCreditLimit] = useState("");
  const [bnplEnabled, setBnplEnabled] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Credit edit state
  const [editingCredit, setEditingCredit] = useState<string | null>(null);
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [editBnplEnabled, setEditBnplEnabled] = useState(false);
  const [savingCredit, setSavingCredit] = useState(false);

  const loadRetailers = useCallback(async () => {
    setLoading(true);
    const data = await getRetailers();
    setRetailers(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadRetailers(); }, [loadRetailers]);

  const filtered = retailers.filter((r) => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search);
    const matchesStatus = statusFilter === "all" || r.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: retailers.length,
    unverified: retailers.filter((r) => r.verification_status === "unverified").length,
    pending: retailers.filter((r) => r.verification_status === "pending").length,
    verified: retailers.filter((r) => r.verification_status === "verified").length,
    rejected: retailers.filter((r) => r.verification_status === "rejected").length,
  };

  function openVerifyDialog(retailer: Retailer, action: "verify" | "reject") {
    setSelectedRetailer(retailer);
    setVerifyAction(action);
    setCreditLimit(action === "verify" ? "50000" : "");
    setBnplEnabled(action === "verify");
    setVerificationNotes("");
    setShowVerifyDialog(true);
  }

  async function handleVerify() {
    if (!selectedRetailer) return;
    setSubmitting(true);
    const result = await verifyRetailer(selectedRetailer.id, verifyAction, {
      credit_limit: verifyAction === "verify" ? parseFloat(creditLimit) || 0 : undefined,
      bnpl_enabled: verifyAction === "verify" ? bnplEnabled : false,
      verification_notes: verificationNotes.trim() || undefined,
    });
    if (result.error) {
      alert(result.error);
    } else {
      setShowVerifyDialog(false);
      loadRetailers();
    }
    setSubmitting(false);
  }

  async function handleSaveCredit(retailerId: string) {
    setSavingCredit(true);
    const result = await updateRetailerCredit(
      retailerId,
      parseFloat(editCreditLimit) || 0,
      editBnplEnabled
    );
    if (result.error) {
      alert(result.error);
    } else {
      setEditingCredit(null);
      loadRetailers();
    }
    setSavingCredit(false);
  }

  const badge = (status: string) => {
    const b = VERIFICATION_BADGES[status] ?? VERIFICATION_BADGES.unverified;
    return <Badge className={`text-[10px] ${b.className}`}>{b.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Retailers</h1>
        <p className="text-sm text-muted-foreground">
          Manage retailer verification, BNPL eligibility, and credit limits.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(["all", "unverified", "pending", "verified", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              statusFilter === s ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
            <p className="text-lg font-bold">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, business, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No retailers found</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{r.business_name || r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.name}</p>
                    </div>
                    {badge(r.verification_status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>
                    {r.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</span>}
                  </div>
                  {r.verification_status === "verified" && (
                    <div className="flex items-center gap-3 text-xs">
                      <span>Credit: <span className="font-semibold">{formatPrice(r.credit_limit)}</span></span>
                      <Badge className={`text-[10px] ${r.bnpl_enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        BNPL {r.bnpl_enabled ? "On" : "Off"}
                      </Badge>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    {r.verification_status !== "verified" && (
                      <Button size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => openVerifyDialog(r, "verify")}>
                        <ShieldCheck className="h-3 w-3" /> Verify
                      </Button>
                    )}
                    {r.verification_status !== "rejected" && r.verification_status !== "verified" && (
                      <Button size="sm" variant="destructive" className="h-7 text-xs gap-1 flex-1" onClick={() => openVerifyDialog(r, "reject")}>
                        <ShieldX className="h-3 w-3" /> Reject
                      </Button>
                    )}
                    {r.verification_status === "verified" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 flex-1"
                        onClick={() => {
                          setEditingCredit(editingCredit === r.id ? null : r.id);
                          setEditCreditLimit(String(r.credit_limit));
                          setEditBnplEnabled(r.bnpl_enabled);
                        }}
                      >
                        <CreditCard className="h-3 w-3" /> Edit Credit
                      </Button>
                    )}
                  </div>
                  {editingCredit === r.id && (
                    <div className="space-y-2 border-t pt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Credit Limit (KSh)</label>
                        <Input className="h-8 text-xs" type="number" value={editCreditLimit} onChange={(e) => setEditCreditLimit(e.target.value)} min={0} />
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={editBnplEnabled} onChange={(e) => setEditBnplEnabled(e.target.checked)} />
                        BNPL Enabled
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs flex-1" disabled={savingCredit} onClick={() => handleSaveCredit(r.id)}>
                          {savingCredit ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingCredit(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>BNPL</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{r.business_name || r.name}</p>
                      {r.business_name && <p className="text-xs text-muted-foreground">{r.name}</p>}
                      {r.id_number && <p className="text-[10px] text-muted-foreground">ID: {r.id_number}</p>}
                      {r.business_reg_number && <p className="text-[10px] text-muted-foreground">Reg: {r.business_reg_number}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{r.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.location || "—"}</TableCell>
                    <TableCell>{badge(r.verification_status)}</TableCell>
                    <TableCell>
                      {r.verification_status === "verified" ? (
                        editingCredit === r.id ? (
                          <div className="space-y-1">
                            <Input className="h-7 w-28 text-xs" type="number" value={editCreditLimit} onChange={(e) => setEditCreditLimit(e.target.value)} min={0} />
                            <label className="flex items-center gap-1 text-[10px]">
                              <input type="checkbox" checked={editBnplEnabled} onChange={(e) => setEditBnplEnabled(e.target.checked)} />
                              BNPL
                            </label>
                            <div className="flex gap-1">
                              <Button size="sm" className="h-6 text-[10px] px-2" disabled={savingCredit} onClick={() => handleSaveCredit(r.id)}>
                                {savingCredit ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingCredit(null)}>✕</Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="text-sm font-medium hover:underline"
                            onClick={() => {
                              setEditingCredit(r.id);
                              setEditCreditLimit(String(r.credit_limit));
                              setEditBnplEnabled(r.bnpl_enabled);
                            }}
                          >
                            {formatPrice(r.credit_limit)}
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.verification_status === "verified" ? (
                        <Badge className={`text-[10px] ${r.bnpl_enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {r.bnpl_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {r.verification_status !== "verified" && (
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => openVerifyDialog(r, "verify")}>
                            <ShieldCheck className="h-3 w-3" /> Verify
                          </Button>
                        )}
                        {r.verification_status !== "rejected" && r.verification_status !== "verified" && (
                          <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => openVerifyDialog(r, "reject")}>
                            <ShieldX className="h-3 w-3" /> Reject
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Verify/Reject Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {verifyAction === "verify" ? "✅ Verify Retailer" : "❌ Reject Retailer"}
            </DialogTitle>
          </DialogHeader>

          {selectedRetailer && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <p className="font-semibold">{selectedRetailer.business_name || selectedRetailer.name}</p>
                <p className="text-xs text-muted-foreground">{selectedRetailer.name} · {selectedRetailer.phone}</p>
                {selectedRetailer.id_number && <p className="text-xs">ID: {selectedRetailer.id_number}</p>}
                {selectedRetailer.business_reg_number && <p className="text-xs">Business Reg: {selectedRetailer.business_reg_number}</p>}
                {selectedRetailer.location && <p className="text-xs text-muted-foreground">{selectedRetailer.location}</p>}
              </div>

              {/* Uploaded KYC Documents */}
              {(() => {
                let docs: Record<string, string> = {};
                try {
                  if (selectedRetailer.verification_notes) {
                    docs = JSON.parse(selectedRetailer.verification_notes);
                  }
                } catch {
                  // not JSON, ignore
                }
                const docEntries = Object.entries(docs).filter(
                  ([key, val]) => key.endsWith("_url") && typeof val === "string" && val.length > 0
                );
                if (docEntries.length === 0) return null;

                const docLabels: Record<string, string> = {
                  id_front_url: "ID Front",
                  id_back_url: "ID Back",
                  business_cert_url: "Business Certificate",
                };

                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <FileText className="h-4 w-4" /> Uploaded Documents
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {docEntries.map(([key, url]) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border p-2 hover:border-primary transition-colors"
                        >
                          {url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                            <img
                              src={url}
                              alt={docLabels[key] || key}
                              className="w-full h-24 object-cover rounded mb-1"
                            />
                          ) : (
                            <div className="w-full h-24 bg-muted rounded flex items-center justify-center mb-1">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <p className="text-xs text-center flex items-center justify-center gap-1">
                            {docLabels[key] || key}
                            <ExternalLink className="h-3 w-3" />
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {verifyAction === "verify" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Credit Limit (KSh)</label>
                    <Input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      min={0}
                      placeholder="e.g. 50000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum outstanding BNPL balance allowed</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bnplEnabled}
                      onChange={(e) => setBnplEnabled(e.target.checked)}
                    />
                    Enable BNPL (Murabaha) for this retailer
                  </label>
                </>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={verifyAction === "verify" ? "KYC completed, docs verified" : "Reason for rejection..."}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={verifyAction === "verify" ? "default" : "destructive"}
                  disabled={submitting}
                  onClick={handleVerify}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {verifyAction === "verify" ? "Verify & Set Credit" : "Reject Retailer"}
                </Button>
                <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

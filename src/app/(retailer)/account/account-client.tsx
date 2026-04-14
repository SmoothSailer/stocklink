"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Store,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CreditCard,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { updateRetailerProfile, submitForVerification } from "../actions";
import { uploadRetailerDoc } from "@/lib/supabase/storage";
import { useAuth } from "@/hooks/use-auth";
import type { Retailer } from "@/types/database";

interface BnplEligibility {
  eligible: boolean;
  reason?: string;
  credit_limit: number;
  credit_used: number;
  available_credit: number;
  verification_status: string;
}

interface AccountClientProps {
  retailer: Retailer;
  bnplEligibility: BnplEligibility;
}

const STATUS_CONFIG = {
  unverified: { label: "Unverified", className: "bg-gray-100 text-gray-800", icon: ShieldAlert, description: "Submit your documents to get verified" },
  pending: { label: "Pending Review", className: "bg-yellow-100 text-yellow-800", icon: ShieldAlert, description: "Your documents are being reviewed" },
  verified: { label: "Verified", className: "bg-green-100 text-green-800", icon: ShieldCheck, description: "Your account is verified" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800", icon: ShieldX, description: "Verification was rejected — please resubmit" },
} as const;

export default function AccountClient({ retailer, bnplEligibility }: AccountClientProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(retailer.name);
  const [businessName, setBusinessName] = useState(retailer.business_name ?? "");
  const [phone, setPhone] = useState(retailer.phone);
  const [location, setLocation] = useState(retailer.location ?? "");
  const [idNumber, setIdNumber] = useState(retailer.id_number ?? "");
  const [businessReg, setBusinessReg] = useState(retailer.business_reg_number ?? "");
  const [saving, setSaving] = useState(false);

  // Verification docs state
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [businessCertFile, setBusinessCertFile] = useState<File | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const status = STATUS_CONFIG[retailer.verification_status] ?? STATUS_CONFIG.unverified;
  const StatusIcon = status.icon;
  const canSubmitVerification = retailer.verification_status === "unverified" || retailer.verification_status === "rejected";

  async function handleSaveProfile() {
    setSaving(true);
    const result = await updateRetailerProfile({
      name: name.trim(),
      business_name: businessName.trim() || undefined,
      phone: phone.trim(),
      location: location.trim() || undefined,
      id_number: idNumber.trim() || undefined,
      business_reg_number: businessReg.trim() || undefined,
    });
    if (result.error) {
      alert(result.error);
    } else {
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleSubmitVerification() {
    if (!idNumber.trim()) {
      alert("Please enter your ID number in the profile section first");
      return;
    }

    setSubmittingVerification(true);

    try {
      // Save profile fields first
      await updateRetailerProfile({
        id_number: idNumber.trim(),
        business_reg_number: businessReg.trim() || undefined,
        location: location.trim() || undefined,
      });

      // Upload documents
      const docUrls: Record<string, string> = {};
      const userId = retailer.user_id;
      if (!userId) {
        alert("Account error — please log in again");
        setSubmittingVerification(false);
        return;
      }

      if (idFrontFile) {
        docUrls.id_front_url = await uploadRetailerDoc(idFrontFile, userId, "id_front");
      }
      if (idBackFile) {
        docUrls.id_back_url = await uploadRetailerDoc(idBackFile, userId, "id_back");
      }
      if (businessCertFile) {
        docUrls.business_cert_url = await uploadRetailerDoc(businessCertFile, userId, "business_cert");
      }

      // Submit for verification
      const result = await submitForVerification(docUrls);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    }

    setSubmittingVerification(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-bold">My Account</h1>

      {/* Verification Status Banner */}
      <Card className={`border-l-4 ${
        retailer.verification_status === "verified" ? "border-l-green-500" :
        retailer.verification_status === "pending" ? "border-l-yellow-500" :
        retailer.verification_status === "rejected" ? "border-l-red-500" :
        "border-l-gray-400"
      }`}>
        <CardContent className="flex items-center gap-3 p-4">
          <StatusIcon className={`h-5 w-5 ${
            retailer.verification_status === "verified" ? "text-green-600" :
            retailer.verification_status === "pending" ? "text-yellow-600" :
            retailer.verification_status === "rejected" ? "text-red-600" :
            "text-gray-500"
          }`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{status.label}</p>
              <Badge className={`text-[10px] ${status.className}`}>{status.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{status.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* BNPL Credit Info (verified only) */}
      {retailer.verification_status === "verified" && retailer.bnpl_enabled && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              BNPL Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credit Limit</span>
              <span className="font-semibold">{formatPrice(bnplEligibility.credit_limit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span>{formatPrice(bnplEligibility.credit_used)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-semibold text-primary">{formatPrice(bnplEligibility.available_credit)}</span>
            </div>
            <Badge className={`text-xs ${bnplEligibility.eligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {bnplEligibility.eligible ? "✓ Eligible for BNPL" : bnplEligibility.reason}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Profile Info */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
            {!editing && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Business Name</label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Mama Mboga Store" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Location</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nairobi, Eastleigh" />
              </div>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground">KYC Information</p>
              <div>
                <label className="text-xs text-muted-foreground">National ID / Passport Number</label>
                <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. 12345678" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Business Registration / KRA PIN</label>
                <Input value={businessReg} onChange={(e) => setBusinessReg(e.target.value)} placeholder="e.g. P051234567Z" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" disabled={saving || !name.trim() || !phone.trim()} onClick={handleSaveProfile}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setName(retailer.name); setBusinessName(retailer.business_name ?? ""); setPhone(retailer.phone); setLocation(retailer.location ?? ""); setIdNumber(retailer.id_number ?? ""); setBusinessReg(retailer.business_reg_number ?? ""); }}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <InfoRow icon={User} label="Name" value={retailer.name} />
              <InfoRow icon={Store} label="Business" value={retailer.business_name || "—"} />
              <InfoRow icon={Phone} label="Phone" value={retailer.phone} />
              <InfoRow icon={MapPin} label="Location" value={retailer.location || "—"} />
              {retailer.id_number && <InfoRow icon={FileText} label="ID Number" value={retailer.id_number} />}
              {retailer.business_reg_number && <InfoRow icon={FileText} label="Business Reg" value={retailer.business_reg_number} />}
            </>
          )}
        </CardContent>
      </Card>

      {/* Verification Document Upload */}
      {canSubmitVerification && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Upload className="h-4 w-4 text-primary" />
              Submit for Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Upload your documents to verify your account. Verified accounts can access BNPL (Buy Now Pay Later).
            </p>

            {!idNumber.trim() && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs text-orange-800">⚠️ Please edit your profile above and enter your ID number first.</p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium">ID Front (Photo)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setIdFrontFile(e.target.files?.[0] ?? null)}
                className="text-xs"
              />
              {idFrontFile && <p className="text-[10px] text-green-600 mt-0.5">✓ {idFrontFile.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium">ID Back (Photo)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setIdBackFile(e.target.files?.[0] ?? null)}
                className="text-xs"
              />
              {idBackFile && <p className="text-[10px] text-green-600 mt-0.5">✓ {idBackFile.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium">Business Certificate (optional)</label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setBusinessCertFile(e.target.files?.[0] ?? null)}
                className="text-xs"
              />
              {businessCertFile && <p className="text-[10px] text-green-600 mt-0.5">✓ {businessCertFile.name}</p>}
            </div>

            <Button
              className="w-full gap-2"
              disabled={submittingVerification || !idNumber.trim() || (!idFrontFile && !idBackFile)}
              onClick={handleSubmitVerification}
            >
              {submittingVerification ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Submit for Verification
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending notice */}
      {retailer.verification_status === "pending" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <ShieldAlert className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-yellow-800">Verification In Progress</p>
            <p className="text-xs text-yellow-700 mt-1">
              Our team is reviewing your documents. This usually takes 1-2 business days.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <Button variant="outline" className="w-full gap-2 text-muted-foreground" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

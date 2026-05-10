"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuthState {
  error: string | null;
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect(next);
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = (formData.get("name") as string)?.trim();
  const businessName = (formData.get("businessName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const inviteId = (formData.get("inviteId") as string)?.trim() || null;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        full_name: name || undefined,
        business_name: businessName || undefined,
        phone: phone || undefined,
        email_confirmed: true,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    return { error: error.message };
  }

  if (data.user) {
    const adminSupabase = createAdminClient();

    // Look up the invite if one was provided
    let invite: { id: string; sales_rep_id: string; name: string; business_name: string | null; phone: string; location: string | null } | null = null;
    if (inviteId) {
      const { data: inviteData } = await adminSupabase
        .from("retailer_invites")
        .select("id, sales_rep_id, name, business_name, phone, location")
        .eq("id", inviteId)
        .eq("status", "pending")
        .single();
      invite = inviteData;
    }

    // Create the retailer record (always — whether invited or fresh)
    const { data: retailer, error: retailerError } = await adminSupabase
      .from("retailers")
      .insert({
        user_id: data.user.id,
        name: name || invite?.name || email.split("@")[0],
        business_name: businessName || invite?.business_name || null,
        phone: phone || invite?.phone || "",
        email: email.toLowerCase().trim(),
        location: invite?.location || null,
        sales_rep_id: invite?.sales_rep_id || null,
      })
      .select("id")
      .single();

    if (retailerError) {
      console.error("Failed to create retailer profile:", retailerError.message);
    }

    // Mark the invite as accepted and link to the new retailer
    if (invite && retailer) {
      await adminSupabase
        .from("retailer_invites")
        .update({
          status: "accepted",
          retailer_id: retailer.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invite.id);
    }
  }

  redirect("/login?registered=true");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

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

  // Insert into retailers table using admin client (user has no session yet)
  if (data.user) {
    const adminSupabase = createAdminClient();
    const { error: retailerError } = await adminSupabase
      .from("retailers")
      .insert({
        user_id: data.user.id,
        name: name || email.split("@")[0],
        business_name: businessName || null,
        phone: phone || "",
        email: email.toLowerCase().trim(),
      });

    if (retailerError) {
      console.error("Failed to create retailer profile:", retailerError.message);
      // Don't block signup — auth user was created successfully
    }
  }

  redirect("/login?registered=true");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

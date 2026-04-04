"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/constants";

export interface AdminSignInState {
  error: string | null;
}

export async function adminSignIn(
  _prevState: AdminSignInState,
  formData: FormData
): Promise<AdminSignInState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Check admin allowlist before attempting sign-in
  if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
    return { error: "You are not authorized to access the admin panel" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    // Generic message to avoid leaking info
    return { error: "Invalid email or password" };
  }

  redirect("/admin/inventory");
}

export async function adminSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

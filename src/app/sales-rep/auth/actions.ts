"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SalesRepSignInState {
  error: string | null;
}

export async function salesRepSignIn(
  _prevState: SalesRepSignInState,
  formData: FormData
): Promise<SalesRepSignInState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

  if (authError) {
    return { error: "Invalid email or password" };
  }

  // Verify this user is actually a sales rep
  const { data: rep } = await supabase
    .from("sales_reps")
    .select("id, is_active")
    .eq("user_id", authData.user.id)
    .single();

  if (!rep) {
    await supabase.auth.signOut();
    return { error: "No sales rep account found for this email" };
  }

  if (!rep.is_active) {
    await supabase.auth.signOut();
    return { error: "Your account has been deactivated. Contact admin." };
  }

  redirect("/sales-rep/dashboard");
}

export async function salesRepSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sales-rep/login");
}

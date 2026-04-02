import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // If there's a code, exchange it for a session
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's a token_hash (email/phone confirmation)
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback — redirect to login on failure
  return NextResponse.redirect(`${origin}/login`);
}

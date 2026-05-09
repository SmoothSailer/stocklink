import { NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";

export async function POST(request: Request) {
  const { to, subject, html } = await request.json();

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, html" },
      { status: 400 }
    );
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

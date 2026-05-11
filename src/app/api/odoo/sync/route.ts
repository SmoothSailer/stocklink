import { NextResponse } from "next/server";
import { isSyncEnabled, runFullSync } from "@/lib/odoo/sync";
import { odoo } from "@/lib/odoo/client";

/**
 * Manual/cron-triggered full sync endpoint.
 * Protected by CRON_SECRET for Vercel Cron or admin bearer token.
 *
 * GET /api/odoo/sync — check connection status
 * POST /api/odoo/sync — trigger full sync
 */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSyncEnabled()) {
    return NextResponse.json({
      status: "disabled",
      message: "Odoo sync is disabled. Set ODOO_SYNC_ENABLED=true to enable.",
    });
  }

  try {
    const version = await odoo.version();
    const uid = await odoo.authenticate();
    return NextResponse.json({
      status: "connected",
      odoo: {
        version: version.server_version,
        uid,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json(
      { status: "error", message },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSyncEnabled()) {
    return NextResponse.json(
      { error: "Odoo sync is disabled" },
      { status: 503 }
    );
  }

  try {
    const result = await runFullSync();
    return NextResponse.json({ status: "completed", result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}

// ── Auth Verification ──────────────────────────────────────────

function verifyAuth(request: Request): boolean {
  // Support Vercel Cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }

  // Support ODOO_WEBHOOK_SECRET as fallback for admin-triggered requests
  const webhookSecret = process.env.ODOO_WEBHOOK_SECRET;
  if (webhookSecret) {
    const secretHeader = request.headers.get("x-odoo-webhook-secret");
    if (secretHeader === webhookSecret) return true;
  }

  return false;
}

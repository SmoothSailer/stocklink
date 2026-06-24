import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStockSyncEnabled, isSyncEnabled } from "@/lib/odoo/sync";
import type { OdooWebhookPayload } from "@/lib/odoo/types";
import { timingSafeEqual } from "crypto";

/**
 * Inbound webhook for Odoo → Ristoka stock/product changes.
 * Odoo automated actions POST here when stock moves are validated
 * or products are updated.
 */
export async function POST(request: Request) {
  // 1. Verify sync is enabled
  if (!isSyncEnabled()) {
    return NextResponse.json(
      { error: "Odoo sync is disabled" },
      { status: 503 }
    );
  }

  // 2. Verify webhook authenticity via shared secret
  const secret = process.env.ODOO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("x-odoo-webhook-secret");
  if (!authHeader || !verifySecret(authHeader, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse payload
  let payload: OdooWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!payload.event || !payload.records?.length) {
    return NextResponse.json(
      { error: "Missing event or records in payload" },
      { status: 400 }
    );
  }

  // 4. Process based on event type
  const supabase = createAdminClient();
  const results: { id: number; status: string; error?: string }[] = [];

  for (const record of payload.records) {
    try {
      switch (payload.event) {
        case "stock.update": {
          if (!isStockSyncEnabled()) {
            results.push({ id: record.id, status: "skipped" });
            break;
          }

          const quantity = record.fields.qty_available as number | undefined;
          const ristokaId = record.x_ristoka_id;

          if (ristokaId && quantity !== undefined) {
            const { error } = await supabase
              .from("products")
              .update({ stock: Math.max(0, Math.floor(quantity)) })
              .eq("id", ristokaId);

            if (error) {
              results.push({ id: record.id, status: "error", error: error.message });
              await logWebhookEvent(supabase, "stock", ristokaId, record.id, "error", error.message);
            } else {
              results.push({ id: record.id, status: "updated" });
              await logWebhookEvent(supabase, "stock", ristokaId, record.id, "success");
            }
          } else {
            // Try to find by odoo_template_id or odoo_product_id
            const { data: product } = await supabase
              .from("products")
              .select("id")
              .or(`odoo_template_id.eq.${record.id},odoo_product_id.eq.${record.id}`)
              .single();

            if (product && quantity !== undefined) {
              await supabase
                .from("products")
                .update({ stock: Math.max(0, Math.floor(quantity)) })
                .eq("id", product.id);
              results.push({ id: record.id, status: "updated" });
              await logWebhookEvent(supabase, "stock", product.id, record.id, "success");
            } else {
              results.push({ id: record.id, status: "skipped" });
            }
          }
          break;
        }

        case "product.update": {
          const ristokaId = record.x_ristoka_id;
          if (!ristokaId) {
            results.push({ id: record.id, status: "skipped" });
            break;
          }

          const updateFields: Record<string, unknown> = {};
          if (record.fields.name) updateFields.name = record.fields.name;
          if (record.fields.list_price) updateFields.price = record.fields.list_price;
          if (record.fields.description_sale) updateFields.description = record.fields.description_sale;

          if (Object.keys(updateFields).length > 0) {
            const { error } = await supabase
              .from("products")
              .update(updateFields)
              .eq("id", ristokaId);

            if (error) {
              results.push({ id: record.id, status: "error", error: error.message });
            } else {
              results.push({ id: record.id, status: "updated" });
            }
          } else {
            results.push({ id: record.id, status: "skipped" });
          }
          break;
        }

        case "product.create": {
          // New products from Odoo — log but don't auto-create
          // (catalog creation stays in Ristoka; admins decide what to list)
          results.push({ id: record.id, status: "skipped" });
          await logWebhookEvent(supabase, "product", undefined, record.id, "skipped", "Auto-create disabled");
          break;
        }

        case "product.delete": {
          // Don't auto-delete — just log for admin awareness
          results.push({ id: record.id, status: "skipped" });
          await logWebhookEvent(supabase, "product", record.x_ristoka_id, record.id, "skipped", "Auto-delete disabled");
          break;
        }

        default:
          results.push({ id: record.id, status: "skipped" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ id: record.id, status: "error", error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

// ── Helpers ────────────────────────────────────────────────────

function verifySecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf-8");
  const b = Buffer.from(expected, "utf-8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function logWebhookEvent(
  supabase: ReturnType<typeof createAdminClient>,
  entityType: string,
  entityId: string | undefined,
  odooId: number,
  status: string,
  errorMessage?: string
) {
  await supabase.from("odoo_sync_log").insert({
    entity_type: entityType,
    entity_id: entityId ?? null,
    odoo_id: odooId,
    direction: "inbound",
    action: "update",
    status,
    error_message: errorMessage ?? null,
  });
}

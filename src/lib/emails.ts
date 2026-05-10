import { resend, EMAIL_FROM, ORDERS_EMAIL_FROM } from "@/lib/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ristoka.com";

function emailHeader() {
  return `
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${APP_URL}/icon-192.png" alt="Ristoka" width="48" height="48" style="border-radius: 12px;" />
    </div>`;
}

interface SendRetailerInviteEmailParams {
  to: string;
  name: string;
  businessName?: string | null;
  phone: string;
  location?: string | null;
  repName: string;
  inviteId: string;
}

export async function sendRetailerInviteEmail({
  to,
  name,
  businessName,
  phone,
  location,
  repName,
  inviteId,
}: SendRetailerInviteEmailParams) {
  const signupParams = new URLSearchParams({
    invite_id: inviteId,
    name,
    email: to,
    phone,
    ...(businessName ? { business_name: businessName } : {}),
    ...(location ? { location } : {}),
  });
  const signupUrl = `${APP_URL}/signup?${signupParams.toString()}`;

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Complete your Ristoka account",
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        ${emailHeader()}
        <h1 style="color: #1F2937; font-size: 24px; margin-bottom: 16px;">Welcome to Ristoka, ${name}! 👋</h1>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          ${repName} has registered you on <strong>Ristoka</strong> — your wholesale supply platform.
        </p>
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #1F2937; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Your details:</p>
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="color: #6B7280; padding: 4px 0; width: 100px;">Name</td><td style="color: #1F2937; padding: 4px 0;">${name}</td></tr>
            ${businessName ? `<tr><td style="color: #6B7280; padding: 4px 0;">Shop</td><td style="color: #1F2937; padding: 4px 0;">${businessName}</td></tr>` : ""}
            ${location ? `<tr><td style="color: #6B7280; padding: 4px 0;">Location</td><td style="color: #1F2937; padding: 4px 0;">📍 ${location}</td></tr>` : ""}
            <tr><td style="color: #6B7280; padding: 4px 0;">Phone</td><td style="color: #1F2937; padding: 4px 0;">${phone}</td></tr>
            <tr><td style="color: #6B7280; padding: 4px 0;">Email</td><td style="color: #1F2937; padding: 4px 0;">${to}</td></tr>
          </table>
        </div>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          To start browsing products, placing orders, and tracking deliveries, <strong>finish setting up your account</strong> by creating a password.
        </p>
        <a href="${signupUrl}" style="display: inline-block; background: #16A34A; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px;">
          Complete Registration
        </a>
        <div style="background: #DCFCE7; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #15803D; font-size: 14px; margin: 0;">
            💡 Once registered, you can unlock Buy Now Pay Later (Murabaha) financing by submitting your ID from your account page.
          </p>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          Questions? Reach out to ${repName} or contact us on WhatsApp.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send retailer onboarding email:", error);
    return { error: error.message };
  }

  return { data };
}

interface SendWelcomeEmailParams {
  to: string;
  name: string;
  loginUrl: string;
  tempPassword?: string;
}

export async function sendWelcomeEmail({
  to,
  name,
  loginUrl,
  tempPassword,
}: SendWelcomeEmailParams) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Welcome to Ristoka — Your account is ready",
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        ${emailHeader()}
        <h1 style="color: #1F2937; font-size: 24px; margin-bottom: 16px;">Welcome to Ristoka, ${name}! 🎉</h1>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Your account has been verified and is ready to use. You can now log in to browse products, place orders, and track deliveries.
        </p>
        ${
          tempPassword
            ? `
        <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #1F2937; font-size: 14px; margin: 0 0 8px;"><strong>Your temporary login credentials:</strong></p>
          <p style="color: #4B5563; font-size: 14px; margin: 0;">Email: ${to}</p>
          <p style="color: #4B5563; font-size: 14px; margin: 0;">Password: ${tempPassword}</p>
          <p style="color: #6B7280; font-size: 12px; margin: 8px 0 0;">Please change your password after first login.</p>
        </div>
        `
            : ""
        }
        <a href="${loginUrl}" style="display: inline-block; background: #16A34A; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 16px;">
          Log in to Ristoka
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
    return { error: error.message };
  }

  return { data };
}

interface SendOrderConfirmationParams {
  to: string;
  name: string;
  orderId: string;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  trackingUrl: string;
}

export async function sendOrderConfirmation({
  to,
  name,
  orderId,
  orderItems,
  total,
  trackingUrl,
}: SendOrderConfirmationParams) {
  const itemsHtml = orderItems
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0; color: #4B5563; border-bottom: 1px solid #E5E7EB;">${item.name}</td>
          <td style="padding: 8px 0; color: #4B5563; border-bottom: 1px solid #E5E7EB; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; color: #4B5563; border-bottom: 1px solid #E5E7EB; text-align: right;">KSh ${item.price.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Order #${orderId.slice(0, 8)} confirmed — Ristoka`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        ${emailHeader()}
        <h1 style="color: #1F2937; font-size: 24px; margin-bottom: 8px;">Order Confirmed ✓</h1>
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 24px;">Order #${orderId.slice(0, 8)}</p>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Hi ${name}, your order has been confirmed and is being prepared.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; color: #1F2937; border-bottom: 2px solid #E5E7EB;">Item</th>
              <th style="text-align: center; padding: 8px 0; color: #1F2937; border-bottom: 2px solid #E5E7EB;">Qty</th>
              <th style="text-align: right; padding: 8px 0; color: #1F2937; border-bottom: 2px solid #E5E7EB;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 0; font-weight: 600; color: #1F2937;">Total</td>
              <td style="padding: 12px 0; font-weight: 600; color: #1F2937; text-align: right;">KSh ${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <a href="${trackingUrl}" style="display: inline-block; background: #16A34A; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Track Your Order
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          You can also track your order on WhatsApp. Questions? Reply to this email or reach us on WhatsApp.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send order confirmation:", error);
    return { error: error.message };
  }

  return { data };
}

interface SendOrderStatusUpdateParams {
  to: string;
  name: string;
  orderId: string;
  status: string;
  statusLabel: string;
  trackingUrl: string;
}

export async function sendOrderStatusUpdate({
  to,
  name,
  orderId,
  status,
  statusLabel,
  trackingUrl,
}: SendOrderStatusUpdateParams) {
  const statusColors: Record<string, string> = {
    confirmed: "#16A34A",
    out_for_delivery: "#F97316",
    delivered: "#059669",
    cancelled: "#EF4444",
  };

  const color = statusColors[status] ?? "#6B7280";

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Order #${orderId.slice(0, 8)} — ${statusLabel}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        ${emailHeader()}
        <h1 style="color: #1F2937; font-size: 24px; margin-bottom: 8px;">Order Update</h1>
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 24px;">Order #${orderId.slice(0, 8)}</p>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Hi ${name}, your order status has been updated:
        </p>
        <div style="background: #F9FAFB; border-left: 4px solid ${color}; padding: 16px; border-radius: 4px; margin: 24px 0;">
          <p style="color: ${color}; font-weight: 600; font-size: 18px; margin: 0;">${statusLabel}</p>
        </div>
        <a href="${trackingUrl}" style="display: inline-block; background: #16A34A; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Order Details
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          Questions? Reply to this email or reach us on WhatsApp.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send order status update:", error);
    return { error: error.message };
  }

  return { data };
}

// ── BNPL Invoice & Follow-up Emails ────────────────────────────

interface BnplInstallmentInfo {
  number: number;
  amount: number;
  dueDate: string;
}

interface SendBnplInvoiceEmailParams {
  to: string;
  retailerName: string;
  orderId: string;
  totalWithMarkup: number;
  downPayment: number;
  installments: BnplInstallmentInfo[];
  repName: string;
  repPhone: string;
}

/**
 * Send a BNPL invoice/payment schedule to the retailer.
 */
export async function sendBnplInvoiceEmail({
  to,
  retailerName,
  orderId,
  totalWithMarkup,
  downPayment,
  installments,
  repName,
  repPhone,
}: SendBnplInvoiceEmailParams) {
  const installmentsHtml = installments
    .map(
      (inst) =>
        `<tr>
          <td style="padding: 8px 12px; color: #4B5563; border-bottom: 1px solid #E5E7EB;">#${inst.number}</td>
          <td style="padding: 8px 12px; color: #1F2937; font-weight: 600; border-bottom: 1px solid #E5E7EB;">KSh ${inst.amount.toLocaleString()}</td>
          <td style="padding: 8px 12px; color: #4B5563; border-bottom: 1px solid #E5E7EB;">${new Date(inst.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
        </tr>`
    )
    .join("");

  const { data, error } = await resend.emails.send({
    from: ORDERS_EMAIL_FROM,
    to,
    subject: `BNPL Payment Schedule — Order #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        ${emailHeader()}
        <h1 style="color: #1F2937; font-size: 24px; margin-bottom: 8px;">Your Payment Schedule</h1>
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 24px;">Order #${orderId.slice(0, 8)} — Murabaha Financing</p>

        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Hi ${retailerName}, a Buy Now Pay Later plan has been set up for your order. Here's your payment schedule:
        </p>

        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #6B7280; padding: 4px 0;">Total (with markup)</td>
              <td style="color: #1F2937; font-weight: 600; padding: 4px 0; text-align: right;">KSh ${totalWithMarkup.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #6B7280; padding: 4px 0;">Down Payment (30%)</td>
              <td style="color: #16A34A; font-weight: 600; padding: 4px 0; text-align: right;">KSh ${downPayment.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <thead>
            <tr style="background: #F3F4F6;">
              <th style="text-align: left; padding: 8px 12px; color: #1F2937; font-size: 13px;">#</th>
              <th style="text-align: left; padding: 8px 12px; color: #1F2937; font-size: 13px;">Amount</th>
              <th style="text-align: left; padding: 8px 12px; color: #1F2937; font-size: 13px;">Due Date</th>
            </tr>
          </thead>
          <tbody>${installmentsHtml}</tbody>
        </table>

        <div style="background: #DCFCE7; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #15803D; font-size: 14px; margin: 0;">
            Please ensure payments are made on or before the due dates. Contact your sales rep ${repName} for any questions.
          </p>
        </div>

        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          Your sales rep: ${repName} · ${repPhone}
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send BNPL invoice email:", error);
    return { error: error.message };
  }

  return { data };
}

interface SendBnplFollowUpEmailParams {
  to: string;
  repName: string;
  retailerName: string;
  retailerPhone: string;
  orderId: string;
  totalWithMarkup: number;
  downPayment: number;
  installments: BnplInstallmentInfo[];
}

/**
 * Send a BNPL follow-up email to the sales rep with the payment schedule.
 */
export async function sendBnplFollowUpEmail({
  to,
  repName,
  retailerName,
  retailerPhone,
  orderId,
  totalWithMarkup,
  downPayment,
  installments,
}: SendBnplFollowUpEmailParams) {
  const installmentsHtml = installments
    .map(
      (inst) =>
        `<tr>
          <td style="padding: 8px 12px; color: #4B5563; border-bottom: 1px solid #E5E7EB;">#${inst.number}</td>
          <td style="padding: 8px 12px; color: #1F2937; font-weight: 600; border-bottom: 1px solid #E5E7EB;">KSh ${inst.amount.toLocaleString()}</td>
          <td style="padding: 8px 12px; color: #4B5563; border-bottom: 1px solid #E5E7EB;">${new Date(inst.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
        </tr>`
    )
    .join("");

  const { data, error } = await resend.emails.send({
    from: ORDERS_EMAIL_FROM,
    to,
    subject: `BNPL Follow-up: ${retailerName} — Order #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        ${emailHeader()}
        <h1 style="color: #1F2937; font-size: 24px; margin-bottom: 8px;">BNPL Plan Created</h1>
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 24px;">Order #${orderId.slice(0, 8)}</p>

        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Hi ${repName}, a Murabaha BNPL plan has been created for <strong>${retailerName}</strong> (${retailerPhone}). Below is the schedule for follow-up:
        </p>

        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #6B7280; padding: 4px 0;">Total (with markup)</td>
              <td style="color: #1F2937; font-weight: 600; padding: 4px 0; text-align: right;">KSh ${totalWithMarkup.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #6B7280; padding: 4px 0;">Down Payment (30%)</td>
              <td style="color: #16A34A; font-weight: 600; padding: 4px 0; text-align: right;">KSh ${downPayment.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <thead>
            <tr style="background: #F3F4F6;">
              <th style="text-align: left; padding: 8px 12px; color: #1F2937; font-size: 13px;">#</th>
              <th style="text-align: left; padding: 8px 12px; color: #1F2937; font-size: 13px;">Amount</th>
              <th style="text-align: left; padding: 8px 12px; color: #1F2937; font-size: 13px;">Due Date</th>
            </tr>
          </thead>
          <tbody>${installmentsHtml}</tbody>
        </table>

        <div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #92400E; font-size: 14px; margin: 0;">
            Remember to collect the 30% down payment (KSh ${downPayment.toLocaleString()}) before dispatching the order. Follow up with the retailer on each due date.
          </p>
        </div>

        <a href="${APP_URL}/sales-rep/dashboard" style="display: inline-block; background: #16A34A; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Dashboard
        </a>

        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          This is an automated notification from Ristoka.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send BNPL follow-up email:", error);
    return { error: error.message };
  }

  return { data };
}

interface SendBnplPaymentReceiptParams {
  to: string;
  retailerName: string;
  orderId: string;
  installmentNumber: number;
  amount: number;
  totalInstallments: number;
  remainingBalance: number;
  method: string;
}

/**
 * Send a payment receipt to the retailer after a BNPL installment is paid.
 */
export async function sendBnplPaymentReceipt({
  to,
  retailerName,
  orderId,
  installmentNumber,
  amount,
  totalInstallments,
  remainingBalance,
  method,
}: SendBnplPaymentReceiptParams) {
  const { data, error } = await resend.emails.send({
    from: ORDERS_EMAIL_FROM,
    to,
    subject: `Payment Received — Installment #${installmentNumber} — Order #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        ${emailHeader()}
        <h1 style="color: #1F2937; font-size: 24px; margin-bottom: 8px;">Payment Received ✓</h1>
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 24px;">Order #${orderId.slice(0, 8)}</p>

        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Hi ${retailerName}, we've received your installment payment. Thank you!
        </p>

        <div style="background: #DCFCE7; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #166534; padding: 4px 0;">Installment</td>
              <td style="color: #166534; font-weight: 600; padding: 4px 0; text-align: right;">#${installmentNumber} of ${totalInstallments}</td>
            </tr>
            <tr>
              <td style="color: #166534; padding: 4px 0;">Amount Paid</td>
              <td style="color: #166534; font-weight: 600; padding: 4px 0; text-align: right;">KSh ${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #166534; padding: 4px 0;">Method</td>
              <td style="color: #166534; padding: 4px 0; text-align: right; text-transform: capitalize;">${method === "mpesa" ? "M-Pesa" : method}</td>
            </tr>
            <tr>
              <td style="color: #166534; padding: 4px 0;">Remaining Balance</td>
              <td style="color: #166534; font-weight: 600; padding: 4px 0; text-align: right;">KSh ${remainingBalance.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        ${remainingBalance <= 0 ? `
        <div style="background: #F0FDF4; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0;">Fully Paid!</p>
          <p style="color: #15803D; font-size: 14px; margin: 8px 0 0;">All installments have been completed. Thank you for your business!</p>
        </div>
        ` : ""}

        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          Questions? Reach out to your sales rep or contact us on WhatsApp.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send BNPL payment receipt:", error);
    return { error: error.message };
  }

  return { data };
}

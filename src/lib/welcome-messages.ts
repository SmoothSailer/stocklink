/**
 * WhatsApp welcome message builders for admin onboarding flows.
 * These are plain functions (not server actions) so they can be used in client components.
 */

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ristoka.com";

export function buildSalesRepWelcome(rep: {
  name: string;
  whatsapp_phone: string;
  email?: string;
  password?: string;
}): string {
  const loginSection =
    rep.email && rep.password
      ? [
          "",
          "🔐 *Your Dashboard Login:*",
          `${siteUrl}/sales-rep/login`,
          `📧 *Email:* ${rep.email}`,
          `🔑 *Password:* ${rep.password}`,
          "",
          "⚠️ Please change your password after your first login. Keep these credentials private.",
        ]
      : [];

  return [
    `Hi ${rep.name}! 👋`,
    "",
    `Welcome to the *Ristoka* team! 🎉`,
    "",
    "You've been added as a Sales Representative. Retailers will reach you on WhatsApp to place orders for your assigned wholesalers.",
    "",
    "📋 *Your responsibilities:*",
    "• Receive and confirm orders from retailers via WhatsApp",
    "• Coordinate deliveries with the operations team",
    "• Maintain relationships with assigned wholesalers",
    "• Onboard new wholesalers and manage their inventory",
    "",
    `📱 *Your WhatsApp:* ${rep.whatsapp_phone}`,
    ...loginSection,
    "",
    `🔗 *Platform:* ${siteUrl}`,
    "",
    "💬 *Join our WhatsApp community:*",
    "https://chat.whatsapp.com/LgpPaEio4eSGx1gY0qq2Qb",
    "Stay updated with the team in the Ristoka Wholesale Hub group.",
    "",
    "If you have any questions, reach out to the admin team. Welcome aboard! 🤝",
  ].join("\n");
}

export function buildWholesalerWelcome(wholesaler: {
  id: string;
  name: string;
  sales_reps?: { name: string; whatsapp_phone: string } | null;
}): string {
  const inventoryLink = `${siteUrl}/wholesaler/${wholesaler.id}`;
  const repInfo = wholesaler.sales_reps
    ? [
        `👤 *Your Sales Rep:* ${wholesaler.sales_reps.name}`,
        `📱 *Rep WhatsApp:* ${wholesaler.sales_reps.whatsapp_phone}`,
        "",
        "Your sales rep will handle all retailer orders and coordinate with you on stock and deliveries.",
      ]
    : ["A sales representative will be assigned to you shortly."];

  return [
    `Hi ${wholesaler.name}! 👋`,
    "",
    `Welcome to *Ristoka*! 🎉`,
    "",
    "We're excited to have you as a wholesale partner on our platform. Retailers across Kenya will be able to discover and order your products.",
    "",
    ...repInfo,
    "",
    "📦 *Your Inventory Dashboard:*",
    inventoryLink,
    "",
    "Use this link to view your product listings, stock levels, and pending orders at any time. Save it or bookmark it!",
    "",
    "The admin team manages your inventory on the platform. If you need stock updates, price changes, or new products added — just reach out to your sales rep.",
    "",
    "💬 *Join our WhatsApp community:*",
    "https://chat.whatsapp.com/LgpPaEio4eSGx1gY0qq2Qb",
    "Connect with the Ristoka Wholesale Hub for updates and support.",
    "",
    "Welcome to the Ristoka family! 🤝",
  ].join("\n");
}

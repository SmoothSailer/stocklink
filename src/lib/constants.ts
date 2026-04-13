// App-wide constants

export const APP_NAME = "Ristoka";
export const APP_DESCRIPTION =
  "Wholesale supply made easy — connecting wholesalers and retailers";

// WhatsApp
export const WHATSAPP_BASE_URL = "https://wa.me";
export const WHATSAPP_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "254720971904";

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_QUANTITY = 999;

// Product categories
export const PRODUCT_CATEGORIES = [
  { label: "Rice", value: "rice", icon: "🍚" },
  { label: "Oil", value: "oil", icon: "🫒" },
  { label: "Sugar", value: "sugar", icon: "🍬" },
  { label: "Flour", value: "flour", icon: "🌾" },
  { label: "LPG Gas", value: "lpg", icon: "🔥" },
  { label: "Beverages", value: "beverages", icon: "🥤" },
  { label: "Dairy", value: "dairy", icon: "🥛" },
  { label: "Cleaning", value: "cleaning", icon: "🧴" },
] as const;

// Order statuses
export const ORDER_STATUSES = {
  placed: { label: "Order Placed", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-800",
  },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
} as const;

// Payment methods
export const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa", icon: "📱" },
  { value: "cash", label: "Cash on Delivery", icon: "💵" },
  { value: "bnpl", label: "BNPL (Murabaha)", icon: "🕌" },
  { value: "card", label: "Card Payment", icon: "💳" },
] as const;

// Payment statuses
export const PAYMENT_STATUSES = {
  pending: { label: "Unpaid", color: "bg-yellow-100 text-yellow-800" },
  partial: { label: "Partial", color: "bg-orange-100 text-orange-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
} as const;

// Price formatting
export const CURRENCY = "KSh";
export const CURRENCY_LOCALE = "en-KE";

// Affiliate program
export const AFFILIATE_COMMISSION_RATE = 0.02; // 2% commission
export const AFFILIATE_COOKIE_NAME = "sl_ref";
export const AFFILIATE_COOKIE_DAYS = 30; // referral attribution window

// Admin
export const ADMIN_EMAILS: string[] = [
  "admin@stocklink.co",
  "farhan@stocklink.co",
  // Add authorized admin emails here
];

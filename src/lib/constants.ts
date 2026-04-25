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

// Shipment statuses
export const SHIPMENT_STATUSES = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: "📝" },
  booked: { label: "Booked", color: "bg-blue-100 text-blue-800", icon: "📋" },
  in_production: { label: "In Production", color: "bg-purple-100 text-purple-800", icon: "🏭" },
  ready_for_shipping: { label: "Ready for Shipping", color: "bg-indigo-100 text-indigo-800", icon: "📦" },
  in_transit: { label: "In Transit", color: "bg-cyan-100 text-cyan-800", icon: "🚢" },
  at_port: { label: "At Port", color: "bg-teal-100 text-teal-800", icon: "⚓" },
  customs_clearance: { label: "Customs Clearance", color: "bg-amber-100 text-amber-800", icon: "🛃" },
  inland_transit: { label: "Inland Transit", color: "bg-orange-100 text-orange-800", icon: "🚛" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: "✅" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: "❌" },
} as const;

// Shipping methods
export const SHIPPING_METHODS = [
  { value: "sea", label: "Sea Freight", icon: "🚢" },
  { value: "air", label: "Air Freight", icon: "✈️" },
  { value: "road", label: "Road Transport", icon: "🚛" },
] as const;

// Container types
export const CONTAINER_TYPES = [
  { value: "20ft", label: "20ft Standard" },
  { value: "40ft", label: "40ft Standard" },
  { value: "40ft_hc", label: "40ft High Cube" },
  { value: "lcl", label: "LCL (Less than Container)" },
] as const;

// Incoterms
export const INCOTERMS = [
  { value: "FOB", label: "FOB — Free on Board" },
  { value: "CIF", label: "CIF — Cost, Insurance & Freight" },
  { value: "EXW", label: "EXW — Ex Works" },
  { value: "DDP", label: "DDP — Delivered Duty Paid" },
  { value: "CFR", label: "CFR — Cost & Freight" },
  { value: "FCA", label: "FCA — Free Carrier" },
] as const;

// Currencies
export const CURRENCIES = [
  { value: "KES", label: "KES — Kenyan Shilling", symbol: "KSh" },
  { value: "USD", label: "USD — US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR — Euro", symbol: "€" },
  { value: "GBP", label: "GBP — British Pound", symbol: "£" },
  { value: "CNY", label: "CNY — Chinese Yuan", symbol: "¥" },
  { value: "AED", label: "AED — UAE Dirham", symbol: "د.إ" },
  { value: "TRY", label: "TRY — Turkish Lira", symbol: "₺" },
  { value: "INR", label: "INR — Indian Rupee", symbol: "₹" },
] as const;

// Countries (common trading partners)
export const COUNTRIES = [
  { value: "KE", label: "Kenya", flag: "🇰🇪" },
  { value: "CN", label: "China", flag: "🇨🇳" },
  { value: "AE", label: "UAE", flag: "🇦🇪" },
  { value: "TR", label: "Turkey", flag: "🇹🇷" },
  { value: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { value: "US", label: "United States", flag: "🇺🇸" },
  { value: "IN", label: "India", flag: "🇮🇳" },
  { value: "DE", label: "Germany", flag: "🇩🇪" },
  { value: "TZ", label: "Tanzania", flag: "🇹🇿" },
  { value: "UG", label: "Uganda", flag: "🇺🇬" },
  { value: "EG", label: "Egypt", flag: "🇪🇬" },
  { value: "ZA", label: "South Africa", flag: "🇿🇦" },
  { value: "SA", label: "Saudi Arabia", flag: "🇸🇦" },
  { value: "JP", label: "Japan", flag: "🇯🇵" },
  { value: "TH", label: "Thailand", flag: "🇹🇭" },
  { value: "MY", label: "Malaysia", flag: "🇲🇾" },
  { value: "ID", label: "Indonesia", flag: "🇮🇩" },
  { value: "BR", label: "Brazil", flag: "🇧🇷" },
  { value: "IT", label: "Italy", flag: "🇮🇹" },
  { value: "PK", label: "Pakistan", flag: "🇵🇰" },
] as const;

// Admin
export const ADMIN_EMAILS: string[] = [
  "admin@stocklink.co",
  "farhan@stocklink.co",
  // Add authorized admin emails here
];

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY, WHATSAPP_BASE_URL, WHATSAPP_PHONE, PRODUCT_CATEGORIES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as KSh currency string */
export function formatPrice(price: number): string {
  return `${CURRENCY} ${price.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/** Build a WhatsApp deep link with pre-filled message */
export function buildWhatsAppLink(message: string, phone?: string): string {
  const encodedMessage = encodeURIComponent(message);
  const target = phone ?? WHATSAPP_PHONE;
  return `${WHATSAPP_BASE_URL}/${target}?text=${encodedMessage}`;
}

/** Get a human-readable relative time string */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
  });
}

/** Calculate countdown string from an expiry date */
export function getCountdown(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/** Generate stock badge info */
export function getStockInfo(stock: number, unit?: string): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const u = unit ? ` ${unit}s` : "";
  if (stock <= 0) return { label: "Out of Stock", variant: "destructive" };
  if (stock <= 20) return { label: `Only ${stock}${u} left`, variant: "secondary" };
  return { label: `${stock}${u} available`, variant: "default" };
}

/** Get category emoji icon by slug, with fallback */
export function getCategoryIcon(category: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.value === category)?.icon ?? "📦";
}


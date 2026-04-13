"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface WhatsAppButtonProps {
  message: string;
  phone?: string;
  label?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
  variant?: "whatsapp" | "outline";
}

export function WhatsAppButton({
  message,
  phone,
  label = "Order via WhatsApp",
  size = "lg",
  className,
  variant = "whatsapp",
}: WhatsAppButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const href = buildWhatsAppLink(message, phone);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      router.push("/login?next=" + encodeURIComponent(window.location.pathname + window.location.search));
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        buttonVariants({
          variant: variant === "outline" ? "outline" : "default",
          size,
        }),
        "gap-2 font-semibold",
        variant === "whatsapp" &&
          "bg-[#25D366] text-white shadow-md hover:bg-[#128C7E]",
        variant === "outline" &&
          "border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10",
        className
      )}
    >
      <MessageCircle className="h-5 w-5" />
      {label}
    </a>
  );
}

"use client";

import { useState } from "react";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  buildUrl: (url: string, text: string) => string;
}

const PLATFORMS: SocialPlatform[] = [
  {
    name: "WhatsApp",
    icon: "💬",
    color: "bg-[#25D366] hover:bg-[#128C7E]",
    buildUrl: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    name: "TikTok",
    icon: "🎵",
    color: "bg-black hover:bg-gray-800",
    buildUrl: (url, _text) =>
      // TikTok doesn't have a direct share URL — copy link for bio, open TikTok
      `https://www.tiktok.com/@stocklink?link=${encodeURIComponent(url)}`,
  },
  {
    name: "X / Twitter",
    icon: "𝕏",
    color: "bg-black hover:bg-gray-800",
    buildUrl: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    icon: "📘",
    color: "bg-[#1877F2] hover:bg-[#0d65d9]",
    buildUrl: (url, _text) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "Telegram",
    icon: "✈️",
    color: "bg-[#0088cc] hover:bg-[#006699]",
    buildUrl: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: "Instagram",
    icon: "📷",
    color: "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    buildUrl: (url, _text) =>
      // Instagram doesn't support direct sharing — copy link for stories/bio
      `https://www.instagram.com/?url=${encodeURIComponent(url)}`,
  },
];

interface AffiliateShareProps {
  referralUrl: string;
  affiliateCode: string;
}

export function AffiliateShare({
  referralUrl,
  affiliateCode,
}: AffiliateShareProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Shop wholesale prices on StockLink! Use my referral link to get started 👇`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: SocialPlatform) => {
    const url = platform.buildUrl(referralUrl, shareText);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join StockLink",
          text: shareText,
          url: referralUrl,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral link + copy */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Your Referral Link
          </p>
          <p className="truncate text-sm font-mono text-foreground">
            {referralUrl}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      {/* Affiliate code */}
      <p className="text-center text-xs text-muted-foreground">
        Your code: <span className="font-mono font-bold text-foreground">{affiliateCode}</span>
      </p>

      {/* Social share buttons */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.name}
            type="button"
            onClick={() => handleShare(platform)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-white transition-transform active:scale-95",
              platform.color
            )}
          >
            <span className="text-xl">{platform.icon}</span>
            <span className="text-[10px] font-medium leading-none">
              {platform.name}
            </span>
          </button>
        ))}
      </div>

      {/* Native share (mobile) */}
      {"share" in navigator && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleNativeShare}
        >
          <Share2 className="h-4 w-4" />
          Share via...
        </Button>
      )}

      {/* TikTok tip */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <span className="text-lg">🎵</span>
          <div>
            <p className="text-xs font-semibold">TikTok Tip</p>
            <p className="text-xs text-muted-foreground">
              Copy your referral link and add it to your TikTok bio, or mention
              your code <span className="font-mono font-bold">{affiliateCode}</span>{" "}
              in your videos.
            </p>
          </div>
        </div>
      </div>

      {/* Share specific product links */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-semibold">Share Product Links</p>
            <p className="text-xs text-muted-foreground">
              Add <span className="font-mono">?ref={affiliateCode}</span> to any
              product page URL to earn commission on that specific product.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

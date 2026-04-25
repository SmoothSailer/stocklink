"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Bell,
  BellOff,
  Clock,
  Users,
  Hash,
  Package,
  MessageSquare,
  Share2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QuantitySelector } from "@/components/retailer/quantity-selector";
import { joinWaitlist, leaveWaitlist } from "@/app/(retailer)/actions";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface WaitlistCardProps {
  productId: string;
  productName: string;
  expectedArrivalDate: string | null;
  minOrderQty: number;
  isOnWaitlist: boolean;
  totalWaiters: number;
  totalQuantityDemand: number;
  position: number | null;
  myEntry: { quantity_interested: number; notes: string | null; created_at: string } | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const target = new Date(targetDate + "T00:00:00").getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.total <= 0) {
    return (
      <div className="rounded-xl bg-primary/10 p-3 text-center">
        <p className="text-sm font-bold text-primary">🎉 Arriving any moment now!</p>
      </div>
    );
  }

  const blocks = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hrs" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-accent" />
        Expected Arrival
      </div>
      <div className="grid grid-cols-4 gap-2">
        {blocks.map((block) => (
          <div
            key={block.label}
            className="rounded-lg bg-accent/10 p-2 text-center"
          >
            <p className="text-lg font-bold tabular-nums text-accent">
              {String(block.value).padStart(2, "0")}
            </p>
            <p className="text-[10px] font-medium uppercase text-muted-foreground">
              {block.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemandMeter({ totalWaiters, totalDemand, unit }: { totalWaiters: number; totalDemand: number; unit?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-border/60 p-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-lg font-bold text-foreground">{totalWaiters}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Retailers waiting</p>
      </div>
      <div className="rounded-lg border border-border/60 p-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-accent" />
          <span className="text-lg font-bold text-foreground">{totalDemand}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Units demanded</p>
      </div>
    </div>
  );
}

export function WaitlistCard({
  productId,
  productName,
  expectedArrivalDate,
  minOrderQty,
  isOnWaitlist: initialIsOnWaitlist,
  totalWaiters: initialTotalWaiters,
  totalQuantityDemand: initialTotalDemand,
  position: initialPosition,
  myEntry,
}: WaitlistCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOnWaitlist, setIsOnWaitlist] = useState(initialIsOnWaitlist);
  const [totalWaiters, setTotalWaiters] = useState(initialTotalWaiters);
  const [totalDemand, setTotalDemand] = useState(initialTotalDemand);
  const [position, setPosition] = useState(initialPosition);
  const [quantity, setQuantity] = useState(myEntry?.quantity_interested ?? minOrderQty);
  const [notes, setNotes] = useState(myEntry?.notes ?? "");
  const [currentEntry, setCurrentEntry] = useState(myEntry);
  const [showNotes, setShowNotes] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleJoin = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/products/${productId}`)}`);
      return;
    }

    const wasUpdating = isUpdating;
    startTransition(async () => {
      const { error } = await joinWaitlist(productId, quantity, notes || undefined);
      if (!error) {
        setIsOnWaitlist(true);
        if (!initialIsOnWaitlist) {
          setTotalWaiters((prev) => prev + 1);
          setPosition(initialTotalWaiters + 1);
        }
        setTotalDemand((prev) => prev - (currentEntry?.quantity_interested ?? 0) + quantity);
        setCurrentEntry({
          quantity_interested: quantity,
          notes: notes || null,
          created_at: currentEntry?.created_at ?? new Date().toISOString(),
        });
        setShowSuccess(true);
        setSuccessMessage(wasUpdating ? "Waitlist updated!" : "You're on the list!");
        setIsUpdating(false);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    });
  };

  function handleLeave() {
    startTransition(async () => {
      const { error } = await leaveWaitlist(productId);
      if (!error) {
        setIsOnWaitlist(false);
        setTotalWaiters((prev) => Math.max(0, prev - 1));
        setTotalDemand((prev) => Math.max(0, prev - quantity));
        setPosition(null);
        setIsUpdating(false);
      }
    });
  }

  function handleShare() {
    const text = `🔔 ${productName} is coming soon on Ristoka! Join the waitlist to be first in line.`;
    const url = `${window.location.origin}/products/${productId}`;
    if (navigator.share) {
      navigator.share({ title: productName, text, url }).catch(() => {});
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`;
      window.open(waUrl, "_blank");
    }
  }

  const joinedDate = currentEntry?.created_at
    ? new Date(currentEntry.created_at).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-orange-50 to-amber-50/50">
      <CardContent className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-bold text-foreground">Coming Soon</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Be the first to know when it drops
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleShare}>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Countdown timer */}
        {expectedArrivalDate && (
          <CountdownTimer targetDate={expectedArrivalDate} />
        )}

        {/* Demand meter */}
        <DemandMeter
          totalWaiters={totalWaiters}
          totalDemand={totalDemand}
        />

        {/* Success animation */}
        {showSuccess && (
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-sm font-medium text-primary">
              🎉 {successMessage} We'll notify you when it's available.
            </p>
          </div>
        )}

        {isOnWaitlist && !isUpdating ? (
          /* ─── On Waitlist: Show status ─── */
          <div className="space-y-3">
            {/* Position card */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    #{position ?? "—"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Your Position</p>
                    <p className="text-[10px] text-muted-foreground">
                      Joined {joinedDate}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-[10px]">
                  <Bell className="h-3 w-3" />
                  Notifications ON
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-primary/10">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {currentEntry?.quantity_interested ?? quantity} units requested
                </span>
                {currentEntry?.notes && (
                  <span className="flex items-center gap-1 truncate">
                    <MessageSquare className="h-3 w-3" />
                    {currentEntry.notes}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setIsUpdating(true)}
              >
                Update Quantity
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleLeave}
                disabled={isPending}
              >
                <BellOff className="mr-1 h-3.5 w-3.5" />
                Leave
              </Button>
            </div>
          </div>
        ) : (
          /* ─── Join form ─── */
          <div className="space-y-3">
            {/* Quantity */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">How many do you need?</p>
                <p className="text-[10px] text-muted-foreground">
                  Helps us plan stock levels
                </p>
              </div>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={minOrderQty}
                max={999}
              />
            </div>

            {/* Notes toggle */}
            <button
              type="button"
              className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowNotes(!showNotes)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Add a note (optional)
              {showNotes ? (
                <ChevronUp className="ml-auto h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="ml-auto h-3.5 w-3.5" />
              )}
            </button>

            {showNotes && (
              <Input
                placeholder="e.g. Need 6kg size,"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
                maxLength={200}
              />
            )}

            {/* CTA */}
            <Button
              size="lg"
              className="w-full gap-2 bg-accent font-semibold text-accent-foreground shadow-md hover:bg-accent/90"
              onClick={handleJoin}
              disabled={isPending}
            >
              <Bell className="h-5 w-5" />
              {isPending
                ? "Joining..."
                : isUpdating
                  ? "Update Waitlist"
                  : "Join Waiting List"}
            </Button>

            {isUpdating && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setIsUpdating(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

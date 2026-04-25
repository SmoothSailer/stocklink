"use client";

import { SHIPMENT_STATUSES } from "@/lib/constants";
import type { ShipmentStatusHistory } from "@/types/database";

interface ShipmentTimelineProps {
  history: ShipmentStatusHistory[];
  currentStatus: string;
}

const statusOrder = [
  "draft",
  "booked",
  "in_production",
  "ready_for_shipping",
  "in_transit",
  "at_port",
  "customs_clearance",
  "inland_transit",
  "delivered",
] as const;

export function ShipmentTimeline({ history, currentStatus }: ShipmentTimelineProps) {
  const completedStatuses = new Set(history.map((h) => h.status));

  return (
    <div className="space-y-0">
      {statusOrder.map((status, idx) => {
        const entry = history.find((h) => h.status === status);
        const isCurrent = status === currentStatus;
        const isCompleted = completedStatuses.has(status);
        const isCancelled = currentStatus === "cancelled";
        const info = SHIPMENT_STATUSES[status];
        const isLast = idx === statusOrder.length - 1;

        return (
          <div key={status} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {info.icon}
              </div>
              {!isLast && (
                <div
                  className={`h-8 w-0.5 ${
                    isCompleted ? "bg-primary/30" : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 ${!isCompleted && !isCurrent ? "opacity-40" : ""}`}>
              <p
                className={`text-sm font-medium ${
                  isCurrent ? "text-primary" : "text-foreground"
                }`}
              >
                {info.label}
              </p>
              {entry && (
                <div className="mt-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {entry.location && (
                    <p className="text-[10px] text-muted-foreground">
                      📍 {entry.location}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Show cancelled separately if applicable */}
      {currentStatus === "cancelled" && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-sm">
              ❌
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">Cancelled</p>
            {history
              .filter((h) => h.status === "cancelled")
              .map((entry) => (
                <div key={entry.id} className="mt-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

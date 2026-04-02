import {
  Package,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
} from "lucide-react";
import type { OrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

const steps: {
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { status: "placed", label: "Order Placed", icon: Package },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { status: "delivered", label: "Delivered", icon: PackageCheck },
];

const statusOrder: Record<OrderStatus, number> = {
  placed: 0,
  confirmed: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

export function OrderTimeline({
  currentStatus,
  createdAt,
  updatedAt,
}: OrderTimelineProps) {
  const currentIndex = statusOrder[currentStatus];

  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
        <XCircle className="h-6 w-6 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">Order Cancelled</p>
          <p className="text-sm text-muted-foreground">
            {new Date(updatedAt).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;
        const Icon = step.icon;

        return (
          <div key={step.status} className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-8 w-0.5",
                    isCompleted && index < currentIndex
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(
                    index === 0 ? createdAt : updatedAt
                  ).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

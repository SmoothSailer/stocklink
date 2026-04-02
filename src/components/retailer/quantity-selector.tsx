"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_QUANTITY } from "@/lib/constants";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = MAX_QUANTITY,
}: QuantitySelectorProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <span className="min-w-[40px] text-center text-lg font-bold tabular-nums">
        {value}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

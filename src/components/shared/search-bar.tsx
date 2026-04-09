"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchBar({
  placeholder = "Search rice, oil, sugar...",
  value,
  onChange,
}: SearchBarProps) {
  const router = useRouter();
  const [localValue, setLocalValue] = useState("");
  const isControlled = value !== undefined && onChange !== undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = isControlled ? value : localValue;
    if (q.trim()) {
      router.push(`/products?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={isControlled ? value : localValue}
        onChange={(e) =>
          isControlled
            ? onChange(e.target.value)
            : setLocalValue(e.target.value)
        }
        className="h-11 rounded-full border-border bg-card pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-primary"
      />
    </form>
  );
}

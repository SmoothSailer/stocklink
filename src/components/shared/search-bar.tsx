"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-11 rounded-full border-border bg-card pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-primary"
      />
    </div>
  );
}

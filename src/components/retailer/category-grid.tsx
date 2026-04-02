import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
      {PRODUCT_CATEGORIES.map((cat) => (
        <Link
          key={cat.value}
          href={`/products?category=${cat.value}`}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-card p-3 shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-xs font-medium text-foreground">
            {cat.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

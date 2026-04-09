import Link from "next/link";
import type { Category } from "@/types/database";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/products?category=${cat.slug}`}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-card p-3 shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-xs font-medium text-foreground">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

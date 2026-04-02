import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-11 w-full rounded-full" />

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

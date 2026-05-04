import { Skeleton } from "@/components/ui/skeleton";

/** Top-level loading state displayed while the dashboard shell is streaming. */
export default function Loading() {
  return (
    <div className="container flex flex-col gap-8 py-12">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-12 w-3/4 max-w-2xl" />
      <Skeleton className="h-5 w-2/3 max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

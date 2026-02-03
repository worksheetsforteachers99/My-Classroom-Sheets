import Skeleton from "@/components/ui/Skeleton";
import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";

export default function ProductsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`filter-group-${idx}`} className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((__, itemIdx) => (
                    <Skeleton
                      key={`filter-item-${idx}-${itemIdx}`}
                      className="h-4 w-40"
                    />
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>

            <ProductGridSkeleton count={12} />

            <div className="flex justify-center pt-4">
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

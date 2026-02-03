import Skeleton from "@/components/ui/Skeleton";
import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";

export default function ProductDetailSkeleton() {
  return (
    <div className="bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14">
        <Skeleton className="h-4 w-40" />

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <div className="flex gap-3">
              {Array.from({ length: 2 }).map((_, idx) => (
                <Skeleton
                  key={`thumb-skel-${idx}`}
                  className="h-16 w-16 rounded-xl"
                />
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, idx) => (
                <Skeleton
                  key={`meta-skel-${idx}`}
                  className="h-20 rounded-xl"
                />
              ))}
            </div>

            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        <section className="mt-12 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <Skeleton className="h-6 w-52" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-4 w-2/3" />
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <Skeleton className="h-6 w-48" />
          <ProductGridSkeleton count={4} className="lg:grid-cols-4" />
        </section>
      </div>
    </div>
  );
}

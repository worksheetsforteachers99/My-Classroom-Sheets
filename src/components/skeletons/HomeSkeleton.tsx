import Skeleton from "@/components/ui/Skeleton";
import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div className="flex flex-col justify-center gap-6">
          <Skeleton className="h-10 w-3/4 rounded-lg md:h-12" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-12 w-44 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>

        <div className="relative">
          <Skeleton className="h-72 w-full rounded-3xl md:h-96" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <Skeleton className="mb-6 h-6 w-56" />
        <ProductGridSkeleton count={10} className="md:grid-cols-3 xl:grid-cols-5" />
      </section>
    </div>
  );
}

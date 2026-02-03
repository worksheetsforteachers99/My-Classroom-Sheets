export default function AdminProductsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-200" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-56 rounded-lg bg-slate-200" />
          <div className="h-10 w-40 rounded-lg bg-slate-200" />
          <div className="h-10 w-40 rounded-lg bg-slate-200" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="h-10 w-full bg-gray-50" />
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={`row-skel-${idx}`} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-4 rounded bg-slate-200" />
              <div className="h-12 w-12 rounded-lg bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="ml-auto h-8 w-24 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

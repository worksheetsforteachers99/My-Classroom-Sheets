export default function ProductDetailsLoading() {
  return (
    <div className="bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14">
        <div className="h-4 w-40 rounded bg-slate-200" />

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200" />
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`thumb-${idx}`}
                  className="h-16 w-16 rounded-xl bg-slate-200"
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-8 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-200" />
              <div className="h-4 w-5/6 rounded bg-slate-200" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`meta-${idx}`}
                  className="h-20 rounded-xl bg-slate-200"
                />
              ))}
            </div>
            <div className="h-12 w-full rounded-xl bg-slate-200" />
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="h-48 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

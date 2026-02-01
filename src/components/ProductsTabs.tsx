"use client";

type ProductsTabsProps = {
  worksheetsCount: number;
  bundlesCount?: number;
};

export default function ProductsTabs({ worksheetsCount, bundlesCount = 0 }: ProductsTabsProps) {
  return (
    <div className="flex items-center gap-8 text-sm">
      <div className="border-b-2 border-slate-900 pb-2 font-semibold text-slate-900">
        Worksheets ({worksheetsCount})
      </div>
      <div className="pb-2 text-slate-500">Bundles ({bundlesCount})</div>
    </div>
  );
}

"use client";

type ProductsTabsProps = {
  activeTab: "worksheets" | "bundles";
  worksheetsCount: number;
  bundlesCount: number;
  onTabChange: (tab: "worksheets" | "bundles") => void;
};

export default function ProductsTabs({
  activeTab,
  worksheetsCount,
  bundlesCount,
  onTabChange,
}: ProductsTabsProps) {
  const tabClass = (tab: "worksheets" | "bundles") =>
    activeTab === tab
      ? "border-b-2 border-slate-900 pb-2 font-semibold text-slate-900"
      : "pb-2 text-slate-500 hover:text-slate-700";

  return (
    <div className="flex items-center gap-8 text-sm">
      <button type="button" className={tabClass("worksheets")} onClick={() => onTabChange("worksheets")}>
        Worksheets ({worksheetsCount})
      </button>
      <button type="button" className={tabClass("bundles")} onClick={() => onTabChange("bundles")}>
        Bundles ({bundlesCount})
      </button>
    </div>
  );
}

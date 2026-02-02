"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductsTabs from "@/components/ProductsTabs";
import ProductsGrid from "@/components/ProductsGrid";

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [totalCount, setTotalCount] = useState(0);
  const [bundleCount, setBundleCount] = useState(0);

  const tab = useMemo(() => {
    const raw = searchParams.get("tab");
    return raw === "bundles" ? "bundles" : "worksheets";
  }, [searchParams]);

  const handleTabChange = (nextTab: "worksheets" | "bundles") => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "worksheets") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Browse Resources</h1>
        <ProductsTabs
          activeTab={tab}
          worksheetsCount={totalCount}
          bundlesCount={bundleCount}
          onTabChange={handleTabChange}
        />
      </div>

      <div className="mt-6">
        <ProductsGrid
          tab={tab}
          onWorksheetCountChange={setTotalCount}
          onBundleCountChange={setBundleCount}
        />
      </div>
    </div>
  );
}

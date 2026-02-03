import { Suspense } from "react";
import ProductsPageClient from "@/components/products/ProductsPageClient";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ProductsPageClient />
    </Suspense>
  );
}

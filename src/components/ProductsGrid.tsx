"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import ProductCard from "@/components/ProductCard";
import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";
import GatedDownloadButton from "@/components/products/GatedDownloadButton";

type Product = {
  id: string;
  title: string;
  slug: string;
  cover_image_path: string | null;
  pdf_path: string | null;
  price_cents?: number | null;
  currency?: string | null;
  created_at: string;
  updated_at?: string | null;
  coverUrl?: string | null;
};

type Bundle = {
  id: string;
  title: string;
  description?: string | null;
};

type ProductsGridProps = {
  tab: "worksheets" | "bundles";
  onWorksheetCountChange: (count: number) => void;
  onBundleCountChange: (count: number) => void;
};

const PAGE_SIZE = 20;
const GROUP_KEYS = ["type", "grade-level", "subject", "framework"] as const;

const parseList = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export default function ProductsGrid({
  tab,
  onWorksheetCountChange,
  onBundleCountChange,
}: ProductsGridProps) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const requestIdRef = useRef(0);
  const filters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return {
      type: parseList(params.get("type")),
      "grade-level": parseList(params.get("grade-level")),
      subject: parseList(params.get("subject")),
      framework: parseList(params.get("framework")),
    };
  }, [searchParams]);
  const queryText = useMemo(
    () => searchParams.get("q")?.trim() ?? "",
    [searchParams]
  );

  const filtersKey = useMemo(
    () =>
      `${GROUP_KEYS.map((key) => (filters[key] ?? []).join(",")).join("|")}::${queryText}`,
    [filters, queryText]
  );

  const statusFilter = "published";
  const isActiveFilter = true;

  const withCoverUrls = useCallback(
    (rows: Product[]) => {
      return rows.map((p) => {
        if (!p.cover_image_path) return { ...p, coverUrl: null };
        const cleanPath = p.cover_image_path.replace(/^\/+/, "");
        const { data: urlData } = supabase.storage
          .from("product-covers")
          .getPublicUrl(cleanPath);
        const publicUrl = urlData.publicUrl;
        const cacheBust = p.updated_at ?? p.id;
        return { ...p, coverUrl: publicUrl ? `${publicUrl}?v=${cacheBust}` : null };
      });
    },
    [supabase]
  );

  const fetchProducts = useCallback(
    async (nextPage: number, reset: boolean) => {
      const requestId = ++requestIdRef.current;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const from = nextPage * PAGE_SIZE;
        const params = new URLSearchParams();
        params.set("page", String(nextPage));
        params.set("pageSize", String(PAGE_SIZE));
        params.set("status", statusFilter);
        params.set("is_active", isActiveFilter ? "true" : "false");

        for (const [key, vals] of Object.entries(filters)) {
          if (vals.length > 0) {
            params.set(key, vals.join(","));
          }
        }
        if (queryText) {
          params.set("q", queryText);
        }

        const res = await fetch(`/api/products?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error ?? "Failed to load products");
        }

        if (requestId !== requestIdRef.current) return;

        const total = Number(json?.count ?? 0);
        const rows = (json?.products ?? []) as Product[];

        onWorksheetCountChange(total);
        const nextItems = withCoverUrls(rows);
        setProducts((prev) => (reset ? nextItems : [...prev, ...nextItems]));
        setHasMore(from + nextItems.length < total);
      } catch (err: any) {
        setError(err.message ?? "Failed to load products");
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, onWorksheetCountChange, statusFilter, isActiveFilter, withCoverUrls, queryText]
  );

  useEffect(() => {
    if (tab !== "worksheets") return;
    setPage(0);
    fetchProducts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, tab]);

  useEffect(() => {
    if (tab !== "worksheets") return;
    if (page === 0) return;
    fetchProducts(page, false);
  }, [page, fetchProducts]);

  useEffect(() => {
    if (tab !== "bundles") return;
    requestIdRef.current += 1;
    setLoading(true);
    setError(null);
    setHasMore(false);
    setProducts([]);
    setBundles([]);
    onBundleCountChange(0);
    setLoadingMore(false);
    setLoading(false);
  }, [tab, onBundleCountChange]);

  if (error) return <div className="text-red-600">Error: {error}</div>;

  const showLoading = loading && tab === "worksheets";

  return (
    <div>
      {showLoading ? (
        <ProductGridSkeleton count={8} />
      ) : tab === "bundles" ? (
        bundles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                </svg>
              </div>
              <div className="text-base font-semibold text-slate-900">No bundles yet</div>
              <div className="text-sm text-slate-600">
                Bundles will appear here once you create them.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="flex h-[360px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="text-lg font-semibold text-slate-900">{bundle.title}</div>
                  {bundle.description ? (
                    <div className="mt-2 text-sm text-slate-600">{bundle.description}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  View bundle
                </button>
              </div>
            ))}
          </div>
        )
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          {queryText ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>No results for “{queryText}”.</div>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("q");
                  const next = params.toString();
                  router.replace(next ? `${pathname}?${next}` : pathname, {
                    scroll: false,
                  });
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear search
              </button>
            </div>
          ) : Object.values(filters).some((vals) => vals.length > 0) ? (
            "No products match your filters."
          ) : (
            "No published resources yet. Publish a product in admin to show it here."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                slug={p.slug}
                coverUrl={p.coverUrl ?? null}
                priceCents={p.price_cents ?? null}
                currency={p.currency ?? null}
                actionElement={
                  <GatedDownloadButton
                    productId={p.id}
                    slug={p.slug}
                    pdfPath={p.pdf_path}
                    title={p.title}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                  />
                }
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={loadingMore}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "See more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

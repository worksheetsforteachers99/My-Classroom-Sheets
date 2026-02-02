"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import ProductCard from "@/components/ProductCard";
import { downloadProductPdf } from "@/lib/downloads/downloadProductPdf";

type Product = {
  id: string;
  title: string;
  slug: string;
  cover_image_path: string | null;
  pdf_path: string | null;
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
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
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

  const filtersKey = useMemo(
    () => GROUP_KEYS.map((key) => (filters[key] ?? []).join(",")).join("|"),
    [filters]
  );

  const withCoverUrls = useCallback(
    (rows: Product[]) => {
      return rows.map((p) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[product-cover-debug]", p);
        }
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

  const fetchMatchedIds = useCallback(async () => {
    const activeGroups = Object.entries(filters).filter(([, vals]) => vals.length > 0);
    if (activeGroups.length === 0) return null;

    let current: Set<string> | null = null;

    for (const [, vals] of activeGroups) {
      const { data, error: ptErr } = await supabase
        .from("product_tags")
        .select("product_id, tag_id")
        .in("tag_id", vals);

      if (ptErr) throw ptErr;

      const ids = new Set((data ?? []).map((row) => row.product_id));
      if (ids.size === 0) return [];

      if (current === null) {
        current = ids;
      } else {
        current = new Set([...current].filter((id) => ids.has(id)));
      }
    }

    return current ? Array.from(current) : null;
  }, [filters, supabase]);

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
        const matchedIds = await fetchMatchedIds();
        if (requestId !== requestIdRef.current) return;

        if (matchedIds && matchedIds.length === 0) {
          setProducts([]);
          onWorksheetCountChange(0);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        let countQuery = supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("status", "published");

        if (matchedIds) {
          countQuery = countQuery.in("id", matchedIds);
        }

        const { count, error: countErr } = await countQuery;
        if (countErr) throw countErr;
        if (requestId !== requestIdRef.current) return;

        const total = count ?? 0;
        onWorksheetCountChange(total);

        let query = supabase
          .from("products")
          .select("id,title,slug,cover_image_path,pdf_path,created_at,updated_at")
          .eq("is_active", true)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (matchedIds) {
          query = query.in("id", matchedIds);
        }

        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error: pErr } = await query.range(from, to);
        if (pErr) throw pErr;
        if (requestId !== requestIdRef.current) return;

        const nextItems = withCoverUrls((data ?? []) as Product[]);
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
    [fetchMatchedIds, onWorksheetCountChange, supabase, withCoverUrls]
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

  const handleDownload = async (product: Product) => {
    if (!product.pdf_path || downloadingId === product.id) return;
    setDownloadingId(product.id);

    try {
      const filename = `${product.slug || product.title || product.id}.pdf`;
      await downloadProductPdf({
        supabase,
        pdfPath: product.pdf_path,
        filename,
      });
    } catch (err) {
      console.log("PDF download error", { pdf_path: product.pdf_path, error: err });
      alert("Could not download file.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (error) return <div className="text-red-600">Error: {error}</div>;

  const showLoading = loading && tab === "worksheets";

  return (
    <div>
      {showLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-[360px] rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
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
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          No products match your filters.
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
                actionLabel={
                  downloadingId === p.id ? "Preparing..." : p.pdf_path ? "Download" : "No file"
                }
                actionDisabled={downloadingId === p.id || !p.pdf_path}
                onActionClick={p.pdf_path ? () => handleDownload(p) : undefined}
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

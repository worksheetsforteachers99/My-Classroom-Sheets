"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowserOrNull } from "@/lib/supabase/browser";
import ProductCard from "@/components/ProductCard";

type Product = {
  id: string;
  title: string;
  slug: string;
  cover_image_path: string | null;
  pdf_path: string | null;
  created_at: string;
  coverUrl?: string | null;
};

type ProductsGridProps = {
  filters: Record<string, string[]>;
  page: number;
  onPageChange: (nextPage: number) => void;
  onCountChange: (count: number) => void;
};

const PAGE_SIZE = 20;

export default function ProductsGrid({
  filters,
  page,
  onPageChange,
  onCountChange,
}: ProductsGridProps) {
  const supabase = useMemo(() => supabaseBrowserOrNull(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const requestIdRef = useRef(0);

  const withCoverUrls = useCallback(
    (rows: Product[]) => {
      if (!supabase) return rows;
      return rows.map((p) => {
        if (!p.cover_image_path) return { ...p, coverUrl: null };
        const cleanPath = p.cover_image_path.replace(/^\/+/, "");
        const { data: urlData } = supabase.storage
          .from("assets")
          .getPublicUrl(cleanPath);
        return { ...p, coverUrl: urlData.publicUrl };
      });
    },
    [supabase]
  );

  const fetchMatchedIds = useCallback(async () => {
    if (!supabase) return null;
    const activeGroups = Object.entries(filters).filter(([, vals]) => vals.length > 0);
    if (activeGroups.length === 0) return null;

    let current: Set<string> | null = null;

    for (const [, vals] of activeGroups) {
      const { data, error: ptErr } = await supabase
        .from("product_tags")
        .select("product_id, tag_id")
        .in("tag_id", vals);

      if (ptErr) throw ptErr;

      const rows = (data ?? []) as Array<{ product_id: string }>;
      const ids = new Set<string>(rows.map((row) => row.product_id));
      if (ids.size === 0) return [];

      if (current === null) {
        current = ids;
      } else {
        const next = new Set<string>();
        for (const id of current) {
          if (ids.has(id)) next.add(id);
        }
        current = next;
      }
    }

    return current ? Array.from(current) : null;
  }, [filters, supabase]);

  const fetchProducts = useCallback(
    async (nextPage: number, reset: boolean) => {
      if (!supabase) {
        setProducts([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        onCountChange(0);
        return;
      }
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
          onCountChange(0);
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
        onCountChange(total);

        let query = supabase
          .from("products")
          .select("id,title,slug,cover_image_path,pdf_path,created_at")
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
    [fetchMatchedIds, onCountChange, supabase, withCoverUrls]
  );

  useEffect(() => {
    fetchProducts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (page === 0) return;
    fetchProducts(page, false);
  }, [page, fetchProducts]);

  const handleDownload = async (pdfPath: string) => {
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const cleanPath = pdfPath.replace(/^\/+/, "");
    const { data: signedData, error: signedErr } = await supabase.storage
      .from("assets")
      .createSignedUrl(cleanPath, 3600);

    let url = signedErr ? null : signedData?.signedUrl ?? null;

    if (!url) {
      const { data: publicData } = supabase.storage.from("assets").getPublicUrl(cleanPath);
      url = publicData.publicUrl;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-[360px] rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
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
                actionLabel={p.pdf_path ? "Download" : "No file"}
                actionDisabled={!p.pdf_path}
                onActionClick={p.pdf_path ? () => handleDownload(p.pdf_path as string) : undefined}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
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

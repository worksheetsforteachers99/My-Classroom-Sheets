"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowserOrNull } from "@/lib/supabase/browser";
import ProductCard from "@/components/ProductCard";

type RecentProduct = {
  id: string;
  title: string | null;
  slug: string | null;
  cover_image_path: string | null;
  created_at: string;
  coverUrl?: string | null;
};

export default function Home() {
  const supabase = useMemo(() => supabaseBrowserOrNull(), []);
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [resourceCount, setResourceCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      const { count, error: countErr } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("status", "published");

      if (countErr) {
        console.error("Failed to load resource count:", countErr);
        setResourceCount(null);
      } else {
        setResourceCount(count ?? 0);
      }

      const { data, error } = await supabase
        .from("products")
        .select("id,title,slug,cover_image_path,created_at,status,is_active")
        .eq("is_active", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) return;

      const items: RecentProduct[] = (data ?? []).map((p: any) => {
        const base: RecentProduct = {
          id: String(p.id),
          title: p.title ?? null,
          slug: p.slug ?? null,
          cover_image_path: p.cover_image_path ?? null,
          created_at: String(p.created_at),
          coverUrl: null,
        };

        if (!base.cover_image_path) return base;

        const cleanPath = base.cover_image_path.replace(/^\/+/, "");
        const { data: urlData } = supabase.storage
          .from("assets")
          .getPublicUrl(cleanPath);
        const coverUrl = urlData.publicUrl;
        if (process.env.NODE_ENV !== "production") {
          console.log("[cover-debug]", {
            title: p.title,
            cover_image_path: p.cover_image_path,
            cleanPath,
            coverUrl,
          });
        }
        return { ...base, coverUrl };
      });

      setRecent(items);
      setShowSeeMore(items.length > 10);
    };

    load();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div className="flex flex-col justify-center gap-6">
          <div className="text-4xl font-semibold leading-tight md:text-5xl">
            Premium Quality Worksheets
          </div>
          <div className="text-lg text-slate-600">
            Find premium printable worksheets by grade, subject, and topic. Instant PDF downloads.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-100"
              href="/products"
            >
              Browse Resources
            </a>
            <a
              className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-100"
              href="/bundles"
            >
              View Bundles
            </a>
            <span className="text-sm font-medium text-teal-600">
              {resourceCount === null ? "— resources" : `${resourceCount}+ resources`}
            </span>
          </div>
        </div>

        <div className="relative">
          <div
            className="relative h-72 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 md:h-96"
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 30% 20%, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 60%), radial-gradient(50% 50% at 70% 80%, rgba(14,165,233,0.2) 0%, rgba(14,165,233,0) 65%), linear-gradient(135deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0) 55%)",
            }}
          >
            <div className="absolute inset-0 opacity-25">
              <div className="absolute left-8 top-10 h-24 w-24 rounded-full border border-slate-300" />
              <div className="absolute right-10 top-16 h-16 w-16 rounded-full border border-slate-300" />
              <div className="absolute left-16 bottom-10 h-20 w-20 rounded-full border border-slate-300" />
              <div className="absolute right-20 bottom-12 h-10 w-10 rounded-full border border-slate-300" />
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Recently Made Resources */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="mb-6 text-xl font-semibold">Recently Made Resources</div>
        {(() => {
          const total = recent.length;
          const showCount = total > 10 ? 10 : total;
          const showTwoRows = showCount > 5;
          const row1 = recent.slice(0, Math.min(5, showCount));
          const row2 = showTwoRows ? recent.slice(5, showCount) : [];
          const renderRow = (items: RecentProduct[]) => (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
              {items.map((product) => {
                const title = product?.title ?? "Worksheet Title";
                const coverUrl = product?.coverUrl ?? null;
                const slug = product?.slug ?? "";
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={title}
                    slug={slug}
                    coverUrl={coverUrl}
                    actionLabel="Download"
                    actionHref={slug ? `/products/${slug}` : "/products"}
                  />
                );
              })}
            </div>
          );

          return (
            <div className="space-y-6">
              {row1.length > 0 ? (
                renderRow(row1)
              ) : (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <ProductCard
                      key={`placeholder-${idx}`}
                      id={`placeholder-${idx}`}
                      title="Worksheet Title"
                      slug=""
                      coverUrl={null}
                      actionLabel="Download"
                      actionHref="/products"
                    />
                  ))}
                </div>
              )}
              {row2.length > 0 && renderRow(row2)}
              {showSeeMore && (
                <div className="flex justify-center pt-2">
                  <a
                    className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    href="/products"
                  >
                    See more
                  </a>
                </div>
              )}
            </div>
          );
        })()}
      </section>
    </div>
  );
}

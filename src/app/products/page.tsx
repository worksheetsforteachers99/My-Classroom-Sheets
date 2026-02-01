"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowserOrNull } from "@/lib/supabase/browser";
import FiltersSidebar from "@/components/FiltersSidebar";
import ProductsTabs from "@/components/ProductsTabs";
import ProductsGrid from "@/components/ProductsGrid";

type TagGroup = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  tag_group_id: string;
  tag_groups?: TagGroup | null;
};

const GROUP_SLUGS = ["type", "grade-level", "subject", "framework"] as const;

export default function ProductsPage() {
  const supabase = useMemo(() => supabaseBrowserOrNull(), []);

  const [error, setError] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [filters, setFilters] = useState<Record<string, string[]>>({
    type: [],
    "grade-level": [],
    subject: [],
    framework: [],
  });

  const tagsByGroup = useMemo(() => {
    const map: Record<string, Tag[]> = {};
    for (const t of tags) {
      const groupSlug = t.tag_groups?.slug;
      if (!groupSlug) continue;
      if (!map[groupSlug]) map[groupSlug] = [];
      map[groupSlug].push(t);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return map;
  }, [tags]);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const init = async () => {
      const { data: gData, error: gErr } = await supabase
        .from("tag_groups")
        .select("id,name,slug,sort_order")
        .order("sort_order", { ascending: true });

      if (gErr) {
        setError(gErr.message);
        return;
      }

      const { data: tData, error: tErr } = await supabase
        .from("tags")
        .select(
          `
          id,name,slug,sort_order,tag_group_id,
          tag_groups:tag_group_id ( id,name,slug,sort_order )
        `
        );

      if (tErr) {
        setError(tErr.message);
        return;
      }

      setTagGroups((gData ?? []).filter((g) => GROUP_SLUGS.includes(g.slug as any)));
      setTags((tData as any) ?? []);
    };

    init();
  }, [supabase]);

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <FiltersSidebar
            tagGroups={tagGroups}
            tagsByGroup={tagsByGroup}
            onFiltersChange={(next) => {
              setFilters(next);
              setPage(0);
            }}
          />

          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
              <h1 className="text-2xl font-semibold text-slate-900">Browse Resources</h1>
              <ProductsTabs worksheetsCount={totalCount} bundlesCount={0} />
            </div>

            <div className="mt-6">
              <ProductsGrid
                filters={filters}
                page={page}
                onPageChange={setPage}
                onCountChange={setTotalCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import FiltersSidebar from "@/components/FiltersSidebar";

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

const getFiltersData = cache(async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: gData, error: gErr } = await supabase
    .from("tag_groups")
    .select("id,name,slug,sort_order")
    .order("sort_order", { ascending: true });

  if (gErr) {
    throw new Error(gErr.message);
  }

  const { data: tData, error: tErr } = await supabase.from("tags").select(
    `
      id,name,slug,sort_order,tag_group_id,
      tag_groups:tag_group_id ( id,name,slug,sort_order )
    `
  );

  if (tErr) {
    throw new Error(tErr.message);
  }

  const tagGroups = (gData ?? []).filter((g) => GROUP_SLUGS.includes(g.slug as any));
  const tags = (tData as unknown as Tag[]) ?? [];

  const tagsByGroup: Record<string, Tag[]> = {};
  for (const t of tags) {
    const groupSlug = t.tag_groups?.slug;
    if (!groupSlug) continue;
    if (!tagsByGroup[groupSlug]) tagsByGroup[groupSlug] = [];
    tagsByGroup[groupSlug].push(t);
  }
  for (const list of Object.values(tagsByGroup)) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  return { tagGroups, tagsByGroup };
});

export default async function ProductsLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug?: string }>;
}>) {
  const resolvedParams = await params;
  if (resolvedParams?.slug) {
    return (
      <div className="min-h-screen bg-slate-50">{children}</div>
    );
  }

  const { tagGroups, tagsByGroup } = await getFiltersData();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <FiltersSidebar tagGroups={tagGroups} tagsByGroup={tagsByGroup} />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

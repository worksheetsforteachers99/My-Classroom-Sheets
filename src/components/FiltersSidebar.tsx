"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TagGroup = {
  id: string;
  name: string;
  slug: string;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  tag_group_id: string;
};

type FiltersSidebarProps = {
  tagGroups: TagGroup[];
  tagsByGroup: Record<string, Tag[]>;
};

const placeholderByGroup: Record<string, string> = {
  type: "Select Types",
  "grade-level": "Select Grades",
  subject: "Select Subjects",
  framework: "Select Framework",
};

const GROUP_KEYS = ["type", "grade-level", "subject", "framework"] as const;
type GroupKey = (typeof GROUP_KEYS)[number];

const parseList = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export default function FiltersSidebar({
  tagGroups,
  tagsByGroup,
}: FiltersSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const selected = useMemo<Record<GroupKey, string[]>>(() => {
    const params = new URLSearchParams(searchParams.toString());
    return {
      type: parseList(params.get("type")),
      "grade-level": parseList(params.get("grade-level")),
      subject: parseList(params.get("subject")),
      framework: parseList(params.get("framework")),
    };
  }, [searchParams]);

  const hasActive = useMemo(
    () => Object.values(selected).some((vals) => vals.length > 0),
    [selected]
  );

  const selectedLabel = (groupSlug: GroupKey, list: Tag[]) => {
    const selectedIds = new Set(selected[groupSlug] ?? []);
    const names = list.filter((t) => selectedIds.has(t.id)).map((t) => t.name);
    if (names.length === 0) return placeholderByGroup[groupSlug] ?? "Select";
    const joined = names.join(", ");
    return joined.length > 24 ? `${joined.slice(0, 24)}…` : joined;
  };

  const updateQuery = (next: Record<GroupKey, string[]>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of GROUP_KEYS) {
      const vals = next[key] ?? [];
      if (vals.length > 0) {
        params.set(key, vals.join(","));
      } else {
        params.delete(key);
      }
    }
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.replace(url, { scroll: false });
  };

  const toggleTag = (groupSlug: GroupKey, tagId: string) => {
    const next = { ...selected };
    const current = new Set(next[groupSlug] ?? []);
    if (current.has(tagId)) {
      current.delete(tagId);
    } else {
      current.add(tagId);
    }
    next[groupSlug] = Array.from(current);
    updateQuery(next);
  };

  const clearFilters = () => {
    const next = {
      type: [],
      "grade-level": [],
      subject: [],
      framework: [],
    };
    updateQuery(next);
  };

  return (
    <aside className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-slate-900">Filters</div>
        {hasActive && (
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-700"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {tagGroups.map((g) => {
          const groupSlug = g.slug as GroupKey;
          const list = tagsByGroup[groupSlug] ?? [];
          const isOpen = openGroup === g.slug;
          return (
            <div key={g.id} className="rounded-xl border border-slate-200 bg-white">
              <div className="px-4 pb-4 pt-3">
                <label
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                  htmlFor={`filter-${g.slug}`}
                >
                  {g.name}
                </label>
                <div className="relative mt-2">
                  <button
                    id={`filter-${g.slug}`}
                    type="button"
                    className="flex h-12 w-full items-center rounded-xl border border-slate-200 bg-white px-4 pr-10 text-left text-sm text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:border-blue-400 hover:border-slate-300"
                    onClick={() => setOpenGroup(isOpen ? null : g.slug)}
                    aria-expanded={isOpen}
                    aria-controls={`filter-panel-${g.slug}`}
                  >
                    <span className="truncate">
                      {selectedLabel(groupSlug, list)}
                    </span>
                  </button>
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              {isOpen && (
                <div
                  id={`filter-panel-${g.slug}`}
                  className="border-t border-slate-200 px-4 py-3"
                >
                  <div className="space-y-2">
                    {list.map((t) => {
                      const checked = (selected[groupSlug] ?? []).includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTag(groupSlug, t.id)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600"
                          />
                          <span>{t.name}</span>
                        </label>
                      );
                    })}
                    {list.length === 0 && (
                      <div className="text-xs text-slate-400">No options</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

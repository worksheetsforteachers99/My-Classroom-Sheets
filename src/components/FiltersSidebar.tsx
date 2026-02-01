"use client";

import { useEffect, useMemo, useState } from "react";

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
  onFiltersChange: (next: Record<string, string[]>) => void;
};

const placeholderByGroup: Record<string, string> = {
  type: "Select Types",
  "grade-level": "Select Grades",
  subject: "Select Subjects",
  framework: "Select Framework",
};

const GROUP_KEYS = ["type", "grade-level", "subject", "framework"];

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
  onFiltersChange,
}: FiltersSidebarProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({
    type: [],
    "grade-level": [],
    subject: [],
    framework: [],
  });

  useEffect(() => {
    const params = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
    const initial: Record<string, string[]> = {
      type: parseList(params.get("type")),
      "grade-level": parseList(params.get("grade-level")),
      subject: parseList(params.get("subject")),
      framework: parseList(params.get("framework")),
    };
    setSelected(initial);
    onFiltersChange(initial);
    // read once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActive = useMemo(
    () => Object.values(selected).some((vals) => vals.length > 0),
    [selected]
  );

  const selectedLabel = (groupSlug: string, list: Tag[]) => {
    const selectedIds = new Set(selected[groupSlug] ?? []);
    const names = list.filter((t) => selectedIds.has(t.id)).map((t) => t.name);
    if (names.length === 0) return placeholderByGroup[groupSlug] ?? "Select";
    const joined = names.join(", ");
    return joined.length > 24 ? `${joined.slice(0, 24)}…` : joined;
  };

  const updateQuery = (next: Record<string, string[]>) => {
    const params = new URLSearchParams();
    for (const key of GROUP_KEYS) {
      const vals = next[key] ?? [];
      if (vals.length > 0) params.set(key, vals.join(","));
    }
    const query = params.toString();
    const url = query ? `/products?${query}` : "/products";
    window.history.replaceState(null, "", url);
  };

  const updateFilters = (next: Record<string, string[]>) => {
    setSelected(next);
    onFiltersChange(next);
    updateQuery(next);
  };

  const toggleTag = (groupSlug: string, tagId: string) => {
    const next = { ...selected };
    const current = new Set(next[groupSlug] ?? []);
    if (current.has(tagId)) {
      current.delete(tagId);
    } else {
      current.add(tagId);
    }
    next[groupSlug] = Array.from(current);
    updateFilters(next);
  };

  const clearFilters = () => {
    const next = {
      type: [],
      "grade-level": [],
      subject: [],
      framework: [],
    };
    updateFilters(next);
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
          const list = tagsByGroup[g.slug] ?? [];
          const isOpen = openGroup === g.slug;
          return (
            <div key={g.id} className="rounded-xl border border-slate-200">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
                onClick={() => setOpenGroup(isOpen ? null : g.slug)}
              >
                <span className="font-semibold text-slate-900">{g.name}</span>
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="truncate">{selectedLabel(g.slug, list)}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-200 px-4 py-3">
                  <div className="space-y-2">
                    {list.map((t) => {
                      const checked = (selected[g.slug] ?? []).includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTag(g.slug, t.id)}
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

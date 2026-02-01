"use client";

import { useState } from "react";
import Link from "next/link";

type ProductCardProps = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  actionDisabled?: boolean;
};

export default function ProductCard({
  title,
  slug,
  coverUrl,
  actionLabel = "Download",
  actionHref,
  onActionClick,
  actionDisabled = false,
}: ProductCardProps) {
  const [imgOk, setImgOk] = useState(true);
  const href = actionHref ?? `/products/${slug}`;
  const buttonClasses = actionDisabled
    ? "inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
    : "inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {coverUrl && imgOk ? (
        <img
          src={coverUrl}
          alt={title || "Worksheet cover"}
          className="h-[220px] w-full rounded-t-2xl object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="flex h-[220px] w-full items-center justify-center rounded-t-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-xs text-slate-500">
          No preview
        </div>
      )}

      <div className="p-4">
        <div className="line-clamp-2 text-base font-semibold text-slate-900">
          {title}
        </div>
        {process.env.NODE_ENV !== "production" && coverUrl && (
          <div className="mt-1 truncate text-[10px] text-slate-400">{coverUrl}</div>
        )}

        <div className="mt-4">
          {actionDisabled ? (
            <button type="button" className={buttonClasses} disabled>
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {actionLabel}
            </button>
          ) : onActionClick ? (
            <button
              type="button"
              onClick={onActionClick}
              className={buttonClasses}
            >
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {actionLabel}
            </button>
          ) : (
            <Link href={href} className={buttonClasses}>
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

type ProductCardProps = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  actionDisabled?: boolean;
  actionElement?: React.ReactNode;
};

export default function ProductCard({
  id,
  title,
  slug,
  coverUrl,
  priceCents,
  currency,
  actionLabel = "Download",
  actionHref,
  onActionClick,
  actionDisabled = false,
  actionElement,
}: ProductCardProps) {
  const [imgOk, setImgOk] = useState(true);
  const detailHref = actionHref ?? (id ? `/product/${id}` : `/products/${slug}`);
  const href = actionHref ?? detailHref ?? "#";
  const buttonClasses = actionDisabled
    ? "inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
    : "inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700";

  const formatPrice = (value?: number | null, code?: string | null) => {
    if (value === null || value === undefined) return "—";
    const amount = value / 100;
    const currencyCode = code ?? "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {detailHref ? (
        <Link
          href={detailHref}
          aria-label={title ? `View ${title}` : "View product"}
          className="absolute inset-0 z-10 rounded-2xl"
        />
      ) : null}
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

      <div className="relative z-0 p-4">
        <div className="line-clamp-2 text-base font-semibold text-slate-900">
          {title}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {formatPrice(priceCents, currency)}
        </div>
        <div className="mt-4">
          {actionElement ? (
            <div className="relative z-20">{actionElement}</div>
          ) : actionDisabled ? (
            <button
              type="button"
              className={`relative z-20 ${buttonClasses}`}
              disabled
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
          ) : onActionClick ? (
            <button
              type="button"
              onClick={onActionClick}
              className={`relative z-20 ${buttonClasses}`}
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
            <Link href={href} className={`relative z-20 ${buttonClasses}`}>
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

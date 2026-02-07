"use client";

import Link from "next/link";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">We couldn't load this product</h1>
      <p className="text-sm text-slate-600">
        Something went wrong while loading the product details. Please try again or return to
        the catalog.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href="/products"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Back to products
        </Link>
      </div>
      {error?.digest ? (
        <p className="text-xs text-slate-400">Error reference: {error.digest}</p>
      ) : null}
    </div>
  );
}

import Link from "next/link";

type ProductCardProps = {
  title: string | null;
  slug: string | null;
  coverUrl?: string | null;
  subject?: string | null;
  category?: string | null;
  type?: string | null;
  downloadHref?: string | null;
};

export default function ProductCard({
  title,
  slug,
  coverUrl,
  subject,
  category,
  type,
  downloadHref,
}: ProductCardProps) {
  const productTitle = title ?? "Untitled product";
  const href = slug ? `/products/${slug}` : "#";
  const actionHref = downloadHref ?? href;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={productTitle}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
          No preview
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="text-sm font-semibold text-slate-900 line-clamp-2">
          {productTitle}
        </div>
        <div className="text-xs text-slate-500">
          {[subject, type, category].filter(Boolean).join(" • ") || "General"}
        </div>
        <Link
          href={actionHref}
          className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Download
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import DownloadCta from "@/components/products/DownloadCta";
import { supabaseServer } from "@/lib/supabase/server";

type Product = {
  id: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  cover_image_path?: string | null;
  pdf_path?: string | null;
  created_at?: string | null;
  price_cents?: number | null;
  currency?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

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

const getShortDescription = (text?: string | null, maxChars = 160) => {
  if (!text) return null;
  const normalized = text
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  if (normalized.length <= maxChars) return normalized;
  const cutoff = normalized.slice(0, maxChars + 1);
  const lastSpace = cutoff.lastIndexOf(" ");
  const trimmed = (lastSpace > 0 ? cutoff.slice(0, lastSpace) : cutoff).trim();
  return trimmed ? `${trimmed}…` : null;
};

const getBaseUrl = async () => {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const proto = forwardedProto ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
};

const getCoverUrl = (
  supabase: ReturnType<typeof supabaseServer>,
  path: string | null | undefined
) => {
  if (!path) return null;
  const cleanPath = path.replace(/^\/+/, "");
  return supabase.storage.from("product-covers").getPublicUrl(cleanPath).data
    .publicUrl;
};

const fetchProduct = async (id: string) => {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/product/${id}`, {
    cache: "no-store",
    next: { tags: ["products"] },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(
      `Failed to load product (${res.status}): ${bodyText || "Unknown error"}`
    );
  }

  const json = (await res.json()) as { product?: Product };
  return json.product ?? null;
};

const fetchSimilarProducts = async (currentId: string) => {
  const baseUrl = await getBaseUrl();
  const res = await fetch(
    `${baseUrl}/api/products?page=0&pageSize=12&status=published&is_active=true`,
    { cache: "no-store", next: { tags: ["products"] } }
  );

  if (!res.ok) return [];
  const json = (await res.json()) as { products?: Product[] };
  const rows = json.products ?? [];
  return rows.filter((row) => row.id !== currentId).slice(0, 8);
};

export default async function ProductDetailByIdPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id?.trim();
  if (!id || id === "undefined") {
    notFound();
  }
  const product = await fetchProduct(id);
  if (!product) notFound();

  const supabase = supabaseServer();
  const coverUrl = getCoverUrl(supabase, product.cover_image_path);
  const thumbnails = [coverUrl, coverUrl];
  const similar = await fetchSimilarProducts(product.id);

  const summary =
    getShortDescription(product.description, 160) ??
    "Premium, classroom-ready resource designed to save prep time and boost student engagement.";

  const metaItems = [
    { label: "Subject", value: "General" },
    { label: "Type", value: "Worksheet" },
  ];

  return (
    <div className="bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14">
        <nav className="text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{product.title ?? "Product"}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={product.title ?? "Product cover"}
                  className="w-full object-cover"
                />
              ) : (
                <div className="flex h-80 w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
                  No preview available
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {thumbnails.map((thumb, idx) => (
                <div
                  key={`thumb-${idx}`}
                  className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt="Preview thumbnail"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                {product.title ?? "Untitled Product"}
              </h1>
              <div className="text-lg font-semibold text-slate-900">
                {formatPrice(product.price_cents, product.currency)}
              </div>
              <p className="text-base text-slate-600">{summary}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {metaItems.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-2 font-semibold text-slate-800">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <DownloadCta
                productId={product.id}
                title={product.title ?? null}
                slug={product.slug ?? product.id}
                pdfPath={product.pdf_path ?? null}
              />
              <div className="text-xs text-slate-500">
                Created on {formatDate(product.created_at)}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Description</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            {product.description ? (
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  This resource includes print-ready worksheets designed for
                  quick use in the classroom or at home.
                </p>
                <p className="text-sm text-slate-600">
                  Use it for warm-ups, centers, or independent practice to save
                  prep time and keep learning engaging.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Reviews &amp; Feedback
          </h2>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No reviews yet. Be the first to leave feedback after downloading.
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Similar Products
          </h2>
          {similar.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              No similar products found.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  title={item.title ?? "Untitled product"}
                  slug={item.slug ?? ""}
                  coverUrl={getCoverUrl(supabase, item.cover_image_path)}
                  priceCents={item.price_cents ?? null}
                  currency={item.currency ?? null}
                  actionLabel="View"
                  actionHref={`/product/${item.id}`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

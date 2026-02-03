import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ProductCard from "@/components/products/ProductCard";
import DownloadCta from "@/components/products/DownloadCta";

type ProductRow = {
  id: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  cover_image_path?: string | null;
  pdf_path?: string | null;
  created_at?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  subject?: string | null;
  category?: string | null;
  type?: string | null;
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

const getCoverUrl = (
  supabase: ReturnType<typeof supabaseServer>,
  path: string | null | undefined
) => {
  if (!path) return null;
  const cleanPath = path.replace(/^\/+/, "");
  return supabase.storage.from("product-covers").getPublicUrl(cleanPath).data
    .publicUrl;
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

export default async function ProductDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = supabaseServer();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "published")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  const coverUrl = getCoverUrl(supabase, product.cover_image_path);
  const subject = product.subject ?? "General";
  const type = product.type ?? "Worksheet";
  const category = product.category ?? "All Grades";
  const createdLabel = formatDate(product.created_at);
  const summary =
    product.description?.trim() ||
    "Premium, classroom-ready resource designed to save prep time and boost student engagement.";

  const { data: similar } = await supabase
    .from("products")
    .select("*")
    .neq("id", product.id)
    .eq("status", "published")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const similarProducts = (similar ?? []) as ProductRow[];

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
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`thumb-${idx}`}
                  className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
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

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Subject", value: subject },
                { label: "Type", value: type },
                { label: "Category", value: category },
              ].map((item) => (
                <div
                  key={item.label}
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
                slug={product.slug ?? null}
                pdfPath={product.pdf_path ?? null}
              />
              <div className="text-xs text-slate-500">
                Created on {createdLabel}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Description
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                What’s included
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {product.description ??
                  "This resource includes print-ready worksheets designed for quick use in the classroom or at home."}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Best for
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>Independent practice and guided instruction</li>
                <li>Small group rotations or homework packets</li>
                <li>Lesson plan enrichment and review</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Teacher notes
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Pair this worksheet with a mini-lesson for maximum impact. The
                layout is intentionally spacious for easy annotation.
              </p>
            </div>
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
          {similarProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              No similar products found.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  title={item.title ?? null}
                  slug={item.slug ?? null}
                  coverUrl={getCoverUrl(supabase, item.cover_image_path)}
                  subject={item.subject ?? null}
                  type={item.type ?? null}
                  category={item.category ?? null}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

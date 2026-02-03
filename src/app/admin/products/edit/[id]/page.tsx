"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { isAdminUser } from "@/lib/admin/guard";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  status: "draft" | "published" | "archived";
  is_active: boolean | null;
  cover_image_path: string | null;
  pdf_path: string | null;
};

export default function AdminEditProductPage() {
  const params = useParams<{ id?: string | string[] }>();
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const DEBUG = false;
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [guard, setGuard] = useState<{ ok: boolean; reason?: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0.00");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<Product["status"]>("draft");
  const [isActive, setIsActive] = useState(true);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const loadProduct = async () => {
    setLoading(true);
    setMessage(null);

    if (!productId) {
      if (DEBUG) {
        console.warn("Admin edit missing product id", { params });
      }
      setMessage("Missing product id.");
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage("Not logged in.");
      setLoading(false);
      return;
    }

    if (DEBUG) {
      console.log("Admin edit fetch product", {
        id: productId,
        idType: typeof productId,
      });
    }

    const res = await fetch(`/api/admin/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(json?.error ?? "Failed to load product.");
      setLoading(false);
      return;
    }

    const p = json.product as Product;
    setProduct(p);
    setTitle(p.title ?? "");
    setSlug(p.slug ?? "");
    setDescription(p.description ?? "");
    setPrice(((p.price_cents ?? 0) / 100).toFixed(2));
    setCurrency(p.currency ?? "USD");
    setStatus((p.status ?? "draft") as Product["status"]);
    setIsActive(Boolean(p.is_active));
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setMessage(null);

      const g = await isAdminUser();
      setGuard(g);

      if (!g.ok) {
        setLoading(false);
        return;
      }

      await loadProduct();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, productId]);

  const coverUrl = useMemo(() => {
    if (!product?.cover_image_path) return null;
    return supabase.storage
      .from("product-covers")
      .getPublicUrl(product.cover_image_path).data.publicUrl;
  }, [product?.cover_image_path, supabase]);

  const save = async () => {
    if (!product) return;
    setSaving(true);
    setMessage(null);

    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setMessage("Price must be a valid non-negative number");
      setSaving(false);
      return;
    }

    const coverTypeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    let nextCoverPath = product.cover_image_path;
    let nextPdfPath = product.pdf_path;

    if (coverFile) {
      const coverExt = coverTypeToExt[coverFile.type];
      if (!coverExt) {
        setMessage("Please upload a JPG, PNG, or WEBP image.");
        setSaving(false);
        return;
      }

      const coverPath = `covers/${product.id}.${coverExt}`;
      const { error: coverUploadErr } = await supabase.storage
        .from("product-covers")
        .upload(coverPath, coverFile, {
          contentType: coverFile.type,
          upsert: true,
        });

      if (coverUploadErr) {
        setMessage(`Cover upload failed: ${coverUploadErr.message}`);
        setSaving(false);
        return;
      }

      nextCoverPath = coverPath;
    }

    if (pdfFile) {
      if (pdfFile.type !== "application/pdf") {
        setMessage("Please upload a valid PDF file.");
        setSaving(false);
        return;
      }

      const pdfPath = `pdfs/${product.id}.pdf`;
      const { error: pdfUploadErr } = await supabase.storage
        .from("product-files")
        .upload(pdfPath, pdfFile, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (pdfUploadErr) {
        setMessage(`PDF upload failed: ${pdfUploadErr.message}`);
        setSaving(false);
        return;
      }

      nextPdfPath = pdfPath;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage("Not logged in.");
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        price_cents: Math.round(priceValue * 100),
        currency,
        status,
        is_active: isActive,
        cover_image_path: nextCoverPath,
        pdf_path: nextPdfPath,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setMessage(json?.error ?? "Update failed.");
      setSaving(false);
      return;
    }

    setProduct(json.product as Product);
    setCoverFile(null);
    setPdfFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    setMessage("✅ Changes saved.");
    setSaving(false);
    router.refresh();
  };

  if (loading) return <div>Loading…</div>;

  if (!guard?.ok) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="text-lg font-semibold">Access denied</div>
        <div className="mt-2 text-sm text-gray-600">
          Reason: {guard?.reason ?? "Unknown"}
        </div>
        <div className="mt-4 text-sm">
          Go to{" "}
          <a className="text-blue-600 underline" href="/products">
            /products
          </a>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="text-lg font-semibold">
          {message ?? "Product not found"}
        </div>
        <div className="mt-4 text-sm">
          Go to{" "}
          <a className="text-blue-600 underline" href="/admin/products">
            /admin/products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 text-gray-900 lg:grid-cols-[1fr_360px]">
      <div className="rounded-xl border bg-white p-6">
        <div className="text-xl font-semibold">Edit Product</div>
        <div className="mt-1 text-sm text-gray-500">
          Update details, pricing, and assets.
        </div>

        {message && (
          <div className="mt-4 rounded-lg border p-3 text-sm">{message}</div>
        )}

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Title</span>
            <input
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grade 4 Black History Month Worksheet"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Slug</span>
            <input
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="grade-4-black-history-month-worksheet"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Description</span>
            <textarea
              className="min-h-[100px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for the product page."
            />
          </label>

          <div className="grid gap-1">
            <span className="text-sm font-medium">Thumbnail (cover image)</span>

            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={product.title}
                className="h-32 w-24 rounded-lg object-cover"
              />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                Choose Image
              </button>

              <div className="text-sm text-gray-600">
                {coverFile ? coverFile.name : "No image selected"}
              </div>

              {coverFile && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    if (coverInputRef.current) coverInputRef.current.value = "";
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            <span className="text-xs text-gray-500">
              Recommended: JPG/WEBP, 1200×1600 (or similar).
            </span>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium">PDF file</span>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPdfFile(file);
              }}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {pdfFile
                  ? `Selected: ${pdfFile.name}`
                  : product.pdf_path
                    ? `Current: ${product.pdf_path}`
                    : "No file selected"}
              </span>
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null);
                    if (pdfInputRef.current) pdfInputRef.current.value = "";
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <span className="text-xs text-gray-500">
              Upload the worksheet PDF (stored privately in Supabase Storage).
            </span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Price</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12.99"
              />
              <span className="text-xs text-gray-500">
                Enter a decimal amount (e.g., 12.99)
              </span>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Currency</span>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="LKR">LKR</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Status</span>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Product["status"])
                }
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>

            <label className="flex items-center gap-2 mt-6">
              <input
                className="accent-black"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="mt-2 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              className="mt-2 rounded-lg border px-4 py-2 text-sm"
              onClick={() => router.push("/admin/products")}
            >
              Back to list
            </button>
          </div>
        </div>
      </div>

      <aside className="rounded-xl border bg-white p-6">
        <div className="font-semibold">Product Details</div>
        <div className="mt-2 text-sm text-gray-600">
          ID: <span className="font-mono">{product.id}</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Status: {product.status}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Active: {product.is_active ? "Yes" : "No"}
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Uploading a new cover or PDF will replace the existing file.
        </div>
      </aside>
    </div>
  );
}

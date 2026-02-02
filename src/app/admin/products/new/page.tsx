"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { isAdminUser } from "@/lib/admin/guard";

type TagGroup = { id: string; name: string; slug: string; sort_order: number };
type Tag = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  tag_group_id: string;
  tag_groups?: TagGroup | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminNewProductPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [guard, setGuard] = useState<{ ok: boolean; reason?: string } | null>(null);

  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("10.00");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [isActive, setIsActive] = useState(true);

  // selected tag ids by group slug
  const [selected, setSelected] = useState<Record<string, string[]>>({
    type: [],
    "grade-level": [],
    subject: [],
    framework: [],
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const tagsByGroup = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const t of tags) {
      const gslug = t.tag_groups?.slug;
      if (!gslug) continue;
      const list = map.get(gslug) ?? [];
      list.push(t);
      map.set(gslug, list);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      map.set(k, list);
    }
    return map;
  }, [tags]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setMessage(null);

      const g = await isAdminUser();
      setGuard(g);

      // even if not admin, we can stop here
      if (!g.ok) {
        setLoading(false);
        return;
      }

      const { data: gData, error: gErr } = await supabase
        .from("tag_groups")
        .select("id,name,slug,sort_order")
        .order("sort_order", { ascending: true });

      if (gErr) {
        setMessage(gErr.message);
        setLoading(false);
        return;
      }

      const { data: tData, error: tErr } = await supabase
        .from("tags")
        .select(
          `
          id,name,slug,sort_order,tag_group_id,
          tag_groups:tag_group_id ( id,name,slug,sort_order )
        `
        );

      if (tErr) {
        setMessage(tErr.message);
        setLoading(false);
        return;
      }

      setTagGroups(gData ?? []);
      setTags((tData as any) ?? []);
      setLoading(false);
    };

    init();
  }, [supabase]);

  // auto slug from title (only if slug empty or matches previous auto)
  useEffect(() => {
    if (!title) return;
    const auto = slugify(title);
    if (!slug || slug === slugify(slug)) setSlug(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const allSelectedTagIds = useMemo(() => Object.values(selected).flat(), [selected]);

  // Dev note: Open browser console, click "Create Product", and copy logs under
  // "=== COVER UPLOAD DEBUG ===" to verify bucket/path/session.
  const saveProduct = async () => {
    setSaving(true);
    setMessage(null);

    const coverTypeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    if (!title.trim()) {
      setMessage("Title is required");
      setSaving(false);
      return;
    }
    if (!slug.trim()) {
      setMessage("Slug is required");
      setSaving(false);
      return;
    }

    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setMessage("Price must be a valid non-negative number");
      setSaving(false);
      return;
    }
    const priceCents = Math.round(priceValue * 100);

    // 1) insert product
    const { data: inserted, error: pErr } = await supabase
      .from("products")
      .insert({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        price_cents: priceCents,
        currency,
        status,
        source_system: "manual",
        is_active: isActive,
        cover_image_path: null,
        pdf_path: null,
      })
      .select("id")
      .single();

    if (pErr) {
      setMessage(pErr.message);
      setSaving(false);
      return;
    }

    const productId = inserted.id as string;

    // 1.5) upload cover image (optional) to storage bucket: product-covers
    if (coverFile) {
      const coverExt = coverTypeToExt[coverFile.type];
      if (!coverExt) {
        setMessage("Please upload a JPG, PNG, or WEBP image.");
        setSaving(false);
        return;
      }

      const coverPath = `covers/${productId}.${coverExt}`;
      const { data: sess } = await supabase.auth.getSession();
      console.log("=== COVER UPLOAD DEBUG ===");
      console.log("UPLOAD COVER", {
        bucket: "product-covers",
        path: coverPath,
        uid: sess.session?.user?.id,
        hasSession: !!sess.session,
        fileType: coverFile.type,
        fileName: coverFile.name,
      });
      // TEMP DEBUG TOGGLE: set to true to test insert-only (upsert: false).
      // After testing, set back to false to use upsert: true.
      const debugNoUpsert = false;

      const { error: coverUploadErr } = await supabase.storage
        .from("product-covers")
        .upload(coverPath, coverFile, {
          contentType: coverFile.type,
          upsert: !debugNoUpsert,
        });

      if (coverUploadErr) {
        console.log("coverUploadErr (full):", coverUploadErr);
        setMessage(`Product created, but thumbnail upload failed: ${coverUploadErr.message}`);
        setSaving(false);
        return;
      }

      const { error: coverUpdateErr } = await supabase
        .from("products")
        .update({ cover_image_path: coverPath })
        .eq("id", productId);

      if (coverUpdateErr) {
        setMessage(
          `Product created and thumbnail uploaded, but saving cover path failed: ${coverUpdateErr.message}`
        );
        setSaving(false);
        return;
      }
    }

    // 2) upload PDF (optional) to storage bucket: product-files
    if (pdfFile) {
      // Basic client-side validation
      if (pdfFile.type !== "application/pdf") {
        setMessage("Please upload a valid PDF file.");
        setSaving(false);
        return;
      }

      const filePath = `products/${productId}.pdf`;

      const { data: sess2 } = await supabase.auth.getSession();
      console.log("=== PDF UPLOAD DEBUG ===");
      console.log("UPLOAD PDF", {
        bucket: "product-files",
        path: filePath,
        uid: sess2.session?.user?.id,
        hasSession: !!sess2.session,
        fileType: pdfFile.type,
        fileName: pdfFile.name,
      });

      const { error: uploadErr } = await supabase.storage
        .from("product-files")
        .upload(filePath, pdfFile, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadErr) {
        setMessage(`Product created, but PDF upload failed: ${uploadErr.message}`);
        setSaving(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from("products")
        .update({ pdf_path: filePath })
        .eq("id", productId);

      if (updateErr) {
        setMessage(`Product created and PDF uploaded, but saving PDF path failed: ${updateErr.message}`);
        setSaving(false);
        return;
      }
    }

    // 3) insert product_tags
    if (allSelectedTagIds.length > 0) {
      const rows = allSelectedTagIds.map((tagId) => ({
        product_id: productId,
        tag_id: tagId,
      }));

      const { error: ptErr } = await supabase.from("product_tags").insert(rows);

      if (ptErr) {
        setMessage(`Product created, but tag link failed: ${ptErr.message}`);
        setSaving(false);
        return;
      }
    }

    setMessage("✅ Product created!");
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice("10.00");
    setCurrency("USD");
    setStatus("draft");
    setIsActive(true);
    setSelected({ type: [], "grade-level": [], subject: [], framework: [] });
    setPdfFile(null);
    setCoverFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";

    setSaving(false);
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
          Go to <a className="text-blue-600 underline" href="/products">/products</a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 text-gray-900 lg:grid-cols-[1fr_360px]">
      <div className="rounded-xl border bg-white p-6">
        <div className="text-xl font-semibold">Add Product</div>
        <div className="mt-1 text-sm text-gray-500">Create a PDF product (manual upload).</div>

        {message && (
          <div className="mt-4 rounded-lg border p-3 text-sm">
            {message}
          </div>
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
                {pdfFile ? `Selected: ${pdfFile.name}` : "No file selected"}
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
              <span className="text-xs text-gray-500">Enter a decimal amount (e.g., 12.99)</span>
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
                onChange={(e) => setStatus(e.target.value as any)}
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

          <button
            onClick={saveProduct}
            disabled={saving}
            className="mt-2 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Product"}
          </button>
        </div>
      </div>

      {/* TAGS SIDE PANEL */}
      <aside className="rounded-xl border bg-white p-6">
        <div className="font-semibold">Tags</div>
        <div className="mt-1 text-sm text-gray-500">
          Select tags to enable filtering.
        </div>

        <div className="mt-4 space-y-4">
          {tagGroups.map((g) => {
            const list = tagsByGroup.get(g.slug) ?? [];
            const value = selected[g.slug] ?? [];

            return (
              <div key={g.id}>
                <div className="mb-1 text-sm font-medium">{g.name}</div>
                <select
                  multiple
                  value={value}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setSelected((prev) => ({ ...prev, [g.slug]: vals }));
                  }}
                  className="h-32 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900"
                >
                  {list.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

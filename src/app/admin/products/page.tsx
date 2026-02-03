
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { isAdminUser } from "@/lib/admin/guard";

type Product = {
  id: string;
  title: string;
  slug: string;
  price_cents: number | null;
  currency: string | null;
  status: string | null;
  is_active: boolean | null;
  cover_image_path: string | null;
  pdf_path?: string | null;
  created_at: string | null;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [guard, setGuard] = useState<{ ok: boolean; reason?: string } | null>(
    null
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductTitle, setDeleteProductTitle] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setError("Not logged in.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? "Failed to load products.");
      setLoading(false);
      return;
    }

    const incoming = (json?.products ?? []) as Product[];
    const valid = incoming.filter((p) => Boolean(p?.id));

    if (valid.length !== incoming.length) {
      // Warn but still render what we can.
      setError("Some products are missing ids. Please refresh.");
    }

    setProducts(valid);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      const g = await isAdminUser();
      setGuard(g);

      if (!g.ok) {
        setLoading(false);
        return;
      }

      await fetchProducts();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(products.map((p) => p.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q)
    );
  }, [products, query]);

  const visibleIds = useMemo(
    () => filtered.map((product) => product.id),
    [filtered]
  );
  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      someVisibleSelected && !allVisibleSelected;
  }, [someVisibleSelected, allVisibleSelected]);

  const formatPrice = (priceCents: number | null, currency: string | null) => {
    if (priceCents === null || priceCents === undefined) return "—";
    const amount = priceCents / 100;
    const code = currency ?? "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${code}`;
    }
  };

  const coverUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from("product-covers").getPublicUrl(path).data
      .publicUrl;
  };

  const confirmDelete = async () => {
    console.log("confirm delete id", deleteProductId);
    const id = deleteProductId;

    if (!id) {
      setDeleteError("Couldn’t delete: missing product id.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        setDeleteError(sessionErr.message);
        return;
      }

      const token = sessionData.session?.access_token;
      if (!token) {
        setDeleteError("Not logged in.");
        return;
      }

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // DELETE endpoints often return 204 No Content; handle both JSON and text.
      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        let message = "Delete failed.";

        if (contentType.includes("application/json")) {
          const j = await res.json().catch(() => null);
          message = j?.error ?? message;
        } else {
          const text = await res.text().catch(() => "");
          if (text) message = text;
        }

        setDeleteError(message);
        return;
      }

      // Success
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setNotice("Product deleted.");

      // Close modal + clear selection
      setDeleteOpen(false);
      setDeleteProductId(null);
      setDeleteProductTitle(null);
    } finally {
      setDeleting(false);
      router.refresh();
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${ids.length} product${ids.length === 1 ? "" : "s"}? This cannot be undone.`
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        setError(sessionErr.message);
        return;
      }

      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Not logged in.");
        return;
      }

      const failedIds: string[] = [];
      const succeededIds: string[] = [];
      const batchSize = 5;

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (id) => {
            const res = await fetch(`/api/admin/products/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (res.ok) return { id, ok: true };

            let message = "Delete failed.";
            const contentType = res.headers.get("content-type") ?? "";
            if (contentType.includes("application/json")) {
              const j = await res.json().catch(() => null);
              message = j?.error ?? message;
            } else {
              const text = await res.text().catch(() => "");
              if (text) message = text;
            }

            return { id, ok: false, message };
          })
        );

        for (const result of results) {
          if (result.ok) {
            succeededIds.push(result.id);
          } else {
            failedIds.push(result.id);
          }
        }
      }

      if (succeededIds.length > 0) {
        setProducts((prev) => prev.filter((p) => !succeededIds.includes(p.id)));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of succeededIds) {
            next.delete(id);
          }
          return next;
        });
      }

      if (failedIds.length > 0) {
        setError(
          `Failed to delete ${failedIds.length} product${
            failedIds.length === 1 ? "" : "s"
          }.`
        );
        if (succeededIds.length > 0) {
          setNotice(
            `Deleted ${succeededIds.length} product${
              succeededIds.length === 1 ? "" : "s"
            }.`
          );
        }
        return;
      }

      setSelectedIds(new Set());
      setNotice(
        `Deleted ${succeededIds.length} product${
          succeededIds.length === 1 ? "" : "s"
        }.`
      );
    } finally {
      setBulkDeleting(false);
      router.refresh();
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            Product Manager
          </div>
          <div className="text-base text-slate-600">
            Manage products, pricing, and status.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            placeholder="Search by title or slug"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedCount === 0 || bulkDeleting}
          >
            {bulkDeleting
              ? "Deleting…"
              : `Delete Selected (${selectedCount})`}
          </button>
          <Link
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
            href="/admin/products/new"
          >
            Add New Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (allVisibleSelected) {
                        for (const id of visibleIds) {
                          next.delete(id);
                        }
                      } else {
                        for (const id of visibleIds) {
                          next.add(id);
                        }
                      }
                      return next;
                    });
                  }}
                  disabled={visibleIds.length === 0}
                  aria-label="Select all products"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
              </th>
              <th className="px-4 py-3">Cover</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={8}
                >
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const url = coverUrl(product.cover_image_path);
                const status = product.status ?? "draft";
                const statusBadgeClasses =
                  status === "published"
                    ? "bg-green-100 text-green-800"
                    : status === "draft"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-slate-100 text-slate-700";
                const activeBadgeClasses = product.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-100 text-slate-700";

                return (
                  <tr key={product.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(product.id)) {
                              next.delete(product.id);
                            } else {
                              next.add(product.id);
                            }
                            return next;
                          });
                        }}
                        aria-label={`Select ${product.title}`}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={product.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="leading-tight">
                        <div className="font-medium text-slate-900">
                          {product.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatPrice(product.price_cents, product.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${activeBadgeClasses}`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {product.created_at
                        ? new Date(product.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          className="text-blue-600 hover:underline"
                          href={`/admin/products/edit/${product.id}`}
                        >
                          Edit
                        </Link>
                        <button
                          className="text-red-600 hover:underline"
                          type="button"
                          onClick={() => {
                            console.log("delete click", product.id);
                            setDeleteProductId(product.id);
                            setDeleteProductTitle(product.title);
                            setDeleteError(null);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="text-lg font-semibold text-slate-900">
              Are you sure?
            </div>
            <div className="mt-2 text-sm text-slate-600">
              This will permanently delete{" "}
              <span className="font-medium">
                {deleteProductTitle ?? "this product"}
              </span>
              .
            </div>

            {deleteError && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteProductId(null);
                  setDeleteProductTitle(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

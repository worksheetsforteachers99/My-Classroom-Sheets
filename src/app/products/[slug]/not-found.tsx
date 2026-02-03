import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
        <div className="text-2xl font-semibold text-slate-900">
          Product not found
        </div>
        <p className="mt-3 text-sm text-slate-600">
          We couldn’t find that product. Try browsing our latest resources.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to Products
        </Link>
      </div>
    </div>
  );
}

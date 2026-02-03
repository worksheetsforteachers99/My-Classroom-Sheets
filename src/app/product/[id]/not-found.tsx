import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="bg-slate-50">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="text-2xl font-semibold text-slate-900">
          Product not found
        </div>
        <p className="mt-2 text-sm text-slate-600">
          The product you’re looking for doesn’t exist or is no longer
          available.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to products
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function AdminProductsPage() {
	return (
		<main className="mx-auto w-full max-w-5xl px-6 py-10">
			<div className="flex flex-col gap-3">
				<h1 className="text-2xl font-semibold">Admin · Products</h1>
				<p className="text-sm text-neutral-600">
					This page is currently a placeholder. Use the link below to create a new product.
				</p>
				<div>
					<Link
						href="/admin/products/new"
						className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
					>
						Create new product
					</Link>
				</div>
			</div>
		</main>
	);
}

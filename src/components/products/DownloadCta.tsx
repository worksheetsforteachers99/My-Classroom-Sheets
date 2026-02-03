"use client";

import GatedDownloadButton from "@/components/products/GatedDownloadButton";

type DownloadCtaProps = {
  productId: string;
  title: string | null;
  slug: string | null;
  pdfPath: string | null;
};

export default function DownloadCta({
  productId,
  title,
  slug,
  pdfPath,
}: DownloadCtaProps) {
  return (
    <GatedDownloadButton
      productId={productId}
      slug={slug}
      pdfPath={pdfPath}
      title={title}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
    />
  );
}

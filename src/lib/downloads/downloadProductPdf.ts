import type { SupabaseClient } from "@supabase/supabase-js";

type DownloadProductPdfParams = {
  supabase: SupabaseClient;
  pdfPath: string;
  filename: string;
};

export async function downloadProductPdf({
  supabase,
  pdfPath,
  filename,
}: DownloadProductPdfParams) {
  const { data, error } = await supabase.storage
    .from("product-files")
    .createSignedUrl(pdfPath, 60);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Signed URL not available");
  }

  const res = await fetch(data.signedUrl);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener noreferrer";
  a.click();
  window.URL.revokeObjectURL(url);
}

"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { downloadProductPdf } from "@/lib/downloads/downloadProductPdf";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

type GatedDownloadButtonProps = {
  productId: string;
  slug?: string | null;
  pdfPath?: string | null;
  title?: string | null;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export default function GatedDownloadButton({
  productId,
  slug,
  pdfPath,
  title,
  label = "Download",
  className = "",
  disabled = false,
}: GatedDownloadButtonProps) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [downloading, setDownloading] = useState(false);

  const isDisabled = disabled || !pdfPath || downloading;

  const handleClick = async () => {
    if (isDisabled) return;

    let currentUser = user;
    if (!currentUser) {
      const { data } = await supabase.auth.getSession();
      currentUser = data.session?.user ?? null;
    }

    if (!currentUser) {
      openAuthModal("login", {
        productId,
        slug,
        pdfPath,
        title,
      });
      return;
    }

    setDownloading(true);
    try {
      const filename = `${slug || title || productId}.pdf`;
      await downloadProductPdf({
        supabase,
        pdfPath: pdfPath ?? "",
        filename,
      });
    } catch {
      alert("Could not download file.");
    } finally {
      setDownloading(false);
    }
  };

  const displayLabel = !pdfPath ? "No file" : downloading ? "Preparing..." : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={isDisabled}
    >
      {displayLabel}
    </button>
  );
}

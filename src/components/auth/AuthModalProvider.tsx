"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { downloadProductPdf } from "@/lib/downloads/downloadProductPdf";

type AuthMode = "login" | "signup";

type PendingDownload = {
  productId: string;
  slug?: string | null;
  pdfPath?: string | null;
  title?: string | null;
};

type AuthModalContextValue = {
  isOpen: boolean;
  mode: AuthMode;
  openAuthModal: (mode?: AuthMode, pending?: PendingDownload) => void;
  closeAuthModal: () => void;
  pendingDownload: PendingDownload | null;
  setPendingDownload: (pending: PendingDownload | null) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [pendingDownload, setPendingDownload] = useState<PendingDownload | null>(null);

  const openAuthModal = useCallback(
    (nextMode: AuthMode = "login", pending?: PendingDownload) => {
      setMode(nextMode);
      if (pending) setPendingDownload(pending);
      setIsOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    setPendingDownload(null);
  }, []);

  const handleAuthSuccess = useCallback(async () => {
    const pending = pendingDownload;
    setPendingDownload(null);

    if (pending?.pdfPath) {
      try {
        const filename = `${pending.slug || pending.title || pending.productId}.pdf`;
        await downloadProductPdf({
          supabase,
          pdfPath: pending.pdfPath,
          filename,
        });
      } catch {
        // Ignore download errors after login.
      }
    }

    router.refresh();
  }, [pendingDownload, router, supabase]);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        openAuthModal,
        closeAuthModal,
        pendingDownload,
        setPendingDownload,
      }}
    >
      {children}
      <AuthModal
        isOpen={isOpen}
        mode={mode}
        onClose={closeAuthModal}
        onSwitchMode={(nextMode) => setMode(nextMode)}
        onAuthSuccess={handleAuthSuccess}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}

"use client";

import { useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

export default function AuthNav() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();

  return (
    <>
      {!loading && !user ? (
        <>
          <button
            type="button"
            className="text-slate-600 hover:text-slate-900"
            onClick={() => openAuthModal("login")}
          >
            Log In
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
            onClick={() => openAuthModal("signup")}
          >
            Sign Up
          </button>
        </>
      ) : null}
      {!loading && user ? (
        <button
          className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          type="button"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      ) : null}
    </>
  );
}

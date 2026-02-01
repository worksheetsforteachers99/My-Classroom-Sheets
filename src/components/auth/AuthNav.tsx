"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowserOrNull } from "@/lib/supabase/browser";
import AuthModal from "@/components/auth/AuthModal";

type AuthMode = "login" | "signup";

export default function AuthNav() {
  const supabase = useMemo(() => supabaseBrowserOrNull(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const openModal = (nextMode: AuthMode) => {
    setMode(nextMode);
    setIsOpen(true);
  };

  return (
    <>
      {!session ? (
        <>
          <button
            type="button"
            className="text-slate-600 hover:text-slate-900"
            onClick={() => openModal("login")}
          >
            Log In
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
            onClick={() => openModal("signup")}
          >
            Sign Up
          </button>
        </>
      ) : (
        <button
          className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          type="button"
          onClick={() => supabase?.auth.signOut()}
        >
          Sign out
        </button>
      )}

      <AuthModal
        isOpen={isOpen}
        mode={mode}
        onClose={() => setIsOpen(false)}
        onSwitchMode={(nextMode) => {
          setMode(nextMode);
          setIsOpen(true);
        }}
      />
    </>
  );
}

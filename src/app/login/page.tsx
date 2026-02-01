"use client";

import { useMemo, useState } from "react";
import { supabaseBrowserOrNull } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowserOrNull(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    if (!supabase) {
      setMsg("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMsg(error.message);
    else setMsg("✅ Sign up success. Check email if confirmation is enabled.");

    setLoading(false);
  };

  const signIn = async () => {
    if (!supabase) {
      setMsg("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else window.location.href = "/admin/products/new";

    setLoading(false);
  };

  const signOut = async () => {
    if (!supabase) {
      setMsg("Supabase is not configured.");
      return;
    }
    await supabase.auth.signOut();
    setMsg("Signed out");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-gray-600">Sign in to access admin.</p>

        {msg && <div className="mt-4 rounded-lg border p-3 text-sm">{msg}</div>}

        <div className="mt-6 grid gap-3">
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={signIn}
              disabled={loading}
              className="flex-1 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              Sign In
            </button>
            <button
              onClick={signUp}
              disabled={loading}
              className="flex-1 rounded-lg border px-4 py-2 disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>

          <button
            onClick={signOut}
            className="mt-2 rounded-lg border px-4 py-2 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import Modal from "@/components/ui/Modal";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  onAuthSuccess?: () => void | Promise<void>;
};

export default function AuthModal({
  isOpen,
  mode,
  onClose,
  onSwitchMode,
  onAuthSuccess,
}: AuthModalProps) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const isLogin = mode === "login";
  const skipEmailConfirm = process.env.NEXT_PUBLIC_AUTH_SKIP_EMAIL_CONFIRMATION === "true";

  const resetMessages = () => {
    setError(null);
    setMessage(null);
    setResendStatus(null);
    setShowResend(false);
  };

  const handleClose = () => {
    setLoading(false);
    resetMessages();
    onClose();
  };

  const handleSuccess = async () => {
    if (onAuthSuccess) {
      await onAuthSuccess();
    }
    handleClose();
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV AUTH] skip_email_confirmation:", skipEmailConfirm);
    }
  }, [skipEmailConfirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    resetMessages();
    setLoading(true);

    if (isLogin) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        if (signInErr.message.toLowerCase().includes("email not confirmed")) {
          setError(
            "Email confirmation is currently enabled. Check inbox or ask admin to disable confirm email."
          );
          setShowResend(true);
        } else {
          setError(signInErr.message);
          setShowResend(false);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setShowResend(false);
      await handleSuccess();
      return;
    }

    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    if (skipEmailConfirm) {
      setMessage("Account created. Signing you in…");
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        if (signInErr.message.toLowerCase().includes("email not confirmed")) {
          setMessage(
            "Email confirmation is currently disabled in dev mode. Please use the admin-created user or disable confirm email later."
          );
        } else {
          setError(signInErr.message);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      await handleSuccess();
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      setResendStatus("Enter your email above to resend.");
      return;
    }
    setResendStatus(null);
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (resendErr) {
      setResendStatus(resendErr.message);
      return;
    }
    setResendStatus("Confirmation email sent.");
  };

  const gradientPanel = (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 p-8 text-white">
      <div className="text-sm uppercase tracking-wide text-white/80">
        {isLogin ? "Welcome Back!" : "New Here?"}
      </div>
      <div>
        <div className="text-3xl font-semibold">
          {isLogin ? "Sign in to continue" : "Create your account"}
        </div>
        <p className="mt-3 text-sm text-white/90">
          {isLogin
            ? "Access premium worksheets and manage your downloads."
            : "Join My Classroom Sheets and start browsing resources."}
        </p>
      </div>
      <div className="text-sm text-white/80">My Classroom Sheets</div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {isLogin ? (
            <>
              <div className="p-8">
                <div className="text-2xl font-semibold text-slate-900">Sign In</div>
                <div className="mt-2 text-sm text-slate-600">
                  Welcome back to My Classroom Sheets.
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Email</span>
                    <input
                      type="email"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Password</span>
                    <input
                      type="password"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>

                  {error && <div className="text-sm text-red-600">{error}</div>}
                  {message && <div className="text-sm text-emerald-600">{message}</div>}
                  {resendStatus && <div className="text-sm text-slate-600">{resendStatus}</div>}

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-2 font-semibold text-white hover:from-teal-600 hover:to-blue-700"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  <div className="text-center text-sm text-slate-600">
                    New here?{" "}
                    <button
                      type="button"
                      className="font-medium text-slate-900 hover:underline"
                      onClick={() => onSwitchMode("signup")}
                    >
                      Create account
                    </button>
                  </div>
                  {skipEmailConfirm && showResend && (
                    <div className="text-center text-xs text-slate-500">
                      <button
                        type="button"
                        className="font-medium text-slate-700 hover:underline"
                        onClick={handleResend}
                      >
                        Resend confirmation email
                      </button>
                    </div>
                  )}
                </form>
              </div>
              <div className="hidden md:block">{gradientPanel}</div>
            </>
          ) : (
            <>
              <div className="hidden md:block">{gradientPanel}</div>
              <div className="p-8">
                <div className="text-2xl font-semibold text-slate-900">Create Account</div>
                <div className="mt-2 text-sm text-slate-600">
                  Start browsing premium worksheets.
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Full name</span>
                    <input
                      type="text"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Email</span>
                    <input
                      type="email"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Password</span>
                    <input
                      type="password"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>

                  {error && <div className="text-sm text-red-600">{error}</div>}
                  {message && <div className="text-sm text-emerald-600">{message}</div>}

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-2 font-semibold text-white hover:from-teal-600 hover:to-blue-700"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>

                  <div className="text-center text-sm text-slate-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-medium text-slate-900 hover:underline"
                      onClick={() => onSwitchMode("login")}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        <div className="md:hidden">{gradientPanel}</div>
      </div>
    </Modal>
  );
}

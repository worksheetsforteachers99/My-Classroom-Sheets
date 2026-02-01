import { supabaseBrowserOrNull } from "@/lib/supabase/browser";

export async function isAdminUser(): Promise<{ ok: boolean; reason?: string }> {
  const supabase = supabaseBrowserOrNull();

  if (!supabase) {
    return {
      ok: false,
      reason: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    };
  }

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) return { ok: false, reason: "Not logged in" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  if (!profile) return { ok: false, reason: "No profile row (create profile)" };
  if (profile.role !== "admin") return { ok: false, reason: "Not an admin" };

  return { ok: true };
}
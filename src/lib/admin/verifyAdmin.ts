import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

type VerifyAdminResult =
  | { ok: true; user: User; supabase: any }
  | { ok: false; status: number; error: string };

export async function verifyAdminFromRequest(
  req: Request
): Promise<VerifyAdminResult> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: userData, error: userErr } = await authClient.auth.getUser(
    token
  );
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileErr) {
    return { ok: false, status: 500, error: profileErr.message };
  }
  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, user: userData.user, supabase };
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const parseList = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "0");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");
  const status = searchParams.get("status") ?? "published";
  const isActive = searchParams.get("is_active") !== "false";
  const q = searchParams.get("q")?.trim();

  const filters = {
    type: parseList(searchParams.get("type")),
    "grade-level": parseList(searchParams.get("grade-level")),
    subject: parseList(searchParams.get("subject")),
    framework: parseList(searchParams.get("framework")),
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const activeGroups = Object.entries(filters).filter(([, vals]) => vals.length > 0);

  let matchedIds: string[] | null = null;
  if (activeGroups.length > 0) {
    let current = new Set<string>();
    let hasCurrent = false;
    for (const [, vals] of activeGroups) {
      const { data, error } = await supabase
        .from("product_tags")
        .select("product_id")
        .in("tag_id", vals);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const ids = new Set<string>((data ?? []).map((row) => row.product_id));
      if (ids.size === 0) {
        matchedIds = [];
        break;
      }

      if (!hasCurrent) {
        current = ids;
        hasCurrent = true;
      } else {
        current = new Set<string>([...current].filter((id) => ids.has(id)));
      }
    }

    matchedIds = matchedIds ?? (hasCurrent ? Array.from(current) : []);
  }

  if (matchedIds && matchedIds.length === 0) {
    return NextResponse.json({ products: [], count: 0 });
  }

  let countQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", status)
    .eq("is_active", isActive);

  if (matchedIds) {
    countQuery = countQuery.in("id", matchedIds);
  }
  if (q) {
    const escaped = q.replace(/[%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    countQuery = countQuery.or(
      `title.ilike.${pattern},slug.ilike.${pattern},description.ilike.${pattern}`
    );
  }

  const { count, error: countErr } = await countQuery;
  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  let query = supabase
    .from("products")
    .select(
      "id,title,slug,cover_image_path,pdf_path,created_at,updated_at,price_cents,currency"
    )
    .eq("status", status)
    .eq("is_active", isActive)
    .order("created_at", { ascending: false });

  if (matchedIds) {
    query = query.in("id", matchedIds);
  }
  if (q) {
    const escaped = q.replace(/[%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    query = query.or(
      `title.ilike.${pattern},slug.ilike.${pattern},description.ilike.${pattern}`
    );
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products: data ?? [],
    count: count ?? 0,
  });
}

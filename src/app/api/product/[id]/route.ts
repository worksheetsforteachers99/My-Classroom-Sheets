import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ALLOWED_FIELDS = [
  "id",
  "title",
  "slug",
  "cover_image_path",
  "pdf_path",
  "created_at",
  "price_cents",
  "currency",
  "description",
] as const;

const UUID_PATTERN =/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params as any);
    const raw = resolvedParams?.id;
    const key = (raw ?? "").trim();

    if (!key || key === "undefined") {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // allow both uuid id OR slug
    const isUuid = UUID_PATTERN.test(key);

    const selectCols = `${ALLOWED_FIELDS.join(",")},status,is_active`;

    const baseQuery = supabase.from("products").select(selectCols);

    const { data, error } = isUuid
      ? await baseQuery.eq("id", key).single()
      : await baseQuery.eq("slug", key).single();

    if (error) {
      const isNotFound =
        (error as any).code === "PGRST116" ||
        error.details?.includes("0 rows") ||
        error.message?.toLowerCase().includes("results contain 0 rows");

      if (isNotFound) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      return NextResponse.json(
        { error: error.message, code: (error as any).code ?? null },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Public storefront rules
    const status = (data as any).status as string | null | undefined;
    const isActive = (data as any).is_active as boolean | null | undefined;

    if (status !== "published" || isActive !== true) {
      // keep storefront behavior = 404 for hidden products
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const product = ALLOWED_FIELDS.reduce<Record<string, unknown>>((acc, field) => {
      acc[field] = (data as any)[field];
      return acc;
    }, {});

    return NextResponse.json({ product });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}

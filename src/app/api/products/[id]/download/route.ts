import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const authHeader = _req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: product, error: productErr } = await supabase
    .from("products")
    .select("pdf_path")
    .eq("id", id)
    .maybeSingle();

  if (productErr) {
    return NextResponse.json({ error: productErr.message }, { status: 500 });
  }

  if (!product?.pdf_path) {
    return NextResponse.json({ error: "No PDF available" }, { status: 404 });
  }

  const { data: signedData, error: signedErr } = await supabase.storage
    .from("product-files")
    .createSignedUrl(product.pdf_path, 60);

  if (signedErr || !signedData?.signedUrl) {
    return NextResponse.json({ error: signedErr?.message ?? "Failed to sign URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signedData.signedUrl });
}

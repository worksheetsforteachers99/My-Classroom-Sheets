import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyAdminFromRequest } from "@/lib/admin/verifyAdmin";

type Params = { params: Promise<{ id: string }> };

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const cleanId = id?.trim();
  console.log("API DEBUG:", req.method, req.url, cleanId, typeof ctx.params);

  if (!cleanId || !uuidRegex.test(cleanId)) {
    return NextResponse.json(
      { error: "Missing product id" },
      { status: 400 }
    );
  }

  const admin = await verifyAdminFromRequest(req);
  console.log("GET /api/admin/products/:id", { id: cleanId, ok: admin.ok });
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { data, error } = await admin.supabase
    .from("products")
    .select(
      "id,title,slug,description,price_cents,currency,status,is_active,cover_image_path,pdf_path,created_at"
    )
    .eq("id", cleanId)
    .maybeSingle();

  console.log("Query result", { data, error });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function PATCH(req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const cleanId = id?.trim();
  console.log("API DEBUG:", req.method, req.url, cleanId, typeof ctx.params);
  if (!cleanId || !uuidRegex.test(cleanId)) {
    return NextResponse.json(
      { error: "Missing product id" },
      { status: 400 }
    );
  }

  const admin = await verifyAdminFromRequest(req);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json()) as Partial<{
    title: string;
    slug: string;
    description: string | null;
    price_cents: number;
    currency: string;
    status: string;
    is_active: boolean;
    cover_image_path: string | null;
    pdf_path: string | null;
  }>;

  const update: Record<string, unknown> = {};
  const allowedKeys = [
    "title",
    "slug",
    "description",
    "price_cents",
    "currency",
    "status",
    "is_active",
    "cover_image_path",
    "pdf_path",
  ] as const;

  for (const key of allowedKeys) {
    if (key in body) {
      update[key] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const productQuery = admin.supabase.from("products") as any;
  const { data, error } = await productQuery
    .update(update)
    .eq("id", cleanId)
    .select(
      "id,title,slug,description,price_cents,currency,status,is_active,cover_image_path,pdf_path,created_at"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const cleanId = id?.trim();
  console.log("API DEBUG:", req.method, req.url, cleanId, typeof ctx.params);
  if (!cleanId || !uuidRegex.test(cleanId)) {
    return NextResponse.json(
      { error: "Missing product id" },
      { status: 400 }
    );
  }

  const admin = await verifyAdminFromRequest(req);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const productLookup = admin.supabase.from("products") as any;
  const { data: product, error: productErr } = await productLookup
    .select("cover_image_path,pdf_path")
    .eq("id", cleanId)
    .maybeSingle();

  if (productErr) {
    return NextResponse.json({ error: productErr.message }, { status: 500 });
  }

  const { error: tagErr } = await admin.supabase
    .from("product_tags")
    .delete()
    .eq("product_id", cleanId);

  if (tagErr) {
    return NextResponse.json({ error: tagErr.message }, { status: 500 });
  }

  const { error: deleteErr } = await admin.supabase
    .from("products")
    .delete()
    .eq("id", cleanId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  const warnings: string[] = [];

  if (product?.cover_image_path) {
    const { error: coverErr } = await admin.supabase.storage
      .from("product-covers")
      .remove([product.cover_image_path]);
    if (coverErr) warnings.push(`Cover delete failed: ${coverErr.message}`);
  }

  if (product?.pdf_path) {
    const { error: pdfErr } = await admin.supabase.storage
      .from("product-files")
      .remove([product.pdf_path]);
    if (pdfErr) warnings.push(`PDF delete failed: ${pdfErr.message}`);
  }

  revalidateTag("products");
  revalidatePath("/");
  revalidatePath("/products");

  return NextResponse.json({
    success: true,
    warnings: warnings.length ? warnings : undefined,
  });
}

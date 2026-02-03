import { NextResponse } from "next/server";
import { verifyAdminFromRequest } from "@/lib/admin/verifyAdmin";

export async function GET(req: Request) {
  const admin = await verifyAdminFromRequest(req);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { data, error } = await admin.supabase
    .from("products")
    .select(
      "id,title,slug,price_cents,currency,status,is_active,cover_image_path,pdf_path,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ products: data ?? [] });
}

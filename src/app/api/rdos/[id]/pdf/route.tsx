import { renderToBuffer } from "@react-pdf/renderer";
import { RdoDocument } from "@/components/rdo/rdo-document";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: RouteContext<"/api/rdos/[id]/pdf">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const { data: rdo, error } = await auth.supabase.from("rdos").select("*, projects(name, address), rdo_labor(*), rdo_equipment(*), rdo_activities(*), rdo_occurrences(*)").eq("id", id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  const pdf = await renderToBuffer(<RdoDocument rdo={rdo} />);
  return new Response(pdf as unknown as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="rdo-${rdo.date}.pdf"` } });
}

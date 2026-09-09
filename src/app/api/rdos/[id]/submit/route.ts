import { requireUser } from "@/lib/supabase/server";

export async function POST(_: Request, ctx: RouteContext<"/api/rdos/[id]/submit">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const { data: rdo, error: lookupError } = await auth.supabase.from("rdos").select("status, created_by").eq("id", id).single();
  if (lookupError) return Response.json({ error: lookupError.message }, { status: 404 });
  if (!(["DRAFT", "WITH_NOTES"] as string[]).includes(rdo.status) || rdo.created_by !== auth.user.id) return Response.json({ error: "Envio não permitido." }, { status: 403 });
  const { data, error } = await auth.supabase.from("rdos").update({ status: "PENDING_APPROVAL", submitted_at: new Date().toISOString() }).eq("id", id).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data);
}

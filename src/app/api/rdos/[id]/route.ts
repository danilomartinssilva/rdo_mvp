import { requireUser } from "@/lib/supabase/server";
import { rdoSchema } from "@/lib/validation";

export async function GET(_: Request, ctx: RouteContext<"/api/rdos/[id]">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const { data, error } = await auth.supabase.from("rdos").select("*, projects(name, address, client_name), users!rdos_created_by_fkey(name), rdo_labor(*), rdo_equipment(*), rdo_activities(*), rdo_occurrences(*), rdo_photos(*), rdo_approvals(*, users(name))").eq("id", id).single();
  return error ? Response.json({ error: error.message }, { status: 404 }) : Response.json(data);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/rdos/[id]">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const parsed = rdoSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Dados do RDO inválidos.", details: parsed.error.flatten() }, { status: 422 });
  const { id } = await ctx.params; const { labor, equipment, activities, occurrences, project_id, ...rdo } = parsed.data;
  const { data: existing, error: lookupError } = await auth.supabase.from("rdos").select("status, created_by").eq("id", id).single();
  if (lookupError) return Response.json({ error: lookupError.message }, { status: 404 });
  if (!(["DRAFT", "WITH_NOTES"] as string[]).includes(existing.status)) return Response.json({ error: "Este RDO não pode mais ser editado." }, { status: 409 });
  const { data, error } = await auth.supabase.from("rdos").update({ ...rdo, project_id }).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const childTables = ["rdo_labor", "rdo_equipment", "rdo_activities", "rdo_occurrences"] as const;
  const inserts = [labor, equipment, activities, occurrences];
  await Promise.all(childTables.map(async (table, index) => {
    await auth.supabase.from(table).delete().eq("rdo_id", id);
    if (inserts[index].length) await auth.supabase.from(table).insert(inserts[index].map((row) => ({ ...row, rdo_id: id })));
  }));
  return Response.json(data);
}

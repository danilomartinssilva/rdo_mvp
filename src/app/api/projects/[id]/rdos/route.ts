import { requireUser } from "@/lib/supabase/server";
import { rdoSchema } from "@/lib/validation";

export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]/rdos">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params; const url = new URL(request.url);
  let query = auth.supabase.from("rdos").select("id, date, status, weather_morning, weather_afternoon, created_at").eq("project_id", id).order("date", { ascending: false });
  if (url.searchParams.get("status")) query = query.eq("status", url.searchParams.get("status")!);
  if (url.searchParams.get("from")) query = query.gte("date", url.searchParams.get("from")!);
  if (url.searchParams.get("to")) query = query.lte("date", url.searchParams.get("to")!);
  const { data, error } = await query;
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data);
}

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/rdos">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params; const parsed = rdoSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.project_id !== id) return Response.json({ error: "Dados do RDO inválidos.", details: parsed.error?.flatten() }, { status: 422 });
  const { labor, equipment, activities, occurrences, ...rdo } = parsed.data;
  const { data, error } = await auth.supabase.from("rdos").insert({ ...rdo, created_by: auth.user.id }).select().single();
  if (error) return Response.json({ error: error.code === "23505" ? "Já existe um RDO para esta data." : error.message }, { status: 409 });
  await Promise.all([
    labor.length && auth.supabase.from("rdo_labor").insert(labor.map((row) => ({ ...row, rdo_id: data.id }))),
    equipment.length && auth.supabase.from("rdo_equipment").insert(equipment.map((row) => ({ ...row, rdo_id: data.id }))),
    activities.length && auth.supabase.from("rdo_activities").insert(activities.map((row) => ({ ...row, rdo_id: data.id }))),
    occurrences.length && auth.supabase.from("rdo_occurrences").insert(occurrences.map((row) => ({ ...row, rdo_id: data.id }))),
  ]);
  return Response.json(data, { status: 201 });
}

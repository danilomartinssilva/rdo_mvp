import { requireUser } from "@/lib/supabase/server";
import { approvalSchema } from "@/lib/validation";

export async function POST(request: Request, ctx: RouteContext<"/api/rdos/[id]/approval">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const parsed = approvalSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  const { id } = await ctx.params;
  const { data: rdo, error: lookupError } = await auth.supabase.from("rdos").select("status").eq("id", id).single();
  if (lookupError) return Response.json({ error: lookupError.message }, { status: 404 });
  if (rdo.status !== "PENDING_APPROVAL") return Response.json({ error: "Somente RDOs enviados podem ser aprovados." }, { status: 409 });
  const { error: updateError } = await auth.supabase.from("rdos").update({ status: parsed.data.status }).eq("id", id);
  if (updateError) return Response.json({ error: updateError.message }, { status: 400 });
  const { data, error } = await auth.supabase.from("rdo_approvals").insert({ rdo_id: id, approved_by: auth.user.id, ...parsed.data }).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data, { status: 201 });
}

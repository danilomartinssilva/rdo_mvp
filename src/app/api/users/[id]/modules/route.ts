import { requireUser } from "@/lib/supabase/server";
export async function POST(
  _: Request,
  ctx: RouteContext<"/api/users/[id]/modules">,
) {
  const a = await requireUser();
  if ("error" in a) return a.error;
  const { id } = await ctx.params;
  const { error } = await a.supabase
    .from("user_module_access")
    .upsert({ user_id: id, module: "BUDGET", granted_by: a.user.id });
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
export async function DELETE(
  _: Request,
  ctx: RouteContext<"/api/users/[id]/modules">,
) {
  const a = await requireUser();
  if ("error" in a) return a.error;
  const { id } = await ctx.params;
  const { error } = await a.supabase
    .from("user_module_access")
    .delete()
    .eq("user_id", id)
    .eq("module", "BUDGET");
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : new Response(null, { status: 204 });
}

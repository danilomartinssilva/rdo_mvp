import { requireUser } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validation";

export async function GET(_: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const { data, error } = await auth.supabase.from("projects").select("*, project_users(user_id, role, users(name, email))").eq("id", id).single();
  return error ? Response.json({ error: error.message }, { status: 404 }) : Response.json(data);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const parsed = projectSchema.partial().safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Dados da obra inválidos." }, { status: 422 });
  const { id } = await ctx.params;
  const { data, error } = await auth.supabase.from("projects").update(parsed.data).eq("id", id).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data);
}

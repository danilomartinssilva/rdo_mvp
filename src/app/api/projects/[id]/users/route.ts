import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const membershipSchema = z.object({ user_id: z.string().uuid(), role: z.enum(["ADMIN", "FIELD", "INSPECTOR"]).nullable().optional() });

export async function GET(_: Request, ctx: RouteContext<"/api/projects/[id]/users">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params; const { data, error } = await auth.supabase.from("project_users").select("user_id, role, users(name, email)").eq("project_id", id);
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data);
}

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/users">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const parsed = membershipSchema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Vínculo inválido." }, { status: 422 });
  const { id } = await ctx.params; const { data, error } = await auth.supabase.from("project_users").upsert({ project_id: id, ...parsed.data }).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data, { status: 201 });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/projects/[id]/users">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const userId = new URL(request.url).searchParams.get("user_id"); if (!userId) return Response.json({ error: "user_id é obrigatório." }, { status: 422 });
  const { id } = await ctx.params; const { error } = await auth.supabase.from("project_users").delete().eq("project_id", id).eq("user_id", userId);
  return error ? Response.json({ error: error.message }, { status: 400 }) : new Response(null, { status: 204 });
}

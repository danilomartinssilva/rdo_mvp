import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(2).max(160),
  bdi_percent: z.number().min(0).max(100).default(0),
});
export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const projectId = new URL(request.url).searchParams.get("project_id");
  let query = auth.supabase
    .from("budgets")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json(data);
}
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return Response.json(
      { error: "Dados do orçamento inválidos." },
      { status: 422 },
    );
  const { count } = await auth.supabase
    .from("budgets")
    .select("*", { count: "exact", head: true })
    .eq("project_id", parsed.data.project_id);
  const { data, error } = await auth.supabase
    .from("budgets")
    .insert({
      ...parsed.data,
      version: (count ?? 0) + 1,
      created_by: auth.user.id,
    })
    .select()
    .single();
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json(data, { status: 201 });
}

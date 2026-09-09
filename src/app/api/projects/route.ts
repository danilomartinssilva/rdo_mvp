import { requireUser } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.supabase.from("projects").select("*").order("name");
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Dados da obra inválidos.", details: parsed.error.flatten() }, { status: 422 });
  const { data, error } = await auth.supabase.from("projects").insert(parsed.data).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data, { status: 201 });
}

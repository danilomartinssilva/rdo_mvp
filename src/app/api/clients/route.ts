import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(150),
  document: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
});
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from("clients")
    .select("*")
    .order("name");
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
      { error: "Dados do cliente inválidos." },
      { status: 422 },
    );
  const { data, error } = await auth.supabase
    .from("clients")
    .insert(parsed.data)
    .select()
    .single();
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json(data, { status: 201 });
}

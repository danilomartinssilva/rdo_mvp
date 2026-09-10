import { requireUser } from "@/lib/supabase/server";
export async function GET() {
  const a = await requireUser();
  if ("error" in a) return a.error;
  const { data, error } = await a.supabase
    .from("users")
    .select("id,name,email,role,user_module_access(modules(code))")
    .order("name");
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json(data);
}

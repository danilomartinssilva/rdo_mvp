import { requireUser } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("users")
    .select("id, name, email, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  const { data: modules } = await auth.supabase.from("user_module_access").select("modules(code)").eq("user_id", auth.user.id);
  return Response.json({ ...(data ?? {
    id: auth.user.id,
    name: auth.user.user_metadata.full_name ?? auth.user.email?.split("@")[0] ?? "",
    email: auth.user.email,
    role: null,
  }), modules: modules?.flatMap((item) => item.modules?.map((module) => module.code) ?? []) ?? [] });
}

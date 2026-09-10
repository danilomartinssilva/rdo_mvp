import { requireUser } from "@/lib/supabase/server";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]/logo">,
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return Response.json({ error: "Envie uma logo PNG, JPG ou WebP." }, { status: 422 });
  }
  if (file.size > MAX_LOGO_SIZE) return Response.json({ error: "A logo deve ter no máximo 2 MB." }, { status: 422 });

  const { data: project, error: projectError } = await auth.supabase
    .from("projects")
    .select("logo_path")
    .eq("id", id)
    .single();
  if (projectError) return Response.json({ error: projectError.message }, { status: 404 });

  const extension = file.name.split(".").pop() || "png";
  const path = `${id}/logo-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await auth.supabase.storage
    .from("project-logos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("projects")
    .update({ logo_path: path })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    await auth.supabase.storage.from("project-logos").remove([path]);
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (project.logo_path) await auth.supabase.storage.from("project-logos").remove([project.logo_path]);
  const { data: publicUrl } = auth.supabase.storage.from("project-logos").getPublicUrl(path);
  return Response.json({ project: data, logo_url: publicUrl.publicUrl });
}

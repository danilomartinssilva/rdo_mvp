import { requireUser } from "@/lib/supabase/server";

const MAX_PHOTOS = 6;

export async function POST(request: Request, ctx: RouteContext<"/api/rdos/[id]/photos">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id } = await ctx.params; const form = await request.formData();
  const file = form.get("file"); const caption = form.get("caption");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return Response.json({ error: "Envie uma imagem válida." }, { status: 422 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "A imagem deve ter no máximo 8 MB." }, { status: 422 });
  const { count } = await auth.supabase.from("rdo_photos").select("*", { count: "exact", head: true }).eq("rdo_id", id);
  if ((count ?? 0) >= MAX_PHOTOS) return Response.json({ error: "O RDO permite no máximo 6 fotos." }, { status: 409 });
  const extension = file.name.split(".").pop() || "jpg"; const path = `${id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await auth.supabase.storage.from("rdo-photos").upload(path, file, { contentType: file.type });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 400 });
  const { data, error } = await auth.supabase.from("rdo_photos").insert({ rdo_id: id, path, caption: typeof caption === "string" ? caption.slice(0, 280) : null, position: count ?? 0 }).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data, { status: 201 });
}

import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";

const copySchema = z.object({ source_rdo_id: z.string().uuid() });
const MAX_PHOTOS = 6;

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/rdos/[id]/photos/copy">,
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const parsed = copySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "RDO de origem inválido." }, { status: 422 });

  const { id } = await ctx.params;
  const { data: destination, error: destinationError } = await auth.supabase
    .from("rdos")
    .select("project_id, status, created_by")
    .eq("id", id)
    .single();
  if (destinationError) return Response.json({ error: destinationError.message }, { status: 404 });
  if (destination.created_by !== auth.user.id || !["DRAFT", "WITH_NOTES"].includes(destination.status)) {
    return Response.json({ error: "Este RDO não permite copiar fotos." }, { status: 409 });
  }

  const { data: source, error: sourceError } = await auth.supabase
    .from("rdos")
    .select("project_id, rdo_photos(path, caption)")
    .eq("id", parsed.data.source_rdo_id)
    .single();
  if (sourceError) return Response.json({ error: sourceError.message }, { status: 404 });
  if (source.project_id !== destination.project_id) return Response.json({ error: "O RDO de origem deve pertencer à mesma obra." }, { status: 422 });

  const { count, error: countError } = await auth.supabase
    .from("rdo_photos")
    .select("*", { count: "exact", head: true })
    .eq("rdo_id", id);
  if (countError) return Response.json({ error: countError.message }, { status: 400 });
  if ((count ?? 0) + source.rdo_photos.length > MAX_PHOTOS) {
    return Response.json({ error: "A cópia excede o limite de 6 fotos do RDO." }, { status: 409 });
  }

  const copied = [];
  for (const photo of source.rdo_photos) {
    const { data: file, error: downloadError } = await auth.supabase.storage.from("rdo-photos").download(photo.path);
    if (downloadError || !file) return Response.json({ error: downloadError?.message ?? "Não foi possível ler uma foto de origem." }, { status: 400 });
    const extension = photo.path.split(".").pop() || "jpg";
    const path = `${id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await auth.supabase.storage.from("rdo-photos").upload(path, file, { contentType: file.type });
    if (uploadError) return Response.json({ error: uploadError.message }, { status: 400 });
    const { error: photoError } = await auth.supabase.from("rdo_photos").insert({ rdo_id: id, path, caption: photo.caption, position: (count ?? 0) + copied.length });
    if (photoError) {
      await auth.supabase.storage.from("rdo-photos").remove([path]);
      return Response.json({ error: photoError.message }, { status: 400 });
    }
    copied.push({ path, caption: photo.caption });
  }
  return Response.json(copied, { status: 201 });
}

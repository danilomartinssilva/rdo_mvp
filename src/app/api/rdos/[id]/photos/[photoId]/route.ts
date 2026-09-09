import { requireUser } from "@/lib/supabase/server";

export async function DELETE(_: Request, ctx: RouteContext<"/api/rdos/[id]/photos/[photoId]">) {
  const auth = await requireUser(); if ("error" in auth) return auth.error;
  const { id, photoId } = await ctx.params;
  const { data: photo, error } = await auth.supabase.from("rdo_photos").select("path").eq("id", photoId).eq("rdo_id", id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  await auth.supabase.storage.from("rdo-photos").remove([photo.path]);
  const { error: deleteError } = await auth.supabase.from("rdo_photos").delete().eq("id", photoId);
  return deleteError ? Response.json({ error: deleteError.message }, { status: 400 }) : new Response(null, { status: 204 });
}

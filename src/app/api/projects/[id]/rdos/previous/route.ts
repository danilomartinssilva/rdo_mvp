import { requireUser } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]/rdos/previous">,
) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const date = new URL(request.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Informe uma data válida." }, { status: 422 });
  }

  const { data, error } = await auth.supabase
    .from("rdos")
    .select("id, date, notes, weather_morning, weather_afternoon, rdo_labor(role_name, quantity, is_outsourced), rdo_equipment(type_name, quantity), rdo_activities(description), rdo_occurrences(type, description), rdo_photos(id, path, caption)")
    .eq("project_id", id)
    .lt("date", date)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ source_date: null, data: null });

  const photos = await Promise.all(data.rdo_photos.map(async (photo) => {
    const { data: signed } = await auth.supabase.storage
      .from("rdo-photos")
      .createSignedUrl(photo.path, 60 * 60);
    return { id: photo.id, caption: photo.caption, signed_url: signed?.signedUrl ?? null };
  }));

  return Response.json({
    source_id: data.id,
    source_date: data.date,
    data: {
      labor: data.rdo_labor,
      equipment: data.rdo_equipment,
      activities: data.rdo_activities.map((activity) => ({ ...activity, status: "IN_PROGRESS" })),
      occurrences: data.rdo_occurrences,
      weather_morning: data.weather_morning,
      weather_afternoon: data.weather_afternoon,
      notes: data.notes ?? "",
    },
    photos,
  });
}

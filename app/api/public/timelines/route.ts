import { supabaseAdmin } from "@/app/lib/supabase";

export async function GET() {
  if (!supabaseAdmin) return Response.json({ timelines: [] });

  const { data, error } = await supabaseAdmin
    .from("saved_timelines")
    .select("id, nickname, events, birth_year, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[timelines]", error);
    return Response.json({ timelines: [] });
  }

  return Response.json({ timelines: data ?? [] });
}

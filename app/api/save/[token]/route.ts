import { supabaseAdmin } from "@/app/lib/supabase";
import { sanitize } from "@/app/lib/sanitize";
import type { TimelineEvent } from "@/app/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!supabaseAdmin) return Response.json({ error: "サービスが利用できません" }, { status: 503 });

  const { token } = await params;
  const { data, error } = await supabaseAdmin
    .from("saved_timelines")
    .select("id, edit_token, nickname, birth_year, events, is_public, notify_ok, created_at, updated_at")
    .eq("edit_token", token)
    .single();

  if (error || !data) return Response.json({ error: "年表が見つかりません" }, { status: 404 });

  return Response.json({ timeline: { ...data, email: undefined } });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!supabaseAdmin) return Response.json({ error: "サービスが利用できません" }, { status: 503 });

  const { token } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "不正なリクエストです" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.nickname === "string") {
    updates.nickname = sanitize(body.nickname).slice(0, 30);
  }
  if (typeof body.is_public === "boolean") {
    updates.is_public = body.is_public;
  }
  if (Array.isArray(body.events)) {
    updates.events = body.events.slice(0, 50).map((e: TimelineEvent) => ({
      id: e.id,
      year: sanitize(String(e.year ?? "")).slice(0, 20),
      age: e.age ? sanitize(String(e.age)).slice(0, 10) : undefined,
      event: sanitize(String(e.event ?? "")).slice(0, 200),
      emotion: e.emotion ? sanitize(String(e.emotion)).slice(0, 50) : undefined,
    }));
  }

  const { error } = await supabaseAdmin
    .from("saved_timelines")
    .update(updates)
    .eq("edit_token", token);

  if (error) {
    console.error("[save/put]", error);
    return Response.json({ error: "更新に失敗しました" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!supabaseAdmin) return Response.json({ error: "サービスが利用できません" }, { status: 503 });

  const { token } = await params;
  const { error } = await supabaseAdmin
    .from("saved_timelines")
    .delete()
    .eq("edit_token", token);

  if (error) return Response.json({ error: "削除に失敗しました" }, { status: 500 });
  return Response.json({ ok: true });
}

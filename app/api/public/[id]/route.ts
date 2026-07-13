import { supabaseAdmin } from "@/app/lib/supabase";
import { sanitize } from "@/app/lib/sanitize";
import type { TimelineEvent } from "@/app/types";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(id: string, password: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const hash = await hashPassword(password);
  const { data } = await supabaseAdmin
    .from("public_timelines")
    .select("password_hash")
    .eq("id", id)
    .single();
  return data?.password_hash === hash;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) return Response.json({ error: "サービスが利用できません" }, { status: 503 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.password) return Response.json({ error: "パスワードが必要です" }, { status: 400 });

  if (!await verifyPassword(id, body.password)) {
    return Response.json({ error: "パスワードが正しくありません" }, { status: 403 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.nickname) updates.nickname = sanitize(String(body.nickname)).slice(0, 30);
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
    .from("public_timelines")
    .update(updates)
    .eq("id", id);

  if (error) return Response.json({ error: "更新に失敗しました" }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) return Response.json({ error: "サービスが利用できません" }, { status: 503 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.password) return Response.json({ error: "パスワードが必要です" }, { status: 400 });

  if (!await verifyPassword(id, body.password)) {
    return Response.json({ error: "パスワードが正しくありません" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("public_timelines")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: "削除に失敗しました" }, { status: 500 });
  return Response.json({ ok: true });
}

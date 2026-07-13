import { supabaseAdmin } from "@/app/lib/supabase";
import { sanitize } from "@/app/lib/sanitize";
import { sendSaveEmail } from "@/app/lib/sendSaveEmail";
import type { TimelineEvent } from "@/app/types";

export async function POST(request: Request) {
  if (!supabaseAdmin) return Response.json({ error: "サービスが利用できません" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "不正なリクエストです" }, { status: 400 });

  const { nickname, events, email, isPublic, notifyOk, birthYear } = body;
  if (!nickname || !Array.isArray(events) || !email) {
    return Response.json({ error: "必要な情報が不足しています" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }

  const safeNickname = sanitize(String(nickname)).slice(0, 30);
  const safeEmail = String(email).trim().toLowerCase().slice(0, 200);
  const safeEvents = events.slice(0, 50).map((e: TimelineEvent) => ({
    id: e.id,
    year: sanitize(String(e.year ?? "")).slice(0, 20),
    age: e.age ? sanitize(String(e.age)).slice(0, 10) : undefined,
    event: sanitize(String(e.event ?? "")).slice(0, 200),
    emotion: e.emotion ? sanitize(String(e.emotion)).slice(0, 50) : undefined,
  }));

  const { data, error } = await supabaseAdmin
    .from("saved_timelines")
    .insert({
      nickname: safeNickname,
      events: safeEvents,
      email: safeEmail,
      is_public: Boolean(isPublic),
      notify_ok: Boolean(notifyOk),
      birth_year: birthYear ?? null,
    })
    .select("id, edit_token")
    .single();

  if (error) {
    console.error("[save]", error);
    return Response.json({ error: "保存に失敗しました" }, { status: 500 });
  }

  await sendSaveEmail({
    to: safeEmail,
    nickname: safeNickname,
    eventCount: safeEvents.length,
    editToken: data.edit_token,
    isPublic: Boolean(isPublic),
  }).catch((e) => console.error("[sendSaveEmail]", e));

  return Response.json({ id: data.id, editToken: data.edit_token });
}

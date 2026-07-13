import { supabaseAdmin } from "@/app/lib/supabase";
import { sanitize } from "@/app/lib/sanitize";
import type { TimelineEvent } from "@/app/types";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  if (!supabaseAdmin) return Response.json({ error: "サービスが利用できません" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "不正なリクエストです" }, { status: 400 });

  const { nickname, events, password, birthYear } = body;
  if (!nickname || !Array.isArray(events) || !password) {
    return Response.json({ error: "必要な情報が不足しています" }, { status: 400 });
  }

  const safeNickname = sanitize(String(nickname)).slice(0, 30);
  const passwordHash = await hashPassword(String(password));
  const safeEvents = events.slice(0, 50).map((e: TimelineEvent) => ({
    id: e.id,
    year: sanitize(String(e.year ?? "")).slice(0, 20),
    age: e.age ? sanitize(String(e.age)).slice(0, 10) : undefined,
    event: sanitize(String(e.event ?? "")).slice(0, 200),
    emotion: e.emotion ? sanitize(String(e.emotion)).slice(0, 50) : undefined,
  }));

  const { data, error } = await supabaseAdmin
    .from("public_timelines")
    .insert({ nickname: safeNickname, events: safeEvents, password_hash: passwordHash, birth_year: birthYear ?? null })
    .select("id")
    .single();

  if (error) {
    console.error("[publish]", error);
    return Response.json({ error: "公開に失敗しました" }, { status: 500 });
  }

  return Response.json({ id: data.id });
}

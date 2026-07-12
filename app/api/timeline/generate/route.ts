import { getTimelineModel, TIMELINE_SYSTEM_PROMPT, extractJSON } from "@/app/lib/gemini";
import { sanitize } from "@/app/lib/sanitize";
import { checkRateLimit } from "@/app/lib/rateLimit";
import type { NenpyoSpec, QAItem, TimelineEvent } from "@/app/types";

const MAX_QA_ITEMS   = 60;
const MAX_QA_CONTENT = 800;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ error: "不正なリクエストです" }, { status: 400 });

    const { spec, qa_history, clientId }: {
      spec: NenpyoSpec;
      qa_history: QAItem[];
      clientId?: string | null;
    } = body;

    const identifier = clientId?.trim() || "anonymous";
    const { ok } = checkRateLimit(identifier, "nenpyo-timeline", 5);
    if (!ok) return Response.json({ error: "本日の年表生成回数の上限（5回）に達しました。明日またお試しください。" }, { status: 429 });

    const name = sanitize(spec?.name ?? "あなた");
    const birthYear = Number(spec?.birthYear) || 1980;

    const safeHistory = Array.isArray(qa_history)
      ? qa_history.slice(0, MAX_QA_ITEMS).map((item) => ({
          role: item.role === "ai" ? "ai" : "user",
          content: sanitize(String(item.content ?? "")).slice(0, MAX_QA_CONTENT),
        } as QAItem))
      : [];

    const qaText = safeHistory
      .map((item) =>
        item.role === "ai"
          ? `ねんピョウ: ${item.content}`
          : `${name}さん: ${item.content}`
      )
      .join("\n\n");

    const model = getTimelineModel();

    const prompt = `${TIMELINE_SYSTEM_PROMPT}

---

以下のインタビュー内容から「じぶん年表」のデータを抽出してください。

【対象者】${name}さん（生まれ年：${birthYear}年）

【インタビュー内容】
${qaText}

上記から時系列順に年表データをJSON配列で出力してください。`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = extractJSON(result.response.text());
    const events = JSON.parse(raw) as Omit<TimelineEvent, "id">[];

    const timeline: TimelineEvent[] = events.map((e, i) => ({
      id: `ev-${i}-${Date.now()}`,
      year: e.year ?? "",
      age: e.age ?? "",
      event: e.event ?? "",
      emotion: e.emotion ?? "",
    }));

    return Response.json({ timeline });
  } catch (err) {
    console.error("[/api/timeline/generate]", err);
    return Response.json({ error: "年表の生成に失敗しました" }, { status: 500 });
  }
}

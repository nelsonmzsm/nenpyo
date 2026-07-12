import { getInterviewModel, buildInterviewSystemPrompt, extractJSON } from "@/app/lib/gemini";
import { sanitize, limitLen, wrapUserInput } from "@/app/lib/sanitize";
import type { NenpyoSpec, InterviewResponse } from "@/app/types";
import { calcMaxQuestions } from "@/app/types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ error: "不正なリクエストです" }, { status: 400 });

    const { spec }: { spec: NenpyoSpec } = body;

    const name = sanitize(spec?.name ?? "あなた");
    const birthYear = Number(spec?.birthYear) || 1980;
    const maxQuestions = calcMaxQuestions(birthYear);
    const systemPrompt = buildInterviewSystemPrompt(name, maxQuestions, birthYear);
    const model = getInterviewModel();

    const overview = limitLen(`${name}さんの半生を聞いて年表を作る`, 200);

    const prompt = `${systemPrompt}

---

${name}さんにインタビューを開始します。カテゴリ「①生い立ち・幼少期」の最初の質問を生成してください。acknowledgementは空文字にしてください。

${wrapUserInput("インタビュー対象", overview!)}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const data = JSON.parse(extractJSON(result.response.text())) as InterviewResponse;
    return Response.json(data);
  } catch (err) {
    console.error("[/api/interview/start]", err);
    return Response.json({ error: "インタビューの開始に失敗しました" }, { status: 500 });
  }
}

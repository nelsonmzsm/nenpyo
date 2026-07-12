import { getInterviewModel, buildInterviewSystemPrompt, extractJSON } from "@/app/lib/gemini";
import { sanitize, limitLen, wrapUserInput } from "@/app/lib/sanitize";
import { checkRateLimit } from "@/app/lib/rateLimit";
import type { NenpyoSpec, QAItem, InterviewResponse } from "@/app/types";
import { calcMaxQuestions } from "@/app/types";

const MAX_ANSWER   = 600;
const MAX_QA_ITEMS = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ error: "不正なリクエストです" }, { status: 400 });

    const { spec, qa_history, answer: rawAnswer, skipped, closingAsked = false, clientId }: {
      spec: NenpyoSpec;
      qa_history: QAItem[];
      answer: string;
      skipped?: boolean;
      closingAsked?: boolean;
      clientId?: string | null;
    } = body;

    const identifier = clientId?.trim() || "anonymous";
    const { ok } = checkRateLimit(identifier, "nenpyo-interview", 60);
    if (!ok) return Response.json({ error: "本日の利用回数の上限に達しました。明日またお試しください。" }, { status: 429 });

    const name = sanitize(spec?.name ?? "あなた");
    const birthYear = Number(spec?.birthYear) || 1980;
    const maxQuestions = calcMaxQuestions(birthYear);

    const answer = skipped ? "" : limitLen(sanitize(rawAnswer ?? ""), MAX_ANSWER);
    if (!skipped && answer === null) {
      return Response.json({ error: `回答は${MAX_ANSWER}字以内にしてください` }, { status: 400 });
    }

    const safeHistory = Array.isArray(qa_history)
      ? qa_history.slice(0, MAX_QA_ITEMS).map((item) => ({
          role: item.role === "ai" ? "ai" : "user",
          content: sanitize(String(item.content ?? "")).slice(0, MAX_ANSWER),
        } as QAItem))
      : [];

    const systemPrompt = buildInterviewSystemPrompt(name, maxQuestions, birthYear);
    const model = getInterviewModel();

    const prevUserAnswerCount = safeHistory.filter((q) => q.role === "user").length;

    const historyText = safeHistory
      .map((item) =>
        item.role === "ai"
          ? `ねんピョウ: ${item.content}`
          : `${name}さん: ${item.content}`
      )
      .join("\n\n");

    const newAnswerLine = skipped
      ? `${name}さん: （この質問はスキップしました）`
      : wrapUserInput(`${name}さんの回答`, answer!);

    let closingInstruction = "";
    if (closingAsked) {
      closingInstruction = `\n\n【重要指示】締めくくりの自由回答を受け取りました。必ず is_complete: true を返してください。`;
    } else if (prevUserAnswerCount >= maxQuestions - 1) {
      closingInstruction = `\n\n【重要指示】インタビューは終盤です。必ず is_complete: false のまま、「ほかに伝えたいことはありますか？」という趣旨の締めくくり質問を1問だけ出してください。next_category は「⑧自由回答」にしてください。`;
    }

    const skipInstruction = skipped
      ? `\n\n【スキップ対応】ユーザーがこの質問をスキップしました。acknowledgement フィールドには「ではほかのことをお尋ねしますね」などの事務的なひとことのみ入れてください。感情的な相槌は使わないこと。`
      : "";

    const prompt = `${systemPrompt}

---

以下の内容で、インタビューの続きを進めてください。次の質問をJSONで生成してください。

【これまでのインタビュー（${prevUserAnswerCount}問回答済み／最大${maxQuestions}問）】
${historyText}

${newAnswerLine}

上記の続きとして次の質問を生成してください。${closingInstruction}${skipInstruction}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const data = JSON.parse(extractJSON(result.response.text())) as InterviewResponse;

    if (closingAsked && !data.is_complete) {
      return Response.json({ ...data, is_complete: true });
    }

    if (!closingAsked && data.is_complete) {
      return Response.json({
        acknowledgement: data.acknowledgement ?? "",
        next_category: "⑧自由回答",
        question_number_in_category: 1,
        question: `インタビューもいよいよ最後になりました。${name}さんから、ほかに伝えたいことや、この年表を見る方へのひとことがあれば、自由にお話しいただけますか？`,
        is_complete: false,
      } satisfies InterviewResponse);
    }

    return Response.json(data);
  } catch (err) {
    console.error("[/api/interview/answer]", err);
    return Response.json({ error: "回答の処理に失敗しました" }, { status: 500 });
  }
}

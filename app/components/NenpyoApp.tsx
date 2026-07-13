"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { NenpyoSpec, QAItem, InterviewResponse, TimelineEvent } from "@/app/types";
import { calcMaxQuestions, categoryToAge } from "@/app/types";
import { SaveModal } from "./SaveModal";
import { PublicTimelinesFeed } from "./PublicTimelinesFeed";

/* ─── フェードインテキスト ─── */

function FadeInText({ text, isNew }: { text: string; isNew: boolean }) {
  const chunks: string[] = [];
  text.split(/(\n)/).forEach((part) => {
    if (part === "\n") { chunks.push("\n"); return; }
    for (let i = 0; i < part.length; i += 4) chunks.push(part.slice(i, i + 4));
  });
  const [visibleCount, setVisibleCount] = useState(isNew ? 0 : chunks.length);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isNew) return;
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= chunks.length) { clearInterval(timerRef.current!); timerRef.current = null; }
    }, 75);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="whitespace-pre-wrap">
      {chunks.map((chunk, i) => {
        if (chunk === "\n") return <br key={i} />;
        const visible = i < visibleCount;
        return (
          <span key={i} style={{
            opacity: visible ? 1 : 0,
            filter: visible ? "blur(0px)" : "blur(4px)",
            transform: visible ? "translateY(0)" : "translateY(5px)",
            transition: "opacity 0.55s ease-out, filter 0.55s ease-out, transform 0.5s ease-out",
            display: "inline",
          }}>{chunk}</span>
        );
      })}
    </span>
  );
}

/* ─── 型 ─── */

type Screen = "spec" | "interview" | "timeline";
type Message = { role: "ai" | "user"; text: string; category?: string; isNew?: boolean };
type Orientation = "horizontal" | "vertical";

/* ─── ヘッダー ─── */

function Header({ screen, name }: { screen: Screen; name?: string }) {
  return (
    <header className="border-b border-nborder bg-npanel px-5 py-4 flex items-center gap-3">
      <span className="text-3xl">🐆</span>
      <div>
        <span className="font-display italic text-ngold text-2xl tracking-tight">じぶん年表</span>
        <span className="text-xs text-ngray border border-nborder px-1.5 py-0.5 tracking-wider ml-2">β版</span>
      </div>
      {screen === "interview" && name && (
        <span className="ml-auto text-sm text-ngray">{name}さんの半生</span>
      )}
    </header>
  );
}

/* ─── 仕様入力画面 ─── */

function SpecScreen({
  onStart,
  startError,
}: {
  onStart: (spec: NenpyoSpec) => void;
  startError: string | null;
}) {
  const [name, setName] = useState("");
  const [kana, setKana] = useState("");
  const [birthYear, setBirthYear] = useState("");

  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - Number(birthYear) : null;
  const maxQ = birthYear ? calcMaxQuestions(Number(birthYear)) : 8;

  const canStart = name.trim().length > 0 && birthYear.length === 4 && Number(birthYear) >= 1900 && Number(birthYear) <= currentYear;

  return (
    <div className="min-h-screen bg-nbase flex flex-col">
      <Header screen="spec" />
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg">
          <div className="bg-npanel border border-nborder p-7 mb-6">
            <div className="flex items-start gap-4 mb-8">
              <span className="text-4xl flex-shrink-0">🐆</span>
              <div className="bg-ndark border border-nborder px-5 py-4 text-base text-ntext leading-loose">
                こんにちは！わたしは「ねんピョウ」です。あなたの半生をインタビューして、「じぶん年表」を作るお手伝いをします。まず、お名前と生まれ年を教えてください！
                <p className="mt-3 text-sm text-ngray">
                  🕐 所要時間の目安：
                  {age !== null
                    ? `約${maxQ * 2}〜${maxQ * 3}分（${maxQ}問）`
                    : "約15〜25分（生まれ年を入力すると更新します）"}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-ntext block mb-2">お名前 <span className="text-ngold">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：田中 太郎"
                  className="w-full border-2 border-nborder bg-nbase px-4 py-3 text-base text-ntext focus:outline-none focus:border-ngold"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-ntext block mb-2">読み方 <span className="text-ngray text-sm font-normal">（任意）</span></label>
                <input
                  type="text"
                  value={kana}
                  onChange={(e) => setKana(e.target.value)}
                  placeholder="例：たなか たろう"
                  className="w-full border-2 border-nborder bg-nbase px-4 py-3 text-base text-ntext focus:outline-none focus:border-ngold"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-ntext block mb-2">生まれ年（西暦） <span className="text-ngold">*</span></label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="例：1985"
                  min="1900"
                  max={currentYear}
                  className="w-full border-2 border-nborder bg-nbase px-4 py-3 text-base text-ntext focus:outline-none focus:border-ngold"
                />
                {age !== null && (
                  <p className="text-sm text-ngray mt-2">現在 {age}歳 ／ インタビュー約{maxQ}問の予定</p>
                )}
              </div>
            </div>
          </div>

          {startError && (
            <p className="text-red-500 text-sm text-center mb-4">{startError}</p>
          )}

          <button
            onClick={() => canStart && onStart({ name: name.trim(), birthYear: Number(birthYear), kana: kana.trim() || undefined })}
            disabled={!canStart}
            className="w-full bg-ngold text-white py-4 text-lg font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            インタビューをはじめる
          </button>

          <p className="text-sm text-ngray text-center mt-5">
            入力した情報はAIインタビューにのみ使用します
          </p>
        </div>
      </div>

      <PublicTimelinesFeed />
    </div>
  );
}

/* ─── インタビュー画面 ─── */

function InterviewScreen({
  spec,
  messages,
  input,
  setInput,
  isLoading,
  error,
  isInterviewComplete,
  answeredCount,
  onSend,
  onSkip,
  onGenerateTimeline,
  isGeneratingTimeline,
  interviewHistoryLen,
  onBack,
}: {
  spec: NenpyoSpec;
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  error: string | null;
  isInterviewComplete: boolean;
  answeredCount: number;
  onSend: () => void;
  onSkip: () => void;
  onGenerateTimeline: () => void;
  isGeneratingTimeline: boolean;
  interviewHistoryLen: number;
  onBack: () => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const maxQ = calcMaxQuestions(spec.birthYear);
  const currentAge = new Date().getFullYear() - spec.birthYear;
  const currentCategory = [...messages].reverse().find(m => m.role === "ai" && m.category)?.category ?? "";
  const coveredAge = categoryToAge(currentCategory, currentAge);
  const ageProgress = currentAge > 0 ? Math.min(100, Math.round((coveredAge / currentAge) * 100)) : 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) { e.preventDefault(); onSend(); }
  };

  return (
    <div className="min-h-screen bg-nbase flex flex-col">
      <Header screen="interview" name={spec.name} />

      {/* プログレス（問数ベース・sticky固定） */}
      <div className="bg-npanel border-b border-nborder px-5 pt-5 pb-3 no-print sticky top-0 z-10">
        {/* バー＋ねんピョウ */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-ngray flex-shrink-0">開始</span>
          <div className="flex-1 relative" style={{ height: "1.75rem" }}>
            {/* バー背景 */}
            <div className="absolute inset-x-0 bottom-0 h-2.5 bg-ndark rounded-full overflow-hidden">
              <div
                className="h-full bg-ngold rounded-full"
                style={{ width: `${Math.min(100, Math.round((answeredCount / maxQ) * 100))}%`, transition: "width 0.7s ease" }}
              />
            </div>
            {/* ねんピョウ */}
            <div
              className="absolute bottom-2 nenpyo-run"
              style={{
                left: `${Math.min(100, Math.round((answeredCount / maxQ) * 100))}%`,
                transform: "translateX(-50%)",
                transition: "left 0.7s ease",
                fontSize: "1.1rem",
                lineHeight: 1,
              }}
            >
              🐆
            </div>
          </div>
          <span className="text-xs text-ngray flex-shrink-0">現在（{currentAge}歳）</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ngold flex-1 truncate">{currentCategory || "①生い立ち・幼少期"}</span>
          <span className="text-xs text-ngray flex-shrink-0">{answeredCount}/{maxQ}問</span>
          {interviewHistoryLen > 0 && (
            <button onClick={onBack} className="text-xs text-ngray hover:text-ntext transition-colors flex-shrink-0 px-2 py-0.5 border border-nborder ml-1">
              ← 戻る
            </button>
          )}
        </div>
      </div>

      {/* メッセージ */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "ai" && <span className="text-3xl flex-shrink-0 mt-1">🐆</span>}
            <div className={`max-w-[85%] px-5 py-4 text-base leading-loose ${
              msg.role === "ai"
                ? "bg-npanel border border-nborder text-ntext"
                : "bg-ngold text-white"
            }`}>
              {msg.role === "ai" && msg.isNew
                ? <FadeInText text={msg.text} isNew={true} />
                : <span className="whitespace-pre-wrap">{msg.text}</span>
              }
              {msg.category && (
                <span className="block text-xs text-ngray mt-2 tracking-wider">{msg.category}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <span className="text-3xl flex-shrink-0 mt-1">🐆</span>
            <div className="bg-npanel border border-nborder px-5 py-4">
              <span className="text-ngray text-base animate-pulse">考え中…</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t border-nborder bg-npanel px-4 py-4 no-print">
        <div className="max-w-2xl mx-auto">
          {isInterviewComplete ? (
            <button
              onClick={onGenerateTimeline}
              disabled={isGeneratingTimeline}
              className="w-full bg-ngold text-white py-5 text-lg font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isGeneratingTimeline ? "年表を作成中…" : "🗓️ じぶん年表を作る"}
            </button>
          ) : (
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; }}
                placeholder="ここに入力してください（Enterで送信）"
                rows={3}
                disabled={isLoading}
                className="flex-1 border-2 border-nborder bg-nbase px-4 py-3 text-base text-ntext focus:outline-none focus:border-ngold resize-none disabled:opacity-50"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={onSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-ngold text-white px-6 py-3 text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex-1"
                >
                  送信
                </button>
                <button
                  onClick={onSkip}
                  disabled={isLoading}
                  className="border-2 border-nborder text-ngray px-6 py-3 text-sm hover:text-ntext hover:border-ntext transition-colors disabled:opacity-40"
                >
                  スキップ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── 年表画面 ─── */

function TimelineScreen({
  spec,
  events,
  onEventsChange,
  onRestart,
  onSave,
  savedToken,
}: {
  spec: NenpyoSpec;
  events: TimelineEvent[];
  onEventsChange: (events: TimelineEvent[]) => void;
  onRestart: () => void;
  onSave: () => void;
  savedToken: string | null;
}) {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const APP_URL = "https://nenpyo-sandy.vercel.app";
  const shareText = `じぶん年表をつくりました！\n${spec.name}さんの半生（${events.length}項目）\n\n${APP_URL}`;

  const updateEvent = (id: string, field: keyof TimelineEvent, value: string) => {
    onEventsChange(events.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const deleteEvent = (id: string) => {
    onEventsChange(events.filter((e) => e.id !== id));
  };

  const addEvent = () => {
    const newEvent: TimelineEvent = {
      id: `ev-new-${Date.now()}`,
      year: "",
      age: "",
      event: "",
      emotion: "",
    };
    onEventsChange([...events, newEvent]);
    setEditingId(newEvent.id);
  };

  const moveEvent = (id: string, dir: -1 | 1) => {
    const idx = events.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= events.length) return;
    const arr = [...events];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onEventsChange(arr);
  };

  const toPlainText = () => {
    const lines = [`【じぶん年表】${spec.name}さんの半生\n`];
    events.forEach((e) => {
      const yearAge = [e.year, e.age].filter(Boolean).join("（") + (e.age ? "）" : "");
      const emotion = e.emotion ? `　—— ${e.emotion}` : "";
      lines.push(`${yearAge}　${e.event}${emotion}`);
    });
    return lines.join("\n");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(toPlainText()).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-nbase flex flex-col">
      <Header screen="timeline" name={spec.name} />

      {/* ツールバー */}
      <div className="bg-npanel border-b border-nborder px-4 py-2 flex items-center gap-2 flex-wrap no-print">
        <span className="text-xs text-ngray mr-2">表示：</span>
        <button
          onClick={() => setOrientation("horizontal")}
          className={`text-xs px-3 py-1 border transition-colors ${orientation === "horizontal" ? "border-ngold text-ngold" : "border-nborder text-ngray hover:text-ntext"}`}
        >
          横書き（縦読み）
        </button>
        <button
          onClick={() => setOrientation("vertical")}
          className={`text-xs px-3 py-1 border transition-colors ${orientation === "vertical" ? "border-ngold text-ngold" : "border-nborder text-ngray hover:text-ntext"}`}
        >
          縦書き（右から左）
        </button>
        <div className="flex-1" />
        <button onClick={handleCopyText} className="text-xs px-3 py-1 border border-nborder text-ngray hover:text-ntext transition-colors">
          {copiedText ? "コピー済み ✓" : "テキストコピー"}
        </button>
        <button onClick={handlePrint} className="text-xs px-3 py-1 bg-ngold text-white hover:opacity-90 transition-opacity">
          PDF保存 / 印刷
        </button>
      </div>

      {/* 縦書きPDFは横向き */}
      {orientation === "vertical" && (
        <style>{`@media print { @page { size: A4 landscape; } }`}</style>
      )}

      <div className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {/* タイトルカード */}
        <div className="mb-6 print-container bg-npanel border border-nborder px-6 py-5 text-center">
          <h1 className={`font-display text-3xl text-ngold mb-2 ${orientation === "vertical" ? "writing-vertical mx-auto" : ""}`}>
            じぶん年表
          </h1>
          <p className="text-base font-bold text-ntext mb-2">{spec.name}さんの半生</p>
          <p className="text-sm text-ngray leading-relaxed max-w-xl mx-auto">
            {events.length > 0
              ? `${spec.birthYear}年生まれの${spec.name}さんが、AIインタビューで語った${events.length}の出来事を収めた記録です。外の世界で起きた出来事と、そのとき感じた内面の変化—ふたつが重なり合って、ひとつだけの「じぶん年表」ができました。`
              : `${spec.name}さんの半生をインタビューで紡ぎ出した年表です。`}
          </p>
        </div>

        {/* 年表本体（白い下敷き） */}
        <div className="bg-npanel border border-nborder px-4 py-5 print-container">
          {orientation === "horizontal" ? (
            <HorizontalTimeline
              events={events}
              editingId={editingId}
              setEditingId={setEditingId}
              onUpdate={updateEvent}
              onDelete={deleteEvent}
              onMove={moveEvent}
            />
          ) : (
            <VerticalTimeline
              events={events}
              editingId={editingId}
              setEditingId={setEditingId}
              onUpdate={updateEvent}
              onDelete={deleteEvent}
              onMove={moveEvent}
            />
          )}

          {/* 項目追加 */}
          <button
            onClick={addEvent}
            className="mt-4 w-full border border-dashed border-nborder text-ngray text-sm py-2 hover:border-ngold hover:text-ngold transition-colors no-print"
          >
            ＋ 項目を追加
          </button>
        </div>{/* /年表本体カード */}

        {/* 年表を保存 */}
        <div className="mt-8 no-print">
          {savedToken ? (
            <div className="bg-ndark border border-nborder px-4 py-3 flex items-start gap-3">
              <span className="text-ngold text-lg mt-0.5">✓</span>
              <div>
                <p className="text-sm font-bold text-ntext">年表を保存しました</p>
                <p className="text-xs text-ngray mt-0.5">編集リンクをメールでお送りしました。<a href={`/edit/${savedToken}`} className="text-ngold hover:opacity-70 underline">編集ページを開く →</a></p>
              </div>
            </div>
          ) : (
            <button
              onClick={onSave}
              className="w-full bg-ngold text-white py-3.5 text-base font-bold tracking-wider hover:opacity-90 transition-opacity"
            >
              📔 年表を保存する
            </button>
          )}
        </div>

        {/* SNSシェア */}
        <div className="mt-4 no-print">
          <p className="text-xs text-ngray mb-2 tracking-wider">シェアする</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank")}
              className="text-xs px-4 py-2 bg-black text-white hover:opacity-80 transition-opacity"
            >
              𝕏
            </button>
            <button
              onClick={() => window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`, "_blank")}
              className="text-xs px-4 py-2 text-white hover:opacity-80 transition-opacity"
              style={{ background: "#000000", border: "1px solid #444" }}
            >
              Threads
            </button>
            <button
              onClick={() => window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`, "_blank")}
              className="text-xs px-4 py-2 text-white hover:opacity-80 transition-opacity"
              style={{ background: "#0085FF" }}
            >
              Bluesky
            </button>
            <button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}`, "_blank")}
              className="text-xs px-4 py-2 text-white hover:opacity-80 transition-opacity"
              style={{ background: "#1877F2" }}
            >
              Facebook
            </button>
            <button
              onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`, "_blank")}
              className="text-xs px-4 py-2 text-white hover:opacity-80 transition-opacity"
              style={{ background: "#00B900" }}
            >
              LINE
            </button>
            <button
              onClick={() => window.open(`https://b.hatena.ne.jp/add?url=${encodeURIComponent(APP_URL)}&title=${encodeURIComponent(`じぶん年表 — ${spec.name}さんの半生`)}`, "_blank")}
              className="text-xs px-4 py-2 text-white hover:opacity-80 transition-opacity"
              style={{ background: "#00A4DE" }}
            >
              はてな
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(APP_URL).then(() => {
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                });
              }}
              className="text-xs px-4 py-2 border border-nborder text-ngray hover:text-ntext hover:border-ntext transition-colors"
            >
              {copiedUrl ? "コピー済み ✓" : "URLコピー"}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onRestart}
              className="text-xs px-4 py-2 border border-nborder text-ngray hover:text-ntext transition-colors"
            >
              最初からやり直す
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 横書き年表 ─── */

function HorizontalTimeline({
  events, editingId, setEditingId, onUpdate, onDelete, onMove,
}: {
  events: TimelineEvent[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (id: string, field: keyof TimelineEvent, value: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div className="space-y-0 print-container">
      {events.map((event, idx) => {
        const isEditing = editingId === event.id;
        return (
          <div key={event.id} className="flex gap-0 group">
            {/* 年・年齢 */}
            <div className="w-28 flex-shrink-0 py-3 pr-4 text-right">
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    className="w-full border border-ngold bg-nbase px-1 py-0.5 text-xs text-ntext focus:outline-none text-right"
                    value={event.year}
                    onChange={(e) => onUpdate(event.id, "year", e.target.value)}
                    placeholder="1990年"
                  />
                  <input
                    className="w-full border border-nborder bg-nbase px-1 py-0.5 text-xs text-ngray focus:outline-none text-right"
                    value={event.age ?? ""}
                    onChange={(e) => onUpdate(event.id, "age", e.target.value)}
                    placeholder="2歳"
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-ntext">{event.year}</p>
                  {event.age && <p className="text-xs text-ngray">{event.age}</p>}
                </>
              )}
            </div>

            {/* タイムラインライン */}
            <div className="flex flex-col items-center mx-2">
              <div className="w-3 h-3 rounded-full bg-ngold flex-shrink-0 mt-4" />
              {idx < events.length - 1 && <div className="w-0.5 flex-1 bg-nborder min-h-[1.5rem]" />}
            </div>

            {/* 内容 */}
            <div className="flex-1 py-3 pl-2 pb-4">
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    className="w-full border border-ngold bg-nbase px-2 py-1 text-sm text-ntext focus:outline-none"
                    value={event.event}
                    onChange={(e) => onUpdate(event.id, "event", e.target.value)}
                    placeholder="出来事を入力"
                  />
                  <input
                    className="w-full border border-nborder bg-nbase px-2 py-1 text-xs text-ngray focus:outline-none"
                    value={event.emotion ?? ""}
                    onChange={(e) => onUpdate(event.id, "emotion", e.target.value)}
                    placeholder="感情・動機（任意）"
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => setEditingId(null)} className="text-xs text-white bg-ngold px-3 py-1">保存</button>
                    <button onClick={() => onDelete(event.id)} className="text-xs text-red-400 border border-red-200 px-3 py-1">削除</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-ntext">{event.event}</p>
                    {event.emotion && <p className="text-xs text-ngold mt-0.5">{event.emotion}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print flex-shrink-0">
                    <button onClick={() => onMove(event.id, -1)} className="text-xs text-ngray hover:text-ntext px-1">↑</button>
                    <button onClick={() => onMove(event.id, 1)} className="text-xs text-ngray hover:text-ntext px-1">↓</button>
                    <button onClick={() => setEditingId(event.id)} className="text-xs text-ngray hover:text-ntext px-1">編集</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 縦書き年表（右から左・古い順） ─── */

function VerticalTimeline({
  events, editingId, setEditingId, onUpdate, onDelete, onMove,
}: {
  events: TimelineEvent[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (id: string, field: keyof TimelineEvent, value: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div className="overflow-x-auto print-container" style={{ minHeight: "400px", paddingBottom: "0.5rem" }}>
      {/* row-reverse: DOM順(古い→新しい)が右→左に並ぶ */}
      <div style={{ display: "flex", flexDirection: "row-reverse", width: "max-content", gap: "0.75rem", minHeight: "360px" }}>
        {events.map((event, idx) => {
          const isEditing = editingId === event.id;
          return (
            <div
              key={event.id}
              className="group"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "3.5rem", flexShrink: 0 }}
            >
              {/* 本文：縦書き（高さ固定で折り返しなし） */}
              <div style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                padding: "0.5rem 0",
                fontSize: "0.8rem",
                lineHeight: 1.6,
                color: "#1C1108",
                height: "16rem",
                overflow: "hidden",
                wordBreak: "break-all",
              }}>
                {isEditing ? (
                  <div style={{ writingMode: "horizontal-tb", width: "180px" }} className="space-y-1">
                    <input className="w-full border border-ngold bg-nbase px-2 py-1 text-sm text-ntext focus:outline-none" value={event.year} onChange={(e) => onUpdate(event.id, "year", e.target.value)} placeholder="1990年" />
                    <input className="w-full border border-nborder bg-nbase px-2 py-1 text-xs text-ngray focus:outline-none" value={event.age ?? ""} onChange={(e) => onUpdate(event.id, "age", e.target.value)} placeholder="2歳" />
                    <input className="w-full border border-ngold bg-nbase px-2 py-1 text-sm text-ntext focus:outline-none" value={event.event} onChange={(e) => onUpdate(event.id, "event", e.target.value)} placeholder="出来事" />
                    <input className="w-full border border-nborder bg-nbase px-2 py-1 text-xs text-ngray focus:outline-none" value={event.emotion ?? ""} onChange={(e) => onUpdate(event.id, "emotion", e.target.value)} placeholder="感情・動機（任意）" />
                    <div className="flex gap-1">
                      <button onClick={() => setEditingId(null)} className="text-xs text-white bg-ngold px-2 py-1">保存</button>
                      <button onClick={() => onDelete(event.id)} className="text-xs text-red-400 border border-red-200 px-2 py-1">削除</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {event.event}
                    {event.emotion && (
                      <span style={{ color: "#D97706", fontSize: "0.7rem" }}>―{event.emotion}</span>
                    )}
                  </>
                )}
              </div>

              {/* ドット＋横線 */}
              <div style={{ display: "flex", width: "100%", alignItems: "center", flexShrink: 0, padding: "0.25rem 0" }}>
                {/* 左線（新しい側）: idx < N-1 のとき存在 */}
                <div style={{ flex: 1, height: "1px", background: idx < events.length - 1 ? "#E8DCC8" : "transparent" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D97706", flexShrink: 0 }} />
                {/* 右線（古い側）: idx > 0 のとき存在 */}
                <div style={{ flex: 1, height: "1px", background: idx > 0 ? "#E8DCC8" : "transparent" }} />
              </div>

              {/* 年・年齢：縦書き */}
              <div style={{
                writingMode: "vertical-rl",
                fontSize: "0.65rem",
                color: "#6B7280",
                fontWeight: "bold",
                padding: "0.4rem 0",
                flexShrink: 0,
                overflow: "hidden",
                maxHeight: "5rem",
              }}>
                {event.year}{event.age ? `・${event.age}` : ""}
              </div>

              {/* 編集ボタン（ホバーで表示） */}
              {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity no-print" style={{ display: "flex", gap: "2px", paddingBottom: "4px" }}>
                  {/* ←=新しい方向、→=古い方向（row-reverseなのでDOMとは逆） */}
                  <button onClick={() => onMove(event.id, 1)} style={{ fontSize: "0.6rem", color: "#6B7280", padding: "1px 3px" }} title="新しい方向へ">←</button>
                  <button onClick={() => onMove(event.id, -1)} style={{ fontSize: "0.6rem", color: "#6B7280", padding: "1px 3px" }} title="古い方向へ">→</button>
                  <button onClick={() => setEditingId(event.id)} style={{ fontSize: "0.6rem", color: "#6B7280", padding: "1px 3px" }}>編集</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── メインアプリ ─── */

export function NenpyoApp() {
  const [screen, setScreen]               = useState<Screen>("spec");
  const [spec, setSpec]                   = useState<NenpyoSpec | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [qaHistory, setQaHistory]         = useState<QAItem[]>([]);
  const [input, setInput]                 = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [startError, setStartError]       = useState<string | null>(null);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isClosingAsked, setIsClosingAsked]           = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [clientId, setClientId]           = useState("");
  const [showSaveModal, setShowSaveModal]   = useState(false);
  const [savedToken, setSavedToken]         = useState<string | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<Array<{
    messages: Message[]; qaHistory: QAItem[]; answeredCount: number; isInterviewComplete: boolean; isClosingAsked: boolean;
  }>>([]);

  useEffect(() => {
    let id = localStorage.getItem("nenpyo-client-id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("nenpyo-client-id", id); }
    setClientId(id);
  }, []);

  /* ── インタビュー開始 ── */
  const handleStart = useCallback(async (s: NenpyoSpec) => {
    setStartError(null);
    setIsLoading(true);
    setSpec(s);
    // 前回のインタビュー状態をリセット
    setAnsweredCount(0);
    setIsInterviewComplete(false);
    setIsClosingAsked(false);
    setInterviewHistory([]);
    setInput("");
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: s }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "開始に失敗しました");
      }
      const data = await res.json() as InterviewResponse;
      const aiText = [data.acknowledgement, data.question].filter(Boolean).join("\n");
      setMessages([{ role: "ai", text: aiText, category: data.next_category, isNew: true }]);
      setQaHistory([{ role: "ai", content: aiText }]);
      setScreen("interview");
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "開始に失敗しました");
      setSpec(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ── 回答送信 ── */
  const sendAnswer = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !spec) return;
    setInterviewHistory((h) => [...h, { messages, qaHistory, answeredCount, isInterviewComplete, isClosingAsked }]);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsLoading(true);
    setError(null);
    const updatedQaHistory: QAItem[] = [...qaHistory, { role: "user", content: trimmed }];
    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, qa_history: qaHistory, answer: trimmed, skipped: false, closingAsked: isClosingAsked, clientId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "送信に失敗しました");
      }
      const data = await res.json() as InterviewResponse;
      handleInterviewResponse(data, updatedQaHistory);
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
      setIsLoading(false);
    }
  }, [input, isLoading, spec, qaHistory, messages, answeredCount, isInterviewComplete, isClosingAsked, clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── スキップ ── */
  const handleSkip = useCallback(async () => {
    if (isLoading || !spec) return;
    setInterviewHistory((h) => [...h, { messages, qaHistory, answeredCount, isInterviewComplete, isClosingAsked }]);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, qa_history: qaHistory, answer: "", skipped: true, closingAsked: isClosingAsked, clientId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as InterviewResponse;
      handleInterviewResponse(data, qaHistory);
    } catch {
      setError("スキップに失敗しました");
      setIsLoading(false);
    }
  }, [isLoading, spec, qaHistory, messages, answeredCount, isInterviewComplete, isClosingAsked, clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── AI応答処理 ── */
  const handleInterviewResponse = (data: InterviewResponse, updatedQaHistory: QAItem[]) => {
    if (data.is_complete) {
      setMessages((prev) => [...prev, { role: "ai", text: "インタビューお疲れさまでした！素晴らしいお話をありがとうございます。年表を作りますね！", isNew: true }]);
      setQaHistory(updatedQaHistory);
      setAnsweredCount((c) => c + 1);
      setIsInterviewComplete(true);
    } else {
      const aiText = [data.acknowledgement, data.question].filter(Boolean).join("\n");
      setMessages((prev) => [...prev, { role: "ai", text: aiText, category: data.next_category, isNew: true }]);
      setQaHistory([...updatedQaHistory, { role: "ai", content: aiText }]);
      setAnsweredCount((c) => c + 1);
      if (data.next_category?.startsWith("⑧")) setIsClosingAsked(true);
    }
    setIsLoading(false);
  };

  /* ── 戻る ── */
  const goBack = () => {
    if (!interviewHistory.length) return;
    const prev = interviewHistory[interviewHistory.length - 1];
    setMessages(prev.messages);
    setQaHistory(prev.qaHistory);
    setAnsweredCount(prev.answeredCount);
    setIsInterviewComplete(prev.isInterviewComplete);
    setIsClosingAsked(prev.isClosingAsked);
    setInterviewHistory((h) => h.slice(0, -1));
    setInput("");
    setError(null);
  };

  /* ── 年表生成 ── */
  const generateTimeline = useCallback(async () => {
    if (!spec) return;
    setIsGeneratingTimeline(true);
    setError(null);
    try {
      const res = await fetch("/api/timeline/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, qa_history: qaHistory, clientId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "年表の生成に失敗しました");
      }
      const data = await res.json() as { timeline: TimelineEvent[] };
      setTimelineEvents(data.timeline);
      setScreen("timeline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "年表の生成に失敗しました");
    } finally {
      setIsGeneratingTimeline(false);
    }
  }, [spec, qaHistory, clientId]);

  /* ── リセット ── */
  const handleRestart = () => {
    setScreen("spec");
    setSpec(null);
    setMessages([]);
    setQaHistory([]);
    setInput("");
    setAnsweredCount(0);
    setIsLoading(false);
    setError(null);
    setStartError(null);
    setIsInterviewComplete(false);
    setIsClosingAsked(false);
    setIsGeneratingTimeline(false);
    setTimelineEvents([]);
    setInterviewHistory([]);
    setShowSaveModal(false);
    setSavedToken(null);
  };

  if (screen === "spec") return (
    <SpecScreen onStart={handleStart} startError={startError} />
  );

  if (screen === "interview" && spec) return (
    <InterviewScreen
      spec={spec}
      messages={messages}
      input={input}
      setInput={setInput}
      isLoading={isLoading}
      error={error}
      isInterviewComplete={isInterviewComplete}
      answeredCount={answeredCount}
      onSend={sendAnswer}
      onSkip={handleSkip}
      onGenerateTimeline={generateTimeline}
      isGeneratingTimeline={isGeneratingTimeline}
      interviewHistoryLen={interviewHistory.length}
      onBack={goBack}
    />
  );

  if (screen === "timeline" && spec) return (
    <>
      <TimelineScreen
        spec={spec}
        events={timelineEvents}
        onEventsChange={setTimelineEvents}
        onRestart={handleRestart}
        onSave={() => setShowSaveModal(true)}
        savedToken={savedToken}
      />
      {showSaveModal && (
        <SaveModal
          spec={spec}
          events={timelineEvents}
          onClose={() => setShowSaveModal(false)}
          onSaved={(token, _isPublic) => {
            setSavedToken(token);
            setShowSaveModal(false);
          }}
        />
      )}
    </>
  );

  return null;
}

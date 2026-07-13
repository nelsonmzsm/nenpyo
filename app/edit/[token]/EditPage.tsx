"use client";

import { useState, useEffect } from "react";
import type { TimelineEvent } from "@/app/types";

interface SavedTimeline {
  id: string;
  edit_token: string;
  nickname: string;
  birth_year: number | null;
  events: TimelineEvent[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

function EventRow({
  event,
  onUpdate,
  onDelete,
}: {
  event: TimelineEvent;
  onUpdate: (id: string, field: keyof TimelineEvent, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="border border-ngold bg-nbase p-3 space-y-2">
        <div className="flex gap-2">
          <input className="w-24 border border-nborder bg-npanel px-2 py-1 text-sm text-ntext focus:outline-none focus:border-ngold" value={event.year} onChange={(e) => onUpdate(event.id, "year", e.target.value)} placeholder="1990年" />
          <input className="w-16 border border-nborder bg-npanel px-2 py-1 text-sm text-ngray focus:outline-none" value={event.age ?? ""} onChange={(e) => onUpdate(event.id, "age", e.target.value)} placeholder="6歳" />
        </div>
        <input className="w-full border border-ngold bg-npanel px-2 py-1.5 text-sm text-ntext focus:outline-none" value={event.event} onChange={(e) => onUpdate(event.id, "event", e.target.value)} placeholder="出来事" />
        <input className="w-full border border-nborder bg-npanel px-2 py-1 text-xs text-ngray focus:outline-none" value={event.emotion ?? ""} onChange={(e) => onUpdate(event.id, "emotion", e.target.value)} placeholder="感情・キーワード（任意）" />
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(false)} className="text-xs bg-ngold text-white px-3 py-1">保存</button>
          <button onClick={() => onDelete(event.id)} className="text-xs text-red-400 border border-red-200 px-3 py-1">削除</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group py-2 border-b border-nborder">
      <div className="flex-1 flex gap-3 min-w-0">
        <span className="text-sm text-ngray flex-shrink-0 min-w-[5rem] pt-0.5">{event.year}{event.age ? `・${event.age}` : ""}</span>
        <div className="min-w-0">
          <p className="text-sm text-ntext">{event.event}</p>
          {event.emotion && <p className="text-xs text-ngold mt-0.5">{event.emotion}</p>}
        </div>
      </div>
      <button onClick={() => setIsEditing(true)} className="text-xs text-ngray hover:text-ntext opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 px-2 py-0.5 border border-nborder">
        編集
      </button>
    </div>
  );
}

export function EditPage({ token }: { token: string }) {
  const [timeline, setTimeline] = useState<SavedTimeline | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [nickname, setNickname] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/save/${token}`)
      .then(r => r.json())
      .then(d => {
        if (!d.timeline) { setNotFound(true); return; }
        setTimeline(d.timeline);
        setEvents(d.timeline.events ?? []);
        setNickname(d.timeline.nickname);
        setIsPublic(d.timeline.is_public);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  const updateEvent = (id: string, field: keyof TimelineEvent, value: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addEvent = () => {
    const newEvent: TimelineEvent = { id: `ev-new-${Date.now()}`, year: "", age: "", event: "", emotion: "" };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/save/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, events, is_public: isPublic }),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      setSaveMsg("保存しました ✓");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/save/${token}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleted(true);
    } catch {
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-nbase flex items-center justify-center">
      <p className="text-ngray text-base animate-pulse">読み込み中…</p>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-nbase flex items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <p className="text-4xl mb-4">🐆</p>
        <p className="font-bold text-ntext text-lg mb-2">年表が見つかりません</p>
        <p className="text-sm text-ngray mb-6">リンクが無効か、すでに削除されています。</p>
        <a href="/" className="text-sm text-ngold hover:opacity-70">← トップに戻る</a>
      </div>
    </div>
  );

  if (deleted) return (
    <div className="min-h-screen bg-nbase flex items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <p className="text-4xl mb-4">🐆</p>
        <p className="font-bold text-ntext text-lg mb-2">年表を削除しました</p>
        <a href="/" className="text-sm text-ngold hover:opacity-70">← トップに戻る</a>
      </div>
    </div>
  );

  const createdAt = timeline ? new Date(timeline.created_at).toLocaleDateString("ja-JP") : "";

  return (
    <div className="min-h-screen bg-nbase">
      {/* ヘッダー */}
      <header className="border-b border-nborder bg-npanel px-5 py-4 flex items-center gap-3">
        <a href="/" className="text-3xl">🐆</a>
        <div>
          <span className="font-display italic text-ngold text-2xl tracking-tight">じぶん年表</span>
          <span className="text-xs text-ngray ml-2">編集ページ</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 基本情報 */}
        <div className="bg-npanel border border-nborder px-5 py-4 space-y-4">
          <div>
            <label className="text-sm font-bold text-ntext block mb-1.5">ニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              className="w-full border-2 border-nborder bg-nbase px-3 py-2.5 text-base text-ntext focus:outline-none focus:border-ngold"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-ntext mb-2">公開設定</p>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="vis" checked={!isPublic} onChange={() => setIsPublic(false)} className="mt-0.5 accent-ngold" />
                <div>
                  <p className="text-sm text-ntext font-medium">非公開</p>
                  <p className="text-xs text-ngray">このリンクを知っている方のみ閲覧可</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="vis" checked={isPublic} onChange={() => setIsPublic(true)} className="mt-0.5 accent-ngold" />
                <div>
                  <p className="text-sm text-ntext font-medium">みんなの年表に公開</p>
                  <p className="text-xs text-ngray">トップページの「みんなの年表」に掲載</p>
                </div>
              </label>
            </div>
          </div>

          <p className="text-xs text-ngray">作成日：{createdAt}</p>
        </div>

        {/* 年表項目 */}
        <div className="bg-npanel border border-nborder px-5 py-4">
          <h2 className="text-sm font-bold text-ntext mb-3">年表（{events.length}項目）</h2>
          <div className="space-y-0">
            {events.map(e => (
              <EventRow key={e.id} event={e} onUpdate={updateEvent} onDelete={deleteEvent} />
            ))}
          </div>
          <button
            onClick={addEvent}
            className="mt-3 w-full border border-dashed border-nborder text-ngray text-sm py-2 hover:border-ngold hover:text-ngold transition-colors"
          >
            ＋ 項目を追加
          </button>
        </div>

        {/* アクション */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !nickname.trim()}
            className="w-full bg-ngold text-white py-3.5 text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isSaving ? "保存中…" : "変更を保存する"}
          </button>
          {saveMsg && (
            <p className={`text-sm text-center ${saveMsg.includes("失敗") ? "text-red-500" : "text-ngold"}`}>
              {saveMsg}
            </p>
          )}

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full border border-red-200 text-red-400 py-2.5 text-sm hover:bg-red-50 transition-colors"
            >
              この年表を削除する
            </button>
          ) : (
            <div className="border border-red-200 bg-red-50 px-4 py-3 space-y-2">
              <p className="text-sm text-red-600 font-bold">本当に削除しますか？この操作は取り消せません。</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-sm bg-red-500 text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
                >
                  {isDeleting ? "削除中…" : "削除する"}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-sm text-ngray hover:text-ntext px-3">キャンセル</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-ngray text-center pb-4">
          このURLを保存しておくと、いつでも編集できます
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import type { TimelineEvent } from "@/app/types";

interface PublicTimeline {
  id: string;
  nickname: string;
  events: TimelineEvent[];
  birth_year: number | null;
  created_at: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function TimelineCard({
  timeline,
  onDeleted,
  onUpdated,
}: {
  timeline: PublicTimeline;
  onDeleted: (id: string) => void;
  onUpdated: (id: string, nickname: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"password" | "edit" | "confirm-delete" | null>(null);
  const [password, setPassword] = useState("");
  const [editNickname, setEditNickname] = useState(timeline.nickname);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const preview = timeline.events.slice(0, 3);
  const hasMore = timeline.events.length > 3;

  const handleVerify = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/public/${timeline.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "パスワードが正しくありません");
      }
      setMode("edit");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/public/${timeline.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, nickname: editNickname }),
      });
      if (!res.ok) throw new Error("更新に失敗しました");
      onUpdated(timeline.id, editNickname);
      setMode(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/public/${timeline.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      onDeleted(timeline.id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "エラーが発生しました");
      setIsLoading(false);
    }
  };

  const closeActions = () => {
    setMode(null);
    setPassword("");
    setActionError(null);
  };

  return (
    <div className="bg-npanel border border-nborder">
      {/* ヘッダー */}
      <div className="px-4 py-3 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ntext text-base truncate">{timeline.nickname}</p>
          <p className="text-xs text-ngray mt-0.5">
            {formatDate(timeline.created_at)}　{timeline.events.length}項目
          </p>
        </div>
        <button
          onClick={() => mode ? closeActions() : setMode("password")}
          className="text-xs text-ngray hover:text-ntext transition-colors border border-nborder px-2.5 py-1 flex-shrink-0"
        >
          {mode ? "閉じる" : "編集・削除"}
        </button>
      </div>

      {/* 年表プレビュー */}
      <div className="px-4 pb-3 space-y-1.5 border-t border-nborder pt-3">
        {(expanded ? timeline.events : preview).map((e) => (
          <div key={e.id} className="flex gap-3 text-sm">
            <span className="text-ngray text-xs pt-0.5 flex-shrink-0 min-w-[5rem]">{e.year}</span>
            <span className="text-ntext leading-snug">{e.event}</span>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-ngold hover:opacity-70 transition-opacity mt-0.5"
          >
            {expanded ? "▲ 閉じる" : `▼ あと${timeline.events.length - 3}項目`}
          </button>
        )}
      </div>

      {/* 編集・削除エリア */}
      {mode && (
        <div className="border-t border-nborder bg-ndark px-4 py-3 space-y-2.5">
          {mode === "password" && (
            <>
              <p className="text-xs font-bold text-ntext">パスワードを入力してください</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="例：AB1C23"
                  className="flex-1 border border-nborder bg-npanel px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:border-ngold uppercase"
                  onKeyDown={(e) => e.key === "Enter" && password.length === 6 && handleVerify()}
                />
                <button
                  onClick={handleVerify}
                  disabled={password.length < 6 || isLoading}
                  className="text-sm bg-ngold text-white px-4 py-2 hover:opacity-90 disabled:opacity-40"
                >
                  {isLoading ? "確認中…" : "確認"}
                </button>
              </div>
              {actionError && <p className="text-red-500 text-xs">{actionError}</p>}
            </>
          )}

          {mode === "edit" && (
            <>
              <p className="text-xs font-bold text-ntext">ニックネームを編集</p>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                maxLength={30}
                className="w-full border border-nborder bg-npanel px-3 py-2 text-sm text-ntext focus:outline-none focus:border-ngold"
              />
              {actionError && <p className="text-red-500 text-xs">{actionError}</p>}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleUpdate}
                  disabled={!editNickname.trim() || isLoading}
                  className="text-xs bg-ngold text-white px-4 py-2 hover:opacity-90 disabled:opacity-40"
                >
                  {isLoading ? "保存中…" : "保存"}
                </button>
                <button
                  onClick={() => { setMode("confirm-delete"); setActionError(null); }}
                  className="text-xs text-red-400 border border-red-200 px-4 py-2 hover:bg-red-50 transition-colors"
                >
                  削除する
                </button>
              </div>
            </>
          )}

          {mode === "confirm-delete" && (
            <>
              <p className="text-xs text-ntext">本当に削除しますか？この操作は元に戻せません。</p>
              {actionError && <p className="text-red-500 text-xs">{actionError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-xs bg-red-500 text-white px-4 py-2 hover:opacity-90 disabled:opacity-40"
                >
                  {isLoading ? "削除中…" : "削除する"}
                </button>
                <button
                  onClick={() => setMode("edit")}
                  className="text-xs text-ngray hover:text-ntext transition-colors px-2"
                >
                  戻る
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function PublicTimelinesFeed() {
  const [timelines, setTimelines] = useState<PublicTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/timelines")
      .then(r => r.json())
      .then(d => setTimelines(d.timelines ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || timelines.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-5 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-ngold text-lg">🐆</span>
        <h2 className="text-sm font-bold text-ngray tracking-wider">みんなの年表</h2>
        <span className="text-xs text-ngray border border-nborder px-1.5 py-0.5">{timelines.length}件</span>
      </div>
      <div className="space-y-3">
        {timelines.map(t => (
          <TimelineCard
            key={t.id}
            timeline={t}
            onDeleted={(id) => setTimelines(prev => prev.filter(t => t.id !== id))}
            onUpdated={(id, nickname) => setTimelines(prev => prev.map(t => t.id === id ? { ...t, nickname } : t))}
          />
        ))}
      </div>
    </div>
  );
}

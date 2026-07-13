"use client";

import { useState } from "react";
import type { NenpyoSpec, TimelineEvent } from "@/app/types";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(arr).map(b => chars[b % chars.length]).join("");
}

interface Props {
  spec: NenpyoSpec;
  events: TimelineEvent[];
  onClose: () => void;
  onPublished: (id: string, password: string) => void;
}

export function PublishModal({ spec, events, onClose, onPublished }: Props) {
  const [nickname, setNickname] = useState(spec.kana || spec.name);
  const [password] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!confirmed) { setError("パスワードを保存したことを確認してください"); return; }
    if (!nickname.trim()) { setError("ニックネームを入力してください"); return; }
    setIsPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/public/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), events, password, birthYear: spec.birthYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "公開に失敗しました");
      onPublished(data.id, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "公開に失敗しました");
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-npanel border border-nborder w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-nborder flex items-center justify-between">
          <h2 className="font-bold text-ntext text-base">みんなの年表に公開する</h2>
          <button onClick={onClose} className="text-ngray hover:text-ntext text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ニックネーム */}
          <div>
            <label className="text-sm font-bold text-ntext block mb-1">
              ニックネーム <span className="text-ngold">*</span>
            </label>
            <p className="text-xs text-ngray mb-2">公開ページに表示される名前です。本名でなくてもOKです。</p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              className="w-full border-2 border-nborder bg-nbase px-3 py-2.5 text-base text-ntext focus:outline-none focus:border-ngold"
            />
          </div>

          {/* プレビュー */}
          <div>
            <p className="text-sm font-bold text-ntext mb-1">公開する内容（{events.length}項目）</p>
            <div className="bg-nbase border border-nborder px-3 py-2.5 max-h-40 overflow-y-auto space-y-1.5">
              {events.map((e) => (
                <div key={e.id} className="flex gap-2 text-xs">
                  <span className="text-ngray flex-shrink-0 min-w-[4rem]">{e.year}</span>
                  <span className="text-ntext truncate">{e.event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* パスワード */}
          <div className="bg-ndark border border-nborder px-4 py-4">
            <p className="text-sm font-bold text-ntext mb-1">編集・削除パスワード</p>
            <p className="text-xs text-ngray mb-3">
              このパスワードは<strong>一度しか表示されません</strong>。必ずメモしてください。
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold text-ngold tracking-[0.2em] flex-1 select-all">
                {password}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(password);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-xs px-3 py-2 border border-nborder bg-npanel text-ngray hover:text-ntext transition-colors flex-shrink-0"
              >
                {copied ? "コピー済み ✓" : "コピー"}
              </button>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 accent-ngold"
              />
              <span className="text-sm text-ntext">パスワードをメモしました</span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full bg-ngold text-white py-3.5 text-base font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPublishing ? "公開中…" : "🌐 みんなの年表に公開する"}
          </button>

          <p className="text-xs text-ngray text-center">
            公開後もパスワードで内容の編集・削除ができます
          </p>
        </div>
      </div>
    </div>
  );
}

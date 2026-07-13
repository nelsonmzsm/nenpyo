"use client";

import { useState } from "react";
import type { NenpyoSpec, TimelineEvent } from "@/app/types";

interface Props {
  spec: NenpyoSpec;
  events: TimelineEvent[];
  onClose: () => void;
  onSaved: (editToken: string, isPublic: boolean) => void;
}

export function SaveModal({ spec, events, onClose, onSaved }: Props) {
  const [nickname, setNickname] = useState(spec.kana || spec.name);
  const [email, setEmail] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [notifyOk, setNotifyOk] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = nickname.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          events,
          email: email.trim(),
          isPublic,
          notifyOk,
          birthYear: spec.birthYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      onSaved(data.editToken, isPublic);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-npanel border border-nborder w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-nborder flex items-center justify-between">
          <h2 className="font-bold text-ntext text-base">年表を保存する</h2>
          <button onClick={onClose} className="text-ngray hover:text-ntext text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ニックネーム */}
          <div>
            <label className="text-sm font-bold text-ntext block mb-1">
              ニックネーム <span className="text-ngold">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              className="w-full border-2 border-nborder bg-nbase px-3 py-2.5 text-base text-ntext focus:outline-none focus:border-ngold"
            />
          </div>

          {/* 公開設定 */}
          <div>
            <p className="text-sm font-bold text-ntext mb-2">公開設定 <span className="text-ngold">*</span></p>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mt-0.5 accent-ngold"
                />
                <div>
                  <p className="text-sm text-ntext font-medium">非公開（自分だけ）</p>
                  <p className="text-xs text-ngray">メールに届く編集リンクからのみアクセスできます</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mt-0.5 accent-ngold"
                />
                <div>
                  <p className="text-sm text-ntext font-medium">みんなの年表に公開する</p>
                  <p className="text-xs text-ngray">トップページの「みんなの年表」に掲載されます</p>
                </div>
              </label>
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label className="text-sm font-bold text-ntext block mb-1">
              メールアドレス <span className="text-ngold">*</span>
            </label>
            <p className="text-xs text-ngray mb-2">編集リンクをお送りします。あとから修正・削除が可能です。</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border-2 border-nborder bg-nbase px-3 py-2.5 text-base text-ntext focus:outline-none focus:border-ngold"
            />
          </div>

          {/* お知らせ opt-in */}
          <label className="flex items-start gap-3 cursor-pointer select-none bg-ndark border border-nborder px-4 py-3">
            <input
              type="checkbox"
              checked={notifyOk}
              onChange={(e) => setNotifyOk(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-ngold flex-shrink-0"
            />
            <div>
              <p className="text-sm text-ntext">新機能・アップデートのお知らせを受け取る</p>
              <p className="text-xs text-ngray mt-0.5">任意。いつでも解除できます。</p>
            </div>
          </label>

          {/* プライバシー */}
          <p className="text-xs text-ngray leading-relaxed border-t border-nborder pt-4">
            メールアドレスは年表の管理・お知らせ以外の目的には使用しません。第三者への提供も行いません。
          </p>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="w-full bg-ngold text-white py-3.5 text-base font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "保存中…" : "📔 年表を保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}

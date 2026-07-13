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

function TimelineCard({ timeline }: { timeline: PublicTimeline }) {
  const [expanded, setExpanded] = useState(false);
  const preview = timeline.events.slice(0, 3);
  const hasMore = timeline.events.length > 3;

  return (
    <div className="bg-npanel border border-nborder">
      <div className="px-4 py-3">
        <p className="font-bold text-ntext text-base truncate">{timeline.nickname}</p>
        <p className="text-xs text-ngray mt-0.5">
          {formatDate(timeline.created_at)}　{timeline.events.length}項目
        </p>
      </div>
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
          <TimelineCard key={t.id} timeline={t} />
        ))}
      </div>
    </div>
  );
}

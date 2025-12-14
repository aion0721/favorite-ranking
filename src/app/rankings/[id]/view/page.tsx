"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

type RankingDetail = {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  authorName?: string | null;
};

type RankingItem = {
  id: string;
  rank: number;
  title: string;
  comment: string | null;
  image_url?: string | null;
  url?: string | null;
};

export default function RankingViewPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [ranking, setRanking] = useState<RankingDetail | null>(null);
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientIdRef = useRef<string>("");
  const itemsLengthRef = useRef<number>(0);

  if (!clientIdRef.current) {
    clientIdRef.current = crypto.randomUUID();
  }

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    const fetchData = async () => {
      const [
        { data: rankingData, error: rankingError },
        { data: itemsData, error: itemsError },
      ] = await Promise.all([
        supabase
          .from("rankings")
          .select("id, title, description, user_id, profiles(display_name)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("ranking_items")
          .select("id, rank, title, comment, image_url, url")
          .eq("ranking_id", id)
          .order("rank", { ascending: false }),
      ]);

      if (rankingError) {
        console.error("Failed to fetch ranking", rankingError);
      } else {
        const profiles = (rankingData as any)?.profiles;
        const displayName = Array.isArray(profiles)
          ? profiles[0]?.display_name ?? null
          : (profiles as any)?.display_name ?? null;

        setRanking(
          rankingData
            ? {
                ...rankingData,
                authorName: displayName,
              }
            : null
        );
      }

      if (itemsError) {
        console.error("Failed to fetch ranking items", itemsError);
      } else {
        setItems(itemsData ?? []);
        setCurrentIndex(0);
        setShowIntro(true);
      }

      setLoading(false);
    };

    fetchData();
  }, [params?.id, supabase]);

  useEffect(() => {
    itemsLengthRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    const channel = supabase.channel(`ranking-view:${id}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "navigate" }, ({ payload }) => {
        if (!payload) return;
        const {
          currentIndex: incomingIndex = 0,
          showIntro: incomingShowIntro = false,
          sender,
        } = payload as {
          currentIndex?: number;
          showIntro?: boolean;
          sender?: string;
        };

        if (sender && sender === clientIdRef.current) return;

        const maxIndex = Math.max(0, itemsLengthRef.current - 1);
        const clampedIndex = Math.min(Math.max(incomingIndex, 0), maxIndex);
        setShowIntro(incomingShowIntro);
        setCurrentIndex(clampedIndex);
      })
      .subscribe();

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [params?.id, supabase]);

  const broadcastNavigation = (nextIndex: number, nextShowIntro: boolean) => {
    const channel = channelRef.current;
    if (!channel) return;

    channel
      .send({
        type: "broadcast",
        event: "navigate",
        payload: {
          currentIndex: nextIndex,
          showIntro: nextShowIntro,
          sender: clientIdRef.current,
        },
      })
      .catch((error) => {
        console.error("Failed to send navigation update", error);
      });
  };

  const applyNavigation = (nextIndex: number, nextShowIntro: boolean) => {
    const maxIndex = Math.max(0, itemsLengthRef.current - 1);
    const clampedIndex = Math.min(Math.max(nextIndex, 0), maxIndex);
    setShowIntro(nextShowIntro);
    setCurrentIndex(clampedIndex);
    broadcastNavigation(clampedIndex, nextShowIntro);
  };

  const handleNext = () => {
    if (items.length === 0) return;

    if (showIntro) {
      applyNavigation(0, false);
      return;
    }
    if (currentIndex < items.length - 1) {
      applyNavigation(currentIndex + 1, false);
    }
  };

  const handlePrev = () => {
    if (showIntro) return;
    if (currentIndex === 0) {
      applyNavigation(currentIndex, true);
      return;
    }
    applyNavigation(Math.max(0, currentIndex - 1), false);
  };

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5 py-10">
        <p className="text-gray-600">読み込み中...</p>
      </main>
    );
  }

  if (!ranking) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5 py-10">
        <p className="text-gray-600">ランキングが見つかりませんでした。</p>
      </main>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-white px-5 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Ranking Viewer
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {ranking.title}
            </h1>
            <p className="text-sm text-gray-600">
              作成者: {ranking.authorName || "未設定"}
            </p>
            {ranking.description && (
              <p className="mt-1 text-gray-700">{ranking.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              {copied ? "コピーしました" : "📋"}
            </button>
            <Link
              href="/rankings"
              className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              一覧へ
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-600">アイテムがありません。</p>
        ) : showIntro ? (
          <section className="relative flex min-h-[60vh] flex-col justify-center rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-lg">
            <div className="absolute right-4 top-4 flex items-center gap-2 text-sm text-gray-600">
              <span>全 {items.length} 件</span>
              <button
                onClick={handleNext}
                className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                最初のランクへ →
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center gap-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {ranking.title}
              </h2>
              {ranking.description && (
                <p className="max-w-2xl text-lg text-gray-700">
                  {ranking.description}
                </p>
              )}
              <p className="text-sm text-gray-500">
                全員がページを開いたら次へを押しましょう
              </p>
            </div>
          </section>
        ) : currentItem ? (
          <section className="relative flex min-h-[60vh] flex-col justify-center rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-lg">
            <div className="absolute left-4 top-4 flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={handlePrev}
                className="rounded border border-gray-300 px-3 py-1 font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                ← {currentIndex === 0 ? "概要へ" : "前のランク"}
              </button>
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-2 text-sm text-gray-600">
              <span>
                Rank {currentItem.rank} / {items.length}
              </span>
              {currentIndex < items.length - 1 && (
                <button
                  onClick={handleNext}
                  className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  次のランク →
                </button>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center gap-4">
              <div className="text-sm font-semibold text-blue-700">
                Rank {currentItem.rank}
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {currentItem.title}
              </h2>
              {currentItem.url && (
                <a
                  href={currentItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-blue-600 underline"
                >
                  リンクを開く
                </a>
              )}
              {currentItem.image_url && (
                <img
                  src={currentItem.image_url}
                  alt={currentItem.title}
                  className="max-h-[320px] w-full max-w-2xl rounded-lg border border-gray-200 object-contain"
                />
              )}
              <p className="max-w-2xl text-lg text-gray-700">
                {currentItem.comment || "コメントがありません。"}
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

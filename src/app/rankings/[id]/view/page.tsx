"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

type RankingDetail = {
  id: string;
  title: string;
  description: string | null;
};

type RankingItem = {
  id: string;
  rank: number;
  title: string;
  comment: string | null;
  image_url?: string | null;
};

export default function RankingViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [ranking, setRanking] = useState<RankingDetail | null>(null);
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    const fetchData = async () => {
      const [{ data: rankingData, error: rankingError }, { data: itemsData, error: itemsError }] =
        await Promise.all([
          supabase
            .from("rankings")
            .select("id, title, description")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("ranking_items")
            .select("id, rank, title, comment, image_url")
            .eq("ranking_id", id)
            .order("rank", { ascending: false }), // 下位ランクから順に表示するため降順
        ]);

      if (rankingError) {
        console.error("Failed to fetch ranking", rankingError);
      } else {
        setRanking(rankingData);
      }

      if (itemsError) {
        console.error("Failed to fetch ranking items", itemsError);
      } else {
        setItems(itemsData ?? []);
        setCurrentIndex(0);
      }

      setLoading(false);
    };

    fetchData();
  }, [params?.id, supabase]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
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
            <h1 className="text-2xl font-bold text-gray-900">{ranking.title}</h1>
            {ranking.description && (
              <p className="mt-1 text-gray-700">{ranking.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/rankings/${ranking.id}`}
              className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              詳細へ戻る
            </Link>
            <Link
              href="/rankings"
              className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              一覧へ
            </Link>
          </div>
        </div>

        {currentItem ? (
          <section className="relative flex min-h-[60vh] flex-col justify-center rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-lg">
            <div className="absolute right-4 top-4 flex items-center gap-2 text-sm text-gray-600">
              <span>
                {items.length - currentIndex} / {items.length} 位
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
              {currentItem.image_url && (
                <img
                  src={currentItem.image_url}
                  alt={currentItem.title}
                  className="max-h-[320px] w-full max-w-2xl rounded-lg border border-gray-200 object-contain"
                />
              )}
              {currentItem.comment && (
                <p className="max-w-2xl text-lg text-gray-700">
                  {currentItem.comment}
                </p>
              )}
            </div>

            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="absolute bottom-4 left-4 rounded border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                ← 前のランク
              </button>
            )}
          </section>
        ) : (
          <p className="text-gray-600">アイテムがありません。</p>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSupabaseSession from "@/hooks/useSupabaseSession";
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
};

export default function RankingDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { session, loading: sessionLoading } = useSupabaseSession();
  const [ranking, setRanking] = useState<RankingDetail | null>(null);
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    const fetchData = async () => {
      const [{ data: rankingData, error: rankingError }, { data: itemsData, error: itemsError }] =
        await Promise.all([
          supabase
            .from("rankings")
            .select("id, title, description, user_id, profiles(display_name)")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("ranking_items")
            .select("id, rank, title, comment, image_url")
            .eq("ranking_id", id)
            .order("rank", { ascending: true }),
        ]);

      if (rankingError) {
        console.error("Failed to fetch ranking", rankingError);
      } else {
        setRanking(
          rankingData
            ? {
                ...rankingData,
                authorName: Array.isArray(rankingData.profiles)
                  ? rankingData.profiles[0]?.display_name ?? null
                  : rankingData.profiles?.display_name ?? null,
              }
            : null
        );
      }

      if (itemsError) {
        console.error("Failed to fetch ranking items", itemsError);
      } else {
        setItems(itemsData ?? []);
      }

      setLoading(false);
    };

    fetchData();
  }, [params?.id, supabase]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">読み込み中...</p>
      </main>
    );
  }

  if (!ranking) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">ランキングが見つかりませんでした。</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ranking.title}</h1>
          <p className="text-sm text-gray-600">
            作者: {ranking.authorName || "未設定"}
          </p>
          {ranking.description && (
            <p className="mt-2 text-gray-700">{ranking.description}</p>
          )}
        </div>
        {!sessionLoading && session && (
          <Link
            href={`/rankings/${ranking.id}/items/new`}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            アイテム追加
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-600">まだアイテムがありません。</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {item.rank}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-lg font-semibold">{item.title}</p>
                {item.comment && (
                  <p className="truncate text-sm text-gray-700">{item.comment}</p>
                )}
              </div>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-16 w-16 rounded-md border border-gray-200 object-cover"
                />
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

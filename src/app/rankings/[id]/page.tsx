"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
};

export default function RankingDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
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
            .select("id, title, description")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("ranking_items")
            .select("id, rank, title, comment")
            .eq("ranking_id", id)
            .order("rank", { ascending: true }),
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{ranking.title}</h1>
        {ranking.description && (
          <p className="mt-2 text-gray-700">{ranking.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-600">まだアイテムがありません。</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mt-1 h-8 w-8 rounded-full bg-blue-600 text-center text-sm font-bold text-white leading-8">
                {item.rank}
              </div>
              <div>
                <p className="text-lg font-semibold">{item.title}</p>
                {item.comment && (
                  <p className="mt-1 text-sm text-gray-700">{item.comment}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSupabaseSession from "@/hooks/useSupabaseSession";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

type Ranking = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
};

export default function RankingsPage() {
  const { session, loading: sessionLoading } = useSupabaseSession();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    const fetchRankings = async () => {
      let query = supabase
        .from("rankings")
        .select("id, title, description, is_public, user_id")
        .order("created_at", { ascending: false });

      if (session?.user?.id) {
        query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
      } else {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Failed to fetch rankings", error);
      } else {
        setRankings(data ?? []);
      }
      setLoading(false);
    };

    fetchRankings();
  }, [session, sessionLoading, supabase]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ranking 一覧</h1>
          <p className="text-gray-600">公開ランキングと自分のランキングを表示</p>
        </div>
        {session && (
          <Link
            href="/rankings/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            新規作成
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">読み込み中...</p>
      ) : rankings.length === 0 ? (
        <p className="text-gray-600">ランキングが見つかりませんでした。</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rankings.map((ranking) => (
            <article
              key={ranking.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">{ranking.title}</h2>
                  {ranking.description && (
                    <p className="text-sm text-gray-600">
                      {ranking.description}
                    </p>
                  )}
                  {!ranking.is_public && (
                    <p className="text-xs text-amber-600">非公開（自分のみ）</p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2 text-sm">
                  {session?.user?.id === ranking.user_id && (
                    <Link
                      href={`/rankings/${ranking.id}`}
                      className="rounded border border-gray-300 px-3 py-1 font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      編集
                    </Link>
                  )}
                  <Link
                    href={`/rankings/${ranking.id}/view`}
                    className="rounded bg-blue-600 px-3 py-1 font-semibold text-white transition hover:bg-blue-700"
                  >
                    表示
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

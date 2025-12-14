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
    <main className="mx-auto max-w-4xl px-5 py-6">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rankings.map((ranking) => (
            <Link
              key={ranking.id}
              href={`/rankings/${ranking.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold">{ranking.title}</h2>
              {ranking.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {ranking.description}
                </p>
              )}
              {!ranking.is_public && (
                <p className="mt-2 text-xs text-amber-600">非公開（自分のみ）</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

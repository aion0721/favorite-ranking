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
  authorName?: string | null;
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
        .select(
          "id, title, description, is_public, user_id, profiles(display_name)"
        )
        .order("created_at", { ascending: false });

      if (session?.user?.id) {
        query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
      } else {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Failed to fetch rankings", error);
        setLoading(false);
        return;
      }

      const withAuthor = (data ?? []).map((r: any) => {
        const profiles = r.profiles;
        const displayName = Array.isArray(profiles)
          ? profiles[0]?.display_name ?? null
          : profiles?.display_name ?? null;
        return {
          ...r,
          authorName: displayName,
        };
      });
      setRankings(withAuthor);
      setLoading(false);
    };

    fetchRankings();
  }, [session, sessionLoading, supabase]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ranking 一覧</h1>
          <p className="text-gray-600">公開ランキング / 自分のランキング</p>
        </div>
        {session && (
          <Link
            href="/rankings/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span aria-hidden="true" className="mr-1">
              ＋
            </span>
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">読み込み中...</p>
      ) : rankings.length === 0 ? (
        <p className="text-gray-600">ランキングがありません。</p>
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
                  <p className="text-xs text-gray-500">
                    作成者: {ranking.authorName || "未設定"}
                  </p>
                  {ranking.description && (
                    <p className="text-sm text-gray-600">
                      {ranking.description}
                    </p>
                  )}
                  {!ranking.is_public && (
                    <p className="text-xs text-amber-600">非公開</p>
                  )}
                </div>
                {session && (
                  <div className="flex flex-wrap justify-end gap-2 text-sm">
                    {session?.user?.id === ranking.user_id && (
                      <Link
                        href={`/rankings/${ranking.id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        <span aria-hidden="true" className="mr-1">
                          ✏️
                        </span>
                      </Link>
                    )}
                    <Link
                      href={`/rankings/${ranking.id}/view`}
                      className="rounded bg-blue-600 px-3 py-1 font-semibold text-white transition hover:bg-blue-700"
                    >
                      <span aria-hidden="true" className="mr-1">
                        👁️
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

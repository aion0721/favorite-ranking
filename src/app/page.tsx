"use client";

import useSupabaseSession from "@/hooks/useSupabaseSession";
import type { RankingItem } from "@/types/ranking";

const mockRankings: RankingItem[] = [
  {
    id: "1",
    title: "好きなプログラミング言語ランキング",
    description: "みんなが愛用する言語のトップ3",
    createdBy: "dev@example.com",
    createdAt: "2024-12-01",
    entries: [
      { id: "1-1", name: "TypeScript", votes: 120 },
      { id: "1-2", name: "Python", votes: 100 },
      { id: "1-3", name: "Go", votes: 85 },
    ],
  },
  {
    id: "2",
    title: "週末に行きたい場所ランキング",
    description: "近場でリフレッシュするならここ！",
    createdBy: "travel@example.com",
    createdAt: "2024-11-20",
    entries: [
      { id: "2-1", name: "温泉", votes: 90 },
      { id: "2-2", name: "美術館", votes: 60 },
      { id: "2-3", name: "山登り", votes: 55 },
    ],
  },
];

export default function Home() {
  const { session, loading } = useSupabaseSession();

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ranking 一覧</h1>
          <p className="mt-1 text-gray-600">みんなのランキングを眺めてみよう</p>
        </div>
        {loading ? (
          <span className="text-sm text-gray-600">チェック中...</span>
        ) : session ? (
          <button className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            作成
          </button>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockRankings.map((ranking) => (
          <article
            key={ranking.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 space-y-1">
              <h2 className="text-lg font-semibold">{ranking.title}</h2>
              <p className="text-sm text-gray-600">{ranking.description}</p>
              <p className="text-xs text-gray-500">
                作成者: {ranking.createdBy} / {ranking.createdAt}
              </p>
            </div>
            <ol className="list-decimal space-y-2 pl-5">
              {ranking.entries.map((entry, index) => (
                <li key={entry.id} className="flex items-center gap-2">
                  <span className="font-semibold">{entry.name}</span>
                  <span className="text-sm text-gray-500">{entry.votes} votes</span>
                  {index === 0 && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Top
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </main>
  );
}

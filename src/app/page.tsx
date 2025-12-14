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
    <main style={{ padding: "20px", maxWidth: 960, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Ranking 一覧</h1>
          <p style={{ margin: "4px 0 0", color: "#555" }}>
            みんなのランキングを眺めてみよう
          </p>
        </div>

        {loading ? (
          <span>チェック中...</span>
        ) : session ? (
          <button style={{ padding: "8px 12px" }}>作成</button>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {mockRankings.map((ranking) => (
          <article
            key={ranking.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 16,
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <header style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>{ranking.title}</h2>
              <p style={{ margin: "4px 0", color: "#666", fontSize: 14 }}>
                {ranking.description}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                作成者: {ranking.createdBy} / {ranking.createdAt}
              </p>
            </header>

            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {ranking.entries.map((entry, index) => (
                <li key={entry.id} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{entry.name}</span>
                  <span style={{ color: "#888", marginLeft: 8 }}>
                    {entry.votes} votes
                  </span>
                  {index === 0 && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "#2563eb",
                        fontWeight: 600,
                      }}
                    >
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

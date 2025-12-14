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
  url?: string | null;
};

export default function RankingEditPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { session, loading: sessionLoading } = useSupabaseSession();

  const [ranking, setRanking] = useState<RankingDetail | null>(null);
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [movingId, setMovingId] = useState<string | null>(null);

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
          .order("rank", { ascending: true }),
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
        if (rankingData) {
          setEditTitle(rankingData.title ?? "");
          setEditDescription(rankingData.description ?? "");
        }
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

  const handleUpdateRanking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ranking) return;
    if (!editTitle.trim()) return;

    setUpdating(true);
    const { error } = await supabase
      .from("rankings")
      .update({
        title: editTitle,
        description: editDescription || null,
      })
      .eq("id", ranking.id);

    if (error) {
      console.error("Failed to update ranking", error);
      setUpdating(false);
      return;
    }

    setRanking((prev) =>
      prev
        ? { ...prev, title: editTitle, description: editDescription || null }
        : prev
    );
    setUpdating(false);
    setShowInfoForm(false);
  };

  const handleCancelInfo = () => {
    if (!ranking) return;
    setEditTitle(ranking.title ?? "");
    setEditDescription(ranking.description ?? "");
    setShowInfoForm(false);
  };

  const swapRanks = async (sourceId: string, targetId: string) => {
    const source = items.find((i) => i.id === sourceId);
    const target = items.find((i) => i.id === targetId);
    if (!source || !target) return;

    setMovingId(sourceId);

    const { error: tempError } = await supabase
      .from("ranking_items")
      .update({ rank: -1 })
      .eq("id", sourceId)
      .eq("ranking_id", params.id);

    if (tempError) {
      console.error("Failed to temp update", tempError);
      setMovingId(null);
      return;
    }

    const { error: targetError } = await supabase
      .from("ranking_items")
      .update({ rank: source.rank })
      .eq("id", targetId)
      .eq("ranking_id", params.id);

    if (targetError) {
      console.error("Failed to update target", targetError);
      setMovingId(null);
      return;
    }

    const { error: sourceError } = await supabase
      .from("ranking_items")
      .update({ rank: target.rank })
      .eq("id", sourceId)
      .eq("ranking_id", params.id);

    if (sourceError) {
      console.error("Failed to update source", sourceError);
      setMovingId(null);
      return;
    }

    setItems((prev) =>
      [...prev]
        .map((it) => {
          if (it.id === sourceId) return { ...it, rank: target.rank };
          if (it.id === targetId) return { ...it, rank: source.rank };
          return it;
        })
        .sort((a, b) => a.rank - b.rank)
    );

    setMovingId(null);
  };

  const handleMoveUp = (itemId: string) => {
    const index = items.findIndex((i) => i.id === itemId);
    if (index <= 0) return;
    swapRanks(itemId, items[index - 1].id);
  };

  const handleMoveDown = (itemId: string) => {
    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1 || index >= items.length - 1) return;
    swapRanks(itemId, items[index + 1].id);
  };

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
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">ランキングを編集</h1>
          <p className="text-sm text-gray-600">
            作成者: {ranking.authorName || "未設定"}
          </p>
          <button
            type="button"
            onClick={() => setShowInfoForm((prev) => !prev)}
            className="mt-1 inline-flex items-center justify-center rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            情報を編集（タイトル・説明）
          </button>
        </div>
        {!sessionLoading && session && (
          <Link
            href={`/rankings/${ranking.id}/items/new`}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span aria-hidden="true" className="mr-1">＋</span>
          </Link>
        )}
      </div>

      {showInfoForm && (
        <form
          onSubmit={handleUpdateRanking}
          className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              タイトル
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              説明（任意）
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="概要やルールなど"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={updating}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {updating ? "更新中..." : "保存する"}
            </button>
            <button
              type="button"
              onClick={handleCancelInfo}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

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
                  <p className="truncate text-sm text-gray-700">
                    {item.comment}
                  </p>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs font-semibold text-blue-600 underline"
                  >
                    {item.url}
                  </a>
                )}
              </div>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-16 w-16 rounded-md border border-gray-200 object-cover"
                />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMoveUp(item.id)}
                  disabled={movingId === item.id || items[0]?.id === item.id}
                  className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(item.id)}
                  disabled={
                    movingId === item.id ||
                    items[items.length - 1]?.id === item.id
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ▼
                </button>
              </div>
              <Link
                href={`/rankings/${ranking.id}/items/${item.id}/edit`}
                className="rounded border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <span aria-hidden="true" className="mr-1">
                  ✏️
                </span>
                編集
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

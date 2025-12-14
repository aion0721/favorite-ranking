"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import useSupabaseSession from "@/hooks/useSupabaseSession";

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

type RankingItem = {
  id: string;
  rank: number;
  title: string;
  comment: string | null;
  image_url: string | null;
  url: string | null;
  ranking: { title: string } | null;
};

export default function EditRankingItemPage() {
  const params = useParams<{ id: string; itemId: string }>();
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseSession();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const rankingId = params?.id;
  const itemId = params?.itemId;

  const [item, setItem] = useState<RankingItem | null>(null);
  const [rank, setRank] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!rankingId || !itemId) return;

    const fetchItem = async () => {
      const { data, error } = await supabase
        .from("ranking_items")
        .select("id, rank, title, comment, image_url, url, rankings(title)")
        .eq("id", itemId)
        .eq("ranking_id", rankingId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch ranking item", error);
        setErrorMessage("アイテムの取得に失敗しました。");
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage("アイテムが見つかりません。");
        setLoading(false);
        return;
      }

      const rankingInfo =
        Array.isArray((data as any).rankings) && (data as any).rankings.length > 0
          ? (data as any).rankings[0]
          : (data as any).rankings ?? null;

      const itemData: RankingItem = {
        id: data.id,
        rank: data.rank,
        title: data.title,
        comment: data.comment,
        image_url: data.image_url,
        url: data.url,
        ranking: rankingInfo ? { title: rankingInfo.title } : null,
      };

      setItem(itemData);
      setRank(data.rank);
      setTitle(data.title);
      setComment(data.comment ?? "");
      setUrl(data.url ?? "");
      setImageUrl(data.image_url ?? null);
      setLoading(false);
    };

    fetchItem();
  }, [itemId, rankingId, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rankingId || !itemId) return;
    setErrorMessage(null);

    if (!title.trim() || rank === "" || Number(rank) < 1) {
      setErrorMessage("順位は1以上、タイトルは必須です。");
      return;
    }

    setSubmitting(true);

    let uploadedImageUrl = imageUrl;

    if (imageFile) {
      const safeName = sanitizeFileName(imageFile.name);
      const filePath = `${rankingId}/${Date.now()}-${safeName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ranking-item-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type || undefined,
        });

      if (uploadError) {
        console.error("Failed to upload image", uploadError);
        setErrorMessage("画像アップロードに失敗しました。");
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("ranking-item-images")
        .getPublicUrl(uploadData.path);
      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from("ranking_items")
      .update({
        rank: Number(rank),
        title,
        comment: comment || null,
        url: url || null,
        image_url: uploadedImageUrl,
      })
      .eq("id", itemId)
      .eq("ranking_id", rankingId);

    if (error) {
      console.error("Failed to update ranking item", error);
      setErrorMessage("更新に失敗しました。");
      setSubmitting(false);
      return;
    }

    router.push(`/rankings/${rankingId}/edit`);
  };

  if (sessionLoading || loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">読み込み中...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">編集にはログインが必要です。</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">{errorMessage || "アイテムが見つかりません。"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-4">
        <p className="text-sm text-gray-500">ランキング: {item.ranking?.title || "-"}</p>
        <h1 className="text-2xl font-bold">アイテムを編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">順位</label>
          <input
            type="number"
            min={1}
            value={rank}
            onChange={(e) => setRank(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="アイテム名"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">コメント（任意）</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="補足や理由など"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">URL（任意）</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">画像（任意）</label>
          {imageUrl && (
            <div className="flex items-center gap-3">
              <img
                src={imageUrl}
                alt={title}
                className="h-20 w-20 rounded-md border border-gray-200 object-cover"
              />
              <span className="text-xs text-gray-600">現在の画像</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-700"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {submitting ? "更新中..." : "更新する"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/rankings/${rankingId}/edit`)}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
}

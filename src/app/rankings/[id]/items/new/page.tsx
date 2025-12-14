"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import useSupabaseSession from "@/hooks/useSupabaseSession";

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

export default function NewRankingItemPage() {
  const { session, loading: sessionLoading } = useSupabaseSession();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const rankingId = params?.id;

  const [rank, setRank] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!rankingId) return;

    const fetchNextRank = async () => {
      const { data, error } = await supabase
        .from("ranking_items")
        .select("rank")
        .eq("ranking_id", rankingId)
        .order("rank", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Failed to fetch last rank", error);
        return;
      }

      const lastRank = data?.[0]?.rank ?? 0;
      setRank((prev) => (prev === "" ? lastRank + 1 : prev));
    };

    fetchNextRank();
  }, [rankingId, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!rankingId || !title.trim() || rank === "") {
      setErrorMessage("順位とタイトルを入力してください。");
      return;
    }
    if (Number(rank) < 1) {
      setErrorMessage("順位は1以上を入力してください。");
      return;
    }

    setSubmitting(true);

    const { data: dupCheck, error: dupError } = await supabase
      .from("ranking_items")
      .select("id")
      .eq("ranking_id", rankingId)
      .eq("rank", Number(rank))
      .maybeSingle();

    if (dupError) {
      console.error("Failed to check duplicate rank", dupError);
      setErrorMessage("順位の重複確認に失敗しました。");
      setSubmitting(false);
      return;
    }

    if (dupCheck) {
      setErrorMessage("同じ順位のアイテムが既に存在します。");
      setSubmitting(false);
      return;
    }

    let uploadedImageUrl: string | null = null;

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
        setErrorMessage("画像のアップロードに失敗しました。");
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("ranking-item-images")
        .getPublicUrl(uploadData.path);
      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("ranking_items").insert({
      ranking_id: rankingId,
      rank: Number(rank),
      title,
      comment: comment || null,
      url: url || null,
      image_url: uploadedImageUrl,
    });

    if (error) {
      console.error("Failed to create ranking item", error);
      setErrorMessage("アイテムの追加に失敗しました。");
      setSubmitting(false);
      return;
    }

    router.push(`/rankings/${rankingId}/edit`);
  };

  if (sessionLoading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">読み込み中...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">アイテムの追加にはログインが必要です。</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-6">
      <h1 className="text-2xl font-bold">ランキングにアイテムを追加</h1>
      <p className="mt-1 text-gray-600">
        順位、タイトル、コメントを入力してください。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {errorMessage && (
          <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            順位（rank）
          </label>
          <input
            type="number"
            min={1}
            value={rank}
            onChange={(e) =>
              setRank(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="例: 1"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            タイトル
          </label>
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
          <label className="block text-sm font-semibold text-gray-800">
            URL（任意）
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            コメント（任意）
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="補足や理由など"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            画像（任意・ranking-item-images バケットにアップロード）
          </label>
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
            {submitting ? "追加中..." : "追加する"}
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

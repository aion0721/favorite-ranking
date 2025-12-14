"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import useSupabaseSession from "@/hooks/useSupabaseSession";
import Link from "next/link";

export default function PasswordSetupPage() {
  const { session, loading } = useSupabaseSession();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!password || password !== confirm) {
      setError("パスワードが一致していません。");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setSaving(false);

    if (updateError) {
      console.error("Failed to update password", updateError);
      setError(
        "パスワードの設定に失敗しました。時間をおいて再度お試しください。"
      );
      return;
    }

    setMessage(
      "パスワードを設定しました。次回からメール+パスワードでログインできます。"
    );
    setPassword("");
    setConfirm("");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">読み込み中...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-gray-600">ログイン後にパスワードを設定できます。</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">パスワードを設定</h1>
        <p className="text-sm text-gray-600">
          現在のアカウント ({session.user.email || "メール未設定"})
          にパスワードを追加します。
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            新しいパスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            確認のため再入力
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="同じパスワードを入力"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
          <Link
            href="/rankings"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            一覧へ戻る
          </Link>
        </div>
      </form>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import useSupabaseSession from "@/hooks/useSupabaseSession";

export default function AccountPage() {
  const { session, loading } = useSupabaseSession();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // fetch profile once when session available
  useState(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;
      setLoadingProfile(true);
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profileError) {
        console.error("Failed to load profile", profileError);
      } else if (data?.display_name) {
        setDisplayName(data.display_name);
      }
      setLoadingProfile(false);
    };
    loadProfile();
  });

  const handleSaveDisplayName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("表示名を入力してください。");
      return;
    }
    setError(null);
    setMessage(null);
    setSavingName(true);

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ user_id: session.user.id, display_name: trimmed }, { onConflict: "user_id" });

    setSavingName(false);
    if (upsertError) {
      console.error("Failed to save display name", upsertError);
      setError("表示名の保存に失敗しました。時間をおいて再度お試しください。");
      return;
    }
    setMessage("表示名を更新しました。");
  };

  const handleSavePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password || password !== passwordConfirm) {
      setError("パスワードが一致していません。");
      return;
    }

    setSavingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (updateError) {
      console.error("Failed to update password", updateError);
      setError("パスワードの変更に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    setMessage("パスワードを変更しました。");
    setPassword("");
    setPasswordConfirm("");
    router.refresh();
  };

  const handleLogout = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.push("/login?logged_out=1");
      return;
    }

    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      const msg = logoutError.message?.toLowerCase() ?? "";
      if (!msg.includes("auth session missing")) {
        console.error("Failed to logout", logoutError);
        setError("ログアウトに失敗しました。時間をおいて再度お試しください。");
        return;
      }
      // 403 などの場合はローカルクリアを試みる
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
    router.push("/login?logged_out=1");
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
        <p className="text-gray-600">ログインしてアカウント設定を行ってください。</p>
        <Link href="/login" className="mt-3 inline-block text-blue-600 underline">
          ログイン画面へ
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Account</p>
          <h1 className="text-2xl font-bold text-gray-900">アカウント設定</h1>
          <p className="text-sm text-gray-600">{session.user.email}</p>
        </div>
        <Link href="/rankings" className="text-sm text-blue-600 underline">
          ランキング一覧へ戻る
        </Link>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">表示名の変更</h2>
          {loadingProfile && <span className="text-xs text-gray-500">読み込み中...</span>}
        </div>
        <form onSubmit={handleSaveDisplayName} className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">表示名</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="表示名を入力"
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {savingName ? "保存中..." : "保存する"}
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">パスワードの変更</h2>
        </div>
        <form onSubmit={handleSavePassword} className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">新しいパスワード</label>
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
            <label className="block text-sm font-semibold text-gray-800">確認</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="同じパスワードを入力"
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {savingPassword ? "保存中..." : "保存する"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ログアウト</h2>
            <p className="text-sm text-gray-600">現在のアカウントからサインアウトします。</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            ログアウト
          </button>
        </div>
      </section>
    </main>
  );
}

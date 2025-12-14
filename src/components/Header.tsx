"use client";

import { useCallback, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import useSupabaseSession from "@/hooks/useSupabaseSession";

export default function Header() {
  const { session, loading } = useSupabaseSession();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const handleLogin = useCallback(async () => {
    const email = window.prompt("メールアドレスを入力してください");
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert("ログインリンクの送信に失敗しました");
      console.error(error);
    } else {
      alert("メールに送信されたリンクからログインしてください");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("ログアウトに失敗しました");
      console.error(error);
    }
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
      <div className="text-lg font-bold">Favorite Ranking</div>

      <div className="flex items-center gap-3 text-sm">
        {loading ? (
          <span className="text-gray-600">読み込み中...</span>
        ) : session ? (
          <>
            <span className="text-gray-700">{session.user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded border border-gray-300 px-3 py-1 text-gray-700 transition hover:bg-gray-100"
            >
              ログアウト
            </button>
          </>
        ) : (
          <button
            onClick={handleLogin}
            className="rounded bg-blue-600 px-4 py-1 font-semibold text-white transition hover:bg-blue-700"
          >
            ログイン
          </button>
        )}
      </div>
    </header>
  );
}

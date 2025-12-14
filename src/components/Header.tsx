"use client";

import Image from "next/image";
import Link from "next/link";
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
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("ログアウトに失敗しました");
      console.error(error);
    }
  }, [supabase]);

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative h-9 w-9 overflow-hidden rounded">
          <Image
            src="/logo.png"
            alt="Favorite Ranking ロゴ"
            fill
            sizes="36px"
            className="object-contain"
            priority
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 leading-tight">
            Favorite Ranking
          </p>
          <p className="text-xs text-gray-500 leading-tight">
            お気に入りを共有しよう
          </p>
        </div>
      </Link>

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

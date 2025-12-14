"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import useSupabaseSession from "@/hooks/useSupabaseSession";

export default function Header() {
  const { session, loading } = useSupabaseSession();

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
    <header
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: 700 }}>Favorite Ranking</div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {loading ? (
          <span>読み込み中...</span>
        ) : session ? (
          <>
            <span>{session.user.email}</span>
            <button onClick={handleLogout}>ログアウト</button>
          </>
        ) : (
          <button onClick={handleLogin}>ログイン</button>
        )}
      </div>
    </header>
  );
}

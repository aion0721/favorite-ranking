"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // ログイン / ログアウトの監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main>
      <h1>Favorite Ranking</h1>

      {session ? <p>ログイン中：{session.user.email}</p> : <p>未ログイン</p>}
      <button onClick={() => supabase.auth.signOut()}>ログアウト</button>
    </main>
  );
}

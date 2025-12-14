"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import useSupabaseSession from "@/hooks/useSupabaseSession";

type UserProfile = {
  user_id: string;
  display_name: string;
};

export default function Header() {
  const { session, loading } = useSupabaseSession();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      setDisplayNameInput("");
      setProfileLoading(false);
      return;
    }

    let isMounted = true;
    setProfileLoading(true);

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Failed to fetch profile", error);
        setProfile(null);
      } else {
        setProfile(data ?? null);
        if (data?.display_name) {
          setDisplayNameInput(data.display_name);
        }
      }
      setProfileLoading(false);
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, supabase]);

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

  const handleDisplayNameSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!session?.user?.id) return;

      const trimmed = displayNameInput.trim();
      if (!trimmed) {
        return;
      }

      setSavingDisplayName(true);

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: session.user.id, display_name: trimmed },
          { onConflict: "user_id" }
        )
        .select("user_id, display_name")
        .maybeSingle();

      if (error) {
        console.error("Failed to save display name", error);
        alert("表示名の保存に失敗しました。時間をおいて再度お試しください。");
      } else if (data) {
        setProfile(data);
        setDisplayNameInput(data.display_name ?? "");
        setEditing(false);
      }

      setSavingDisplayName(false);
    },
    [displayNameInput, session?.user?.id, supabase]
  );

  const handleStartEdit = useCallback(() => {
    if (profile?.display_name) {
      setDisplayNameInput(profile.display_name);
    }
    setEditing(true);
  }, [profile?.display_name]);

  const displayLabel = profile?.display_name || session?.user?.email;
  const showDisplayNameForm =
    !!session && !loading && !profileLoading && (!profile || editing);

  return (
    <div className="border-b border-gray-200 bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
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
            <p className="text-sm font-semibold leading-tight text-gray-700">
              Favorite Ranking
            </p>
            <p className="text-xs leading-tight text-gray-500">
              お気に入りを共有しよう
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {loading ? (
            <span className="text-gray-600">読み込み中...</span>
          ) : session ? (
            <>
              {profileLoading ? (
                <span className="text-gray-700">プロフィール取得中...</span>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded px-2 py-1 text-gray-700 transition hover:bg-gray-100"
                  title="表示名を変更する"
                >
                  {displayLabel}
                </button>
              )}
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

      {showDisplayNameForm && (
        <div className="border-t border-blue-100 bg-blue-50">
          <form
            onSubmit={handleDisplayNameSubmit}
            className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-blue-900">
                {profile ? "表示名を変更できます。" : "はじめまして！表示名を登録してください。"}
              </p>
              <p className="text-xs text-blue-800">
                ランキング作成者として表示する名前です。あとから変更もできます。
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                className="w-full min-w-0 rounded border border-blue-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-56"
                placeholder="表示名を入力"
                maxLength={50}
                required
              />
              <button
                type="submit"
                disabled={savingDisplayName || !displayNameInput.trim()}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {savingDisplayName ? "保存中..." : "保存"}
              </button>
              {profile && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-100"
                >
                  キャンセル
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

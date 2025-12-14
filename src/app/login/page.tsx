"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

function LoginContent() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const loggedOut = searchParams.get("logged_out");
    if (loggedOut) {
      setMessage("ログアウトしました。再度ログインしてください。");
    }
  }, [searchParams]);

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }
    setLoadingOtp(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setLoadingOtp(false);

    if (otpError) {
      console.error("Failed to send magic link", otpError);
      setError("メール送信に失敗しました。時間をおいて再度お試しください。");
      return;
    }
    setOtpSent(true);
    setMessage("マジックリンクを送信しました。メールを確認してください。");
  };

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!passwordEmail.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }
    setLoadingPwd(true);
    const { error: pwdError } = await supabase.auth.signInWithPassword({
      email: passwordEmail,
      password,
    });
    setLoadingPwd(false);

    if (pwdError) {
      console.error("Failed to login with password", pwdError);
      setError("メールアドレスまたはパスワードが違う可能性があります。");
      return;
    }
    setMessage("ログインしました。3秒後にトップページへ移動します。");
    setRedirecting(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">ログイン</h1>
        <p className="text-sm text-gray-600">
          初回はメールアドレスにマジックリンクを送信します。登録済みならメール+パスワードでもログインできます。
        </p>
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

      <section className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleMagicLink}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">初回サインイン</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              マジックリンク
            </span>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loadingOtp}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loadingOtp ? "送信中..." : otpSent ? "再送する" : "マジックリンクを送信"}
          </button>
        </form>

        <form
          onSubmit={handlePasswordLogin}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">登録済みの方</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              ID / PW
            </span>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              メールアドレス
            </label>
            <input
              type="email"
              value={passwordEmail}
              onChange={(e) => setPasswordEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              パスワード
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
          <button
            type="submit"
            disabled={loadingPwd || redirecting}
            className="w-full rounded bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {redirecting ? "リダイレクト中..." : loadingPwd ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </section>

      <div className="text-sm text-gray-600">
        <p>
          まだパスワードを設定していない場合は、マジックリンクでログインした後に「パスワードを設定する」機能を追加すると併用できます。
        </p>
        <Link href="/rankings" className="mt-2 inline-block text-blue-600 underline">
          ランキング一覧へ戻る
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-5 py-8">
          <p className="text-gray-600">読み込み中...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

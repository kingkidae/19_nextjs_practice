"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState(params.get("error") ? "로그인에 실패했습니다. 다시 시도하세요." : "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = createClient();
    setBusy(true);
    setError("");
    setNotice("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError("이메일 또는 비밀번호가 맞지 않습니다.");
      router.replace(next);
      router.refresh();
      return;
    }

    const nickname = String(form.get("nickname")).trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname }, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) return setError(error.message.includes("registered") ? "이미 가입된 이메일입니다." : error.message);
    if (data.session) {
      router.replace(next);
      router.refresh();
    } else {
      setNotice("확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 끝납니다.");
    }
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-[#f6f1e7] p-6 shadow-[6px_6px_0_var(--ink)] sm:p-8">
      <div role="tablist" aria-label="로그인 방식" className="mb-6 grid grid-cols-2 rounded-full border-2 border-ink p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full py-2 font-bold ${mode === m ? "bg-ink text-linen" : ""}`}
          >
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <button type="button" onClick={google} className="btn w-full">
        <svg aria-hidden width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Google 계정으로 계속하기
      </button>

      <p className="my-5 text-center text-sm text-ink-soft">또는 이메일로</p>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-1 block text-sm font-bold">닉네임</span>
            <input name="nickname" required minLength={2} maxLength={20} className="field" autoComplete="nickname" />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-bold">이메일</span>
          <input name="email" type="email" required className="field" autoComplete="email" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">비밀번호</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="field"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && <p role="alert" className="text-sm font-bold text-siren">{error}</p>}
        {notice && <p role="status" className="text-sm font-bold">{notice}</p>}
        <button disabled={busy} className="btn btn-ink w-full">
          {busy ? "확인 중…" : mode === "login" ? "로그인" : "가입하기"}
        </button>
      </form>
    </div>
  );
}

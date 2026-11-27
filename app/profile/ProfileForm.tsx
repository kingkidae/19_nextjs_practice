"use client";

import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORIES } from "@/lib/constants";
import type { Profile, ProfilePrivate } from "@/lib/types";
import { saveProfile, skipOnboarding, type ProfileState } from "./actions";
import { Avatar } from "@/components/Avatar";

interface Props {
  profile: Profile;
  priv: ProfilePrivate | null;
  email: string;
  welcome: boolean;
  next: string;
}

export function ProfileForm({ profile, priv, email, welcome, next }: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname);
  const shown = remove ? null : preview ?? profile.avatar_url;

  return (
    <form action={action} className="mt-10 space-y-10">
      <input type="hidden" name="next" value={next} />

      {/* ── 공개 프로필 ── */}
      <section aria-labelledby="public-h" className="grid gap-6 rounded-2xl border-2 border-ink bg-[#f6f1e7] p-6 sm:grid-cols-[auto_1fr]">
        <h2 id="public-h" className="sr-only">공개 프로필</h2>
        <div className="flex flex-col items-center gap-3">
          <label className="group relative cursor-pointer rounded-full has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-siren">
            <motion.span key={shown ?? "none"} initial={{ scale: 0.85, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} className="block">
              <Avatar name={nickname || "?"} url={shown} size={112} />
            </motion.span>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/60 text-sm font-bold text-linen opacity-0 transition-opacity group-hover:opacity-100">
              사진 바꾸기
            </span>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              className="sr-only"
              aria-label="아바타 사진 고르기"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : null);
                setRemove(false);
              }}
            />
          </label>
          {(profile.avatar_url || preview) && (
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" name="remove_avatar" checked={remove} onChange={(e) => setRemove(e.target.checked)} className="accent-[var(--siren)]" />
              사진 지우기
            </label>
          )}
          <p className="max-w-[9rem] text-center text-xs text-ink-soft">2MB 이하 이미지</p>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block font-bold">닉네임 <span className="text-siren">*</span></span>
            <input name="nickname" required minLength={2} maxLength={20} value={nickname} onChange={(e) => setNickname(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">한 줄 소개</span>
            <input name="bio" maxLength={160} defaultValue={profile.bio ?? ""} className="field" placeholder="예: 찍먹 원리주의자. 논리로만 싸웁니다." />
          </label>
          <p className="text-sm text-ink-soft">로그인 계정: {email}</p>
        </div>
      </section>

      {/* ── 비공개 개인정보 ── */}
      <section aria-labelledby="private-h" className="rounded-2xl border-2 border-dashed border-ink p-6">
        <h2 id="private-h" className="font-display text-2xl">나만 보는 정보</h2>
        <p className="mt-1 text-sm text-ink-soft">모두 선택 항목입니다. 다른 사람에게 보이지 않고, 관심 주제 추천에만 씁니다.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">출생연도</span>
            <input name="birth_year" type="number" min={1900} max={new Date().getFullYear()} defaultValue={priv?.birth_year ?? ""} className="field" placeholder="1995" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">성별</span>
            <select name="gender" defaultValue={priv?.gender ?? ""} className="field">
              <option value="">선택 안 함</option>
              <option value="female">여성</option>
              <option value="male">남성</option>
              <option value="other">기타</option>
              <option value="private">밝히지 않음</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">지역</span>
            <input name="region" maxLength={30} defaultValue={priv?.region ?? ""} className="field" placeholder="서울" />
          </label>
        </div>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-bold">관심 카테고리</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.slug}
                className="cursor-pointer rounded-full border-2 border-ink px-3 py-1 text-sm transition-colors has-[:checked]:bg-ink has-[:checked]:text-linen has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-siren"
              >
                <input type="checkbox" name="interests" value={c.slug} defaultChecked={priv?.interests.includes(c.slug)} className="sr-only" />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <AnimatePresence>
        {state.error && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="font-bold text-siren">
            {state.error}
          </motion.p>
        )}
        {state.ok && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="font-bold">
            저장했습니다.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className="btn btn-ink">{pending ? "저장 중…" : welcome ? "저장하고 시작하기" : "저장"}</button>
        {welcome && (
          <button type="submit" formAction={skipOnboarding.bind(null, next)} formNoValidate className="btn">
            나중에 하기
          </button>
        )}
      </div>
    </form>
  );
}

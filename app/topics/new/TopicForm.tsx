"use client";

import { useActionState, useState } from "react";
import { createTopic, type FormState } from "../actions";
import { CATEGORIES, weightLabel } from "@/lib/constants";

export function TopicForm({ defaultCategory }: { defaultCategory: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTopic, {});
  const [weight, setWeight] = useState(5);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={action} className="mt-8 space-y-6">
      <label className="block">
        <span className="mb-1 block font-bold">주제</span>
        <input name="title" required minLength={2} maxLength={80} className="field text-lg" placeholder="한 문장으로, 찬반이 갈리게" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-bold">찬성 쪽 이름</span>
          <input name="pros_label" maxLength={20} className="field" placeholder="찬성 (예: 부먹)" />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">반대 쪽 이름</span>
          <input name="cons_label" maxLength={20} className="field" placeholder="반대 (예: 찍먹)" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block font-bold">설명</span>
        <textarea name="description" maxLength={1000} rows={4} className="field" placeholder="배경과 쟁점을 짧게" />
      </label>

      <label className="block">
        <span className="mb-1 block font-bold">카테고리</span>
        <select name="category" required defaultValue={defaultCategory} className="field">
          <option value="" disabled>골라 주세요</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>

      <div>
        <label htmlFor="weight" className="mb-1 flex items-baseline justify-between font-bold">
          경중
          <span className={`text-sm ${weight >= 7 ? "text-siren" : "text-ink-soft"}`}>{weight} · {weightLabel(weight)}</span>
        </label>
        <input
          id="weight"
          name="weight"
          type="range"
          min={1}
          max={10}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="w-full accent-[var(--siren)]"
        />
      </div>

      <div>
        <span className="mb-1 block font-bold">카드 사진 (선택)</span>
        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-ink p-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- 로컬 미리보기
            <img src={preview} alt="선택한 사진 미리보기" className="h-20 w-28 rounded-md object-cover" />
          ) : (
            <span className="flex h-20 w-28 items-center justify-center rounded-md bg-linen-deep text-xs text-ink-soft">사진 없음</span>
          )}
          <span className="text-sm text-ink-soft">주제와 관련된 사진을 고르세요. 4MB 이하. 없으면 포스터 표지가 들어갑니다.</span>
          <input
            name="image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
        </label>
      </div>

      {state.error && <p role="alert" className="font-bold text-siren">{state.error}</p>}
      <button disabled={pending} className="btn btn-siren">{pending ? "올리는 중…" : "주제 올리기"}</button>
    </form>
  );
}

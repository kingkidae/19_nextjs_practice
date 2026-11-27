"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { weightLabel } from "@/lib/constants";

const PRESETS = [
  { label: "전부", min: 1, max: 10 },
  { label: "가볍게", min: 1, max: 3 },
  { label: "적당히", min: 4, max: 6 },
  { label: "진지하게", min: 7, max: 10 },
];

export function FilterPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [min, setMin] = useState(Number(sp.get("min") ?? 1));
  const [max, setMax] = useState(Number(sp.get("max") ?? 10));
  const [open, setOpen] = useState(Boolean(sp.get("sort") || sp.get("period") || sp.get("live")));

  function push(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  function setRange(a: number, b: number) {
    setMin(a);
    setMax(b);
    push({ min: a === 1 ? null : String(a), max: b === 10 ? null : String(b) });
  }

  // 막대를 누르면 가까운 쪽 끝을 그 칸으로 옮긴다
  function pickBar(level: number) {
    if (Math.abs(level - min) <= Math.abs(level - max)) setRange(Math.min(level, max), max);
    else setRange(min, Math.max(level, min));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    push({
      q: String(f.get("q") ?? "").trim() || null,
      sort: String(f.get("sort") ?? "") || null,
      period: String(f.get("period") ?? "") || null,
      live: f.get("live") ? "1" : null,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]" aria-busy={pending}>
      <form onSubmit={submit} className="space-y-3" role="search">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="q">주제 검색</label>
          <input id="q" name="q" defaultValue={sp.get("q") ?? ""} placeholder="주제나 설명으로 찾기" className="field" />
          <button className="btn btn-ink shrink-0">검색</button>
        </div>
        <button
          type="button"
          className="text-sm font-bold underline underline-offset-4"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          상세검색 {open ? "접기" : "열기"}
        </button>
        {open && (
          <div className="grid gap-3 rounded-lg border-2 border-ink bg-[#f6f1e7] p-4 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-bold">정렬</span>
              <select name="sort" defaultValue={sp.get("sort") ?? ""} className="field">
                <option value="">최근 채팅 순</option>
                <option value="new">새로 올라온 순</option>
                <option value="popular">참여자 많은 순</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-bold">올라온 기간</span>
              <select name="period" defaultValue={sp.get("period") ?? ""} className="field">
                <option value="">전체</option>
                <option value="1">오늘</option>
                <option value="7">최근 7일</option>
                <option value="30">최근 30일</option>
              </select>
            </label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold">
              <input type="checkbox" name="live" defaultChecked={sp.get("live") === "1"} className="h-5 w-5 accent-[var(--siren)]" />
              지금 토론 중인 주제만
            </label>
          </div>
        )}
      </form>

      <fieldset className="rounded-xl bg-ink p-4 text-linen lg:w-[22rem]">
        <legend className="sr-only">주제의 경중</legend>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-xl">경중</span>
          <span className="text-sm text-linen/75" aria-live="polite">
            {min === max ? `${min}` : `${min}–${max}`} · {weightLabel(min)}
            {min !== max && ` ~ ${weightLabel(max)}`}
          </span>
        </div>
        {/* 볼륨 미터: 오른쪽으로 갈수록 무거운 주제 */}
        <div className="mt-3 flex h-20 items-end gap-1.5">
          {Array.from({ length: 10 }, (_, i) => {
            const level = i + 1;
            const on = level >= min && level <= max;
            return (
              <button
                key={level}
                type="button"
                onClick={() => pickBar(level)}
                aria-pressed={on}
                aria-label={`경중 ${level}: ${weightLabel(level)}`}
                className={`flex-1 rounded-sm transition-[background-color,height] duration-200 ${
                  on ? (level >= 7 ? "bg-siren" : "bg-linen") : "bg-linen/15 hover:bg-linen/30"
                }`}
                style={{ height: `${22 + i * 8.6}%` }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-linen/60">
          <span>부먹 찍먹</span>
          <span>낙태 합법화</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setRange(p.min, p.max)}
              className={`rounded-full border px-3 py-1 text-xs ${
                min === p.min && max === p.max ? "border-siren bg-siren text-linen" : "border-linen/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

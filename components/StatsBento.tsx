"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TopicStats } from "@/lib/types";

// 관계도 유형 색: dataviz 검증기 통과 (#F6F1E7 표면, CVD ΔE 8.8 / 정상 시각 23.1). 4번째 유형부터는 '기타' 회색으로 접는다.
const TYPE_COLORS = ["#C2571A", "#17855F", "#8B3FA8"];
const OTHER = "#8C857A";

type CardKey = "trend" | "standoff" | "keywords" | "relations" | "articles";

interface Props {
  stats: TopicStats | null;
  title: string;
  prosLabel: string;
  consLabel: string;
  prosCount: number;
  consCount: number;
  rooms: { live: number; waiting: number; ended: number };
}

export function StatsBento(props: Props) {
  const [open, setOpen] = useState<CardKey | null>(null);
  const s = props.stats;
  const empty = <p className="text-sm text-ink-soft">자료 준비 중입니다. 관리자가 빅카인즈 자료를 올리면 채워집니다.</p>;

  const cards: { key: CardKey; title: string; className: string; body: (full: boolean) => React.ReactNode }[] = [
    {
      key: "trend",
      title: "언론 보도량 추이",
      className: "sm:col-span-2 lg:row-span-2",
      body: (full) => (s?.trend.length ? <TrendChart data={s.trend} full={full} /> : empty),
    },
    {
      key: "standoff",
      title: "이 사이트의 판세",
      className: "sm:col-span-2",
      body: (full) => <Standoff {...props} full={full} />,
    },
    {
      key: "keywords",
      title: "연관어",
      className: "lg:row-span-2",
      body: (full) => (s?.keywords.length ? <KeywordBars data={s.keywords} limit={full ? 30 : 8} /> : empty),
    },
    {
      key: "relations",
      title: "관계도",
      className: "lg:row-span-2",
      body: (full) => (s?.relations.length ? <RelationGraph data={s.relations} center={props.title} full={full} /> : empty),
    },
    {
      key: "articles",
      title: "관련 기사",
      className: "sm:col-span-2",
      body: (full) => (s?.articles.length ? <Articles data={s.articles} full={full} /> : empty),
    },
  ];

  const current = cards.find((c) => c.key === open);

  return (
    <section aria-labelledby="bento-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="bento-title" className="font-display text-4xl">싸우기 전에 읽을 거리</h2>
        <p className="text-xs text-ink-soft">
          출처: BIG KINDS{s?.is_sample && " (예시 데이터)"}
          {s && ` · ${new Date(s.updated_at).toLocaleDateString("ko-KR")} 갱신`}
        </p>
      </div>
      <div className="mt-5 grid auto-rows-[minmax(10rem,auto)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.button
            layoutId={`bento-${c.key}`}
            key={c.key}
            type="button"
            onClick={() => setOpen(c.key)}
            className={`flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-[#f6f1e7] p-4 text-left ${c.className}`}
            aria-haspopup="dialog"
          >
            <span className="mb-3 flex w-full items-center justify-between font-bold">
              {c.title}
              <span aria-hidden className="text-lg leading-none">+</span>
            </span>
            <span className="block w-full flex-1">{c.body(false)}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-label={current.title}>
            <motion.div
              className="absolute inset-0 bg-ink/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
            />
            <motion.div
              layoutId={`bento-${current.key}`}
              className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-ink bg-[#f6f1e7] p-6"
              onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-3xl">{current.title}</h3>
                <button autoFocus onClick={() => setOpen(null)} className="btn" aria-label="닫기">닫기</button>
              </div>
              {current.body(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ───────── 보도량: 단일 시리즈 선 그래프 + 호버 십자선 ─────────
function TrendChart({ data, full }: { data: { date: string; count: number }[]; full: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = full ? 260 : 200, P = { l: 36, r: 24, t: 30, b: 26 };
  const max = Math.max(...data.map((d) => d.count), 1);
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(data.length - 1, 1);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.count)}`).join("");
  const peak = data.reduce((a, d, i) => (d.count > data[a].count ? i : a), 0);
  const ticks = [0, Math.round(max / 2), max];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`월별 보도 건수. 최고 ${data[peak].date} ${data[peak].count}건`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - P.l) / (W - P.l - P.r)) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#c9bea8" strokeWidth={1} />
            <text x={P.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4a4844">{t}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="#4a4844">{d.date.slice(2)}</text>
        ))}
        <path d={`${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="#18181a" opacity={0.06} />
        <path d={line} fill="none" stroke="#18181a" strokeWidth={2} strokeLinejoin="round" />
        <circle cx={x(peak)} cy={y(data[peak].count)} r={5} fill="#f2301f" stroke="#f6f1e7" strokeWidth={2} />
        <text x={x(peak)} y={y(data[peak].count) - 12} textAnchor="middle" fontSize={12} fontWeight={700} fill="#18181a">
          {data[peak].count}건
        </text>
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#18181a" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].count)} r={5} fill="#18181a" stroke="#f6f1e7" strokeWidth={2} />
          </g>
        )}
      </svg>
      <p className="h-5 text-sm" aria-live="polite">
        {hover !== null ? `${data[hover].date}: ${data[hover].count.toLocaleString()}건` : ""}
      </p>
      {full && <DataTable head={["기간", "보도 건수"]} rows={data.map((d) => [d.date, d.count.toLocaleString()])} />}
    </div>
  );
}

// ───────── 판세: 사이트 내 찬반 인원과 토론방 현황 ─────────
function Standoff({ prosLabel, consLabel, prosCount, consCount, rooms, full }: Props & { full: boolean }) {
  const total = prosCount + consCount;
  const pct = total ? Math.round((prosCount / total) * 100) : 50;
  return (
    <div>
      <div className="flex items-end justify-between">
        <p><span className="font-display text-5xl text-pros">{prosCount}</span> <span className="text-sm">{prosLabel}</span></p>
        <p className="text-right"><span className="text-sm">{consLabel}</span> <span className="font-display text-5xl text-cons">{consCount}</span></p>
      </div>
      <div className="mt-3 flex h-3 gap-[2px] overflow-hidden rounded-full" aria-label={`${prosLabel} ${pct}%, ${consLabel} ${100 - pct}%`}>
        <div className="rounded-l-full bg-pros" style={{ width: `${pct}%` }} />
        <div className="flex-1 rounded-r-full bg-cons" />
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        진행 중 {rooms.live}방 / 대기 {rooms.waiting}방 / 종료 {rooms.ended}방
      </p>
      {full && (
        <p className="mt-4 text-sm">
          인원은 이 주제의 모든 토론방에서 각 진영을 고른 사람 수를 더한 값입니다. 내보내진 사람은 빠집니다.
        </p>
      )}
    </div>
  );
}

// ───────── 연관어: 단일 색 가로 막대 ─────────
function KeywordBars({ data, limit }: { data: { word: string; weight: number }[]; limit: number }) {
  const rows = [...data].sort((a, b) => b.weight - a.weight).slice(0, limit);
  const max = rows[0]?.weight || 1;
  return (
    <ol className="space-y-1.5">
      {rows.map((k, i) => (
        <li key={k.word} className="grid grid-cols-[5.5rem_1fr] items-center gap-2 text-sm" title={`가중치 ${k.weight}`}>
          <span className="truncate">{k.word}</span>
          <span className="h-2.5 rounded-r-[4px] bg-ink" style={{ width: `${(k.weight / max) * 100}%`, opacity: i === 0 ? 1 : 0.75 }} />
        </li>
      ))}
    </ol>
  );
}

// ───────── 관계도: 주제를 가운데 두고 개체를 둘러 배치 ─────────
function RelationGraph({ data, center, full }: { data: { name: string; type: string; weight: number }[]; center: string; full: boolean }) {
  const nodes = [...data].sort((a, b) => b.weight - a.weight).slice(0, full ? 16 : 7);
  const typeOrder = Object.entries(nodes.reduce<Record<string, number>>((m, n) => ({ ...m, [n.type]: (m[n.type] ?? 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
  const color = (t: string) => TYPE_COLORS[typeOrder.indexOf(t)] ?? OTHER;
  const max = nodes[0]?.weight || 1;
  const S = full ? 460 : 240, c = S / 2, R = S * 0.36;

  return (
    <div>
      <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto w-full max-w-md" role="img" aria-label={`${center} 관계도: ${nodes.map((n) => n.name).join(", ")}`}>
        {nodes.map((n, i) => {
          const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const nx = c + Math.cos(a) * R, ny = c + Math.sin(a) * R;
          const r = 5 + (n.weight / max) * (full ? 14 : 8);
          return (
            <g key={n.name}>
              <line x1={c} y1={c} x2={nx} y2={ny} stroke="#18181a" strokeOpacity={0.25} strokeWidth={1 + (n.weight / max) * 3} />
              <circle cx={nx} cy={ny} r={r} fill={color(n.type)} stroke="#f6f1e7" strokeWidth={2}>
                <title>{`${n.name} (${n.type}) 가중치 ${n.weight}`}</title>
              </circle>
              <text x={nx} y={ny + r + (full ? 13 : 10)} textAnchor="middle" fontSize={full ? 12 : 9} fill="#18181a">{n.name}</text>
            </g>
          );
        })}
        <circle cx={c} cy={c} r={full ? 30 : 18} fill="#18181a" />
        <text x={c} y={c} textAnchor="middle" dominantBaseline="middle" fontSize={full ? 12 : 8} fill="#ece5d6" fontWeight={700}>주제</text>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="범례">
        {[...typeOrder.slice(0, 3), ...(typeOrder.length > 3 ? ["기타"] : [])].map((t) => (
          <li key={t} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: t === "기타" ? OTHER : color(t) }} />
            {t}
          </li>
        ))}
      </ul>
      {full && <DataTable head={["개체", "유형", "가중치"]} rows={nodes.map((n) => [n.name, n.type, String(n.weight)])} />}
    </div>
  );
}

function Articles({ data, full }: { data: { title: string; press: string; date: string; url: string }[]; full: boolean }) {
  // 카드(버튼) 안에는 링크를 넣을 수 없어서, 원문 링크는 펼친 화면에서만 건다
  return (
    <ul className="divide-y divide-linen-dim">
      {data.slice(0, full ? 50 : 3).map((a, i) => (
        <li key={i} className="py-2">
          {full ? (
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">
              {a.title}
            </a>
          ) : (
            <span className="font-bold">{a.title}</span>
          )}
          <span className="block text-xs text-ink-soft">{a.press} / {a.date}</span>
        </li>
      ))}
    </ul>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer font-bold">표로 보기</summary>
      <table className="mt-2 w-full text-left">
        <thead>
          <tr>{head.map((h) => <th key={h} className="border-b-2 border-ink py-1">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-linen-dim py-1">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

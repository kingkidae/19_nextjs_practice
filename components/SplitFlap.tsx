"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TICK = 70; // 플랩이 한 번 넘어가는 간격(ms)
const START = 250; // 첫 글자가 멈추기 시작하는 시점
const STAGGER = 85; // 글자마다 멈추는 시차

// at[i]: 그 칸의 글자가 마지막으로 바뀐 틱. 바뀐 칸만 접힘 애니메이션을 다시 시작한다.
type Board = { cur: string[]; prev: string[]; at: number[]; tick: number };
const rand = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/** 공항 출발 안내판처럼 글자판이 넘어가다 왼쪽부터 차례로 멈춘다. 마우스를 올리면 다시 돈다. */
export function SplitFlap({ lines, className }: { lines: string[]; className?: string }) {
  const key = lines.join("|");
  const target = useMemo(() => key.replaceAll("|", "").split(""), [key]);
  // 줄마다 전체 글자 배열에서 몇 번째부터 시작하는지
  const starts = useMemo(() => key.split("|").map((_, n, all) => all.slice(0, n).join("").length), [key]);
  const reduce = useReducedMotion();
  // 서버 렌더와 첫 화면은 최종 글자: 자바스크립트가 없어도 제목이 보인다
  const [board, setBoard] = useState<Board>({ cur: target, prev: target, at: target.map(() => 0), tick: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(() => {
    if (reduce || timer.current) return;
    const t0 = performance.now();
    const doneAt = START + (target.length - 1) * STAGGER;
    timer.current = setInterval(() => {
      const elapsed = performance.now() - t0;
      // 마지막 글자가 멈춘 뒤 접힘 애니메이션(220ms)이 끝나면 모든 칸을 최종 글자로 정리하고 멈춘다
      if (elapsed >= doneAt + 300) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setBoard((b) => ({ cur: target, prev: target, at: b.at, tick: b.tick + 1 }));
        return;
      }
      setBoard((b) => {
        const tick = b.tick + 1;
        const cur = target.map((ch, i) => (elapsed >= START + i * STAGGER ? ch : rand()));
        return {
          cur,
          prev: cur.map((c, i) => (c !== b.cur[i] ? b.cur[i] : b.prev[i])),
          at: cur.map((c, i) => (c !== b.cur[i] ? tick : b.at[i])),
          tick,
        };
      });
    }, TICK);
  }, [reduce, target]);

  useEffect(() => {
    run();
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [run]);

  return (
    <span className={className} onPointerEnter={run} aria-hidden>
      {lines.map((line, n) => {
        const start = starts[n];
        return (
          <span key={line} className="block whitespace-nowrap">
            {line.split("").map((final, j) => {
              const i = start + j;
              const cur = board.cur[i];
              const prev = board.prev[i];
              const flipping = cur !== prev;
              const settling = cur === final && flipping;
              return (
                <span key={j} className="flap" style={{ ["--d" as string]: settling ? "220ms" : `${TICK}ms` }}>
                  <span className="flap-sizer">{final}</span>
                  {/* 고정된 두 반쪽: 위는 새 글자, 아래는 아직 이전 글자 */}
                  <span className="flap-layer flap-top">{cur}</span>
                  <span className="flap-layer flap-bottom">{flipping ? prev : cur}</span>
                  {flipping && (
                    <>
                      {/* 이전 글자의 위 반쪽이 접혀 내려가고, 새 글자의 아래 반쪽이 펼쳐진다 */}
                      <span key={`t${board.at[i]}`} className="flap-layer flap-top flap-fold-top">{prev}</span>
                      <span key={`b${board.at[i]}`} className="flap-layer flap-bottom flap-fold-bottom">{cur}</span>
                    </>
                  )}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

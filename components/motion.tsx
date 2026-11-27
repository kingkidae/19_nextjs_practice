"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** 화면에 들어오면 아래에서 떠오른다. delay 로 순서를 준다. */
export function Reveal({ children, delay = 0, className, y = 28, x = 0 }: { children: React.ReactNode; delay?: number; className?: string; y?: number; x?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** 자식들을 차례로 등장시키는 그리드 */
export function Stagger({ children, className, step = 0.07 }: { children: React.ReactNode[]; className?: string; step?: number }) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40, rotate: i % 2 ? 1.5 : -1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, delay: (i % 8) * step, ease: EASE }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/** 헤드라인: 줄마다 마스크 아래에서 솟아오른다 */
export function RiseLines({ lines, className, delay = 0 }: { lines: string[]; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={line + i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: delay + i * 0.12, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** 0 부터 목표 숫자까지 세어 올라간다 (화면에 들어올 때 한 번) */
export function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.1, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref} className={className}>{n.toLocaleString()}</span>;
}

/** 마우스를 따라 살짝 기우는 카드 (포스터를 손에 든 느낌) */
export function Tilt({ children, className, max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 250, damping: 20 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 250, damping: 20 });
  return (
    <motion.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      {children}
    </motion.div>
  );
}

/** 끝없이 흐르는 띠 (지금 불붙은 주제 전광판) */
export function Marquee({ children, speed = 40, className }: { children: React.ReactNode; speed?: number; className?: string }) {
  return (
    <div className={`group flex overflow-hidden ${className ?? ""}`}>
      {[0, 1].map((k) => (
        <div
          key={k}
          aria-hidden={k === 1}
          inert={k === 1}
          className="flex shrink-0 animate-[marquee_var(--speed)_linear_infinite] items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ ["--speed" as string]: `${speed}s` }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

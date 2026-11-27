"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

// 그림자: 바닥에 붙은 짙은 그림자 + 넓게 퍼지는 옅은 그림자. 떠오르면 멀어지고 옅어진다.
const SHADOW = {
  rest: "0 6px 10px -2px rgba(0,0,0,0.45), 0 14px 28px -6px rgba(0,0,0,0.35)",
  lifted: "0 12px 16px -4px rgba(0,0,0,0.38), 0 24px 40px -8px rgba(0,0,0,0.3)",
  pressed: "0 2px 4px 0 rgba(0,0,0,0.5), 0 4px 8px -2px rgba(0,0,0,0.3)",
};

// 오른쪽 아래 "맨 위로" 버튼. 600px 이상 내려가면 나타나고, 테두리의 빨간 링이 읽은 만큼 찬다.
export function BackToTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 600));

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label="맨 위로 올라가기"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          initial={{ opacity: 0, y: 24, scale: 0.6, boxShadow: SHADOW.rest }}
          animate={{ opacity: 1, y: 0, scale: 1, boxShadow: SHADOW.rest }}
          exit={{ opacity: 0, y: 24, scale: 0.6 }}
          whileHover={{ y: -4, boxShadow: SHADOW.lifted }}
          whileTap={{ scale: 0.92, y: 0, boxShadow: SHADOW.pressed }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className="fixed bottom-5 right-5 z-[65] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-linen sm:bottom-8 sm:right-8"
        >
          <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="28" cy="28" r="25" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
            <motion.circle cx="28" cy="28" r="25" fill="none" stroke="#f2301f" strokeWidth="3" strokeLinecap="round" style={{ pathLength: scrollYProgress }} />
          </svg>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

"use client";

import { MotionConfig, motion, useScroll, useSpring } from "motion/react";
import { BackToTop } from "@/components/BackToTop";

// 모든 모션은 사용자의 '동작 줄이기' 설정을 따른다
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      {children}
      <BackToTop />
    </MotionConfig>
  );
}

// 화면 맨 위의 얇은 빨간 선: 얼마나 읽었는지
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-siren" />;
}

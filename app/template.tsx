"use client";

import { motion } from "motion/react";

// 페이지를 옮길 때마다 새로 마운트된다: 살짝 떠오르며 들어온다
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

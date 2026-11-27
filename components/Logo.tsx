"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

// CONTROVERSIAL 속에 숨은 V 와 S = VS. 로드 때 떨어져 박히고, 로고에 마우스를 올리면 서로 들이받는다.
function Hit({ ch, i, dir, hit }: { ch: string; i: number; dir: 1 | -1; hit: number }) {
  return (
    <motion.span
      className="inline-block text-siren"
      initial={{ y: -28, rotate: -20, opacity: 0 }}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 14, delay: 0.25 + i * 0.12 }}
    >
      {/* hit 값이 바뀔 때마다 다시 마운트되어 충돌 모션을 한 번 재생한다 */}
      <motion.span
        key={hit}
        className="inline-block"
        initial={false}
        animate={hit ? { x: [0, dir * 3, dir * -1, 0], rotate: [0, dir * 14, dir * -6, 0], scale: [1, 1.3, 1.1, 1] } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {ch}
      </motion.span>
    </motion.span>
  );
}

export function Logo() {
  const [hit, setHit] = useState(0);
  return (
    <Link
      href="/"
      onPointerEnter={() => setHit((n) => n + 1)}
      onFocus={() => setHit((n) => n + 1)}
      className="font-display whitespace-nowrap text-lg leading-none sm:text-2xl"
      aria-label="The Controversial 홈"
    >
      <span aria-hidden>
        THE CONTRO<Hit ch="V" i={0} dir={1} hit={hit} />ER<Hit ch="S" i={1} dir={-1} hit={hit} />IAL
      </span>
    </Link>
  );
}

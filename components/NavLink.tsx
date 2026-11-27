"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

type Props = { href: string; children: React.ReactNode; className?: string };

// 현재 보고 있는 메뉴 아래에 빨간 밑줄이 미끄러져 따라온다
function Active({ href, children, className = "" }: Props) {
  const path = usePathname();
  const on = path === href || (href !== "/" && path.startsWith(href + "/"));
  return (
    <Link href={href} aria-current={on ? "page" : undefined} className={`relative text-linen/80 hover:text-linen ${on ? "text-linen" : ""} ${className}`}>
      {children}
      {on && <motion.span layoutId="nav-underline" className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-siren" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
    </Link>
  );
}

export function NavLink(props: Props) {
  // 동적 경로에서는 경로를 요청 시점에야 알 수 있어 Suspense 가 필요하다
  return (
    <Suspense fallback={<Link href={props.href} className={`text-linen/80 ${props.className ?? ""}`}>{props.children}</Link>}>
      <Active {...props} />
    </Suspense>
  );
}

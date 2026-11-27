import type { Metadata } from "next";
import { Black_Han_Sans, IBM_Plex_Sans_KR } from "next/font/google";
import { Suspense } from "react";
import Link from "next/link";
import { HeaderAccount } from "@/components/HeaderAccount";
import { CATEGORIES } from "@/lib/constants";
import "./globals.css";

const display = Black_Han_Sans({ weight: "400", variable: "--font-black-han", preload: false });
const body = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], variable: "--font-plex-kr", preload: false });

export const metadata: Metadata = {
  title: "The Controversial: Pros and Cons",
  description: "부먹 찍먹부터 낙태 합법화까지. 세상의 모든 논쟁을 찬반으로 나눠 실시간으로 싸우는 곳.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="bg-ink text-linen">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
            <Link href="/" className="font-display whitespace-nowrap text-lg leading-none sm:text-2xl" aria-label="The Controversial 홈">
              THE <span className="text-siren">C</span>ONTROVERSIAL
            </Link>
            <nav aria-label="주요 메뉴" className="ml-auto flex items-center gap-4 text-sm">
              <Link href="/notices" className="hover:text-siren">공지</Link>
              <Link href="/shop" className="hover:text-siren">상점</Link>
              <Suspense fallback={<span className="w-16" />}>
                <HeaderAccount />
              </Suspense>
            </nav>
          </div>
          <nav aria-label="카테고리" className="border-t border-ink-soft/60">
            <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6">
              {CATEGORIES.map((c) => (
                <li key={c.slug} className="shrink-0">
                  <Link href={`/c/${c.slug}`} className="block px-3 py-2 text-sm text-linen/80 hover:text-linen">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-ink text-linen/70">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-6 text-xs sm:px-6">
            <p>The Controversial: Pros and Cons · 포트폴리오 프로젝트</p>
            <p>통계·기사 출처: 한국언론진흥재단 BIG KINDS. 기사 저작권은 각 언론사에 있습니다.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, IBM_Plex_Sans_KR } from "next/font/google";
import { Suspense } from "react";
import { HeaderAccount } from "@/components/HeaderAccount";
import { Providers } from "@/components/Providers";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { CATEGORIES } from "@/lib/constants";
import { getSettings, SITE } from "@/lib/settings";
import "./globals.css";

const display = Black_Han_Sans({ weight: "400", variable: "--font-black-han", preload: false });
const body = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], variable: "--font-plex-kr", preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const { site_url } = await getSettings();
  return {
    metadataBase: new URL(site_url),
    title: { default: `${SITE.fullName} | 세상의 모든 논쟁을 찬반으로`, template: `%s | ${SITE.name}` },
    description: SITE.description,
    applicationName: SITE.fullName,
    keywords: ["찬반 토론", "토론 사이트", "논쟁", "밸런스 게임", "부먹 찍먹", "실시간 토론", "시사 토론", "찬성 반대", "토론 커뮤니티"],
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "ko_KR", siteName: SITE.fullName, title: SITE.fullName, description: SITE.description, url: "/" },
    twitter: { card: "summary_large_image", title: SITE.fullName, description: SITE.description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: "#18181a" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <html lang="ko" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "Organization", "@id": `${settings.site_url}/#org`, name: SITE.fullName, url: settings.site_url, ...(settings.contact_email && { email: settings.contact_email }), sameAs: [settings.instagram_url, settings.x_url, settings.youtube_url].filter(Boolean) },
              { "@type": "WebSite", "@id": `${settings.site_url}/#site`, name: SITE.fullName, url: settings.site_url, inLanguage: "ko-KR", description: SITE.description, publisher: { "@id": `${settings.site_url}/#org` } },
            ],
          }}
        />
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-siren focus:px-4 focus:py-2 focus:text-linen">
            본문으로 건너뛰기
          </a>
          <header className="bg-ink text-linen">
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
              <Logo />
              <nav aria-label="주요 메뉴" className="ml-auto flex items-center gap-4 text-sm">
                <NavLink href="/notices">공지</NavLink>
                <NavLink href="/shop">상점</NavLink>
                <Suspense fallback={<span className="w-16" />}>
                  <HeaderAccount />
                </Suspense>
              </nav>
            </div>
            <nav aria-label="카테고리" className="border-t border-ink-soft/60">
              <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6">
                {CATEGORIES.map((c) => (
                  <li key={c.slug} className="shrink-0">
                    <NavLink href={`/c/${c.slug}`} className="block px-3 py-2 text-sm">
                      {c.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </header>
          <main id="main" className="flex-1">{children}</main>
          <Footer settings={settings} />
        </Providers>
      </body>
    </html>
  );
}

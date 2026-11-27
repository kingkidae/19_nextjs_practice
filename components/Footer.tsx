import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { SITE } from "@/lib/settings";
import { CATEGORIES } from "@/lib/constants";
import { LogoMark } from "@/components/LogoMark";

// 관리자 > 사이트 설정의 링크를 쓴다. 외부 주소는 새 탭으로 연다.
function FooterLink({ href, children, strong }: { href: string; children: React.ReactNode; strong?: boolean }) {
  const external = /^https?:\/\//.test(href);
  const cls = `underline-offset-4 hover:text-linen hover:underline ${strong ? "font-bold text-linen" : ""}`;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  );
}

export function Footer({ settings }: { settings: Settings }) {
  const sns = [
    { label: "Instagram", href: settings.instagram_url },
    { label: "X", href: settings.x_url },
    { label: "YouTube", href: settings.youtube_url },
  ].filter((s) => s.href);

  return (
    <footer className="overflow-hidden bg-ink text-linen/70">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display flex items-center gap-3 text-3xl text-linen"><LogoMark size={40} />THE CONTROVERSIAL</p>
            <p className="mt-3 max-w-sm text-sm">{SITE.description}</p>
          </div>
          <nav aria-label="카테고리 바로가기">
            <p className="mb-3 text-sm font-bold text-linen">카테고리</p>
            <ul className="grid grid-cols-3 gap-y-1.5 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c.slug}><Link href={`/c/${c.slug}`} className="hover:text-linen">{c.name}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="안내">
            <p className="mb-3 text-sm font-bold text-linen">안내</p>
            <ul className="space-y-1.5 text-sm">
              <li><FooterLink href="/notices">공지</FooterLink></li>
              <li><FooterLink href={settings.terms_url}>이용약관</FooterLink></li>
              <li><FooterLink href={settings.privacy_url} strong>개인정보 처리방침</FooterLink></li>
              {settings.contact_email && <li><a href={`mailto:${settings.contact_email}`} className="hover:text-linen">문의 {settings.contact_email}</a></li>}
              {sns.map((s) => <li key={s.label}><FooterLink href={s.href}>{s.label}</FooterLink></li>)}
            </ul>
          </nav>
        </div>
        <p className="mt-10 border-t border-linen/15 py-5 text-xs">
          통계·기사 출처: 한국언론진흥재단 BIG KINDS. 기사 저작권은 각 언론사에 있습니다. 포트폴리오 프로젝트로 결제는 테스트 모드입니다.
        </p>
      </div>
      {/* 바닥에 깔린 대형 워드마크 */}
      <p aria-hidden className="font-display -mb-[0.18em] select-none whitespace-nowrap text-center text-[12.5vw] leading-none text-linen/[0.06]">
        PROS VS CONS
      </p>
    </footer>
  );
}

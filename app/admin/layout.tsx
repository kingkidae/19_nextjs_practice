import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";

const TABS = [
  { href: "/admin", label: "토론방·주제" },
  { href: "/admin/notices", label: "공지" },
  { href: "/admin/users", label: "회원" },
  { href: "/admin/stats", label: "빅카인즈 자료" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl">관리자</h1>
      <nav aria-label="관리 메뉴" className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold hover:bg-ink hover:text-linen">
            {t.label}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<div className="mt-8 h-80 animate-pulse rounded-xl bg-linen-deep" />}>
        <Gate>{children}</Gate>
      </Suspense>
    </div>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login?next=/admin");
  if (profile?.role !== "admin") redirect("/");
  return <div className="mt-8">{children}</div>;
}

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "공지 | The Controversial" };

export default function NoticesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-6xl">공지</h1>
      <Suspense fallback={<div className="mt-8 h-60 animate-pulse rounded-xl bg-linen-deep" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (!data?.length) return <p className="mt-8 text-ink-soft">등록된 공지가 없습니다.</p>;
  return (
    <ul className="mt-8 space-y-4">
      {data.map((n) => (
        <li key={n.id} className={`rounded-2xl border-2 border-ink p-5 ${n.pinned ? "bg-ink text-linen" : "bg-[#f6f1e7]"}`}>
          <details open={n.pinned}>
            <summary className="flex cursor-pointer items-baseline justify-between gap-3">
              <span className="text-lg font-bold">
                {n.pinned && <span className="mr-2 rounded bg-siren px-1.5 text-sm text-linen">고정</span>}
                {n.title}
              </span>
              <time className="shrink-0 text-xs opacity-70" dateTime={n.created_at}>
                {new Date(n.created_at).toLocaleDateString("ko-KR")}
              </time>
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-sm opacity-90">{n.body}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}

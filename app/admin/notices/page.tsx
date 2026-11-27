import { createClient } from "@/lib/supabase/server";
import { NoticeForm } from "./NoticeForm";
import { deleteNotice } from "../actions";

export default async function AdminNotices() {
  const supabase = await createClient();
  const { data } = await supabase.from("notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <section aria-labelledby="new-notice">
        <h2 id="new-notice" className="font-display text-3xl">새 공지</h2>
        <NoticeForm />
      </section>
      <section aria-labelledby="notice-list">
        <h2 id="notice-list" className="font-display text-3xl">등록된 공지 {data?.length ?? 0}개</h2>
        <ul className="mt-4 space-y-3">
          {(data ?? []).map((n) => (
            <li key={n.id} className="rounded-2xl border-2 border-ink bg-[#f6f1e7] p-4">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-2 font-bold">
                  <span>{n.pinned && "📌 "}{n.title}</span>
                  <span className="text-xs font-normal text-ink-soft">수정하려면 펼치기</span>
                </summary>
                <NoticeForm notice={n} />
                <form action={deleteNotice.bind(null, n.id)} className="mt-2">
                  <button className="text-sm font-bold text-siren underline underline-offset-4">이 공지 삭제</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

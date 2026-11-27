import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryName } from "@/lib/constants";
import type { Room } from "@/lib/types";
import { deleteRoom, deleteTopic, setMuted } from "./actions";

export default async function AdminRooms() {
  const supabase = await createClient();
  const [{ data: rooms }, { data: topics }] = await Promise.all([
    supabase.from("rooms").select("*, topics(title)").neq("status", "ended").order("created_at", { ascending: false }).limit(100),
    supabase.from("topic_cards").select("id, title, category, weight, participants, created_at").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="rooms-h">
        <h2 id="rooms-h" className="font-display text-3xl">진행 중·대기 중인 토론방</h2>
        <p className="mt-1 text-sm text-ink-soft">발언 정지, 메시지 삭제, 강퇴는 방에 들어가서도 할 수 있습니다.</p>
        <ul className="mt-4 space-y-2">
          {(rooms ?? []).map((r: Room & { topics: { title: string } | null }) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink bg-[#f6f1e7] p-3 text-sm">
              <StatusBadge status={r.status} />
              {r.muted && <span className="rounded-full bg-siren px-2 py-0.5 font-bold text-linen">정지됨</span>}
              <Link href={`/rooms/${r.id}`} className="min-w-0 flex-1 truncate font-bold underline-offset-4 hover:underline">
                {r.title} <span className="font-normal text-ink-soft">/ {r.topics?.title}</span>
              </Link>
              <form action={setMuted.bind(null, r.id, !r.muted)}>
                <button className="rounded-full border-2 border-ink px-3 py-1 font-bold">{r.muted ? "정지 풀기" : "발언 정지"}</button>
              </form>
              <form action={deleteRoom.bind(null, r.id)}>
                <button className="rounded-full bg-siren px-3 py-1 font-bold text-linen">삭제</button>
              </form>
            </li>
          ))}
          {!rooms?.length && <li className="text-ink-soft">열린 방이 없습니다.</li>}
        </ul>
      </section>

      <section aria-labelledby="topics-h">
        <h2 id="topics-h" className="font-display text-3xl">최근 주제</h2>
        <ul className="mt-4 space-y-2">
          {(topics ?? []).map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-xl border-2 border-ink bg-[#f6f1e7] p-3 text-sm">
              <span className="rounded-full border border-ink px-2">{categoryName(t.category)}</span>
              <Link href={`/topics/${t.id}`} className="min-w-0 flex-1 truncate font-bold">{t.title}</Link>
              <span className="text-ink-soft">경중 {t.weight} / {t.participants}명</span>
              <form action={deleteTopic.bind(null, t.id)}>
                <button className="rounded-full bg-siren px-3 py-1 font-bold text-linen">삭제</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

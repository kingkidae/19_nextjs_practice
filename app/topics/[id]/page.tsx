import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { categoryName, timeAgo, weightLabel } from "@/lib/constants";
import type { Room, TopicCard, TopicStats } from "@/lib/types";
import { StatsBento } from "@/components/StatsBento";
import { joinRoom } from "../actions";
import { RoomForm } from "./RoomForm";
import { StatusBadge } from "@/components/StatusBadge";
import { deleteTopic } from "@/app/admin/actions";

export default function TopicPage({ params }: PageProps<"/topics/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-[60vh] max-w-7xl animate-pulse bg-linen-deep" />}>
      <Topic params={params} />
    </Suspense>
  );
}

async function Topic({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getViewer();
  const [{ data: topic }, { data: stats }, { data: rooms }] = await Promise.all([
    supabase.from("topic_cards").select("*").eq("id", id).maybeSingle<TopicCard>(),
    supabase.from("topic_stats").select("*").eq("topic_id", id).maybeSingle<TopicStats>(),
    supabase.from("rooms").select("*, room_members(side, kicked)").eq("topic_id", id).order("created_at", { ascending: false }),
  ]);
  if (!topic) notFound();

  const list = (rooms ?? []) as (Room & { room_members: { side: string; kicked: boolean }[] })[];
  const count = (status: Room["status"]) => list.filter((r) => r.status === status).length;
  const canDelete = profile?.role === "admin" || (user && topic.created_by === user.id);

  return (
    <article>
      <header className="relative overflow-hidden bg-ink text-linen">
        {topic.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 Storage 이미지
          <img src={topic.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        )}
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6">
          <p className="text-sm text-linen/70">
            <Link href={`/c/${topic.category}`} className="underline underline-offset-4">{categoryName(topic.category)}</Link>
            {" "}/ 경중 {topic.weight} {weightLabel(topic.weight)} / 마지막 채팅 {timeAgo(topic.last_chat_at)}
          </p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl sm:text-7xl">{topic.title}</h1>
          {topic.description && <p className="mt-5 max-w-2xl text-linen/85">{topic.description}</p>}
          {canDelete && (
            <form action={deleteTopic.bind(null, topic.id)} className="mt-6">
              <button className="text-sm text-siren underline underline-offset-4">주제 삭제</button>
            </form>
          )}
        </div>
        {/* 두 코너: 진영 선택 */}
        <div className="relative grid sm:grid-cols-2">
          {(["pros", "cons"] as const).map((side) => (
            <a
              key={side}
              href="#rooms"
              className={`group flex items-center justify-between px-6 py-6 sm:px-10 ${side === "pros" ? "bg-pros" : "bg-cons sm:flex-row-reverse sm:text-right"}`}
            >
              <span>
                <span className="block text-sm text-linen/80">{side === "pros" ? "블루 코너" : "레드 코너"}</span>
                <span className="font-display text-4xl">{side === "pros" ? topic.pros_label : topic.cons_label}</span>
              </span>
              <span className="font-display text-5xl">{side === "pros" ? topic.pros_count : topic.cons_count}<span className="ml-1 text-lg">명</span></span>
            </a>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6">
        <StatsBento
          stats={stats}
          title={topic.title}
          prosLabel={topic.pros_label}
          consLabel={topic.cons_label}
          prosCount={topic.pros_count}
          consCount={topic.cons_count}
          rooms={{ live: count("live"), waiting: count("waiting"), ended: count("ended") }}
        />

        <section id="rooms" aria-labelledby="rooms-title" className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 id="rooms-title" className="font-display text-4xl">토론방</h2>
            {list.length === 0 ? (
              <p className="mt-4 text-ink-soft">아직 열린 방이 없습니다. 오른쪽에서 첫 방을 여세요.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {list.map((r) => {
                  const active = r.room_members.filter((m) => !m.kicked);
                  const pros = active.filter((m) => m.side === "pros").length;
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border-2 border-ink bg-[#f6f1e7] p-4">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-xs">
                          <StatusBadge status={r.status} />
                          발언 {r.speak_seconds / 60}분 / {r.rounds}라운드
                        </p>
                        <Link href={`/rooms/${r.id}`} className="mt-1 block truncate text-lg font-bold underline-offset-4 hover:underline">
                          {r.title}
                        </Link>
                        <p className="text-sm text-ink-soft">{topic.pros_label} {pros}명 / {topic.cons_label} {active.length - pros}명</p>
                      </div>
                      {r.status === "ended" ? (
                        <Link href={`/rooms/${r.id}`} className="btn">결과 보기</Link>
                      ) : (
                        <div className="flex gap-2">
                          <form action={joinRoom.bind(null, r.id, "pros")}>
                            <button className="btn btn-pros">{topic.pros_label}로 입장</button>
                          </form>
                          <form action={joinRoom.bind(null, r.id, "cons")}>
                            <button className="btn btn-siren">{topic.cons_label}로 입장</button>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <aside className="rounded-2xl bg-ink p-5 text-linen">
            <h3 className="font-display text-2xl">새 방 열기</h3>
            {user ? (
              <RoomForm topicId={topic.id} prosLabel={topic.pros_label} consLabel={topic.cons_label} />
            ) : (
              <p className="mt-3 text-sm">
                방을 열려면 <Link href={`/login?next=/topics/${topic.id}`} className="font-bold text-siren underline">로그인</Link>하세요.
              </p>
            )}
          </aside>
        </section>
      </div>
    </article>
  );
}

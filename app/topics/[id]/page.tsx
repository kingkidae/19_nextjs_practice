import { Suspense } from "react";
import type { Metadata } from "next";
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
import { JsonLd } from "@/components/JsonLd";
import { CountUp, Reveal, RiseLines } from "@/components/motion";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings, SITE } from "@/lib/settings";

export async function generateMetadata({ params }: PageProps<"/topics/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { data: t } = await createPublicClient()
    .from("topics")
    .select("title, description, category, pros_label, cons_label, image_url")
    .eq("id", id)
    .maybeSingle();
  if (!t) return { title: "찾을 수 없는 주제", robots: { index: false } };
  const description = (t.description || `${t.title}: ${t.pros_label} vs ${t.cons_label}. ${categoryName(t.category)} 찬반 토론.`).slice(0, 155);
  return {
    title: `${t.title} 찬반 토론`,
    description,
    keywords: [t.title, `${t.pros_label} ${t.cons_label}`, `${categoryName(t.category)} 토론`, "찬반 토론"],
    alternates: { canonical: `/topics/${id}` },
    openGraph: { type: "article", title: `${t.title} | ${t.pros_label} vs ${t.cons_label}`, description, url: `/topics/${id}`, siteName: SITE.fullName, locale: "ko_KR" },
    twitter: { card: "summary_large_image", title: t.title, description },
  };
}

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

  const { site_url } = await getSettings();
  const url = `${site_url}/topics/${topic.id}`;

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "DiscussionForumPosting",
              "@id": url,
              headline: topic.title,
              text: topic.description || `${topic.pros_label} vs ${topic.cons_label}`,
              url,
              datePublished: topic.created_at,
              ...(topic.last_chat_at && { dateModified: topic.last_chat_at }),
              inLanguage: "ko-KR",
              articleSection: categoryName(topic.category),
              ...(topic.image_url && { image: topic.image_url }),
              author: { "@type": "Person", name: "The Controversial 회원" },
              interactionStatistic: [
                { "@type": "InteractionCounter", interactionType: "https://schema.org/JoinAction", userInteractionCount: topic.pros_count + topic.cons_count },
              ],
              isPartOf: { "@id": `${site_url}/#site` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "홈", item: `${site_url}/` },
                { "@type": "ListItem", position: 2, name: categoryName(topic.category), item: `${site_url}/c/${topic.category}` },
                { "@type": "ListItem", position: 3, name: topic.title, item: url },
              ],
            },
          ],
        }}
      />
      <header className="relative overflow-hidden bg-ink text-linen">
        {topic.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 Storage 이미지
          <img src={topic.image_url} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 animate-[kenburns_18s_ease-out_forwards] motion-reduce:animate-none" />
        )}
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6">
          <p className="text-sm text-linen/70">
            <Link href={`/c/${topic.category}`} className="underline underline-offset-4">{categoryName(topic.category)}</Link>
            {" "}/ 경중 {topic.weight} {weightLabel(topic.weight)} / 마지막 채팅 {timeAgo(topic.last_chat_at)}
          </p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl sm:text-7xl"><RiseLines lines={[topic.title]} delay={0.05} /></h1>
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
            <Reveal key={side} x={side === "pros" ? -60 : 60} y={0} delay={0.2}>
            <a
              href="#rooms"
              className={`flex h-full items-center justify-between px-6 py-6 sm:px-10 ${side === "pros" ? "border-t border-linen/20 bg-ink text-linen" : "border-y-2 border-ink bg-linen text-ink sm:flex-row-reverse sm:text-right"}`}
            >
              <span>
                <span className="block text-sm opacity-70">{side === "pros" ? "PROS" : "CONS"}</span>
                <span className="font-display text-4xl">{side === "pros" ? topic.pros_label : topic.cons_label}</span>
              </span>
              <span className="font-display text-5xl"><CountUp to={side === "pros" ? topic.pros_count : topic.cons_count} /><span className="ml-1 text-lg">명</span></span>
            </a>
            </Reveal>
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
                            <button className="btn btn-ink">{topic.pros_label}로 입장</button>
                          </form>
                          <form action={joinRoom.bind(null, r.id, "cons")}>
                            <button className="btn">{topic.cons_label}로 입장</button>
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

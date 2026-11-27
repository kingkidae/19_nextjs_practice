import { Suspense } from "react";
import Link from "next/link";
import { HeroCoin } from "@/components/HeroCoin";
import { TopicCard } from "@/components/TopicCard";
import { JsonLd } from "@/components/JsonLd";
import { Marquee, Reveal, RiseLines, Stagger, Tilt } from "@/components/motion";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import type { TopicCard as T } from "@/lib/types";
import { CardsSkeleton, SetupNotice } from "@/components/Feedback";

// GEO: 화면에 보이는 질문과 답을 그대로 구조화 데이터로도 준다
const FAQ = [
  { q: "The Controversial 은 어떤 곳인가요?", a: "세상의 논쟁 주제를 찬성(PROS)과 반대(CONS)로 나눠 실시간 채팅으로 토론하는 커뮤니티입니다. 부먹 찍먹 같은 가벼운 주제부터 낙태 합법화 같은 무거운 주제까지 다룹니다." },
  { q: "토론은 어떻게 진행되나요?", a: "방장이 시작하면 동전 룰렛이 선공을 정합니다. 발언 차례마다 진영에서 무작위로 뽑힌 한 사람만 1~5분 동안 전체 채팅에 쓸 수 있고, 나머지는 팀 채팅으로 작전을 짭니다." },
  { q: "잠깐!!! 과 방.해.금.지 는 무엇인가요?", a: "잠깐!!! 은 상대 발언을 멈추고 3분간 끼어드는 아이템이고, 방.해.금.지 는 우리 팀 발언 중 들어온 잠깐!!! 을 무효로 만드는 아이템입니다. 둘 다 발언 한 번에 한 번만 쓸 수 있습니다." },
  { q: "주제의 경중은 무엇인가요?", a: "주제가 얼마나 무거운지를 1(웃자고 하는 얘기)부터 10(아주 무거움)까지 나타낸 값입니다. 카테고리 화면의 볼륨 미터로 원하는 무게의 주제만 골라 볼 수 있습니다." },
  { q: "통계와 기사는 어디서 오나요?", a: "한국언론진흥재단 빅카인즈(BIG KINDS) 자료를 바탕으로 보도량 추이, 연관어, 관계도, 관련 기사 제목과 원문 링크를 보여 줍니다." },
];

export default function Home() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />

      <section className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pt-16">
        <div>
          <h1 className="font-display text-[clamp(3.5rem,11vw,9.5rem)]">
            <RiseLines lines={["THE", "CONTRO", "VERSIAL"]} />
            <span className="sr-only">: 찬반 실시간 토론 커뮤니티</span>
          </h1>
          <Reveal delay={0.45} y={16}>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              부먹 찍먹부터 낙태 합법화까지. 주제를 올리고, 진영을 고르고, 정해진 시간 동안 한 사람씩 말합니다.
              끼어들고 싶다면 잠깐!!! 을 외치세요.
            </p>
          </Reveal>
          <Reveal delay={0.6} y={16}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/topics/new" className="btn btn-siren">주제 올리기</Link>
              <Link href="#hot" className="btn">지금 싸우는 곳 보기</Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.25} y={40}>
          <HeroCoin />
        </Reveal>
      </section>

      <Suspense fallback={<div className="h-14 bg-siren" />}>
        <HotStrip />
      </Suspense>

      <section aria-labelledby="cat-title" className="bg-ink text-linen">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Reveal>
            <h2 id="cat-title" className="font-display text-4xl">어디서 싸울까</h2>
          </Reveal>
          <Stagger className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9" step={0.04}>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} className="sweep flex h-24 items-end rounded-lg border border-linen/25 p-3 font-bold transition-colors hover:border-siren">
                {c.name}
              </Link>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="hot" aria-labelledby="hot-title" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-14 sm:px-6">
        <Reveal>
          <h2 id="hot-title" className="font-display text-4xl sm:text-5xl">방금까지 불붙은 주제</h2>
        </Reveal>
        <Suspense fallback={<CardsSkeleton />}>
          <HotTopics />
        </Suspense>
      </section>

      <section aria-labelledby="faq-title" className="border-t-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <h2 id="faq-title" className="font-display text-4xl sm:text-5xl">처음 왔다면</h2>
            <p className="mt-3 text-ink-soft">링에 오르기 전에 알아 둘 것.</p>
          </Reveal>
          <div className="divide-y-2 divide-ink border-y-2 border-ink">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.06} y={12}>
                <details className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                    {f.q}
                    <span aria-hidden className="font-display text-2xl transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-ink-soft">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

async function getHot() {
  const supabase = await createClient();
  return supabase.from("topic_cards").select("*").order("last_chat_at", { ascending: false, nullsFirst: false }).limit(8);
}

// 빨간 전광판: 지금 불붙은 주제 제목이 흐른다
async function HotStrip() {
  const { data } = await getHot();
  const topics = (data ?? []) as T[];
  if (!topics.length) return null;
  return (
    <div className="border-y-2 border-ink bg-siren py-3 text-linen" role="region" aria-label="지금 불붙은 주제">
      <Marquee speed={45}>
        {topics.map((t) => (
          <Link key={t.id} href={`/topics/${t.id}`} className="font-display flex items-center gap-6 whitespace-nowrap px-6 text-2xl hover:underline">
            {t.title}
            <span aria-hidden className="text-ink">VS</span>
          </Link>
        ))}
      </Marquee>
    </div>
  );
}

async function HotTopics() {
  const { data, error } = await getHot();
  if (error) return <SetupNotice />;
  const topics = (data ?? []) as T[];
  if (!topics.length) {
    return (
      <p className="mt-8 text-ink-soft">
        아직 올라온 주제가 없습니다. <Link href="/topics/new" className="font-bold underline">첫 주제를 올려 보세요.</Link>
      </p>
    );
  }
  return (
    <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {topics.map((t) => (
        <Tilt key={t.id}>
          <TopicCard topic={t} />
        </Tilt>
      ))}
    </Stagger>
  );
}

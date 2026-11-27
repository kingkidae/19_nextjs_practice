import { Suspense } from "react";
import Link from "next/link";
import { HeroCoin } from "@/components/HeroCoin";
import { TopicCard } from "@/components/TopicCard";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import type { TopicCard as T } from "@/lib/types";
import { CardsSkeleton, SetupNotice } from "@/components/Feedback";

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pt-16">
        <div>
          <h1 className="font-display text-[clamp(3.5rem,11vw,9.5rem)]">
            THE
            <br />
            CONTRO
            <br />
            VERSIAL
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            부먹 찍먹부터 낙태 합법화까지. 주제를 올리고, 진영을 고르고, 정해진 시간 동안 한 사람씩 말합니다.
            끼어들고 싶다면 잠깐!!! 을 외치세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/topics/new" className="btn btn-siren">주제 올리기</Link>
            <Link href="#hot" className="btn">지금 싸우는 곳 보기</Link>
          </div>
        </div>
        <HeroCoin />
      </section>

      <section aria-labelledby="cat-title" className="bg-ink text-linen">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 id="cat-title" className="font-display text-3xl">어디서 싸울까</h2>
          <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/c/${c.slug}`}
                  className="flex h-20 items-end rounded-lg border border-linen/25 p-3 font-bold transition-colors hover:border-siren hover:text-siren"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="hot" aria-labelledby="hot-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 id="hot-title" className="font-display text-4xl">방금까지 불붙은 주제</h2>
        <Suspense fallback={<CardsSkeleton />}>
          <HotTopics />
        </Suspense>
      </section>
    </>
  );
}

async function HotTopics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topic_cards")
    .select("*")
    .order("last_chat_at", { ascending: false, nullsFirst: false })
    .limit(8);
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
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {topics.map((t) => <TopicCard key={t.id} topic={t} />)}
    </div>
  );
}

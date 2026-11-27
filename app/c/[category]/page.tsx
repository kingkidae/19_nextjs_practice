import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterPanel } from "@/components/FilterPanel";
import { TopicCard } from "@/components/TopicCard";
import { CardsSkeleton, SetupNotice } from "@/components/Feedback";
import { createClient } from "@/lib/supabase/server";
import { categoryName, isCategory } from "@/lib/constants";
import type { TopicCard as T } from "@/lib/types";

export default function CategoryPage({ params, searchParams }: PageProps<"/c/[category]">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="h-16" />}>
        <Heading params={params} />
      </Suspense>
      <div className="mt-6">
        <Suspense>
          <FilterPanel />
        </Suspense>
      </div>
      <Suspense fallback={<CardsSkeleton />}>
        <Results params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Heading({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-6xl sm:text-7xl">{categoryName(category)}</h1>
      <Link href={`/topics/new?category=${category}`} className="btn btn-siren">이 카테고리에 주제 올리기</Link>
    </div>
  );
}

const daysAgo = (days: number) => new Date(Date.now() - days * 864e5).toISOString();
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const clampWeight = (v: string, d: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : d;
};

async function Results({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  if (!isCategory(category)) notFound();

  const supabase = await createClient();
  let query = supabase
    .from("topic_cards")
    .select("*")
    .eq("category", category)
    .gte("weight", clampWeight(one(sp.min), 1))
    .lte("weight", clampWeight(one(sp.max), 10));

  // PostgREST 필터 문법을 깨는 문자는 지운다
  const text = one(sp.q).replace(/[,()%*\\]/g, " ").trim().slice(0, 50);
  if (text) query = query.or(`title.ilike.%${text}%,description.ilike.%${text}%`);
  const days = Number(one(sp.period));
  if ([1, 7, 30].includes(days)) query = query.gte("created_at", daysAgo(days));
  if (one(sp.live) === "1") query = query.gt("live_rooms", 0);

  const sort = one(sp.sort);
  query =
    sort === "new"
      ? query.order("created_at", { ascending: false })
      : sort === "popular"
        ? query.order("participants", { ascending: false })
        : query.order("last_chat_at", { ascending: false, nullsFirst: false });

  const { data, error } = await query.limit(60);
  if (error) return <SetupNotice />;
  const topics = (data ?? []) as T[];

  if (!topics.length) {
    return (
      <div className="mt-10 rounded-xl border-2 border-dashed border-ink p-10 text-center">
        <p className="font-display text-3xl">조건에 맞는 주제가 없습니다.</p>
        <p className="mt-2 text-ink-soft">경중 범위를 넓히거나 검색어를 바꿔 보세요. 아니면 직접 불을 붙이세요.</p>
        <Link href={`/topics/new?category=${category}`} className="btn btn-ink mt-6">주제 올리기</Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-8 text-sm text-ink-soft">{topics.length}개 주제</p>
      <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((t) => <TopicCard key={t.id} topic={t} />)}
      </div>
    </>
  );
}

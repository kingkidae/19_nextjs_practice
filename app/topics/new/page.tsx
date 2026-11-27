import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { TopicForm } from "./TopicForm";

export const metadata = { title: "주제 올리기", robots: { index: false, follow: true } };

export default function NewTopicPage({ searchParams }: PageProps<"/topics/new">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-6xl">불씨 던지기</h1>
      <p className="mt-3 text-ink-soft">
        찬성과 반대로 깔끔하게 갈리는 문장일수록 싸움이 잘 붙습니다. 예: &ldquo;탕수육은 부어 먹어야 한다&rdquo;
      </p>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-xl bg-linen-deep" />}>
        <Gate searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Gate({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ user }, sp] = await Promise.all([getViewer(), searchParams]);
  if (!user) redirect("/login?next=/topics/new");
  const category = typeof sp.category === "string" ? sp.category : "";
  return <TopicForm defaultCategory={category} />;
}

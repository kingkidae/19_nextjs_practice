import Link from "next/link";
import { categoryName, timeAgo, weightLabel } from "@/lib/constants";
import type { TopicCard as T } from "@/lib/types";

// 사진이 없는 주제: 카테고리 이름을 크게 깐 포스터 표지
function PosterCover({ topic }: { topic: T }) {
  const heavy = topic.weight >= 7;
  return (
    <div className={`absolute inset-0 overflow-hidden ${heavy ? "bg-ink" : "bg-linen-deep"}`} aria-hidden>
      <span
        className={`font-display absolute -bottom-6 -left-2 whitespace-nowrap text-[7.5rem] leading-none ${heavy ? "text-linen/10" : "text-ink/10"}`}
      >
        {categoryName(topic.category)}
      </span>
      <span
        className={`font-display absolute right-4 top-3 text-6xl ${heavy ? "text-siren" : "text-ink/80"}`}
      >
        VS
      </span>
    </div>
  );
}

export function TopicCard({ topic }: { topic: T }) {
  const total = topic.pros_count + topic.cons_count;
  const prosPct = total ? Math.round((topic.pros_count / total) * 100) : 50;

  return (
    <article className="relative flex aspect-[4/5] flex-col overflow-hidden rounded-xl border-2 border-ink bg-[#f6f1e7]">
      <div className="relative h-1/2 w-full shrink-0">
        {topic.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 Supabase Storage 이미지
          <img src={topic.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <PosterCover topic={topic} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-linen">
          {topic.live_rooms > 0 && (
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-siren px-2.5 py-0.5 text-xs font-bold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-linen" />
              {topic.live_rooms}개 방에서 싸우는 중
            </p>
          )}
          <h3 className="font-display line-clamp-2 text-2xl leading-tight">
            <Link href={`/topics/${topic.id}`} className="after:absolute after:inset-0">
              {topic.title}
            </Link>
          </h3>
          <p className="mt-2 flex items-center justify-between text-sm text-linen/85">
            <span>
              <span className="font-bold text-[#9fb1ff]">{topic.pros_label} {topic.pros_count}명</span>
              <span className="mx-1.5 text-linen/50">대</span>
              <span className="font-bold text-[#ff8a7d]">{topic.cons_label} {topic.cons_count}명</span>
            </span>
            <span>{timeAgo(topic.last_chat_at)}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* 줄다리기 막대: 찬반 비율 */}
        <div className="flex h-2 overflow-hidden rounded-full bg-linen-dim" aria-label={`${topic.pros_label} ${prosPct}%`}>
          <div className="bg-pros" style={{ width: `${prosPct}%` }} />
          <div className="flex-1 bg-cons" />
        </div>
        <p className="line-clamp-2 text-sm text-ink-soft">{topic.description}</p>
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="rounded-full border border-ink px-2 py-0.5">{categoryName(topic.category)}</span>
          <span className="flex items-center gap-2" title={`경중 ${topic.weight}/10`}>
            <span className="flex items-end gap-[2px]" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className={`w-[3px] rounded-sm ${i < topic.weight ? (i >= 6 ? "bg-siren" : "bg-ink") : "bg-linen-dim"}`}
                  style={{ height: 4 + i * 1.2 }}
                />
              ))}
            </span>
            {weightLabel(topic.weight)}
          </span>
        </div>
      </div>
    </article>
  );
}

import { createClient } from "@/lib/supabase/server";
import { StatsUpload } from "./StatsUpload";

export default async function AdminStats() {
  const supabase = await createClient();
  const [{ data: topics }, { data: stats }] = await Promise.all([
    supabase.from("topics").select("id, title").order("created_at", { ascending: false }).limit(300),
    supabase.from("topic_stats").select("topic_id, is_sample, updated_at"),
  ]);
  const has = new Map((stats ?? []).map((s) => [s.topic_id, s]));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
      <section aria-labelledby="upload-h">
        <h2 id="upload-h" className="font-display text-3xl">빅카인즈 엑셀 올리기</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
          <li>bigkinds.or.kr 에 로그인해 주제 키워드로 뉴스를 검색합니다.</li>
          <li>뉴스 목록, 키워드 트렌드, 연관어 분석, 관계도 분석 화면에서 엑셀로 내려받습니다.</li>
          <li>아래에서 주제와 자료 종류를 고르고 파일을 올립니다. 기사는 제목·언론사·날짜·링크만 저장합니다.</li>
        </ol>
        <StatsUpload topics={topics ?? []} />
      </section>
      <section aria-labelledby="status-h">
        <h2 id="status-h" className="font-display text-3xl">주제별 자료 현황</h2>
        <ul className="mt-4 space-y-1 text-sm">
          {(topics ?? []).map((t) => {
            const s = has.get(t.id);
            return (
              <li key={t.id} className="flex justify-between gap-3 border-b border-linen-dim py-1.5">
                <span className="truncate">{t.title}</span>
                <span className={`shrink-0 ${s ? (s.is_sample ? "text-ink-soft" : "font-bold") : "text-siren"}`}>
                  {s ? (s.is_sample ? "예시 데이터" : new Date(s.updated_at).toLocaleDateString("ko-KR")) : "없음"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

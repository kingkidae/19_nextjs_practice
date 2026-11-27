import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings, SITE } from "@/lib/settings";
import { CATEGORIES, categoryName } from "@/lib/constants";

// GEO: AI 검색·답변 엔진이 사이트를 요약해 인용할 수 있도록 마크다운 안내문을 준다 (llmstxt.org 형식)
async function buildText() {
  "use cache";
  cacheTag("sitemap", "settings");
  cacheLife("hours");
  const [{ site_url: base }, { data: topics }] = await Promise.all([
    getSettings(),
    createPublicClient().from("topics").select("id, title, category, pros_label, cons_label").order("last_chat_at", { ascending: false, nullsFirst: false }).limit(50),
  ]);

  return [
    `# ${SITE.fullName}`,
    "",
    `> ${SITE.description}`,
    "",
    "## 서비스 요약",
    "- 회원이 논쟁 주제를 올리고, 찬성(PROS)과 반대(CONS) 진영으로 나뉘어 실시간 채팅으로 토론한다.",
    "- 발언 차례마다 진영에서 무작위로 뽑힌 한 사람만 1~5분 동안 전체 채팅에 쓸 수 있다. 선공은 동전 룰렛이 정한다.",
    "- 상대 발언 중 3분간 끼어드는 '잠깐!!!', 이를 무효화하는 '방.해.금.지' 아이템이 있다.",
    "- 주제마다 한국언론진흥재단 빅카인즈(BIG KINDS) 기반 보도량 추이, 연관어, 관계도, 관련 기사 목록을 제공한다.",
    "- 주제의 경중을 1(웃자고 하는 얘기)~10(아주 무거움)으로 표시한다.",
    "",
    "## 카테고리",
    ...CATEGORIES.map((c) => `- [${c.name}](${base}/c/${c.slug})`),
    "",
    "## 최근 토론 주제",
    ...(topics ?? []).map((t) => `- [${t.title}](${base}/topics/${t.id}): ${categoryName(t.category)}, ${t.pros_label} vs ${t.cons_label}`),
    "",
    "## 안내",
    `- [공지](${base}/notices)`,
    `- [이용약관](${base}/terms)`,
    `- [개인정보 처리방침](${base}/privacy)`,
    `- [사이트맵](${base}/sitemap.xml)`,
    "",
  ].join("\n");
}

export async function GET() {
  return new Response(await buildText(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}

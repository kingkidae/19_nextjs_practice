export const CATEGORIES = [
  { slug: "politics", name: "정치" },
  { slug: "economy", name: "경제" },
  { slug: "society", name: "사회" },
  { slug: "culture", name: "문화" },
  { slug: "world", name: "국제" },
  { slug: "local", name: "지역" },
  { slug: "sports", name: "스포츠" },
  { slug: "tech", name: "IT&과학" },
  { slug: "entertainment", name: "연예" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const isCategory = (slug: string): slug is CategorySlug => CATEGORIES.some((c) => c.slug === slug);

export const ITEMS = {
  wait: { name: "잠깐!!!", price: 1000, desc: "상대 발언을 멈추고 3분간 내가 말한다. 발언 한 번에 한 번만." },
  block: { name: "방.해.금.지", price: 1000, desc: "우리 팀 발언 중 들어온 잠깐!!! 을 무효로 만든다." },
} as const;
export type ItemKey = keyof typeof ITEMS;

export function weightLabel(w: number) {
  if (w <= 2) return "웃자고 하는 얘기";
  if (w <= 4) return "가볍게 한판";
  if (w <= 6) return "꽤 진지함";
  if (w <= 8) return "무거움";
  return "아주 무거움";
}

export function timeAgo(iso: string | null) {
  if (!iso) return "아직 채팅 없음";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "방금 전";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

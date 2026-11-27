import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const SETTING_FIELDS = [
  { key: "site_url", label: "사이트 주소", hint: "배포 주소. sitemap 과 검색엔진 대표 주소(canonical)에 쓴다. 예: https://controversial.kr" },
  { key: "terms_url", label: "이용약관 링크", hint: "기본 /terms. 외부 문서로 바꿀 수 있다." },
  { key: "privacy_url", label: "개인정보 처리방침 링크", hint: "기본 /privacy" },
  { key: "contact_email", label: "문의 메일", hint: "푸터와 개인정보 처리방침의 책임자 연락처에 표시" },
  { key: "instagram_url", label: "Instagram", hint: "비우면 숨김" },
  { key: "x_url", label: "X (Twitter)", hint: "비우면 숨김" },
  { key: "youtube_url", label: "YouTube", hint: "비우면 숨김" },
] as const;

export type SettingKey = (typeof SETTING_FIELDS)[number]["key"];
export type Settings = Record<SettingKey, string>;

const DEFAULTS: Settings = {
  site_url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  terms_url: "/terms",
  privacy_url: "/privacy",
  contact_email: "",
  instagram_url: "",
  x_url: "",
  youtube_url: "",
};

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");
  const { data } = await createPublicClient().from("site_settings").select("key, value");
  const out = { ...DEFAULTS };
  for (const row of data ?? []) {
    if (row.key in out && row.value) out[row.key as SettingKey] = row.value;
  }
  out.site_url = out.site_url.replace(/\/+$/, "");
  return out;
}

export const SITE = {
  name: "The Controversial",
  fullName: "The Controversial: Pros and Cons",
  description:
    "부먹 찍먹부터 낙태 합법화까지. 세상의 논쟁 주제를 찬성과 반대로 나눠, 정해진 시간 동안 한 사람씩 발언하는 실시간 토론 커뮤니티.",
};

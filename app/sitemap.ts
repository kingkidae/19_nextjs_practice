import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings } from "@/lib/settings";
import { CATEGORIES } from "@/lib/constants";

async function getEntries() {
  "use cache";
  cacheTag("sitemap", "settings");
  cacheLife("hours");
  const supabase = createPublicClient();
  const [{ data: topics }, { data: notices }] = await Promise.all([
    supabase.from("topics").select("id, created_at, last_chat_at").order("created_at", { ascending: false }).limit(5000),
    supabase.from("notices").select("updated_at").order("updated_at", { ascending: false }).limit(1),
  ]);
  return { topics: topics ?? [], noticeUpdated: notices?.[0]?.updated_at ?? null };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ site_url: base }, { topics, noticeUpdated }] = await Promise.all([getSettings(), getEntries()]);
  const latest = topics.reduce<string | null>((max, t) => {
    const d = t.last_chat_at ?? t.created_at;
    return !max || d > max ? d : max;
  }, null);

  return [
    { url: `${base}/`, lastModified: latest ?? undefined, changeFrequency: "hourly", priority: 1 },
    ...CATEGORIES.map((c) => ({ url: `${base}/c/${c.slug}`, lastModified: latest ?? undefined, changeFrequency: "hourly" as const, priority: 0.8 })),
    ...topics.map((t) => ({
      url: `${base}/topics/${t.id}`,
      lastModified: t.last_chat_at ?? t.created_at,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    { url: `${base}/notices`, lastModified: noticeUpdated ?? undefined, changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

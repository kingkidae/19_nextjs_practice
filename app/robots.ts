import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site_url } = await getSettings();
  return {
    // AI 검색(GEO) 크롤러도 공개 페이지는 허용한다
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/profile", "/auth", "/shop/success", "/shop/fail", "/rooms/"] }],
    sitemap: `${site_url}/sitemap.xml`,
    host: site_url,
  };
}

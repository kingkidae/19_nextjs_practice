import type { MetadataRoute } from "next";
import { SITE } from "@/lib/settings";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.fullName,
    short_name: SITE.name,
    description: SITE.description,
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#ece5d6",
    theme_color: "#18181a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}

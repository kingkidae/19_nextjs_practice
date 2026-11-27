import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";
import { categoryName, weightLabel } from "@/lib/constants";
import { fontOptions, loadDisplayFont, OG_SIZE } from "@/lib/og";

export const alt = "The Controversial 토론 주제";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: t } = await createPublicClient()
    .from("topic_cards")
    .select("title, category, weight, pros_label, cons_label, pros_count, cons_count")
    .eq("id", id)
    .maybeSingle();

  const title = t?.title ?? "찾을 수 없는 주제";
  const meta = t ? `${categoryName(t.category)} / 경중 ${t.weight} ${weightLabel(t.weight)}` : "";
  const pros = t ? `${t.pros_label} ${t.pros_count}` : "PROS";
  const cons = t ? `${t.cons_label} ${t.cons_count}` : "CONS";
  const font = await loadDisplayFont(title + meta + pros + cons + "THE CONTROVERSIAL VS 0123456789");
  const heavy = (t?.weight ?? 0) >= 7;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: heavy ? "#18181a" : "#ece5d6", color: heavy ? "#ece5d6" : "#18181a", fontFamily: "Display", padding: 64 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30 }}>
          <span>THE CONTROVERSIAL</span>
          <span style={{ color: "#f2301f" }}>{meta}</span>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", fontSize: title.length > 24 ? 76 : 100, lineHeight: 1.1 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 48 }}>
          <span style={{ display: "flex", padding: "10px 32px", borderRadius: 999, background: heavy ? "#ece5d6" : "#18181a", color: heavy ? "#18181a" : "#ece5d6" }}>{pros}</span>
          <span style={{ fontSize: 36, opacity: 0.6 }}>VS</span>
          <span style={{ display: "flex", padding: "4px 26px", borderRadius: 999, border: `6px solid ${heavy ? "#ece5d6" : "#18181a"}` }}>{cons}</span>
        </div>
      </div>
    ),
    { ...size, fonts: fontOptions(font) },
  );
}

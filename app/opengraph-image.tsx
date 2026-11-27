import { ImageResponse } from "next/og";
import { fontOptions, loadDisplayFont, OG_SIZE } from "@/lib/og";

export const alt = "The Controversial: Pros and Cons — 세상의 모든 논쟁을 찬반으로";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const lines = ["THE", "CONTRO", "VERSIAL"];
  const sub = "세상의 모든 논쟁을 찬반으로";
  const font = await loadDisplayFont(lines.join("") + sub + "PROSCONVS");
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#ece5d6", color: "#18181a", fontFamily: "Display", padding: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 120, lineHeight: 0.92 }}>
            {lines.map((l) => <span key={l}>{l}</span>)}
          </div>
          <span style={{ fontSize: 44 }}>{sub}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
          <div style={{ display: "flex", width: 220, height: 220, borderRadius: 999, background: "#18181a", color: "#ece5d6", alignItems: "center", justifyContent: "center", fontSize: 64 }}>PROS</div>
          <div style={{ display: "flex", width: 220, height: 220, borderRadius: 999, border: "8px solid #18181a", alignItems: "center", justifyContent: "center", fontSize: 64 }}>CONS</div>
        </div>
        <div style={{ position: "absolute", left: 0, bottom: 0, width: 1200, height: 16, background: "#f2301f" }} />
      </div>
    ),
    { ...size, fonts: fontOptions(font) },
  );
}

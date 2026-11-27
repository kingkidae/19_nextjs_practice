import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/LogoMark";

// iOS 홈 화면 아이콘 (PNG 180px). 모양은 app/icon.svg 와 같다.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#18181a", alignItems: "center", justifyContent: "center" }}>
        <LogoMark size={150} />
      </div>
    ),
    size,
  );
}

import { MARK } from "@/lib/logo";

// 로고 마크: 칠한 반원(PROS) + 테두리 원(CONS) + 가운데를 가르는 사이렌 레드 사선.
// gap 은 사선 양옆의 틈 색으로, 마크가 놓인 바탕색과 같아야 한다.
export function LogoMark({ size = 28, ink = "#ece5d6", gap = "#18181a", className = "" }: { size?: number; ink?: string; gap?: string; className?: string }) {
  const { ring, slash } = MARK;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={className}>
      <path d={MARK.pros} fill={ink} />
      <circle cx={ring.cx} cy={ring.cy} r={ring.r} fill="none" stroke={ink} strokeWidth={ring.stroke} />
      <line {...{ x1: slash.x1, y1: slash.y1, x2: slash.x2, y2: slash.y2 }} stroke={gap} strokeWidth={slash.gap} strokeLinecap="round" />
      <line {...{ x1: slash.x1, y1: slash.y1, x2: slash.x2, y2: slash.y2 }} stroke={MARK.siren} strokeWidth={slash.width} strokeLinecap="round" />
    </svg>
  );
}

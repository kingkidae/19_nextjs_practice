import type { Room } from "@/lib/types";

export function StatusBadge({ status }: { status: Room["status"] }) {
  const map = { live: ["토론 중", "bg-siren text-linen"], waiting: ["대기 중", "bg-ink text-linen"], ended: ["종료", "bg-linen-dim"] } as const;
  const [label, cls] = map[status];
  return <span className={`rounded-full px-2 py-0.5 font-bold ${cls}`}>{label}</span>;
}

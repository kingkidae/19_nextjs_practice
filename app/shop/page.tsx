import { Suspense } from "react";
import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { ShopClient } from "./ShopClient";

export const metadata = { title: "아이템 상점", description: "토론 아이템 잠깐!!! 과 방.해.금.지 를 살 수 있습니다.", robots: { index: false, follow: true } };

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-6xl">상점</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        토스페이먼츠 테스트 결제입니다. 실제 돈은 빠져나가지 않습니다. 아이템은 1개에 1,000원이고 한 번에 10개까지 살 수 있습니다.
      </p>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-xl bg-linen-deep" />}>
        <Shop />
      </Suspense>
    </div>
  );
}

async function Shop() {
  const { supabase, user } = await getViewer();
  if (!user) {
    return (
      <p className="mt-8">
        아이템을 사려면 <Link href="/login?next=/shop" className="font-bold text-siren underline">로그인</Link>하세요.
      </p>
    );
  }
  const { data } = await supabase.from("inventory").select("item, qty").eq("user_id", user.id);
  const inv = { wait: 0, block: 0 };
  data?.forEach((i: { item: "wait" | "block"; qty: number }) => (inv[i.item] = i.qty));
  return <ShopClient customerKey={user.id} inventory={inv} clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ""} />;
}

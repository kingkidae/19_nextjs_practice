import { Suspense } from "react";
import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ITEMS } from "@/lib/constants";

export default function SuccessPage({ searchParams }: PageProps<"/shop/success">) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <Suspense fallback={<p className="font-display text-4xl">결제를 확인하는 중…</p>}>
        <Confirm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Confirm({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const paymentKey = String(sp.paymentKey ?? "");
  const orderId = String(sp.orderId ?? "");
  const amount = Number(sp.amount);
  const { supabase, user } = await getViewer();
  if (!user) return <Result ok={false} message="로그인이 풀렸습니다. 다시 로그인한 뒤 상점에서 보유 수량을 확인하세요." />;

  // 내 주문인지, 금액이 바뀌지 않았는지 확인한다 (RLS 로 내 주문만 보인다)
  const { data: order } = await supabase.from("payments").select("*").eq("order_id", orderId).maybeSingle();
  if (!order) return <Result ok={false} message="주문을 찾지 못했습니다." />;
  // 묶음 주문(wait_qty/block_qty)과 예전 한 종류 주문(item/qty)을 모두 읽는다
  const counts = {
    wait: order.wait_qty ?? (order.item === "wait" ? order.qty : 0),
    block: order.block_qty ?? (order.item === "block" ? order.qty : 0),
  };
  const summary = (["wait", "block"] as const).filter((k) => counts[k] > 0).map((k) => `${ITEMS[k].name} ${counts[k]}개`).join(", ");
  if (order.status === "done") return <Result ok message={`${summary}가 이미 지급되었습니다.`} />;
  if (order.amount !== amount) return <Result ok={false} message="결제 금액이 주문 금액과 달라 승인하지 않았습니다." />;

  const secret = process.env.TOSS_SECRET_KEY ?? "";
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) {
    // 같은 결제를 두 번 승인하려던 경우(새로고침 등)는 실패로 바꾸지 않는다
    if (body.code !== "ALREADY_PROCESSED_PAYMENT")
      await createAdminClient().from("payments").update({ status: "failed" }).eq("order_id", orderId).eq("status", "pending");
    return <Result ok={false} message={`결제 승인 실패: ${body.message ?? res.status}`} />;
  }

  const { error } = await createAdminClient().rpc("complete_order", { p_order: orderId, p_payment_key: paymentKey });
  if (error) return <Result ok={false} message={`결제는 승인됐지만 아이템 지급에 실패했습니다. 관리자에게 주문번호 ${orderId} 를 알려 주세요.`} />;
  return <Result ok message={`${summary}를 받았습니다.`} />;
}

function Result({ ok, message }: { ok: boolean; message: string }) {
  return (
    <>
      <p className={`font-display text-6xl ${ok ? "" : "text-siren"}`}>{ok ? "결제 완료" : "결제 실패"}</p>
      <p className="mt-4">{message}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/shop" className="btn">상점으로</Link>
        <Link href="/" className="btn btn-ink">싸우러 가기</Link>
      </div>
    </>
  );
}

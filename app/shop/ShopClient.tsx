"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { ITEMS, type ItemKey } from "@/lib/constants";
import { createOrder } from "./actions";

export function ShopClient({ customerKey, inventory, clientKey }: { customerKey: string; inventory: Record<ItemKey, number>; clientKey: string }) {
  const [item, setItem] = useState<ItemKey>("wait");
  const [qty, setQty] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(clientKey ? "" : "NEXT_PUBLIC_TOSS_CLIENT_KEY 가 설정되지 않았습니다.");
  const [busy, setBusy] = useState(false);
  const widgets = useRef<TossPaymentsWidgets | null>(null);
  const amount = ITEMS[item].price * qty;

  useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    (async () => {
      try {
        const toss = await loadTossPayments(clientKey);
        const w = toss.widgets({ customerKey });
        await w.setAmount({ currency: "KRW", value: ITEMS.wait.price });
        await Promise.all([
          w.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
          w.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
        ]);
        if (!cancelled) {
          widgets.current = w;
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) setError(`결제창을 불러오지 못했습니다: ${(e as Error).message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientKey, customerKey]);

  useEffect(() => {
    widgets.current?.setAmount({ currency: "KRW", value: amount });
  }, [amount, ready]);

  async function pay() {
    if (!widgets.current) return;
    setBusy(true);
    setError("");
    const order = await createOrder(item, qty);
    if ("error" in order) {
      setBusy(false);
      return setError(order.error ?? "주문을 만들지 못했습니다.");
    }
    try {
      await widgets.current.setAmount({ currency: "KRW", value: order.amount });
      await widgets.current.requestPayment({
        orderId: order.orderId,
        orderName: `${ITEMS[item].name} ${qty}개`,
        successUrl: `${location.origin}/shop/success`,
        failUrl: `${location.origin}/shop/fail`,
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        {(Object.keys(ITEMS) as ItemKey[]).map((k) => (
          <label
            key={k}
            className={`block cursor-pointer rounded-2xl border-2 border-ink p-5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-siren ${
              item === k ? (k === "wait" ? "bg-siren text-linen" : "bg-ink text-linen") : "bg-[#f6f1e7]"
            }`}
          >
            <input type="radio" name="item" value={k} checked={item === k} onChange={() => setItem(k)} className="sr-only" />
            <span className="flex items-baseline justify-between">
              <span className="font-display text-4xl">{ITEMS[k].name}</span>
              <span className="text-sm">보유 {inventory[k]}개</span>
            </span>
            <span className="mt-2 block text-sm opacity-90">{ITEMS[k].desc}</span>
            <span className="mt-2 block font-bold">{ITEMS[k].price.toLocaleString()}원</span>
          </label>
        ))}
        <div className="flex items-center gap-3">
          <span className="font-bold">수량</span>
          <button type="button" className="btn h-11 w-11 px-0" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="하나 줄이기">−</button>
          <output className="font-display w-10 text-center text-3xl" aria-live="polite">{qty}</output>
          <button type="button" className="btn h-11 w-11 px-0" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="하나 늘리기">+</button>
          <span className="ml-auto font-display text-3xl">{amount.toLocaleString()}원</span>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-ink bg-white p-2">
        <div id="payment-method" />
        <div id="agreement" />
        {error && <p role="alert" className="px-4 py-2 font-bold text-siren">{error}</p>}
        <div className="p-4">
          <button className="btn btn-siren w-full" disabled={!ready || busy} onClick={pay}>
            {busy ? "결제창 여는 중…" : `${amount.toLocaleString()}원 결제하기`}
          </button>
        </div>
      </div>
    </div>
  );
}

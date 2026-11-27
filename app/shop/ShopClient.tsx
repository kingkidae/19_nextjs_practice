"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { ITEMS, type ItemKey } from "@/lib/constants";
import { createOrder } from "./actions";

// 위젯 정리 작업의 꼬리. 다음 렌더는 이게 끝난 뒤에 시작한다 (개발 모드의 이중 실행, 페이지 재방문 대비).
let teardown: Promise<void> = Promise.resolve();

const KEYS = Object.keys(ITEMS) as ItemKey[];
const MAX = 10;

export function ShopClient({ customerKey, inventory, clientKey }: { customerKey: string; inventory: Record<ItemKey, number>; clientKey: string }) {
  const [qty, setQty] = useState<Record<ItemKey, number>>({ wait: 1, block: 0 });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(clientKey ? "" : "NEXT_PUBLIC_TOSS_CLIENT_KEY 가 설정되지 않았습니다.");
  const [busy, setBusy] = useState(false);
  const widgets = useRef<TossPaymentsWidgets | null>(null);
  const amount = KEYS.reduce((sum, k) => sum + ITEMS[k].price * qty[k], 0);
  const count = qty.wait + qty.block;
  const amountRef = useRef(amount);
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    let rendered: { destroy: () => Promise<void> }[] = [];
    // 토스 위젯은 한 화면에 하나만 그릴 수 있다. 이전에 그린 위젯을 다 지운 뒤에 그린다.
    const run = teardown.then(async () => {
      if (cancelled) return;
      try {
        const toss = await loadTossPayments(clientKey);
        const w = toss.widgets({ customerKey });
        await w.setAmount({ currency: "KRW", value: amountRef.current || ITEMS.wait.price });
        rendered = await Promise.all([
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
    });
    return () => {
      cancelled = true;
      widgets.current = null;
      setReady(false);
      teardown = run
        .then(() => Promise.all(rendered.map((r) => r.destroy())))
        .then(() => undefined, () => undefined);
    };
  }, [clientKey, customerKey]);

  useEffect(() => {
    // 0원은 위젯에 넣지 않는다 (결제 버튼이 막혀 있으므로 직전 금액을 그대로 둔다)
    if (amount > 0) widgets.current?.setAmount({ currency: "KRW", value: amount });
  }, [amount, ready]);

  const change = (k: ItemKey, d: number) => setQty((q) => ({ ...q, [k]: Math.min(MAX, Math.max(0, q[k] + d)) }));

  async function pay() {
    if (!widgets.current || count < 1) return;
    setBusy(true);
    setError("");
    const order = await createOrder(qty.wait, qty.block);
    if ("error" in order) {
      setBusy(false);
      return setError(order.error ?? "주문을 만들지 못했습니다.");
    }
    try {
      await widgets.current.setAmount({ currency: "KRW", value: order.amount });
      await widgets.current.requestPayment({
        orderId: order.orderId,
        orderName: KEYS.filter((k) => qty[k] > 0).map((k) => `${ITEMS[k].name} ${qty[k]}개`).join(", "),
        successUrl: `${location.origin}/shop/success`,
        failUrl: `${location.origin}/shop/fail`,
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    // 두 열이 같은 높이로 늘어난다 (grid 기본 stretch). 왼쪽 합계 상자는 아래쪽에 붙는다.
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-4">
        {KEYS.map((k) => {
          const on = qty[k] > 0;
          return (
            <section
              key={k}
              aria-label={ITEMS[k].name}
              className={`rounded-2xl border-2 border-ink p-5 transition-colors duration-300 ${
                on ? (k === "wait" ? "bg-siren text-linen" : "bg-ink text-linen") : "bg-[#f6f1e7]"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-4xl">{ITEMS[k].name}</h2>
                <span className="text-sm">보유 {inventory[k]}개</span>
              </div>
              <p className="mt-2 text-sm opacity-90">{ITEMS[k].desc}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="font-bold">{ITEMS[k].price.toLocaleString()}원</span>
                <div className="ml-auto flex items-center gap-2">
                  <button type="button" className="btn h-10 w-10 px-0" disabled={qty[k] === 0} onClick={() => change(k, -1)} aria-label={`${ITEMS[k].name} 하나 줄이기`}>−</button>
                  <output className="font-display w-9 text-center text-3xl" aria-live="polite" aria-label={`${ITEMS[k].name} 수량`}>
                    {qty[k]}
                  </output>
                  <button type="button" className="btn h-10 w-10 px-0" disabled={qty[k] === MAX} onClick={() => change(k, 1)} aria-label={`${ITEMS[k].name} 하나 늘리기`}>+</button>
                </div>
              </div>
            </section>
          );
        })}

        {/* 합계: 왼쪽 열의 남은 높이를 채워 오른쪽 결제수단 카드와 바닥선을 맞춘다 */}
        <section aria-labelledby="order-sum" className="flex flex-1 flex-col rounded-2xl border-2 border-dashed border-ink p-5">
          <h2 id="order-sum" className="font-display text-2xl">주문 내역</h2>
          <ul className="mt-auto space-y-1.5 pt-4 text-sm">
            <AnimatePresence initial={false}>
              {KEYS.filter((k) => qty[k] > 0).map((k) => (
                <motion.li
                  key={k}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-between overflow-hidden"
                >
                  <span>{ITEMS[k].name} × {qty[k]}</span>
                  <span>{(ITEMS[k].price * qty[k]).toLocaleString()}원</span>
                </motion.li>
              ))}
            </AnimatePresence>
            {count === 0 && <li className="text-ink-soft">아이템을 1개 이상 고르세요.</li>}
          </ul>
          <div className="mt-4 flex items-end justify-between border-t-2 border-ink pt-4">
            <span className="font-bold">합계 {count}개</span>
            <motion.span key={amount} initial={{ y: -8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className="font-display text-4xl">
              {amount.toLocaleString()}원
            </motion.span>
          </div>
        </section>
      </div>

      <div className="flex flex-col rounded-2xl border-2 border-ink bg-white p-2">
        <div id="payment-method" />
        <div id="agreement" />
        {error && <p role="alert" className="px-4 py-2 font-bold text-siren">{error}</p>}
        <div className="mt-auto p-4">
          <button className="btn btn-siren w-full" disabled={!ready || busy || count < 1} onClick={pay}>
            {busy ? "결제창 여는 중…" : count < 1 ? "아이템을 고르세요" : `${amount.toLocaleString()}원 결제하기`}
          </button>
        </div>
      </div>
    </div>
  );
}

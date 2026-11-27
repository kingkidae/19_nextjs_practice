"use client";

import dynamic from "next/dynamic";

// three.js 는 브라우저에서만 돈다
const Coin = dynamic(() => import("./Coin").then((m) => m.Coin), {
  ssr: false,
  loading: () => <div className="aspect-square w-full" />,
});

export function HeroCoin() {
  return (
    <figure className="relative mx-auto w-full max-w-md">
      <Coin mode="hero" className="aspect-square w-full" label="PROS 와 CONS 가 새겨진 동전. 누르면 뒤집힌다." />
      <figcaption className="text-center text-sm text-ink-soft">동전을 눌러 뒤집어 보세요. 토론의 선공도 이 동전이 정합니다.</figcaption>
    </figure>
  );
}

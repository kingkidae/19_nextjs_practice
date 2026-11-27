import { Suspense } from "react";
import Link from "next/link";

export default function FailPage({ searchParams }: PageProps<"/shop/fail">) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <p className="font-display text-6xl text-siren">결제 취소</p>
      <Suspense>
        <Reason searchParams={searchParams} />
      </Suspense>
      <Link href="/shop" className="btn mt-8">상점으로 돌아가기</Link>
    </div>
  );
}

async function Reason({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <p className="mt-4">{String(sp.message ?? "결제가 끝나지 않았습니다. 다시 시도하세요.")}</p>;
}

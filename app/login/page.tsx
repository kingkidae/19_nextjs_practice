import { Suspense } from "react";
import { AuthForm } from "./AuthForm";

export const metadata = { title: "로그인", robots: { index: false, follow: true } };

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
      <section>
        <h1 className="font-display text-6xl sm:text-7xl">
          링에 오르려면
          <br />
          이름부터.
        </h1>
        <p className="mt-6 max-w-md text-ink-soft">
          구경은 누구나 할 수 있습니다. 진영을 고르고, 발언하고, 아이템을 쓰려면 로그인이 필요합니다.
        </p>
      </section>
      <Suspense>
        <AuthForm />
      </Suspense>
    </div>
  );
}

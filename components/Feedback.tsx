export function CardsSkeleton() {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-linen-deep" />
      ))}
    </div>
  );
}

export function SetupNotice() {
  return (
    <p role="alert" className="mt-8 rounded-lg border-2 border-siren p-4 text-sm">
      데이터를 불러오지 못했습니다. <code>.env.local</code> 의 Supabase 주소와 키, 그리고 <code>supabase/schema.sql</code> 실행 여부를 확인하세요.
    </p>
  );
}

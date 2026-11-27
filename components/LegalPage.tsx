// 이용약관·개인정보 처리방침 공통 틀: 왼쪽 목차, 오른쪽 본문
export function LegalPage({
  title,
  effective,
  sections,
  intro,
}: {
  title: string;
  effective: string;
  intro: React.ReactNode;
  sections: { id: string; title: string; body: React.ReactNode }[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-soft">시행일 {effective}</p>
      <div className="mt-6 max-w-3xl text-ink-soft">{intro}</div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="목차" className="lg:sticky lg:top-6 lg:self-start">
          <ol className="space-y-1.5 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="underline-offset-4 hover:underline">
                  제{i + 1}조 {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="max-w-3xl space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-6">
              <h2 id={`${s.id}-h`} className="font-display text-2xl">
                제{i + 1}조 {s.title}
              </h2>
              <div className="mt-3 space-y-3 leading-7 [&_li]:ml-5 [&_li]:list-disc [&_table]:w-full [&_td]:border-b [&_td]:border-linen-dim [&_td]:py-2 [&_td]:pr-3 [&_th]:border-b-2 [&_th]:border-ink [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// 검색엔진·AI 답변 엔진용 구조화 데이터. </script> 주입을 막으려고 < 를 이스케이프한다.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

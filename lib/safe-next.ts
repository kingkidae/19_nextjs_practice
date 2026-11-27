// 로그인 후 돌아갈 주소(next)를 사이트 안 경로로만 제한한다 (오픈 리다이렉트 방지).
// "/\evil.com" 은 브라우저가 "//evil.com" 으로 읽으므로 역슬래시와 제어 문자도 막고,
// 고정된 가짜 출처에 붙여 해석했을 때 출처가 그대로인지 확인한다.
export function safeNext(v: string | null | undefined): string {
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.includes("\\") || /[\x00-\x1f\x7f]/.test(v)) return "/";
  try {
    const base = "http://local.invalid";
    const u = new URL(v, base);
    const out = u.pathname + u.search + u.hash;
    // "/.//evil.com" 처럼 정규화한 뒤에야 "//" 가 되는 경우가 있어, 돌려줄 값을 다시 검사한다
    if (u.origin !== base || out.startsWith("//") || out.includes("\\")) return "/";
    return out;
  } catch {
    return "/";
  }
}

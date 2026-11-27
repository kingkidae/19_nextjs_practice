// 사진이 없으면 닉네임 첫 글자를 포스터 글꼴로 찍는다
export function Avatar({ name, url, size = 32, className = "" }: { name: string; url: string | null | undefined; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 의 사용자 사진
    return <img src={url} alt="" referrerPolicy="no-referrer" style={style} className={`shrink-0 rounded-full border-2 border-ink object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: size * 0.45 }}
      className={`font-display inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink bg-ink text-linen ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-8xl">404</p>
      <p className="mt-4 text-ink-soft">찾는 주제나 토론방이 없습니다. 삭제됐거나 주소가 틀렸을 수 있습니다.</p>
      <Link href="/" className="btn btn-ink mt-8">처음으로</Link>
    </div>
  );
}

import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { signOut } from "@/app/actions";

export async function HeaderAccount() {
  const { profile } = await getViewer();
  if (!profile) {
    return (
      <Link href="/login" className="rounded-full bg-siren px-4 py-1.5 font-bold text-linen">
        로그인
      </Link>
    );
  }
  return (
    <>
      {profile.role === "admin" && (
        <Link href="/admin" className="rounded-full border border-siren px-3 py-1 text-siren">관리자</Link>
      )}
      <span className="hidden text-linen/70 sm:inline">{profile.nickname}</span>
      <form action={signOut}>
        <button className="text-linen/70 underline-offset-4 hover:underline">로그아웃</button>
      </form>
    </>
  );
}

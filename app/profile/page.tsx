import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import type { ProfilePrivate } from "@/lib/types";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "내 프로필", robots: { index: false } };

export default function ProfilePage({ searchParams }: PageProps<"/profile">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-2xl bg-linen-deep" />}>
        <Profile searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Profile({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ supabase, user, profile }, sp] = await Promise.all([getViewer(), searchParams]);
  if (!user || !profile) redirect("/login?next=/profile");
  const { data: priv } = await supabase.from("profile_private").select("*").eq("user_id", user.id).maybeSingle<ProfilePrivate>();
  const welcome = sp.welcome === "1";
  const next = typeof sp.next === "string" ? sp.next : "";

  return (
    <>
      <h1 className="font-display text-6xl">{welcome ? "링에 오르기 전에" : "내 프로필"}</h1>
      <p className="mt-3 text-ink-soft">
        {welcome
          ? "상대가 누구와 싸우는지 알 수 있게 닉네임과 아바타를 정해 주세요. 나머지는 선택입니다."
          : "닉네임, 아바타, 한 줄 소개는 다른 사람에게 보입니다. 출생연도·성별·지역·관심 분야는 나만 봅니다."}
      </p>
      <ProfileForm profile={profile} priv={priv} email={user.email ?? ""} welcome={welcome} next={welcome ? next || "/" : ""} />
    </>
  );
}

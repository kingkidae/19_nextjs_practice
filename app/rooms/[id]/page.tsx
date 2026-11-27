import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import type { Member, Message, Room } from "@/lib/types";
import { RoomClient } from "./RoomClient";

export default function RoomPage({ params, searchParams }: PageProps<"/rooms/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-[70vh] max-w-7xl animate-pulse bg-linen-deep" />}>
      <RoomLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RoomLoader({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase, user, profile } = await getViewer();

  const { data: room } = await supabase.from("rooms").select("*").eq("id", id).maybeSingle<Room>();
  if (!room) notFound();

  const [{ data: topic }, { data: members }, { data: messages }, { data: votes }, { data: inventory }] = await Promise.all([
    supabase.from("topics").select("id, title, pros_label, cons_label").eq("id", room.topic_id).single(),
    supabase.from("room_members").select("*, profiles(nickname)").eq("room_id", id).order("joined_at"),
    supabase.from("messages").select("*").eq("room_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("votes").select("user_id, side").eq("room_id", id),
    user ? supabase.from("inventory").select("item, qty").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ]);

  const names: Record<string, string> = {};
  (members ?? []).forEach((m: Member & { profiles: { nickname: string } | null }) => {
    names[m.user_id] = m.profiles?.nickname ?? "알 수 없음";
  });
  // 메시지 작성자 중 이미 나간 사람의 이름도 채운다
  const authorIds = [...new Set((messages ?? []).map((m) => m.user_id).filter((u): u is string => !!u && !names[u]))];
  if (authorIds.length) {
    const { data: authors } = await supabase.from("profiles").select("id, nickname").in("id", authorIds);
    authors?.forEach((a) => (names[a.id] = a.nickname));
  }

  const inv = { wait: 0, block: 0 };
  (inventory ?? []).forEach((i: { item: "wait" | "block"; qty: number }) => (inv[i.item] = i.qty));

  return (
    <RoomClient
      initialRoom={room}
      topic={topic!}
      initialMembers={(members ?? []) as Member[]}
      initialMessages={((messages ?? []) as Message[]).reverse()}
      initialVotes={votes ?? []}
      initialNames={names}
      initialInventory={inv}
      viewer={user ? { id: user.id, isAdmin: profile?.role === "admin" } : null}
      joinError={typeof sp.error === "string" ? sp.error : null}
    />
  );
}

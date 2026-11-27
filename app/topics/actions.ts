"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCategory } from "@/lib/constants";

export type FormState = { error?: string };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function createTopic(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/topics/new");

  const title = str(form, "title");
  const description = str(form, "description");
  const category = str(form, "category");
  const weight = Number(form.get("weight"));
  const pros_label = str(form, "pros_label") || "찬성";
  const cons_label = str(form, "cons_label") || "반대";

  if (title.length < 2 || title.length > 80) return { error: "주제는 2~80자로 적어 주세요." };
  if (description.length > 1000) return { error: "설명은 1000자 이내로 적어 주세요." };
  if (!isCategory(category)) return { error: "카테고리를 골라 주세요." };
  if (!Number.isInteger(weight) || weight < 1 || weight > 10) return { error: "경중은 1~10 사이로 골라 주세요." };
  if (pros_label.length > 20 || cons_label.length > 20) return { error: "진영 이름은 20자 이내로 적어 주세요." };

  let image_url: string | null = null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) return { error: "사진은 이미지 파일만 올릴 수 있습니다." };
    if (file.size > 4 * 1024 * 1024) return { error: "사진은 4MB 이하로 올려 주세요." };
    const ext = file.type.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("topic-images").upload(path, file, { contentType: file.type });
    if (error) return { error: `사진을 올리지 못했습니다: ${error.message}` };
    image_url = supabase.storage.from("topic-images").getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("topics")
    .insert({ title, description, category, weight, pros_label, cons_label, image_url, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: `주제를 올리지 못했습니다: ${error.message}` };
  redirect(`/topics/${data.id}`);
}

export async function createRoom(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const topicId = str(form, "topic_id");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/topics/${topicId}`);

  const title = str(form, "title");
  const minutes = Number(form.get("minutes"));
  const rounds = Number(form.get("rounds"));
  const side = str(form, "side");
  if (title.length < 2 || title.length > 60) return { error: "방 이름은 2~60자로 적어 주세요." };
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 5) return { error: "발언 시간은 1~5분 사이입니다." };
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 5) return { error: "라운드는 1~5회 사이입니다." };
  if (side !== "pros" && side !== "cons") return { error: "내 진영을 골라 주세요." };

  const { data, error } = await supabase
    .from("rooms")
    .insert({ topic_id: topicId, title, speak_seconds: minutes * 60, rounds, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: `방을 만들지 못했습니다: ${error.message}` };
  const { error: joinError } = await supabase.rpc("join_room", { p_room: data.id, p_side: side });
  if (joinError) return { error: joinError.message };
  redirect(`/rooms/${data.id}`);
}

export async function joinRoom(roomId: string, side: "pros" | "cons") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/rooms/${roomId}`);
  const { error } = await supabase.rpc("join_room", { p_room: roomId, p_side: side });
  if (error) redirect(`/rooms/${roomId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/rooms/${roomId}`);
}

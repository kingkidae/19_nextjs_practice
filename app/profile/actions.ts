"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCategory } from "@/lib/constants";
import { safeNext } from "@/lib/safe-next";

export type ProfileState = { error?: string; ok?: boolean };

const GENDERS = ["female", "male", "other", "private"];

export async function saveProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const nickname = String(form.get("nickname") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const birthRaw = String(form.get("birth_year") ?? "").trim();
  const gender = String(form.get("gender") ?? "");
  const region = String(form.get("region") ?? "").trim();
  const interests = form.getAll("interests").map(String).filter(isCategory);
  const birth_year = birthRaw ? Number(birthRaw) : null;

  if (nickname.length < 2 || nickname.length > 20) return { error: "닉네임은 2~20자로 적어 주세요." };
  if (bio.length > 160) return { error: "한 줄 소개는 160자 이내로 적어 주세요." };
  if (birth_year !== null && (!Number.isInteger(birth_year) || birth_year < 1900 || birth_year > new Date().getFullYear()))
    return { error: "출생연도를 확인해 주세요." };
  if (gender && !GENDERS.includes(gender)) return { error: "성별 값을 확인해 주세요." };
  if (region.length > 30) return { error: "지역은 30자 이내로 적어 주세요." };

  const patch: Record<string, unknown> = { nickname, bio, onboarded: true };

  const file = form.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) return { error: "아바타는 이미지 파일만 올릴 수 있습니다." };
    if (file.size > 2 * 1024 * 1024) return { error: "아바타는 2MB 이하로 올려 주세요." };
    const ext = file.type.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "jpg";
    // 매번 새 파일명: 브라우저 캐시에 옛 사진이 남지 않게
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (error) return { error: `아바타를 올리지 못했습니다: ${error.message}` };
    patch.avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  } else if (form.get("remove_avatar") === "on") {
    patch.avatar_url = null;
  }

  const { error: pErr } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (pErr) return { error: `프로필을 저장하지 못했습니다: ${pErr.message}` };

  const { error: privErr } = await supabase.from("profile_private").upsert({
    user_id: user.id,
    birth_year,
    gender: gender || null,
    region: region || null,
    interests,
    updated_at: new Date().toISOString(),
  });
  if (privErr) return { error: `개인정보를 저장하지 못했습니다: ${privErr.message}` };

  revalidatePath("/", "layout");
  const next = String(form.get("next") ?? "");
  if (next) redirect(safeNext(next));
  return { ok: true };
}

// 첫 로그인 안내를 건너뛴다. 다시 묻지 않는다.
export async function skipOnboarding(next: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
  redirect(safeNext(next));
}

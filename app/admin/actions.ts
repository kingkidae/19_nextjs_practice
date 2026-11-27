"use server";

import ExcelJS from "exceljs";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { parseBigKinds, type StatKind } from "@/lib/bigkinds";
import { SETTING_FIELDS } from "@/lib/settings";
import { safeNext } from "@/lib/safe-next";

async function requireAdmin() {
  const viewer = await getViewer();
  if (viewer.profile?.role !== "admin") redirect("/");
  return viewer.supabase;
}

// 주제 삭제는 작성자도 할 수 있다. 권한 판정은 RLS 가 한다.
export async function deleteTopic(id: string) {
  const { supabase } = await getViewer();
  await supabase.from("topics").delete().eq("id", id);
  revalidateTag("sitemap", "max");
  redirect("/");
}

export type NoticeState = { error?: string; ok?: boolean };

export async function saveNotice(_: NoticeState, form: FormData): Promise<NoticeState> {
  const supabase = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const pinned = form.get("pinned") === "on";
  if (!title || title.length > 100) return { error: "제목은 1~100자로 적어 주세요." };
  const { error } = id
    ? await supabase.from("notices").update({ title, body, pinned, updated_at: new Date().toISOString() }).eq("id", id)
    : await supabase.from("notices").insert({ title, body, pinned });
  if (error) return { error: error.message };
  revalidatePath("/admin/notices");
  revalidatePath("/notices");
  return { ok: true };
}

export async function deleteNotice(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("notices").delete().eq("id", id);
  revalidatePath("/admin/notices");
  revalidatePath("/notices");
}

export async function deleteRoom(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("rooms").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function setMuted(id: string, muted: boolean) {
  const supabase = await requireAdmin();
  await supabase.rpc("admin_set_muted", { p_room: id, p_muted: muted });
  revalidatePath("/admin");
}

export async function setRole(userId: string, role: "user" | "admin") {
  const supabase = await requireAdmin();
  await supabase.rpc("admin_set_role", { p_user: userId, p_role: role });
  revalidatePath("/admin/users");
}

export type UploadState = { error?: string; message?: string };

const KIND_LABEL: Record<StatKind, string> = {
  articles: "관련 기사",
  trend: "보도량 추이",
  keywords: "연관어",
  relations: "관계도",
};

export async function uploadStats(_: UploadState, form: FormData): Promise<UploadState> {
  const supabase = await requireAdmin();
  const topicId = String(form.get("topic_id") ?? "");
  const kind = String(form.get("kind") ?? "") as StatKind;
  const file = form.get("file");
  if (!topicId) return { error: "주제를 고르세요." };
  if (!(kind in KIND_LABEL)) return { error: "자료 종류를 고르세요." };
  if (!(file instanceof File) || !file.size) return { error: "엑셀 파일을 고르세요." };
  if (!/\.xlsx$/i.test(file.name)) return { error: "빅카인즈에서 받은 .xlsx 파일만 올릴 수 있습니다." };

  let rows: (string | number | Date | null)[][];
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const sheet = wb.worksheets[0];
    rows = [];
    sheet.eachRow({ includeEmpty: true }, (row) => {
      const values = (row.values as unknown[]).slice(1); // exceljs 는 1번 칸부터 쓴다
      rows.push(
        values.map((v) => {
          if (v && typeof v === "object" && "hyperlink" in v) return String((v as { hyperlink: unknown }).hyperlink);
          if (v && typeof v === "object" && "richText" in v)
            return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
          if (v && typeof v === "object" && "text" in v) return String((v as { text: unknown }).text);
          if (v && typeof v === "object" && "result" in v) return (v as { result: string | number }).result; // 수식 칸
          return v as string | number | Date | null;
        }),
      );
    });
  } catch {
    return { error: "엑셀 파일을 읽지 못했습니다. 파일이 깨지지 않았는지 확인하세요." };
  }

  let parsed;
  try {
    parsed = parseBigKinds(kind, rows);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!parsed.length) return { error: "읽을 수 있는 행이 없습니다." };

  const { error } = await supabase
    .from("topic_stats")
    .upsert({ topic_id: topicId, [kind]: parsed, is_sample: false, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath(`/topics/${topicId}`);
  return { message: `${KIND_LABEL[kind]} ${parsed.length}건을 저장했습니다.` };
}

export type SettingsState = { error?: string; ok?: boolean };

// 링크는 사이트 안 경로(/...), http(s) 주소, 빈 값만 받는다. javascript: 같은 주소를 막는다.
const okLink = (v: string) => v === "" || safeNext(v) === v || /^https?:\/\/[^\s\\]+$/i.test(v);

export async function saveSettings(_: SettingsState, form: FormData): Promise<SettingsState> {
  const supabase = await requireAdmin();
  const rows = [];
  for (const f of SETTING_FIELDS) {
    const value = String(form.get(f.key) ?? "").trim();
    if (value.length > 500) return { error: `${f.label}: 500자 이내로 적어 주세요.` };
    if (f.key === "contact_email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: "문의 메일 형식을 확인해 주세요." };
    } else if (f.key === "site_url") {
      if (!/^https?:\/\/[^\s/]+/i.test(value)) return { error: "사이트 주소는 http:// 또는 https:// 로 시작해야 합니다." };
    } else if (!okLink(value)) {
      return { error: `${f.label}: /로 시작하는 경로나 http(s) 주소만 쓸 수 있습니다.` };
    }
    rows.push({ key: f.key, value, updated_at: new Date().toISOString() });
  }
  const { error } = await supabase.from("site_settings").upsert(rows);
  if (error) return { error: error.message };
  updateTag("settings");
  return { ok: true };
}

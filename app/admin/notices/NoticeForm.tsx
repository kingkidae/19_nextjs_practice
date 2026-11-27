"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveNotice, type NoticeState } from "../actions";

interface Notice {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
}

export function NoticeForm({ notice }: { notice?: Notice }) {
  const [state, action, pending] = useActionState<NoticeState, FormData>(saveNotice, {});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !notice) form.current?.reset();
  }, [state, notice]);

  return (
    <form ref={form} action={action} className="mt-4 space-y-3 text-sm">
      {notice && <input type="hidden" name="id" value={notice.id} />}
      <label className="block">
        <span className="mb-1 block font-bold">제목</span>
        <input name="title" defaultValue={notice?.title} required maxLength={100} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">내용</span>
        <textarea name="body" defaultValue={notice?.body} rows={5} className="field" />
      </label>
      <label className="flex items-center gap-2 font-bold">
        <input type="checkbox" name="pinned" defaultChecked={notice?.pinned} className="h-5 w-5 accent-[var(--siren)]" />
        맨 위에 고정
      </label>
      {state.error && <p role="alert" className="font-bold text-siren">{state.error}</p>}
      {state.ok && <p role="status" className="font-bold">{notice ? "수정했습니다." : "등록했습니다."}</p>}
      <button disabled={pending} className="btn btn-ink">{notice ? "수정 저장" : "공지 등록"}</button>
    </form>
  );
}

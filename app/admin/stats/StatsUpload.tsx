"use client";

import { useActionState } from "react";
import { uploadStats, type UploadState } from "../actions";

export function StatsUpload({ topics }: { topics: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadStats, {});
  return (
    <form action={action} className="mt-5 space-y-4 text-sm">
      <label className="block">
        <span className="mb-1 block font-bold">주제</span>
        <select name="topic_id" required defaultValue="" className="field">
          <option value="" disabled>골라 주세요</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">자료 종류</span>
        <select name="kind" required defaultValue="articles" className="field">
          <option value="articles">뉴스 목록 → 관련 기사</option>
          <option value="trend">키워드 트렌드 → 보도량 추이</option>
          <option value="keywords">연관어 분석 → 연관어</option>
          <option value="relations">관계도 분석 → 관계도</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">엑셀 파일 (.xlsx)</span>
        <input name="file" type="file" required accept=".xlsx" className="field py-2" />
      </label>
      {state.error && <p role="alert" className="font-bold text-siren">{state.error}</p>}
      {state.message && <p role="status" className="font-bold">{state.message}</p>}
      <button disabled={pending} className="btn btn-ink">{pending ? "읽는 중…" : "올리기"}</button>
    </form>
  );
}

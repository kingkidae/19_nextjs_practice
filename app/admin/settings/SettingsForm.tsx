"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "../actions";

interface Field {
  key: string;
  label: string;
  hint: string;
}

export function SettingsForm({ fields, values }: { fields: Field[]; values: Record<string, string> }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  return (
    <form action={action} className="mt-6 space-y-5">
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1 block font-bold">{f.label}</span>
          <input
            name={f.key}
            defaultValue={values[f.key] ?? ""}
            type={f.key === "contact_email" ? "email" : "text"}
            required={f.key === "site_url"}
            className="field"
          />
          <span className="mt-1 block text-xs text-ink-soft">{f.hint}</span>
        </label>
      ))}
      {state.error && <p role="alert" className="font-bold text-siren">{state.error}</p>}
      {state.ok && <p role="status" className="font-bold">저장했습니다. 푸터, sitemap, 검색엔진 정보에 반영됩니다.</p>}
      <button disabled={pending} className="btn btn-ink">{pending ? "저장 중…" : "설정 저장"}</button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { createRoom, type FormState } from "../actions";

export function RoomForm({ topicId, prosLabel, consLabel }: { topicId: string; prosLabel: string; consLabel: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createRoom, {});
  const [minutes, setMinutes] = useState(2);

  return (
    <form action={action} className="mt-4 space-y-4 text-sm">
      <input type="hidden" name="topic_id" value={topicId} />
      <label className="block">
        <span className="mb-1 block font-bold">방 이름</span>
        <input name="title" required minLength={2} maxLength={60} className="field" placeholder="예: 점심시간 한판" />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between font-bold">
          발언 시간 <span className="text-siren">{minutes}분</span>
        </span>
        <input
          name="minutes"
          type="range"
          min={1}
          max={5}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-full accent-[var(--siren)]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">라운드</span>
        <select name="rounds" defaultValue="3" className="field">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}라운드 (양쪽 {n}번씩 발언)</option>)}
        </select>
      </label>
      <fieldset>
        <legend className="mb-1 font-bold">내 진영</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-linen/30 p-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-siren has-[:checked]:border-linen has-[:checked]:bg-linen has-[:checked]:font-bold has-[:checked]:text-ink">
            <input type="radio" name="side" value="pros" required className="sr-only" />
            {prosLabel}
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-linen/30 p-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-siren has-[:checked]:border-linen has-[:checked]:font-bold has-[:checked]:ring-2 has-[:checked]:ring-linen">
            <input type="radio" name="side" value="cons" className="sr-only" />
            {consLabel}
          </label>
        </div>
      </fieldset>
      {state.error && <p role="alert" className="font-bold text-siren">{state.error}</p>}
      <button disabled={pending} className="btn btn-siren w-full">{pending ? "여는 중…" : "방 열고 입장"}</button>
    </form>
  );
}

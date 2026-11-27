"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { joinRoom } from "@/app/topics/actions";
import { ITEMS } from "@/lib/constants";
import type { Member, Message, Room, Side } from "@/lib/types";

const Coin = dynamic(() => import("@/components/Coin").then((m) => m.Coin), { ssr: false });

interface Props {
  initialRoom: Room;
  topic: { id: string; title: string; pros_label: string; cons_label: string };
  initialMembers: Member[];
  initialMessages: Message[];
  initialVotes: { user_id: string; side: Side }[];
  initialNames: Record<string, string>;
  initialInventory: { wait: number; block: number };
  viewer: { id: string; isAdmin: boolean } | null;
  joinError: string | null;
}

// "00:01:23.45" 형식의 Postgres interval 을 밀리초로
function intervalMs(v: string | null) {
  if (!v) return 0;
  const [h, m, s] = v.split(":").map(Number);
  return ((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000;
}
const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);
const clock = (t: number) => {
  const s = Math.max(0, Math.ceil(t / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function RoomClient(props: Props) {
  const { topic, viewer } = props;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [room, setRoom] = useState(props.initialRoom);
  const [members, setMembers] = useState(props.initialMembers);
  const [messages, setMessages] = useState(props.initialMessages);
  const [votes, setVotes] = useState(props.initialVotes);
  const [names, setNames] = useState(props.initialNames);
  const [inventory, setInventory] = useState(props.initialInventory);
  const [error, setError] = useState(props.joinError ?? "");
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState<null | "wait" | "block">(null);
  const [rouletteDoneFor, setRouletteDoneFor] = useState<string | null>(null);
  const lastTick = useRef(0);
  const requested = useRef(new Set(Object.keys(props.initialNames)));

  const label = (s: Side | null) => (s === "pros" ? topic.pros_label : s === "cons" ? topic.cons_label : "");
  const nameOf = useCallback((id: string | null) => (id ? names[id] ?? "참여자" : "없음"), [names]);
  const me = viewer ? members.find((m) => m.user_id === viewer.id && !m.kicked) : undefined;
  const kickedMe = viewer ? members.some((m) => m.user_id === viewer.id && m.kicked) : false;
  const active = members.filter((m) => !m.kicked);
  const team = (s: Side) => active.filter((m) => m.side === s);

  // ── 실시간 구독 ──
  useEffect(() => {
    const ensureName = (uid: string | null) => {
      if (!uid || requested.current.has(uid)) return;
      requested.current.add(uid);
      supabase.from("profiles").select("nickname").eq("id", uid).single().then(({ data }) => {
        if (data) setNames((p) => (p[uid] ? p : { ...p, [uid]: data.nickname }));
      });
    };
    const ch = supabase
      .channel(`room:${room.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, (p) => {
        const next = p.new as Room;
        setRoom((prev) => {
          if (!prev.interrupter_id && next.interrupter_id) setFlash("wait");
          else if (prev.interrupter_id && !next.interrupter_id && next.block_used && !prev.block_used) setFlash("block");
          return next;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, () => {
        router.replace(`/topics/${topic.id}`);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${room.id}` }, (p) => {
        const m = p.new as Member;
        if (!m?.user_id) return;
        ensureName(m.user_id);
        setMembers((prev) => [...prev.filter((x) => x.user_id !== m.user_id), m]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` }, (p) => {
        const msg = p.new as Message;
        ensureName(msg.user_id);
        setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev.slice(-299), msg]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (p) => {
        const id = (p.old as { id?: number }).id;
        setMessages((prev) => prev.filter((x) => x.id !== id));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes", filter: `room_id=eq.${room.id}` }, (p) => {
        const v = p.new as { user_id: string; side: Side };
        setVotes((prev) => [...prev.filter((x) => x.user_id !== v.user_id), v]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, room.id, router, topic.id]);

  // ── 시계 ──
  // shortcut: 남은 시간은 브라우저 시계로 그린다. 판정은 DB now() 라 공정하지만, 시계가 크게 틀린 기기에선 표시가 몇 초 어긋날 수 있다.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1800);
    return () => clearTimeout(t);
  }, [flash]);

  const interrupting = !!room.interrupter_id && now < ms(room.interrupt_ends_at);
  const beforeFirstTurn = room.status === "live" && now < ms(room.turn_starts_at);
  const showRoulette = beforeFirstTurn && room.current_round === 1 && room.current_side === room.first_side;
  const remaining = room.interrupter_id ? ms(room.interrupt_ends_at) - now : ms(room.turn_ends_at) - now;
  const pausedLeft = intervalMs(room.paused_remaining);

  // 시간이 다 되면 아무 참여자의 브라우저든 DB 에 정리를 요청한다 (DB 가 시간을 다시 확인)
  useEffect(() => {
    if (room.status !== "live" || room.muted || !viewer) return;
    const due = room.interrupter_id ? now >= ms(room.interrupt_ends_at) : now >= ms(room.turn_ends_at);
    if (due && now - lastTick.current > 1500) {
      lastTick.current = now;
      supabase.rpc("tick_room", { p_room: room.id });
    }
  }, [now, room, supabase, viewer]);

  const rouletteDone = rouletteDoneFor === room.turn_starts_at;

  const activeSpeaker = room.status !== "live" || room.muted
    ? null
    : interrupting
      ? room.interrupter_id
      : !room.interrupter_id && !beforeFirstTurn && now < ms(room.turn_ends_at)
        ? room.speaker_id
        : null;

  const canSpeakMain =
    !!me && !room.muted && (room.status !== "live" || activeSpeaker === viewer?.id);
  const isLeader = !!me?.is_leader;

  async function call(fn: string, args: Record<string, unknown>) {
    setError("");
    const { error } = await supabase.rpc(fn, args);
    if (error) setError(error.message);
    return !error;
  }

  async function refreshInventory() {
    if (!viewer) return;
    const { data } = await supabase.from("inventory").select("item, qty").eq("user_id", viewer.id);
    const inv = { wait: 0, block: 0 };
    data?.forEach((i: { item: "wait" | "block"; qty: number }) => (inv[i.item] = i.qty));
    setInventory(inv);
  }

  async function spendItem(fn: "use_wait" | "use_block") {
    if (await call(fn, { p_room: room.id })) refreshInventory();
  }

  const mainMessages = messages.filter((m) => m.channel === "main" || m.channel === "system");
  const teamMessages = me ? messages.filter((m) => m.channel === me.side) : [];
  const voteCount = (s: Side) => votes.filter((v) => v.side === s).length;
  const myVote = viewer ? votes.find((v) => v.user_id === viewer.id)?.side : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* ── 상단 ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/topics/${topic.id}`} className="text-sm underline underline-offset-4">{topic.title}</Link>
        {viewer?.isAdmin && (
          <div className="ml-auto flex gap-2">
            <button className="btn" onClick={() => call("admin_set_muted", { p_room: room.id, p_muted: !room.muted })}>
              {room.muted ? "발언 정지 풀기" : "전체 발언 정지"}
            </button>
            <button
              className="btn btn-siren"
              onClick={async () => {
                if (!confirm("이 토론방을 삭제할까요? 채팅도 모두 지워집니다.")) return;
                const { error } = await supabase.from("rooms").delete().eq("id", room.id);
                if (error) setError(error.message);
                else router.replace(`/topics/${topic.id}`);
              }}
            >
              방 삭제
            </button>
          </div>
        )}
      </div>
      <h1 className="font-display mt-2 text-4xl sm:text-5xl">{room.title}</h1>

      {/* ── 링: 두 코너와 가운데 시계 ── */}
      <section aria-label="토론 상황" className="mt-5 grid overflow-hidden rounded-2xl border-2 border-ink bg-ink text-linen md:grid-cols-[1fr_1.4fr_1fr]">
        <Corner side="pros" label={topic.pros_label} count={team("pros").length} lit={room.current_side === "pros" && room.status === "live"} />
        <div className="flex flex-col items-center justify-center gap-1 px-4 py-6 text-center" aria-live="polite">
          {room.status === "waiting" && (
            <>
              <p className="font-display text-3xl">경기 전</p>
              <p className="text-sm text-linen/75">양쪽에 1명 이상 모이면 방장이 시작합니다. 선공은 동전이 정합니다.</p>
              {(viewer?.id === room.created_by || viewer?.isAdmin) && (
                <button
                  className="btn btn-siren mt-3"
                  disabled={!team("pros").length || !team("cons").length}
                  onClick={() => call("start_debate", { p_room: room.id })}
                >
                  토론 시작
                </button>
              )}
            </>
          )}
          {room.status === "live" && (
            <>
              <p className="text-sm text-linen/70">
                ROUND {room.current_round} / {room.rounds}
                {room.muted && <span className="ml-2 rounded bg-siren px-2 font-bold text-linen">관리자 정지 중</span>}
              </p>
              {interrupting ? (
                <>
                  <p className="font-display text-3xl text-siren">잠깐!!! {nameOf(room.interrupter_id)}</p>
                  <p className="font-display text-7xl tabular-nums">{clock(remaining)}</p>
                  <p className="text-sm text-linen/70">{nameOf(room.speaker_id)} 님의 남은 {clock(pausedLeft)} 은 멈춰 있습니다.</p>
                </>
              ) : (
                <>
                  <p className="font-display text-3xl">
                    <span className={room.current_side === "pros" ? "text-[#9fb1ff]" : "text-[#ff8a7d]"}>{label(room.current_side)}</span>{" "}
                    {nameOf(room.speaker_id)}
                  </p>
                  <p className="font-display text-7xl tabular-nums">{beforeFirstTurn ? "--:--" : clock(remaining)}</p>
                  <p className="text-sm text-linen/70">발언자 외에는 전체 채팅에 쓸 수 없습니다.</p>
                </>
              )}
            </>
          )}
          {room.status === "ended" && (
            <>
              <p className="font-display text-4xl">경기 종료</p>
              <p className="text-sm text-linen/75">누가 더 설득력 있었나요?</p>
              <div className="mt-3 flex gap-2">
                {(["pros", "cons"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={!viewer || !!myVote}
                    onClick={async () => {
                      const { error } = await supabase.from("votes").insert({ room_id: room.id, side: s });
                      if (error) setError(error.code === "23505" ? "이미 투표했습니다." : error.message);
                    }}
                    className={`btn ${s === "pros" ? "btn-pros" : "btn-siren"}`}
                    aria-pressed={myVote === s}
                  >
                    {label(s)} {voteCount(s)}표
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <Corner side="cons" label={topic.cons_label} count={team("cons").length} lit={room.current_side === "cons" && room.status === "live"} />
      </section>

      {error && <p role="alert" className="mt-3 rounded-lg bg-siren px-4 py-2 font-bold text-linen">{error}</p>}

      {/* 관전자: 진영 고르기 */}
      {!me && room.status !== "ended" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-ink p-4">
          <p className="mr-auto text-sm">
            {kickedMe ? "이 방에서 내보내져 관전만 할 수 있습니다." : "관전 중입니다. 진영을 고르면 토론에 참여합니다. 한 번 고른 진영은 바꿀 수 없습니다."}
          </p>
          {!kickedMe && (
            <>
              <form action={joinRoom.bind(null, room.id, "pros")}><button className="btn btn-pros">{topic.pros_label}로 참여</button></form>
              <form action={joinRoom.bind(null, room.id, "cons")}><button className="btn btn-siren">{topic.cons_label}로 참여</button></form>
            </>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* ── 전체 채팅 ── */}
        <section aria-labelledby="main-chat" className="flex min-h-[28rem] flex-col rounded-2xl border-2 border-ink bg-[#f6f1e7]">
          <h2 id="main-chat" className="border-b-2 border-ink px-4 py-2 font-bold">전체 채팅</h2>
          <ChatLog
            messages={mainMessages}
            nameOf={nameOf}
            sideOf={(uid) => members.find((m) => m.user_id === uid)?.side}
            canDelete={!!viewer?.isAdmin}
            onDelete={async (id) => {
              const { error } = await supabase.from("messages").delete().eq("id", id);
              if (error) setError(error.message);
            }}
            mine={viewer?.id}
          />
          {me && room.status === "live" && (
            <div className="flex flex-wrap gap-2 border-t-2 border-ink px-4 py-2">
              {me.side !== room.current_side && !room.interrupter_id && (
                <button
                  className="btn btn-siren"
                  disabled={room.wait_used || beforeFirstTurn || inventory.wait < 1}
                  onClick={() => spendItem("use_wait")}
                  title={ITEMS.wait.desc}
                >
                  {ITEMS.wait.name} ({inventory.wait})
                </button>
              )}
              {me.side === room.current_side && interrupting && (
                <button className="btn btn-ink" disabled={room.block_used || inventory.block < 1} onClick={() => spendItem("use_block")} title={ITEMS.block.desc}>
                  {ITEMS.block.name} ({inventory.block})
                </button>
              )}
              {room.interrupter_id === viewer?.id && interrupting && (
                <button className="btn" onClick={() => call("end_interrupt", { p_room: room.id })}>할 말 다 했음 (일찍 끝내기)</button>
              )}
              <Link href="/shop" className="ml-auto self-center text-sm underline underline-offset-4">아이템 사러 가기</Link>
            </div>
          )}
          <ChatInput
            disabled={!canSpeakMain}
            placeholder={
              !viewer ? "로그인하면 참여할 수 있습니다" :
              !me ? "진영을 고르면 말할 수 있습니다" :
              room.muted ? "관리자가 발언을 멈췄습니다" :
              canSpeakMain ? "주장을 펼치세요" : "지금은 발언자만 말할 수 있습니다. 팀 채팅을 쓰세요"
            }
            onSend={(body) => call("send_message", { p_room: room.id, p_channel: "main", p_body: body })}
          />
        </section>

        {/* ── 팀 채팅과 팀원 ── */}
        <section aria-labelledby="team-chat" className={`flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border-2 border-t-8 border-ink bg-ink text-linen ${me ? (me.side === "pros" ? "border-t-pros" : "border-t-cons") : ""}`}>
          <h2 id="team-chat" className="border-b border-linen/20 px-4 py-2 font-bold">
            {me ? `팀 채팅 (${label(me.side)})` : "팀원"}
          </h2>
          <TeamRoster
            sides={viewer?.isAdmin || !me ? ["pros", "cons"] : [me.side]}
            team={team}
            label={label}
            nameOf={nameOf}
            viewerId={viewer?.id}
            canKick={(m) => !!viewer && m.user_id !== viewer.id && (viewer.isAdmin || (isLeader && me?.side === m.side))}
            onKick={(uid) => {
              if (confirm(`${nameOf(uid)} 님을 이 방에서 내보낼까요? 다시 들어올 수 없습니다.`)) call("kick_member", { p_room: room.id, p_user: uid });
            }}
          />
          {me && (
            <>
              <ChatLog messages={teamMessages} nameOf={nameOf} mine={viewer?.id} dark canDelete={!!viewer?.isAdmin}
                onDelete={async (id) => { await supabase.from("messages").delete().eq("id", id); }} />
              <ChatInput
                dark
                disabled={room.muted}
                placeholder={room.muted ? "관리자가 발언을 멈췄습니다" : "우리 팀만 보는 작전 회의"}
                onSend={(body) => call("send_message", { p_room: room.id, p_channel: "team", p_body: body })}
              />
            </>
          )}
        </section>
      </div>

      {/* ── 연출: 선공 룰렛 ── */}
      <AnimatePresence>
        {showRoulette && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/90 text-linen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-label="선공 결정"
          >
            <p className="font-display text-3xl">선공을 정합니다</p>
            <Coin mode="roulette" result={room.first_side} onDone={() => setRouletteDoneFor(room.turn_starts_at)} className="h-[min(60vh,28rem)] w-[min(90vw,28rem)]" />
            <p className="font-display h-16 text-5xl" aria-live="assertive">
              {rouletteDone && (
                <motion.span initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={room.first_side === "pros" ? "text-[#9fb1ff]" : "text-siren"}>
                  {label(room.first_side)} 선공!
                </motion.span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 연출: 잠깐!!! / 방.해.금.지 ── */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          >
            <motion.p
              initial={{ scale: 3, rotate: -8 }}
              animate={{ scale: 1, rotate: [-8, 4, -2, 0] }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className={`font-display rounded-2xl border-4 border-ink px-10 py-6 text-7xl shadow-[10px_10px_0_var(--ink)] sm:text-9xl ${flash === "wait" ? "bg-siren text-linen" : "bg-ink text-linen"}`}
            >
              {flash === "wait" ? "잠깐!!!" : "방.해.금.지"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Corner({ side, label, count, lit }: { side: Side; label: string; count: number; lit: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-6 py-5 transition-colors duration-500 md:flex-col md:justify-center ${
        lit ? (side === "pros" ? "bg-pros" : "bg-cons") : ""
      }`}
    >
      <p className="font-display text-3xl">{label}</p>
      <p className="text-sm">{count}명{lit && " · 발언 중"}</p>
    </div>
  );
}

function ChatLog({
  messages, nameOf, sideOf, mine, dark, canDelete, onDelete,
}: {
  messages: Message[];
  nameOf: (id: string | null) => string;
  sideOf?: (id: string | null) => Side | undefined;
  mine?: string;
  dark?: boolean;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  return (
    <div className="h-80 flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm" role="log" aria-live="polite">
      {messages.length === 0 && <p className={dark ? "text-linen/70" : "text-ink-soft"}>아직 조용합니다.</p>}
      {messages.map((m) =>
        m.channel === "system" ? (
          <p key={m.id} className={`text-center text-xs font-bold ${dark ? "text-linen/70" : "text-ink-soft"}`}>{m.body}</p>
        ) : (
          <div key={m.id} className={`group flex gap-2 ${m.user_id === mine ? "flex-row-reverse text-right" : ""}`}>
            <div className="max-w-[80%]">
              <p className={`text-xs font-bold ${dark ? "text-linen/80" : sideOf?.(m.user_id) === "pros" ? "text-pros" : sideOf?.(m.user_id) === "cons" ? "text-cons" : ""}`}>
                {nameOf(m.user_id)}
              </p>
              <p className={`inline-block whitespace-pre-wrap break-words rounded-xl px-3 py-1.5 text-left ${dark ? "bg-linen/10" : m.user_id === mine ? "bg-ink text-linen" : "bg-linen-deep"}`}>
                {m.body}
              </p>
            </div>
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(m.id)}
                className="self-end text-xs underline opacity-0 focus:opacity-100 group-hover:opacity-100"
                aria-label={`${nameOf(m.user_id)} 님의 메시지 삭제`}
              >
                삭제
              </button>
            )}
          </div>
        ),
      )}
      <div ref={end} />
    </div>
  );
}

function ChatInput({ disabled, placeholder, onSend, dark }: { disabled: boolean; placeholder: string; onSend: (body: string) => Promise<boolean>; dark?: boolean }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={`flex gap-2 border-t-2 p-3 ${dark ? "border-linen/20" : "border-ink"}`}
      onSubmit={async (e) => {
        e.preventDefault();
        const body = text.trim();
        if (!body) return;
        setBusy(true);
        if (await onSend(body)) setText("");
        setBusy(false);
      }}
    >
      <label className="sr-only" htmlFor={dark ? "team-input" : "main-input"}>{placeholder}</label>
      <input
        id={dark ? "team-input" : "main-input"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        disabled={disabled}
        placeholder={placeholder}
        className={`field disabled:opacity-60 ${dark ? "border-linen/30 bg-linen/10 text-linen placeholder:text-linen/50" : ""}`}
      />
      <button disabled={disabled || busy || !text.trim()} className={`btn shrink-0 ${dark ? "" : "btn-ink"}`}>보내기</button>
    </form>
  );
}

function TeamRoster({
  sides, team, label, nameOf, viewerId, canKick, onKick,
}: {
  sides: Side[];
  team: (s: Side) => Member[];
  label: (s: Side) => string;
  nameOf: (id: string | null) => string;
  viewerId?: string;
  canKick: (m: Member) => boolean;
  onKick: (uid: string) => void;
}) {
  return (
    <div className="space-y-2 border-b border-linen/20 px-4 py-3 text-sm">
      {sides.map((s) => (
        <div key={s}>
          {sides.length > 1 && <p className="text-xs text-linen/70">{label(s)}</p>}
          <ul className="flex flex-wrap gap-1.5">
            {team(s).map((m) => (
              <li key={m.user_id} className="flex items-center gap-1 rounded-full bg-linen/10 py-0.5 pl-2.5 pr-1">
                {m.is_leader && <span title="팀장" aria-label="팀장">★</span>}
                {nameOf(m.user_id)}
                {m.user_id === viewerId && " (나)"}
                {canKick(m) ? (
                  <button onClick={() => onKick(m.user_id)} className="ml-1 rounded-full bg-linen px-2 text-xs font-bold text-ink" aria-label={`${nameOf(m.user_id)} 내보내기`}>
                    내보내기
                  </button>
                ) : (
                  <span className="w-1.5" />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

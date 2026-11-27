-- The Controversial: Pros and Cons — Supabase schema
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 실행한 뒤 seed.sql 을 실행한다.

create extension if not exists pgcrypto;

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name',
                  split_part(new.email, '@', 1)), 30),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- ───────────────────────── topics ─────────────────────────
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  category text not null check (category in
    ('politics','economy','society','culture','world','local','sports','tech','entertainment')),
  weight int not null check (weight between 1 and 10),
  pros_label text not null default '찬성' check (char_length(pros_label) between 1 and 20),
  cons_label text not null default '반대' check (char_length(cons_label) between 1 and 20),
  image_url text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  last_chat_at timestamptz
);
create index on public.topics (category, created_at desc);

create table public.topic_stats (
  topic_id uuid primary key references public.topics on delete cascade,
  trend jsonb not null default '[]',      -- [{date, count}]
  keywords jsonb not null default '[]',   -- [{word, weight}]
  relations jsonb not null default '[]',  -- [{name, type, weight}]
  articles jsonb not null default '[]',   -- [{title, press, date, url}]  기사 본문은 저장하지 않는다(저작권)
  is_sample boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── rooms ─────────────────────────
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics on delete cascade,
  title text not null check (char_length(title) between 2 and 60),
  created_by uuid references public.profiles on delete set null,
  speak_seconds int not null check (speak_seconds between 60 and 300),
  rounds int not null default 3 check (rounds between 1 and 5),
  status text not null default 'waiting' check (status in ('waiting','live','ended')),
  first_side text check (first_side in ('pros','cons')),
  current_round int not null default 0,
  current_side text check (current_side in ('pros','cons')),
  speaker_id uuid references public.profiles on delete set null,
  turn_starts_at timestamptz,
  turn_ends_at timestamptz,
  paused_remaining interval,             -- 잠깐!!! 동안 멈춰 둔 원래 발언자의 남은 시간
  interrupter_id uuid references public.profiles on delete set null,
  interrupt_ends_at timestamptz,
  wait_used boolean not null default false,
  block_used boolean not null default false,
  muted boolean not null default false,
  muted_at timestamptz,
  started_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.rooms (topic_id, created_at desc);

create table public.room_members (
  room_id uuid references public.rooms on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  side text not null check (side in ('pros','cons')),
  is_leader boolean not null default false,
  kicked boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms on delete cascade,
  user_id uuid references public.profiles on delete set null,
  channel text not null check (channel in ('main','pros','cons','system')),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index on public.messages (room_id, created_at);

create table public.votes (
  room_id uuid references public.rooms on delete cascade,
  user_id uuid references public.profiles on delete cascade default auth.uid(),
  side text not null check (side in ('pros','cons')),
  primary key (room_id, user_id)
);

-- ───────────────────────── shop ─────────────────────────
create table public.inventory (
  user_id uuid references public.profiles on delete cascade,
  item text not null check (item in ('wait','block')),
  qty int not null default 0 check (qty >= 0),
  primary key (user_id, item)
);

create table public.payments (
  order_id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  item text not null check (item in ('wait','block')),
  qty int not null check (qty between 1 and 10),
  amount int not null,
  status text not null default 'pending' check (status in ('pending','done','failed')),
  payment_key text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── notices ─────────────────────────
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  body text not null default '',
  pinned boolean not null default false,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── card view ─────────────────────────
create view public.topic_cards with (security_invoker = true) as
select t.*,
  coalesce(sum((m.side = 'pros')::int), 0)::int as pros_count,
  coalesce(sum((m.side = 'cons')::int), 0)::int as cons_count,
  count(m.user_id)::int as participants,
  (count(distinct r.id) filter (where r.status = 'live'))::int as live_rooms
from public.topics t
left join public.rooms r on r.topic_id = t.id
left join public.room_members m on m.room_id = r.id and not m.kicked
group by t.id;

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.topic_stats enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.votes enable row level security;
alter table public.inventory enable row level security;
alter table public.payments enable row level security;
alter table public.notices enable row level security;

create policy "profiles read" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update using (id = auth.uid() or public.is_admin());
-- 일반 사용자가 자기 role 을 바꾸지 못하도록 컬럼 단위로 막는다. role 변경은 admin_set_role() 로만.
revoke update on public.profiles from anon, authenticated;
grant update (nickname, avatar_url) on public.profiles to authenticated;

create policy "topics read" on public.topics for select using (true);
create policy "topics create" on public.topics for insert to authenticated with check (created_by = auth.uid());
create policy "topics admin update" on public.topics for update using (public.is_admin());
create policy "topics delete" on public.topics for delete using (public.is_admin() or created_by = auth.uid());

create policy "stats read" on public.topic_stats for select using (true);
create policy "stats admin write" on public.topic_stats for all using (public.is_admin()) with check (public.is_admin());

create policy "rooms read" on public.rooms for select using (true);
create policy "rooms create" on public.rooms for insert to authenticated
  with check (created_by = auth.uid() and status = 'waiting');
create policy "rooms delete" on public.rooms for delete
  using (public.is_admin() or (created_by = auth.uid() and status = 'waiting'));

create policy "members read" on public.room_members for select using (true);

create policy "messages read" on public.messages for select using (
  channel in ('main','system') or public.is_admin() or exists (
    select 1 from public.room_members m
    where m.room_id = messages.room_id and m.user_id = auth.uid() and m.side = messages.channel and not m.kicked)
);
create policy "messages admin delete" on public.messages for delete using (public.is_admin());

create policy "votes read" on public.votes for select using (true);
create policy "votes cast" on public.votes for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.rooms r where r.id = room_id and r.status = 'ended')
);

create policy "inventory own" on public.inventory for select using (user_id = auth.uid());
create policy "payments own" on public.payments for select using (user_id = auth.uid() or public.is_admin());

create policy "notices read" on public.notices for select using (true);
create policy "notices admin write" on public.notices for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── debate engine ─────────────────────────
-- 모든 판정은 DB 의 now() 기준. 클라이언트 시계는 화면 표시용일 뿐이다.

create or replace function public._pick_speaker(p_room uuid, p_side text) returns uuid
language sql volatile as $$
  select user_id from public.room_members
  where room_id = p_room and side = p_side and not kicked
  order by random() limit 1
$$;

create or replace function public._sys(p_room uuid, p_body text) returns void
language sql as $$
  insert into public.messages (room_id, user_id, channel, body) values (p_room, null, 'system', p_body)
$$;

create or replace function public._nick(p_user uuid) returns text
language sql stable as $$
  select coalesce((select nickname from public.profiles where id = p_user), '알 수 없음')
$$;

create or replace function public._side_name(p_side text) returns text
language sql immutable as $$ select case p_side when 'pros' then 'PROS' else 'CONS' end $$;

create or replace function public._resume(p_room uuid, p_msg text) returns void
language plpgsql as $$
begin
  update public.rooms
  set turn_ends_at = now() + coalesce(paused_remaining, interval '0'),
      interrupter_id = null, interrupt_ends_at = null, paused_remaining = null
  where id = p_room;
  perform public._sys(p_room, p_msg);
end $$;

create or replace function public._next_turn(r public.rooms) returns void
language plpgsql as $$
declare v_side text; v_round int; v_speaker uuid;
begin
  if r.current_side = r.first_side then
    v_side := case r.first_side when 'pros' then 'cons' else 'pros' end;
    v_round := r.current_round;
  else
    v_side := r.first_side;
    v_round := r.current_round + 1;
  end if;

  if v_round > r.rounds then
    update public.rooms
    set status = 'ended', speaker_id = null, current_side = null, turn_starts_at = null, turn_ends_at = null,
        interrupter_id = null, interrupt_ends_at = null, paused_remaining = null
    where id = r.id;
    perform public._sys(r.id, '토론이 끝났습니다. 더 설득력 있었던 쪽에 투표하세요.');
    return;
  end if;

  v_speaker := public._pick_speaker(r.id, v_side);
  update public.rooms
  set current_round = v_round, current_side = v_side, speaker_id = v_speaker,
      turn_starts_at = now(), turn_ends_at = now() + make_interval(secs => r.speak_seconds),
      wait_used = false, block_used = false, interrupter_id = null, interrupt_ends_at = null, paused_remaining = null
  where id = r.id;
  perform public._sys(r.id, format('ROUND %s · %s 차례. 발언자: %s', v_round, public._side_name(v_side), public._nick(v_speaker)));
end $$;

create or replace function public.join_room(p_room uuid, p_side text) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_member room_members;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if p_side not in ('pros','cons') then raise exception '잘못된 진영입니다.'; end if;
  -- 방 행을 잠가서 팀장 자리가 동시에 두 명에게 가지 않게 한다
  perform 1 from rooms where id = p_room and status <> 'ended' for update;
  if not found then raise exception '이미 끝났거나 없는 토론방입니다.'; end if;

  select * into v_member from room_members where room_id = p_room and user_id = v_uid;
  if found then
    if v_member.kicked then raise exception '이 방에서 내보내져 다시 들어갈 수 없습니다.'; end if;
    return; -- 한 번 고른 진영은 바꿀 수 없다
  end if;

  insert into room_members (room_id, user_id, side, is_leader)
  values (p_room, v_uid, p_side, not exists (
    select 1 from room_members where room_id = p_room and side = p_side and is_leader and not kicked));
  perform _sys(p_room, format('%s 님이 %s 팀에 들어왔습니다.', _nick(v_uid), _side_name(p_side)));
end $$;

create or replace function public.start_debate(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms; v_first text; v_speaker uuid;
begin
  select * into r from rooms where id = p_room for update;
  if not found then raise exception '토론방이 없습니다.'; end if;
  if auth.uid() is null or (r.created_by is distinct from auth.uid() and not is_admin()) then
    raise exception '방장만 시작할 수 있습니다.';
  end if;
  if r.status <> 'waiting' then raise exception '이미 시작된 토론입니다.'; end if;
  if not exists (select 1 from room_members where room_id = p_room and side = 'pros' and not kicked)
     or not exists (select 1 from room_members where room_id = p_room and side = 'cons' and not kicked) then
    raise exception 'PROS 와 CONS 에 각각 1명 이상 있어야 시작할 수 있습니다.';
  end if;

  v_first := case when random() < 0.5 then 'pros' else 'cons' end;
  v_speaker := _pick_speaker(p_room, v_first);
  -- 첫 발언은 룰렛 연출(회전 2초 + 결과 2초)이 끝난 뒤 시작한다
  update rooms
  set status = 'live', started_at = now(), first_side = v_first, current_round = 1, current_side = v_first,
      speaker_id = v_speaker,
      turn_starts_at = now() + interval '4 seconds',
      turn_ends_at = now() + interval '4 seconds' + make_interval(secs => speak_seconds),
      wait_used = false, block_used = false
  where id = p_room;
  perform _sys(p_room, format('룰렛 결과 %s 선공. 첫 발언자: %s', _side_name(v_first), _nick(v_speaker)));
end $$;

-- 시간이 지난 상태를 정리한다. 누가 몇 번 불러도 결과가 같다.
create or replace function public.tick_room(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  select * into r from rooms where id = p_room for update;
  if not found or r.status <> 'live' or r.muted then return; end if;
  if r.interrupter_id is not null then
    if r.interrupt_ends_at <= now() then
      perform _resume(p_room, '잠깐!!! 시간이 끝났습니다. 원래 발언자가 이어서 말합니다.');
    end if;
    return;
  end if;
  if r.turn_ends_at <= now() then perform _next_turn(r); end if;
end $$;

create or replace function public.send_message(p_room uuid, p_channel text, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r rooms; m room_members; v_active uuid; v_body text := btrim(p_body);
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if v_body = '' then raise exception '내용을 입력하세요.'; end if;
  select * into r from rooms where id = p_room;
  if not found then raise exception '토론방이 없습니다.'; end if;

  if is_admin() and p_channel = 'main' then
    insert into messages (room_id, user_id, channel, body) values (p_room, v_uid, 'main', v_body);
    update topics set last_chat_at = now() where id = r.topic_id;
    return;
  end if;

  select * into m from room_members where room_id = p_room and user_id = v_uid;
  if not found or m.kicked then raise exception '토론 참여자만 말할 수 있습니다.'; end if;
  if r.muted then raise exception '관리자가 이 방의 발언을 멈췄습니다.'; end if;

  if p_channel = 'team' then
    insert into messages (room_id, user_id, channel, body) values (p_room, v_uid, m.side, v_body);
    return;
  end if;

  if r.status = 'live' then
    v_active := case
      when r.interrupter_id is not null and r.interrupt_ends_at > now() then r.interrupter_id
      when r.interrupter_id is null and now() >= r.turn_starts_at and now() < r.turn_ends_at then r.speaker_id
    end;
    if v_active is distinct from v_uid then raise exception '지금은 발언자만 말할 수 있습니다. 팀 채팅을 이용하세요.'; end if;
  end if;

  insert into messages (room_id, user_id, channel, body) values (p_room, v_uid, 'main', v_body);
  update topics set last_chat_at = now() where id = r.topic_id;
end $$;

create or replace function public.use_wait(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r rooms; v_side text;
begin
  select * into r from rooms where id = p_room for update;
  if not found or r.status <> 'live' or r.muted then raise exception '지금은 아이템을 쓸 수 없습니다.'; end if;
  if r.interrupter_id is not null then raise exception '이미 잠깐!!! 이 진행 중입니다.'; end if;
  if now() < r.turn_starts_at or now() >= r.turn_ends_at then raise exception '발언 시간 중에만 쓸 수 있습니다.'; end if;
  if r.wait_used then raise exception '이번 발언에서는 이미 잠깐!!! 이 쓰였습니다.'; end if;
  select side into v_side from room_members where room_id = p_room and user_id = v_uid and not kicked;
  if v_side is null then raise exception '토론 참여자만 쓸 수 있습니다.'; end if;
  if v_side = r.current_side then raise exception '상대 팀이 발언할 때만 쓸 수 있습니다.'; end if;

  update inventory set qty = qty - 1 where user_id = v_uid and item = 'wait' and qty > 0;
  if not found then raise exception '잠깐!!! 아이템이 없습니다. 상점에서 구매하세요.'; end if;

  update rooms
  set wait_used = true, interrupter_id = v_uid, interrupt_ends_at = now() + interval '3 minutes',
      paused_remaining = turn_ends_at - now()
  where id = p_room;
  perform _sys(p_room, format('잠깐!!! %s 님이 3분간 끼어듭니다.', _nick(v_uid)));
end $$;

create or replace function public.use_block(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r rooms; v_side text;
begin
  select * into r from rooms where id = p_room for update;
  if not found or r.status <> 'live' or r.muted then raise exception '지금은 아이템을 쓸 수 없습니다.'; end if;
  if r.interrupter_id is null or r.interrupt_ends_at <= now() then raise exception '무효로 만들 잠깐!!! 이 없습니다.'; end if;
  if r.block_used then raise exception '이번 발언에서는 이미 방.해.금.지 가 쓰였습니다.'; end if;
  select side into v_side from room_members where room_id = p_room and user_id = v_uid and not kicked;
  if v_side is distinct from r.current_side then raise exception '발언 중인 팀만 쓸 수 있습니다.'; end if;

  update inventory set qty = qty - 1 where user_id = v_uid and item = 'block' and qty > 0;
  if not found then raise exception '방.해.금.지 아이템이 없습니다. 상점에서 구매하세요.'; end if;

  update rooms set block_used = true where id = p_room;
  perform _resume(p_room, format('방.해.금.지! %s 님이 잠깐!!! 을 무효로 만들었습니다.', _nick(v_uid)));
end $$;

create or replace function public.end_interrupt(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  select * into r from rooms where id = p_room for update;
  -- NULL 끼리 비교가 통과하지 않도록 진행 중인 끼어들기를 명시적으로 확인한다
  if not found or r.status <> 'live' or r.interrupter_id is null or r.interrupter_id <> auth.uid() then
    raise exception '끼어든 사람만 끝낼 수 있습니다.';
  end if;
  perform _resume(p_room, format('%s 님이 잠깐!!! 을 일찍 끝냈습니다.', _nick(auth.uid())));
end $$;

create or replace function public.kick_member(p_room uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); me room_members; target room_members; r rooms;
begin
  select * into r from rooms where id = p_room for update;
  select * into target from room_members where room_id = p_room and user_id = p_user;
  if not found or target.kicked then raise exception '내보낼 참여자가 없습니다.'; end if;
  if not is_admin() then
    select * into me from room_members where room_id = p_room and user_id = v_uid;
    if not found or not me.is_leader or me.kicked or me.side <> target.side then
      raise exception '팀장만 자기 팀원을 내보낼 수 있습니다.';
    end if;
    if p_user = v_uid then raise exception '자기 자신은 내보낼 수 없습니다.'; end if;
  end if;

  update room_members set kicked = true, is_leader = false where room_id = p_room and user_id = p_user;
  if target.is_leader then
    update room_members set is_leader = true
    where room_id = p_room and user_id = (
      select user_id from room_members where room_id = p_room and side = target.side and not kicked
      order by joined_at limit 1);
  end if;
  if r.speaker_id = p_user then
    update rooms set speaker_id = _pick_speaker(p_room, target.side) where id = p_room;
  end if;
  perform _sys(p_room, format('%s 님이 방에서 내보내졌습니다.', _nick(p_user)));
  if r.interrupter_id = p_user then
    perform _resume(p_room, '끼어든 사람이 내보내져 원래 발언자가 이어서 말합니다.');
  end if;
end $$;

create or replace function public.admin_set_muted(p_room uuid, p_muted boolean) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms; v_gap interval;
begin
  if not is_admin() then raise exception '관리자만 할 수 있습니다.'; end if;
  select * into r from rooms where id = p_room for update;
  if r.muted = p_muted then return; end if;
  if p_muted then
    update rooms set muted = true, muted_at = now() where id = p_room;
    perform _sys(p_room, '관리자가 이 방의 발언을 멈췄습니다.');
  else
    -- 멈춘 동안 흐른 시간만큼 타이머를 뒤로 민다
    v_gap := now() - r.muted_at;
    update rooms
    set muted = false, muted_at = null,
        turn_starts_at = turn_starts_at + v_gap, turn_ends_at = turn_ends_at + v_gap,
        interrupt_ends_at = interrupt_ends_at + v_gap
    where id = p_room;
    perform _sys(p_room, '관리자가 발언 정지를 풀었습니다.');
  end if;
end $$;

create or replace function public.admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception '관리자만 할 수 있습니다.'; end if;
  if p_user = auth.uid() then raise exception '자기 등급은 바꿀 수 없습니다.'; end if;
  update profiles set role = p_role where id = p_user;
end $$;

-- ───────────────────────── payments ─────────────────────────
create or replace function public.create_order(p_item text, p_qty int)
returns table (order_id text, amount int)
language plpgsql security definer set search_path = public as $$
declare v_order text := 'ORD_' || replace(gen_random_uuid()::text, '-', ''); v_amount int;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if p_item not in ('wait','block') or p_qty not between 1 and 10 then raise exception '잘못된 주문입니다.'; end if;
  v_amount := p_qty * 1000; -- 가격은 서버에서만 정한다
  insert into payments (order_id, user_id, item, qty, amount) values (v_order, auth.uid(), p_item, p_qty, v_amount);
  return query select v_order, v_amount;
end $$;

-- 토스 승인 성공 후 서버(service_role)만 호출한다
create or replace function public.complete_order(p_order text, p_payment_key text) returns void
language plpgsql security definer set search_path = public as $$
declare p payments;
begin
  update payments set status = 'done', payment_key = p_payment_key
  where order_id = p_order and status = 'pending' returning * into p;
  if not found then return; end if; -- 이미 처리된 주문: 아이템을 두 번 주지 않는다
  insert into inventory (user_id, item, qty) values (p.user_id, p.item, p.qty)
  on conflict (user_id, item) do update set qty = inventory.qty + excluded.qty;
end $$;

-- ───────────────────────── grants ─────────────────────────
revoke execute on function public._pick_speaker, public._sys, public._nick, public._side_name,
  public._resume, public._next_turn, public.handle_new_user, public.complete_order
  from public, anon, authenticated;
grant execute on function public.complete_order to service_role;
-- 토론·결제·관리 함수는 로그인한 사용자만 부를 수 있다
revoke execute on function public.join_room, public.start_debate, public.tick_room, public.send_message,
  public.use_wait, public.use_block, public.end_interrupt, public.kick_member,
  public.admin_set_muted, public.admin_set_role, public.create_order
  from public, anon;
grant execute on function public.join_room, public.start_debate, public.tick_room, public.send_message,
  public.use_wait, public.use_block, public.end_interrupt, public.kick_member,
  public.admin_set_muted, public.admin_set_role, public.create_order
  to authenticated;

-- 테이블 접근 권한은 grants.sql 에 있다. 이 파일 다음에 실행한다.

-- ───────────────────────── realtime ─────────────────────────
alter publication supabase_realtime add table public.rooms, public.room_members, public.messages, public.votes;

-- ───────────────────────── storage ─────────────────────────
insert into storage.buckets (id, name, public) values ('topic-images', 'topic-images', true)
on conflict (id) do nothing;
create policy "topic images upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'topic-images' and (storage.foldername(name))[1] = auth.uid()::text);

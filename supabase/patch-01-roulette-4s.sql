-- 룰렛을 2초로 줄이면서 첫 발언 대기 시간을 7초에서 4초로 줄인다. SQL Editor 에서 한 번 실행.
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

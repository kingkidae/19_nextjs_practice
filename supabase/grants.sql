-- 테이블 접근 권한. 새 테이블을 Data API 에 자동 공개하지 않는 Supabase 프로젝트에서 필요하다.
-- 실제로 무엇을 읽고 쓸 수 있는지는 RLS 정책이 정한다. 여기서는 문만 열어 준다.

grant usage on schema public to anon, authenticated, service_role;

grant select on public.profiles, public.topics, public.topic_stats, public.rooms, public.room_members,
  public.messages, public.votes, public.notices, public.topic_cards
  to anon, authenticated;

grant select on public.inventory, public.payments to authenticated;
grant insert on public.topics, public.rooms, public.votes, public.topic_stats, public.notices to authenticated;
grant update on public.topics, public.topic_stats, public.notices to authenticated;
grant delete on public.topics, public.rooms, public.messages, public.topic_stats, public.notices to authenticated;

-- 프로필은 닉네임과 사진만 고칠 수 있다. role 변경은 admin_set_role() 로만.
revoke update on public.profiles from anon, authenticated;
grant update (nickname, avatar_url) on public.profiles to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- 프로필(아바타·소개·개인정보), 첫 로그인 안내, 사이트 설정. SQL Editor 에서 한 번 실행.

-- ── 공개 프로필 항목 ──
alter table public.profiles
  add column if not exists bio text not null default '' check (char_length(bio) <= 160),
  add column if not exists onboarded boolean not null default false;

grant update (nickname, avatar_url, bio, onboarded) on public.profiles to authenticated;

-- ── 비공개 개인정보: 본인만 읽고 쓴다 ──
create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles on delete cascade default auth.uid(),
  birth_year int check (birth_year between 1900 and 2030),
  gender text check (gender in ('female', 'male', 'other', 'private')),
  region text check (char_length(region) <= 30),
  interests text[] not null default '{}' check (interests <@ array[
    'politics','economy','society','culture','world','local','sports','tech','entertainment']::text[]),
  updated_at timestamptz not null default now()
);
alter table public.profile_private enable row level security;
drop policy if exists "private own read" on public.profile_private;
drop policy if exists "private own write" on public.profile_private;
create policy "private own read" on public.profile_private for select using (user_id = auth.uid());
create policy "private own write" on public.profile_private for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.profile_private to authenticated;
grant all on public.profile_private to service_role;

-- ── 아바타 저장소: 누구나 보고, 본인 폴더에만 올린다 ──
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
drop policy if exists "avatar upload" on storage.objects;
drop policy if exists "avatar update" on storage.objects;
drop policy if exists "avatar delete" on storage.objects;
create policy "avatar upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 사이트 설정: 관리자가 링크 주소 등을 바꾼다 ──
create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  value text not null default '' check (char_length(value) <= 500),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "settings read" on public.site_settings;
drop policy if exists "settings admin write" on public.site_settings;
create policy "settings read" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;

insert into public.site_settings (key, value) values
  ('site_url', 'http://localhost:3000'),
  ('terms_url', '/terms'),
  ('privacy_url', '/privacy'),
  ('contact_email', ''),
  ('instagram_url', ''),
  ('x_url', ''),
  ('youtube_url', '')
on conflict (key) do nothing;

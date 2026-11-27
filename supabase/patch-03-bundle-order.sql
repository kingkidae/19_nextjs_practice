-- 잠깐!!! 과 방.해.금.지 를 한 번에 사는 묶음 주문. SQL Editor 에서 한 번 실행.

-- ── 주문에 아이템별 수량 칸 추가 ──
alter table public.payments
  add column if not exists wait_qty int not null default 0,
  add column if not exists block_qty int not null default 0;

-- 기존 한 종류 주문을 새 칸으로 옮긴다
update public.payments
set wait_qty = case when item = 'wait' then qty else 0 end,
    block_qty = case when item = 'block' then qty else 0 end
where wait_qty = 0 and block_qty = 0;

-- item/qty 는 예전 주문 기록용으로만 남긴다
alter table public.payments alter column item drop not null;
alter table public.payments alter column qty drop not null;
alter table public.payments drop constraint if exists payments_qty_check;
alter table public.payments drop constraint if exists payments_bundle_check;
alter table public.payments add constraint payments_bundle_check
  check (wait_qty between 0 and 10 and block_qty between 0 and 10 and wait_qty + block_qty >= 1);

-- ── 묶음 주문 만들기: 금액은 서버에서만 정한다 ──
create or replace function public.create_bundle_order(p_wait int, p_block int)
returns table (order_id text, amount int)
language plpgsql security definer set search_path = public as $$
declare v_order text := 'ORD_' || replace(gen_random_uuid()::text, '-', ''); v_amount int;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if p_wait not between 0 and 10 or p_block not between 0 and 10 or p_wait + p_block < 1 then
    raise exception '아이템은 종류별로 0~10개, 합쳐서 1개 이상 고르세요.';
  end if;
  v_amount := (p_wait + p_block) * 1000;
  insert into payments (order_id, user_id, wait_qty, block_qty, amount)
  values (v_order, auth.uid(), p_wait, p_block, v_amount);
  return query select v_order, v_amount;
end $$;

-- 예전 화면(한 종류 주문)이 남아 있어도 동작하도록 같은 저장 방식으로 바꿔 둔다
create or replace function public.create_order(p_item text, p_qty int)
returns table (order_id text, amount int)
language plpgsql security definer set search_path = public as $$
begin
  if p_item not in ('wait','block') then raise exception '잘못된 주문입니다.'; end if;
  return query select * from public.create_bundle_order(
    case when p_item = 'wait' then p_qty else 0 end,
    case when p_item = 'block' then p_qty else 0 end);
end $$;

-- ── 결제 승인 후 두 아이템을 한꺼번에 지급 (service_role 전용) ──
create or replace function public.complete_order(p_order text, p_payment_key text) returns void
language plpgsql security definer set search_path = public as $$
declare p payments;
begin
  update payments set status = 'done', payment_key = p_payment_key
  where order_id = p_order and status = 'pending' returning * into p;
  if not found then return; end if; -- 이미 처리된 주문: 두 번 지급하지 않는다
  if p.wait_qty > 0 then
    insert into inventory (user_id, item, qty) values (p.user_id, 'wait', p.wait_qty)
    on conflict (user_id, item) do update set qty = inventory.qty + excluded.qty;
  end if;
  if p.block_qty > 0 then
    insert into inventory (user_id, item, qty) values (p.user_id, 'block', p.block_qty)
    on conflict (user_id, item) do update set qty = inventory.qty + excluded.qty;
  end if;
end $$;

revoke execute on function public.create_bundle_order from public, anon;
grant execute on function public.create_bundle_order to authenticated;
revoke execute on function public.complete_order from public, anon, authenticated;
grant execute on function public.complete_order to service_role;

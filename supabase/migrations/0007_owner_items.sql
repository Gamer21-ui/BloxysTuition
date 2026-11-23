-- Owner-exclusive cosmetics: never sold, hidden from students, automatically available to the tutor.
alter table shop_items add column if not exists tutor_only boolean not null default false;

drop policy if exists shop_select on shop_items;
create policy shop_select on shop_items for select using (
  is_approved() and ((active and not tutor_only) or is_tutor()));

create or replace function buy_item(p_item uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype; prof profiles%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into it from shop_items where id = p_item and active and not tutor_only;
  if not found then raise exception 'item not available'; end if;
  select * into prof from profiles where id = auth.uid() for update;
  if level_from_xp(prof.xp) < it.min_level then raise exception 'reach level % to unlock this', it.min_level; end if;
  if prof.coins < it.price then raise exception 'not enough coins'; end if;
  if it.kind = 'streak_freeze' then
    if prof.streak_freezes >= 2 then raise exception 'you can only hold 2 streak freezes'; end if;
    update profiles set coins = coins - it.price, streak_freezes = streak_freezes + 1 where id = prof.id;
  else
    if exists (select 1 from user_items where user_id = prof.id and item_id = it.id) then raise exception 'you already own this'; end if;
    insert into user_items(user_id, item_id) values (prof.id, it.id);
    update profiles set coins = coins - it.price where id = prof.id;
  end if;
  insert into xp_events(user_id, amount, coins, reason, ref) values (prof.id, 0, -it.price, 'shop', it.code);
  return jsonb_build_object('coins', prof.coins - it.price, 'kind', it.kind, 'code', it.code);
end $$;

create or replace function equip_item(p_kind text, p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_kind not in ('title', 'name_style', 'frame', 'hat', 'pattern') then raise exception 'bad kind'; end if;
  if p_code is not null then
    select s.* into it from shop_items s
    where s.code = p_code and s.kind = p_kind
      and ((s.tutor_only and is_tutor())
           or exists (select 1 from user_items u where u.item_id = s.id and u.user_id = auth.uid()));
    if not found then raise exception 'you do not own this'; end if;
  end if;
  if p_kind = 'title' then update profiles set title = it.data->>'text' where id = auth.uid();
  elsif p_kind = 'name_style' then update profiles set name_style = p_code where id = auth.uid();
  elsif p_kind = 'frame' then update profiles set frame = p_code where id = auth.uid();
  elsif p_kind = 'hat' then update profiles set blocky = blocky || jsonb_build_object('hat', coalesce(p_code, 'none')) where id = auth.uid();
  elsif p_kind = 'pattern' then update profiles set blocky = blocky || jsonb_build_object('pattern', coalesce(p_code, 'none')) where id = auth.uid();
  end if;
end $$;

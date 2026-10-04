-- Keep data valid even when an administrator uses SQL rather than the application RPC.
create or replace function public.validate_selection_session()
returns trigger language plpgsql set search_path = '' as $$
declare v_block uuid; v_event uuid; v_selection_event uuid;
begin
  select s.block_id, s.event_id into v_block, v_event from public.sessions s where s.id = new.session_id;
  select b.event_id into v_selection_event from public.blocks b where b.id = new.block_id;
  if v_block is null or v_block <> new.block_id or v_event <> v_selection_event then
    raise exception 'SESSION_BLOCK_MISMATCH' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger student_selection_matches_session_block
  before insert or update of block_id, session_id on public.student_selections
  for each row execute function public.validate_selection_session();

create or replace function public.select_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_target public.sessions%rowtype; v_old public.student_selections%rowtype;
  v_event public.events%rowtype; v_normal integer; v_large integer; v_normal_rooms integer;
  v_large_rooms integer; v_count integer; v_claim uuid; v_result text;
begin
  perform public.ensure_student_profile();
  -- Read the target first only to discover its block. The actual row locks below are
  -- acquired by UUID order, avoiding A→B / B→A switching deadlocks.
  select * into v_target from public.sessions where id = p_session_id and active;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001'; end if;
  select * into v_old from public.student_selections where student_id = v_user and block_id = v_target.block_id for update;
  if found and v_old.session_id = p_session_id then return jsonb_build_object('code','OK','idempotent',true); end if;
  perform 1 from public.sessions s
    where s.id = p_session_id or (found and s.id = v_old.session_id)
    order by s.id for update;
  select * into v_target from public.sessions where id = p_session_id and active;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001'; end if;
  select * into v_event from public.events where id = v_target.event_id for share;
  v_result := public.registration_state(v_event.id);
  if v_result is distinct from 'OPEN' then raise exception '%', coalesce(v_result,'EVENT_NOT_FOUND') using errcode = 'P0001'; end if;
  insert into public.block_large_room_claims(block_id) values(v_target.block_id) on conflict(block_id) do nothing;
  -- This lock serializes capacity decisions for just one block, including the S→S+1 race.
  select winning_session_id into v_claim from public.block_large_room_claims where block_id = v_target.block_id for update;
  select min(capacity) filter(where not is_large_room), max(capacity) filter(where is_large_room),
    count(*) filter(where not is_large_room), count(*) filter(where is_large_room)
    into v_normal, v_large, v_normal_rooms, v_large_rooms
  from public.rooms where event_id = v_event.id and active;
  if v_normal is null or v_large is null or v_large <= v_normal or v_normal_rooms <> 4 or v_large_rooms <> 1
    or exists(select 1 from public.rooms r where r.event_id=v_event.id and r.active and not r.is_large_room and r.capacity<>v_normal) then
    raise exception 'EVENT_CONFIGURATION_INVALID' using errcode = 'P0001';
  end if;
  select count(*) into v_count from public.student_selections where session_id = v_target.id;
  if v_claim = v_target.id then
    if v_count >= v_large then raise exception 'SWITCH_TARGET_FULL' using errcode = 'P0001'; end if;
  elsif v_claim is not null then
    if v_count >= v_normal then raise exception 'SWITCH_TARGET_FULL' using errcode = 'P0001'; end if;
  elsif v_count < v_normal then null;
  elsif v_count = v_normal then
    update public.block_large_room_claims set winning_session_id=v_target.id, claimed_at=now() where block_id=v_target.block_id;
  else raise exception 'SESSION_FULL' using errcode = 'P0001'; end if;
  insert into public.student_selections(student_id,block_id,session_id) values(v_user,v_target.block_id,v_target.id)
    on conflict(student_id,block_id) do update set session_id=excluded.session_id, updated_at=now();
  return jsonb_build_object('code','OK','idempotent',false);
end $$;

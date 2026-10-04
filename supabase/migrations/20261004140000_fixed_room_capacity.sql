-- Every session has a room before registration; that room's capacity is authoritative.
drop function public.session_availability(uuid);
drop table public.block_large_room_claims;
drop index public.one_large_active_room;
alter table public.rooms drop column is_large_room;
alter table public.sessions rename column final_room_id to room_id;
alter table public.sessions alter column room_id set not null;

-- A block, room and session must belong to the same event.
alter table public.blocks add constraint blocks_id_event_id_key unique(id,event_id);
alter table public.rooms add constraint rooms_id_event_id_key unique(id,event_id);
alter table public.sessions add constraint sessions_block_event_fkey
  foreign key(block_id,event_id) references public.blocks(id,event_id) on delete cascade;
alter table public.sessions add constraint sessions_room_event_fkey
  foreign key(room_id,event_id) references public.rooms(id,event_id) on delete restrict;

create or replace function public.event_registration_ready(p_event_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    (select count(*)=4 from public.blocks b where b.event_id=p_event_id)
    and (select count(*)=5 from public.rooms r where r.event_id=p_event_id and r.active)
    and (select count(*)=20 from public.sessions s where s.event_id=p_event_id and s.active)
    and not exists(
      select 1 from public.blocks b
      left join public.sessions s on s.block_id=b.id and s.active
      where b.event_id=p_event_id group by b.id having count(s.id)<>5
    )
    and not exists(
      select 1 from public.sessions s
      join public.rooms r on r.id=s.room_id
      where s.event_id=p_event_id and s.active and (not r.active or r.capacity<=0 or r.event_id<>s.event_id)
    )
    and not exists(
      select 1 from public.sessions s
      where s.event_id=p_event_id and s.active group by s.block_id,s.room_id having count(*)>1
    )
$$;

create or replace function public.require_event_registration_ready()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.registration_open_at is not null and not public.event_registration_ready(new.id) then
    raise exception 'EVENT_CONFIGURATION_INVALID' using errcode='P0001';
  end if;
  return new;
end $$;
create trigger event_must_be_ready_before_registration
  before insert or update of registration_open_at on public.events
  for each row when (new.registration_open_at is not null)
  execute function public.require_event_registration_ready();

create or replace function public.select_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid:=auth.uid(); v_target public.sessions%rowtype; v_old public.student_selections%rowtype;
  v_event public.events%rowtype; v_room public.rooms%rowtype; v_count integer; v_result text;
  v_had_old boolean:=false;
begin
  perform public.ensure_student_profile();
  select * into v_target from public.sessions where id=p_session_id and active;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode='P0001'; end if;
  select * into v_old from public.student_selections where student_id=v_user and block_id=v_target.block_id for update;
  v_had_old:=found;
  if v_had_old and v_old.session_id=p_session_id then return jsonb_build_object('code','OK','idempotent',true); end if;

  -- Every selection touching a session obtains these locks by UUID order. This
  -- serializes capacity decisions for the target without a global/block lock.
  perform 1 from public.sessions s
    where s.id=p_session_id or (v_had_old and s.id=v_old.session_id)
    order by s.id for update;
  select * into v_target from public.sessions where id=p_session_id and active;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode='P0001'; end if;
  select * into v_event from public.events where id=v_target.event_id for share;
  v_result:=public.registration_state(v_event.id);
  if v_result is distinct from 'OPEN' then raise exception '%',coalesce(v_result,'EVENT_NOT_FOUND') using errcode='P0001'; end if;
  if not public.event_registration_ready(v_event.id) then raise exception 'EVENT_CONFIGURATION_INVALID' using errcode='P0001'; end if;
  select * into v_room from public.rooms where id=v_target.room_id and event_id=v_target.event_id and active for share;
  if not found or v_room.capacity<=0 then raise exception 'EVENT_CONFIGURATION_INVALID' using errcode='P0001'; end if;
  select count(*) into v_count from public.student_selections where session_id=v_target.id;
  if v_count>=v_room.capacity then
    if v_had_old then raise exception 'SWITCH_TARGET_FULL' using errcode='P0001';
    else raise exception 'SESSION_FULL' using errcode='P0001'; end if;
  end if;
  insert into public.student_selections(student_id,block_id,session_id) values(v_user,v_target.block_id,v_target.id)
    on conflict(student_id,block_id) do update set session_id=excluded.session_id,updated_at=now();
  return jsonb_build_object('code','OK','idempotent',false);
end $$;

create function public.session_availability(p_event_id uuid)
returns table(session_id uuid,block_id uuid,registrations integer,capacity integer,room_number text)
language sql stable security definer set search_path = '' as $$
  select s.id,s.block_id,count(ss.student_id)::integer,r.capacity,r.room_number
  from public.sessions s
  join public.rooms r on r.id=s.room_id and r.active
  left join public.student_selections ss on ss.session_id=s.id
  where s.event_id=p_event_id and s.active
  group by s.id,s.block_id,r.capacity,r.room_number
$$;
revoke all on function public.event_registration_ready(uuid),public.session_availability(uuid) from public;
grant execute on function public.event_registration_ready(uuid),public.session_availability(uuid) to authenticated;

drop policy "public rooms after schedule" on public.rooms;
create policy "public rooms after site publication" on public.rooms for select using(
  public.is_admin() or exists(select 1 from public.events e where e.id=event_id and e.site_public_at<=now())
);

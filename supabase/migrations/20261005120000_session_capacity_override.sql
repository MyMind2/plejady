alter table public.sessions
  add column capacity_override integer,
  add constraint sessions_capacity_override_positive
    check(capacity_override is null or capacity_override > 0);

-- Rooms provide the normal capacity. Only genuine per-session exceptions use
-- capacity_override.
update public.rooms set capacity=80;

update public.sessions s
set capacity_override=40
from public.blocks b, public.rooms r, public.lectures l, public.lecturers lecturer
where s.block_id=b.id
  and s.room_id=r.id
  and s.lecture_id=l.id
  and l.lecturer_id=lecturer.id
  and s.active
  and b.display_order=1
  and r.room_number='102'
  and lecturer.name='Přemek Štenc';

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
      where s.event_id=p_event_id
        and s.active
        and (not r.active or coalesce(s.capacity_override,r.capacity)<=0 or r.event_id<>s.event_id)
    )
    and not exists(
      select 1 from public.sessions s
      where s.event_id=p_event_id and s.active group by s.block_id,s.room_id having count(*)>1
    )
$$;

create or replace function public.select_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid:=auth.uid(); v_target public.sessions%rowtype; v_old public.student_selections%rowtype;
  v_event public.events%rowtype; v_room public.rooms%rowtype; v_count integer; v_result text;
  v_effective_capacity integer; v_had_old boolean:=false;
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
  if not found then raise exception 'EVENT_CONFIGURATION_INVALID' using errcode='P0001'; end if;
  v_effective_capacity:=coalesce(v_target.capacity_override,v_room.capacity);
  if v_effective_capacity<=0 then raise exception 'EVENT_CONFIGURATION_INVALID' using errcode='P0001'; end if;
  select count(*) into v_count from public.student_selections where session_id=v_target.id;
  if v_count>=v_effective_capacity then
    if v_had_old then raise exception 'SWITCH_TARGET_FULL' using errcode='P0001';
    else raise exception 'SESSION_FULL' using errcode='P0001'; end if;
  end if;
  insert into public.student_selections(student_id,block_id,session_id) values(v_user,v_target.block_id,v_target.id)
    on conflict(student_id,block_id) do update set session_id=excluded.session_id,updated_at=now();
  return jsonb_build_object('code','OK','idempotent',false);
end $$;

create or replace function public.session_availability(p_event_id uuid)
returns table(session_id uuid,block_id uuid,registrations integer,capacity integer,room_number text)
language sql stable security definer set search_path = '' as $$
  select s.id,s.block_id,count(ss.student_id)::integer,
    coalesce(s.capacity_override,r.capacity)::integer,r.room_number
  from public.sessions s
  join public.rooms r on r.id=s.room_id and r.active
  left join public.student_selections ss on ss.session_id=s.id
  where s.event_id=p_event_id and s.active
  group by s.id,s.block_id,s.capacity_override,r.capacity,r.room_number
$$;

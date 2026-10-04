-- Guest registration belongs to the single event whose registration window is
-- currently open. Anonymous callers do not need read access to public.events.
drop function public.register_guest(uuid,text,text);

create function public.register_guest(p_full_name text,p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text:=btrim(p_full_name);
  v_email text:=lower(btrim(p_email));
  v_event_ids uuid[];
  v_event_id uuid;
  v_limit integer;
  v_count integer;
begin
  if v_name is null or char_length(v_name) not between 2 and 160 or v_name ~ '[[:cntrl:]]' then
    raise exception 'INVALID_GUEST_NAME' using errcode='P0001';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL' using errcode='P0001';
  end if;

  -- Lock every currently eligible event before deciding. The application
  -- expects exactly one; zero or multiple matches fail without guessing.
  select array_agg(eligible.id order by eligible.id)
  into v_event_ids
  from (
    select e.id
    from public.events e
    where e.registration_open_at is not null
      and e.registration_open_at<=now()
      and (e.registration_close_at is null or e.registration_close_at>now())
    order by e.id
    for update
  ) eligible;

  if coalesce(cardinality(v_event_ids),0)=0 then
    raise exception 'GUEST_REGISTRATION_NOT_OPEN' using errcode='P0001';
  end if;
  if cardinality(v_event_ids)>1 then
    raise exception 'GUEST_EVENT_AMBIGUOUS' using errcode='P0001';
  end if;

  v_event_id:=v_event_ids[1];
  select e.guest_limit into strict v_limit from public.events e where e.id=v_event_id;

  -- The eligible event row remains locked through duplicate/capacity checks
  -- and insertion, preserving the existing concurrency guarantee.
  if exists(select 1 from public.guests where event_id=v_event_id and normalized_email=v_email) then
    raise exception 'GUEST_DUPLICATE' using errcode='P0001';
  end if;
  select count(*) into v_count from public.guests where event_id=v_event_id and status='active';
  if v_count>=v_limit then raise exception 'GUEST_LIMIT_REACHED' using errcode='P0001'; end if;

  insert into public.guests(event_id,full_name,normalized_email,display_email)
  values(v_event_id,v_name,v_email,btrim(p_email));
  return jsonb_build_object('code','OK');
end $$;

revoke all on function public.register_guest(text,text) from public;
grant execute on function public.register_guest(text,text) to anon,authenticated;

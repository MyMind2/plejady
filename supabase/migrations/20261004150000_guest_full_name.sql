-- Guests register without an account through this concurrency-safe RPC only.
alter table public.guests add column full_name text;

-- Preserve any registrations created before this migration. Administrators can
-- replace this marker if such rows exist in a deployed database.
update public.guests set full_name='Neuvedeno' where full_name is null;

alter table public.guests alter column full_name set not null;
alter table public.guests add constraint guests_full_name_valid check(
  full_name=btrim(full_name)
  and char_length(full_name) between 2 and 160
  and full_name !~ '[[:cntrl:]]'
);

drop function public.register_guest(uuid,text);

create function public.register_guest(p_event_id uuid,p_full_name text,p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text:=btrim(p_full_name);
  v_email text:=lower(btrim(p_email));
  v_limit integer;
  v_count integer;
begin
  if v_name is null or char_length(v_name) not between 2 and 160 or v_name ~ '[[:cntrl:]]' then
    raise exception 'INVALID_GUEST_NAME' using errcode='P0001';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL' using errcode='P0001';
  end if;

  -- This event-row lock serializes capacity and duplicate decisions. It keeps
  -- count + insert atomic without granting anonymous table access.
  select guest_limit into v_limit from public.events where id=p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND' using errcode='P0001'; end if;
  if exists(select 1 from public.guests where event_id=p_event_id and normalized_email=v_email) then
    raise exception 'GUEST_DUPLICATE' using errcode='P0001';
  end if;
  select count(*) into v_count from public.guests where event_id=p_event_id and status='active';
  if v_count>=v_limit then raise exception 'GUEST_LIMIT_REACHED' using errcode='P0001'; end if;

  insert into public.guests(event_id,full_name,normalized_email,display_email)
  values(p_event_id,v_name,v_email,btrim(p_email));
  return jsonb_build_object('code','OK');
end $$;

revoke all on function public.register_guest(uuid,text,text) from public;
grant execute on function public.register_guest(uuid,text,text) to anon,authenticated;

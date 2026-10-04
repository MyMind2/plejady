-- Guest registration is intentionally on-screen only. No delivery provider or email job exists.
alter table public.guests drop column confirmation_email_status;
drop type public.email_status;

create or replace function public.register_guest(p_event_id uuid,p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text:=lower(trim(p_email)); v_limit integer; v_count integer;
begin
 if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'INVALID_EMAIL' using errcode='P0001'; end if;
 select guest_limit into v_limit from public.events where id=p_event_id for update; if not found then raise exception 'EVENT_NOT_FOUND' using errcode='P0001'; end if;
 if exists(select 1 from public.guests where event_id=p_event_id and normalized_email=v_email) then raise exception 'GUEST_DUPLICATE' using errcode='P0001'; end if;
 select count(*) into v_count from public.guests where event_id=p_event_id and status='active'; if v_count>=v_limit then raise exception 'GUEST_LIMIT_REACHED' using errcode='P0001'; end if;
 insert into public.guests(event_id,normalized_email,display_email) values(p_event_id,v_email,trim(p_email));
 return jsonb_build_object('code','OK');
end $$;

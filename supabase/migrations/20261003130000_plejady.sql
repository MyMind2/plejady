create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'admin', 'owner');
create type public.guest_status as enum ('active', 'cancelled');
create type public.email_status as enum ('not_configured', 'pending', 'sent', 'failed');

create table public.events (
  id uuid primary key default gen_random_uuid(), name text not null, event_date date not null,
  timezone text not null default 'Europe/Prague' check (timezone = 'Europe/Prague'),
  site_public_at timestamptz, registration_open_at timestamptz, registration_close_at timestamptz,
  schedule_published_at timestamptz, guest_limit integer not null default 30 check (guest_limit between 0 and 500),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (registration_close_at is null or registration_open_at is null or registration_close_at > registration_open_at)
);
create table public.blocks (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade, display_order smallint not null check(display_order between 1 and 4), start_time time not null, end_time time not null, unique(event_id, display_order), check(end_time > start_time));
create table public.rooms (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade, room_number text not null, capacity integer not null check(capacity > 0), is_large_room boolean not null default false, active boolean not null default true, unique(event_id, room_number));
create unique index one_large_active_room on public.rooms(event_id) where active and is_large_room;
create table public.lecturers (id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 160), short_bio text not null default '', photo_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.lectures (id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 2 and 220), annotation text not null default '', lecturer_id uuid not null references public.lecturers on delete restrict);
create table public.sessions (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade, lecture_id uuid not null references public.lectures on delete restrict, block_id uuid not null references public.blocks on delete cascade, final_room_id uuid references public.rooms on delete restrict, active boolean not null default true, unique(block_id, lecture_id));
create unique index one_session_room_per_block on public.sessions(block_id, final_room_id) where final_room_id is not null and active;
create table public.block_large_room_claims (block_id uuid primary key references public.blocks on delete cascade, winning_session_id uuid unique references public.sessions on delete restrict, claimed_at timestamptz);
create table public.student_profiles (user_id uuid primary key references auth.users on delete cascade, email text not null unique, display_name text not null default '', created_at timestamptz not null default now(), check(email = lower(email)));
create table public.student_selections (student_id uuid not null references public.student_profiles(user_id) on delete cascade, block_id uuid not null references public.blocks on delete cascade, session_id uuid not null references public.sessions on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(student_id, block_id));
create index student_selections_session_idx on public.student_selections(session_id);
create table public.guests (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade, normalized_email text not null, display_email text not null, status public.guest_status not null default 'active', confirmation_email_status public.email_status not null default 'not_configured', created_at timestamptz not null default now(), unique(event_id, normalized_email));
create table public.user_roles (user_id uuid primary key references auth.users on delete cascade, role public.app_role not null default 'student', granted_by uuid references auth.users, created_at timestamptz not null default now());
create table public.audit_log (id bigint generated always as identity primary key, actor_id uuid references auth.users, action text not null, entity_type text not null, entity_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now());

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','owner')) $$;
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.user_roles where user_id = auth.uid() and role = 'owner') $$;
create or replace function public.registration_state(p_event_id uuid, p_now timestamptz default now()) returns text language sql stable security definer set search_path = '' as $$ select case when e.registration_open_at is null or p_now < e.registration_open_at then 'REGISTRATION_NOT_OPEN' when e.registration_close_at is not null and p_now >= e.registration_close_at then 'REGISTRATION_CLOSED' else 'OPEN' end from public.events e where e.id=p_event_id $$;

create or replace function public.ensure_student_profile() returns void language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='P0001'; end if;
  if split_part(v_email,'@',2) <> 'student.alej.cz' or split_part(v_email,'@',1)='' or split_part(v_email,'@',3)<>'' then raise exception 'INVALID_STUDENT_DOMAIN' using errcode='P0001'; end if;
  insert into public.student_profiles(user_id,email,display_name) values(auth.uid(),v_email,coalesce(auth.jwt()->'user_metadata'->>'full_name',split_part(v_email,'@',1))) on conflict(user_id) do update set email=excluded.email;
  insert into public.user_roles(user_id,role) values(auth.uid(),'student') on conflict(user_id) do nothing;
end $$;

create or replace function public.select_session(p_session_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_target public.sessions%rowtype; v_old public.student_selections%rowtype; v_event public.events%rowtype; v_normal integer; v_large integer; v_count integer; v_claim uuid; v_result text;
begin
  perform public.ensure_student_profile();
  select * into v_target from public.sessions where id=p_session_id and active for update;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode='P0001'; end if;
  select * into v_event from public.events where id=v_target.event_id for share;
  v_result:=public.registration_state(v_event.id); if v_result <> 'OPEN' then raise exception '%',v_result using errcode='P0001'; end if;
  select * into v_old from public.student_selections where student_id=v_user and block_id=v_target.block_id for update;
  if found and v_old.session_id=p_session_id then return jsonb_build_object('code','OK','idempotent',true); end if;
  -- Deterministic target/current locking and one block-state lock protect the S→S+1 race.
  if found then perform 1 from public.sessions where id=v_old.session_id and id<>v_target.id for update; end if;
  insert into public.block_large_room_claims(block_id) values(v_target.block_id) on conflict(block_id) do nothing;
  select winning_session_id into v_claim from public.block_large_room_claims where block_id=v_target.block_id for update;
  select min(capacity) filter(where not is_large_room), max(capacity) filter(where is_large_room) into v_normal,v_large from public.rooms where event_id=v_event.id and active;
  if v_normal is null or v_large is null or v_large<=v_normal then raise exception 'EVENT_CONFIGURATION_INVALID' using errcode='P0001'; end if;
  -- The locked claim row serializes only this block while capacity is evaluated.
  select count(*) into v_count from public.student_selections where session_id=v_target.id;
  if v_claim=v_target.id then
    if v_count>=v_large then raise exception 'SWITCH_TARGET_FULL' using errcode='P0001'; end if;
  elsif v_claim is not null then
    if v_count>=v_normal then raise exception 'SWITCH_TARGET_FULL' using errcode='P0001'; end if;
  elsif v_count < v_normal then null;
  elsif v_count = v_normal then
    update public.block_large_room_claims set winning_session_id=v_target.id,claimed_at=now() where block_id=v_target.block_id;
  else raise exception 'SESSION_FULL' using errcode='P0001'; end if;
  insert into public.student_selections(student_id,block_id,session_id) values(v_user,v_target.block_id,v_target.id) on conflict(student_id,block_id) do update set session_id=excluded.session_id,updated_at=now();
  return jsonb_build_object('code','OK','idempotent',false);
end $$;

create or replace function public.register_guest(p_event_id uuid,p_email text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text:=lower(trim(p_email)); v_limit integer; v_count integer;
begin
 if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'INVALID_EMAIL' using errcode='P0001'; end if;
 select guest_limit into v_limit from public.events where id=p_event_id for update; if not found then raise exception 'EVENT_NOT_FOUND' using errcode='P0001'; end if;
 if exists(select 1 from public.guests where event_id=p_event_id and normalized_email=v_email) then raise exception 'GUEST_DUPLICATE' using errcode='P0001'; end if;
 select count(*) into v_count from public.guests where event_id=p_event_id and status='active'; if v_count>=v_limit then raise exception 'GUEST_LIMIT_REACHED' using errcode='P0001'; end if;
 insert into public.guests(event_id,normalized_email,display_email,confirmation_email_status) values(p_event_id,v_email,trim(p_email),case when current_setting('request.headers',true) is null then 'not_configured'::public.email_status else 'pending'::public.email_status end);
 return jsonb_build_object('code','OK');
end $$;
create or replace function public.session_availability(p_event_id uuid) returns table(session_id uuid, block_id uuid, registrations integer, effective_capacity integer, large_room_claimed boolean) language sql stable security definer set search_path = '' as $$
  select s.id,s.block_id,count(ss.student_id)::integer,case when c.winning_session_id=s.id then max(r.capacity) filter(where r.is_large_room) else min(r.capacity) filter(where not r.is_large_room) end::integer,c.winning_session_id=s.id
  from public.sessions s left join public.student_selections ss on ss.session_id=s.id left join public.block_large_room_claims c on c.block_id=s.block_id cross join public.rooms r
  where s.event_id=p_event_id and s.active and r.event_id=p_event_id and r.active group by s.id,s.block_id,c.winning_session_id
$$;

alter table public.events enable row level security; alter table public.blocks enable row level security; alter table public.rooms enable row level security; alter table public.lecturers enable row level security; alter table public.lectures enable row level security; alter table public.sessions enable row level security; alter table public.block_large_room_claims enable row level security; alter table public.student_profiles enable row level security; alter table public.student_selections enable row level security; alter table public.guests enable row level security; alter table public.user_roles enable row level security; alter table public.audit_log enable row level security;
create policy "public event after publication" on public.events for select using(site_public_at is not null and site_public_at<=now() or public.is_admin());
create policy "public programme after publication" on public.blocks for select using(exists(select 1 from public.events e where e.id=event_id and (e.site_public_at<=now() or public.is_admin())));
create policy "public rooms after schedule" on public.rooms for select using(public.is_admin() or exists(select 1 from public.events e where e.id=event_id and e.schedule_published_at<=now()));
create policy "public lecturers" on public.lecturers for select using(true); create policy "public lectures" on public.lectures for select using(true); create policy "public sessions" on public.sessions for select using(true);
create policy "students own profile" on public.student_profiles for select using(user_id=auth.uid()); create policy "students own selections" on public.student_selections for select using(student_id=auth.uid());
create policy "admins manage data" on public.events for all using(public.is_admin()) with check(public.is_admin());
create policy "admins blocks" on public.blocks for all using(public.is_admin()) with check(public.is_admin()); create policy "admins rooms" on public.rooms for all using(public.is_admin()) with check(public.is_admin()); create policy "admins lecturers" on public.lecturers for all using(public.is_admin()) with check(public.is_admin()); create policy "admins lectures" on public.lectures for all using(public.is_admin()) with check(public.is_admin()); create policy "admins sessions" on public.sessions for all using(public.is_admin()) with check(public.is_admin()); create policy "admins claims" on public.block_large_room_claims for all using(public.is_admin()) with check(public.is_admin()); create policy "admins guests" on public.guests for all using(public.is_admin()) with check(public.is_admin()); create policy "admins roles" on public.user_roles for all using(public.is_owner()) with check(public.is_owner()); create policy "admins audit" on public.audit_log for select using(public.is_admin());
revoke all on function public.select_session(uuid),public.register_guest(uuid,text),public.ensure_student_profile(),public.session_availability(uuid) from public; grant execute on function public.select_session(uuid),public.ensure_student_profile(),public.session_availability(uuid) to authenticated; grant execute on function public.register_guest(uuid,text) to anon,authenticated;

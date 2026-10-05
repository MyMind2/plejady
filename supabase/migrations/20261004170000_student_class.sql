-- School classes are intentionally a fixed event-specific list. Existing
-- profiles remain valid with a null class until the student chooses one.
alter table public.student_profiles
  add column class_name text,
  add constraint student_profiles_class_name_valid check(
    class_name is null or class_name in (
      'Kvinta A','Sexta A','Septima A','Oktáva A',
      'Kvinta B','Sexta B','Septima B','Oktáva B',
      'Prvák','Druhák','Třeťák','Čtvrťák'
    )
  );

create function public.set_student_class(p_class_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.ensure_student_profile();

  if p_class_name is null or p_class_name not in (
    'Kvinta A','Sexta A','Septima A','Oktáva A',
    'Kvinta B','Sexta B','Septima B','Oktáva B',
    'Prvák','Druhák','Třeťák','Čtvrťák'
  ) then
    raise exception 'INVALID_CLASS' using errcode='P0001';
  end if;

  update public.student_profiles
  set class_name=p_class_name
  where user_id=auth.uid();

  if not found then raise exception 'PROFILE_NOT_FOUND' using errcode='P0001'; end if;
end $$;

create function public.require_student_class_for_selection()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(
    select 1 from public.student_profiles p
    where p.user_id=new.student_id and p.class_name is not null
  ) then
    raise exception 'CLASS_REQUIRED' using errcode='P0001';
  end if;
  return new;
end $$;

create trigger student_class_required_for_selection
  before insert or update of session_id on public.student_selections
  for each row execute function public.require_student_class_for_selection();

revoke all on function public.set_student_class(text) from public;
grant execute on function public.set_student_class(text) to authenticated;

revoke all on function public.require_student_class_for_selection() from public;

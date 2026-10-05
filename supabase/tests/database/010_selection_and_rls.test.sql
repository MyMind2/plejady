begin;
select plan(39);
select is((select count(*) from public.blocks where event_id='10000000-0000-4000-8000-000000000001'),4::bigint,'seed has exactly four blocks');
select is((select count(*) from public.sessions where event_id='10000000-0000-4000-8000-000000000001'),20::bigint,'seed has exactly twenty sessions');
select is((select min(session_count)=5 and max(session_count)=5 from (select count(*) session_count from public.sessions where event_id='10000000-0000-4000-8000-000000000001' group by block_id) counts),true,'each seeded block has five sessions');
select is((select count(*) from public.sessions where event_id='10000000-0000-4000-8000-000000000001' and room_id is not null),20::bigint,'every session has a predetermined room');
select is((select min(room_count)=5 and max(room_count)=5 from (select count(distinct room_id) room_count from public.sessions where event_id='10000000-0000-4000-8000-000000000001' and active group by block_id) counts),true,'each block uses five distinct rooms');
select is(public.event_registration_ready('10000000-0000-4000-8000-000000000001'),true,'seeded event is ready for registration');
update public.events set registration_open_at=null where id='10000000-0000-4000-8000-000000000001';
update public.rooms set active=false where id='10000000-0000-4000-8000-000000002001';
select is(public.event_registration_ready('10000000-0000-4000-8000-000000000001'),false,'inactive assigned room makes event unready');
select throws_ok(
  $$update public.events set registration_open_at=now() where id='10000000-0000-4000-8000-000000000001'$$,
  'P0001','EVENT_CONFIGURATION_INVALID','registration cannot open with an invalid room assignment'
);
update public.rooms set active=true where id='10000000-0000-4000-8000-000000002001';
update public.events set registration_open_at=now()-interval '1 hour' where id='10000000-0000-4000-8000-000000000001';

select throws_ok(
  $$select public.register_guest(null,'blank-name@example.test')$$,
  'P0001','INVALID_GUEST_NAME','guest full name is required'
);
select is(
  (public.register_guest('  Jana Nováková  ','Guest@Example.Test')->>'code'),
  'OK','guest registration accepts a name and email from any domain'
);
select is(
  (select full_name from public.guests where normalized_email='guest@example.test'),
  'Jana Nováková','guest full name is trimmed before storage'
);
select is(
  (select normalized_email from public.guests where normalized_email='guest@example.test'),
  'guest@example.test','guest email is trimmed and normalized before storage'
);
select throws_ok(
  $$select public.register_guest('Jiný host','  GUEST@example.test  ')$$,
  'P0001','GUEST_DUPLICATE','normalized duplicate guest email is rejected'
);
do $$
begin
  for i in 2..30 loop
    perform public.register_guest(format('Host %s',i),format('limit%s@example.test',i));
  end loop;
end $$;
select throws_ok(
  $$select public.register_guest('Host 31','limit31@example.test')$$,
  'P0001','GUEST_LIMIT_REACHED','guest registration rejects the thirty-first active guest'
);
select is(
  (select count(*) from public.guests where event_id='10000000-0000-4000-8000-000000000001' and status='active'),
  30::bigint,'guest registration stores at most thirty active guests'
);
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
select is_empty('select * from public.guests','anonymous users cannot read the guest list');
reset role;
delete from public.guests where event_id='10000000-0000-4000-8000-000000000001';

update public.events set registration_open_at=null where id='10000000-0000-4000-8000-000000000001';
select throws_ok(
  $$select public.register_guest('Host bez události','closed@example.test')$$,
  'P0001','GUEST_REGISTRATION_NOT_OPEN','guest registration requires one currently open event'
);
update public.events set registration_open_at=now()-interval '1 hour' where id='10000000-0000-4000-8000-000000000001';

alter table public.events disable trigger event_must_be_ready_before_registration;
insert into public.events(id,name,event_date,site_public_at,registration_open_at,registration_close_at,guest_limit)
values('10000000-0000-4000-8000-000000000002','Unexpected second open event',current_date,now()-interval '1 day',now()-interval '1 hour',now()+interval '1 hour',30);
alter table public.events enable trigger event_must_be_ready_before_registration;
select throws_ok(
  $$select public.register_guest('Host s nejasnou událostí','ambiguous@example.test')$$,
  'P0001','GUEST_EVENT_AMBIGUOUS','guest registration fails safely when multiple events are open'
);
delete from public.events where id='10000000-0000-4000-8000-000000000002';

insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('20000000-0000-4000-8000-000000000001','authenticated','authenticated','one@student.alej.cz','',now(),'{}','{}',now(),now()),
('20000000-0000-4000-8000-000000000002','authenticated','authenticated','two@student.alej.cz','',now(),'{}','{}',now(),now()),
('20000000-0000-4000-8000-000000000003','authenticated','authenticated','three@student.alej.cz','',now(),'{}','{}',now(),now()),
('20000000-0000-4000-8000-000000000006','authenticated','authenticated','outside@gmail.com','',now(),'{}','{}',now(),now());

insert into public.student_profiles(user_id,email,display_name)
values
('20000000-0000-4000-8000-000000000001','one@student.alej.cz','Student One'),
('20000000-0000-4000-8000-000000000002','two@student.alej.cz','Student Two'),
('20000000-0000-4000-8000-000000000003','three@student.alej.cz','Student Three');

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"one@student.alej.cz"}',true);
select is((select class_name from public.student_profiles where user_id='20000000-0000-4000-8000-000000000001'),null,'existing student profile remains valid without a class');
select throws_ok(
  $$select public.select_session('10000000-0000-4000-8000-000000005001')$$,
  'P0001','CLASS_REQUIRED','student must choose a class before selecting a lecture'
);
select lives_ok(
  $$do $body$ declare class_name text; begin
    foreach class_name in array array['Kvinta A','Sexta A','Septima A','Oktáva A','Kvinta B','Sexta B','Septima B','Oktáva B','Prvák','Druhák','Třeťák','Čtvrťák']
    loop perform public.set_student_class(class_name); end loop;
  end $body$;$$,
  'all twelve configured classes are accepted'
);
select is((select class_name from public.student_profiles where user_id='20000000-0000-4000-8000-000000000001'),'Čtvrťák','student can save their own class');
select throws_ok(
  $$select public.set_student_class('Páťák')$$,
  'P0001','INVALID_CLASS','class RPC rejects a value outside the fixed list'
);
select is_empty(
  $$update public.student_profiles set class_name='Kvinta A' where user_id='20000000-0000-4000-8000-000000000002' returning user_id$$,
  'student cannot update another student profile directly'
);
reset role;
select is((select class_name from public.student_profiles where user_id='20000000-0000-4000-8000-000000000002'),null,'another student class remains unchanged');
select col_has_check('public','student_profiles','class_name','student class has a database check constraint');
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"one@student.alej.cz"}',true);
select is((public.select_session('10000000-0000-4000-8000-000000005001')->>'code'),'OK','student can select a session');
select is((select count(*) from public.student_selections where student_id='20000000-0000-4000-8000-000000000001'),1::bigint,'one selection is created');
select is((public.select_session('10000000-0000-4000-8000-000000005001')->>'idempotent'),'true','clicking current session is idempotent');
select is((select count(*) from public.student_selections where student_id='20000000-0000-4000-8000-000000000001'),1::bigint,'idempotency creates no duplicate');
select is((public.select_session('10000000-0000-4000-8000-000000005002')->>'code'),'OK','switching succeeds');
select is((select session_id from public.student_selections where student_id='20000000-0000-4000-8000-000000000001' and block_id='10000000-0000-4000-8000-000000001001'),'10000000-0000-4000-8000-000000005002'::uuid,'switch replaces old choice atomically');

reset role;
update public.rooms set capacity=1 where id='10000000-0000-4000-8000-000000002001';
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","email":"two@student.alej.cz"}',true);
select public.set_student_class('Kvinta A');
select public.select_session('10000000-0000-4000-8000-000000005001');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","email":"three@student.alej.cz"}',true);
select public.set_student_class('Kvinta B');
select public.select_session('10000000-0000-4000-8000-000000005003');
select throws_ok($$select public.select_session('10000000-0000-4000-8000-000000005001')$$,'P0001','SWITCH_TARGET_FULL','full target room rejects switch');
select is((select session_id from public.student_selections where student_id='20000000-0000-4000-8000-000000000003' and block_id='10000000-0000-4000-8000-000000001001'),'10000000-0000-4000-8000-000000005003'::uuid,'failed switch retains old selection');

reset role;
update public.events set registration_close_at=now()-interval '1 second' where id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.select_session('10000000-0000-4000-8000-000000005006')$$,'P0001','REGISTRATION_CLOSED','database enforces close time');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"one@student.alej.cz"}',true);
select is_empty($$select * from public.student_profiles where user_id='20000000-0000-4000-8000-000000000002'$$,'student cannot read another student profile');
select is_empty($$select * from public.student_selections where student_id='20000000-0000-4000-8000-000000000002'$$,'student cannot read another student selection');
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
select is_empty('select * from public.student_selections','anonymous cannot read student selections');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000006","email":"outside@gmail.com"}',true);
select throws_ok($$select public.select_session('10000000-0000-4000-8000-000000005006')$$,'P0001','INVALID_STUDENT_DOMAIN','exact school-domain check rejects Gmail');
select * from finish();
rollback;

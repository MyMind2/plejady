-- This test uses independent PostgreSQL sessions through dblink: it exercises real
-- concurrent transactions, rather than merely invoking a function in a loop.
create extension if not exists dblink;
begin;
select plan(4);
insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated',format('race%s@student.alej.cz',n),'',now(),'{}','{}',now(),now() from generate_series(1,64) n;
update public.rooms set capacity=1 where event_id='10000000-0000-4000-8000-000000000001' and not is_large_room;
update public.rooms set capacity=2 where event_id='10000000-0000-4000-8000-000000000001' and is_large_room;
commit;

select dblink_connect('seat_a','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
select dblink_connect('seat_b','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
-- First claim the block 3 large room with another session; session 5011 remains normal capacity 1.
select dblink_send_query('seat_a',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","email":"race1@student.alej.cz"}',true); perform public.select_session('10000000-0000-4000-8000-000000005012'); end $body$;$$);
select * from dblink_get_result('seat_a') as t(result text);
select * from dblink_get_result('seat_a') as t(result text);
select dblink_send_query('seat_a',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","email":"race2@student.alej.cz"}',true); perform public.select_session('10000000-0000-4000-8000-000000005012'); end $body$;$$);
select * from dblink_get_result('seat_a') as t(result text);
select * from dblink_get_result('seat_a') as t(result text);
select dblink_send_query('seat_a',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000003","email":"race3@student.alej.cz"}',true); perform pg_sleep(0.2); begin perform public.select_session('10000000-0000-4000-8000-000000005011'); exception when others then null; end; end $body$;$$);
select dblink_send_query('seat_b',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000004',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000004","email":"race4@student.alej.cz"}',true); perform pg_sleep(0.2); begin perform public.select_session('10000000-0000-4000-8000-000000005011'); exception when others then null; end; end $body$;$$);
select * from dblink_get_result('seat_a') as t(result text); select * from dblink_get_result('seat_b') as t(result text);
select * from dblink_get_result('seat_a') as t(result text); select * from dblink_get_result('seat_b') as t(result text);
select is((select count(*) from public.student_selections where session_id='10000000-0000-4000-8000-000000005011'),1::bigint,'concurrent final-seat registrations stop at normal capacity');

-- Put both block 2 sessions at exactly S=1 before racing their S→S+1 registrations.
select dblink_send_query('seat_a',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000005',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000005","email":"race5@student.alej.cz"}',true); perform public.select_session('10000000-0000-4000-8000-000000005006'); end $body$;$$);
select * from dblink_get_result('seat_a') as t(result text); select * from dblink_get_result('seat_a') as t(result text);
select dblink_send_query('seat_b',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000006',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000006","email":"race6@student.alej.cz"}',true); perform public.select_session('10000000-0000-4000-8000-000000005007'); end $body$;$$);
select * from dblink_get_result('seat_b') as t(result text); select * from dblink_get_result('seat_b') as t(result text);
select dblink_send_query('seat_a',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000007',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000007","email":"race7@student.alej.cz"}',true); perform pg_sleep(0.2); begin perform public.select_session('10000000-0000-4000-8000-000000005006'); exception when others then null; end; end $body$;$$);
select dblink_send_query('seat_b',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000008',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000008","email":"race8@student.alej.cz"}',true); perform pg_sleep(0.2); begin perform public.select_session('10000000-0000-4000-8000-000000005007'); exception when others then null; end; end $body$;$$);
select * from dblink_get_result('seat_a') as t(result text); select * from dblink_get_result('seat_b') as t(result text);
select * from dblink_get_result('seat_a') as t(result text); select * from dblink_get_result('seat_b') as t(result text);
select is((select count(*) from public.block_large_room_claims where winning_session_id in ('10000000-0000-4000-8000-000000005006','10000000-0000-4000-8000-000000005007')),1::bigint,'simultaneous S+1 attempts produce exactly one large-room winner');
select ok(not exists(select 1 from public.student_selections ss join public.sessions s on s.id=ss.session_id join public.block_large_room_claims c on c.block_id=s.block_id where c.winning_session_id<>s.id and ss.session_id in ('10000000-0000-4000-8000-000000005006','10000000-0000-4000-8000-000000005007') group by ss.session_id having count(*)>1),'losing normal session never exceeds normal capacity');

-- Guest limit race: thirty-two independent attempts for a limit of thirty.
select dblink_disconnect('seat_a'); select dblink_disconnect('seat_b');
do $$ declare i integer; begin for i in 1..32 loop perform dblink_connect('guest'||i,'host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable'); perform dblink_send_query('guest'||i,format($q$do $body$ begin perform pg_sleep(0.2); begin perform public.register_guest('10000000-0000-4000-8000-000000000001', %L); exception when others then null; end; end $body$;$q$,format('guest%s@example.test',i))); end loop; for i in 1..32 loop perform * from dblink_get_result('guest'||i) as t(result text); perform * from dblink_get_result('guest'||i) as t(result text); perform dblink_disconnect('guest'||i); end loop; end $$;
select is((select count(*) from public.guests where event_id='10000000-0000-4000-8000-000000000001' and status='active'),30::bigint,'32 concurrent attempts fill exactly 30 places without overflowing');
select * from finish();

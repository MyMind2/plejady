-- Independent dblink connections execute genuinely overlapping transactions.
create extension if not exists dblink;
begin;
select plan(4);
insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated',format('race%s@student.alej.cz',n),'',now(),'{}','{}',now(),now() from generate_series(1,64) n;
insert into public.student_profiles(user_id,email,display_name,class_name)
select id,email,split_part(email,'@',1),'Kvinta A' from auth.users
where id between '30000000-0000-4000-8000-000000000001'::uuid and '30000000-0000-4000-8000-000000000064'::uuid;
update public.rooms set capacity=3 where id='10000000-0000-4000-8000-000000002002';
insert into public.student_selections(student_id,block_id,session_id)
select id,'10000000-0000-4000-8000-000000001001','10000000-0000-4000-8000-000000005002' from auth.users
where id between '30000000-0000-4000-8000-000000000001'::uuid and '30000000-0000-4000-8000-000000000039'::uuid;
commit;

select dblink_connect('seat_a','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
select dblink_connect('seat_b','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
select dblink_send_query('seat_a',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000040',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000040","email":"race40@student.alej.cz"}',true); perform pg_sleep(0.2); begin perform public.select_session('10000000-0000-4000-8000-000000005002'); exception when others then null; end; end $body$;$$);
select dblink_send_query('seat_b',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000041',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000041","email":"race41@student.alej.cz"}',true); perform pg_sleep(0.2); begin perform public.select_session('10000000-0000-4000-8000-000000005002'); exception when others then null; end; end $body$;$$);
select * from dblink_get_result('seat_a') as t(result text); select * from dblink_get_result('seat_b') as t(result text);
select * from dblink_get_result('seat_a') as t(result text); select * from dblink_get_result('seat_b') as t(result text);
select is((select count(*) from public.student_selections where session_id='10000000-0000-4000-8000-000000005002'),40::bigint,'concurrent attempts for the final override seat stop at forty');
select dblink_disconnect('seat_a'); select dblink_disconnect('seat_b');

-- Pre-fill two of three places, then start ten transactions for the final place.
select dblink_connect('pre_a','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
select dblink_connect('pre_b','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
select dblink_send_query('pre_a',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000003","email":"race3@student.alej.cz"}',true); perform public.select_session('10000000-0000-4000-8000-000000005012'); end $body$;$$);
select dblink_send_query('pre_b',$$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000004',true); perform set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000004","email":"race4@student.alej.cz"}',true); perform public.select_session('10000000-0000-4000-8000-000000005012'); end $body$;$$);
select * from dblink_get_result('pre_a') as t(result text); select * from dblink_get_result('pre_b') as t(result text);
select * from dblink_get_result('pre_a') as t(result text); select * from dblink_get_result('pre_b') as t(result text);
select dblink_disconnect('pre_a'); select dblink_disconnect('pre_b');
do $$ declare i integer; begin for i in 1..10 loop perform dblink_connect('lecture'||i,'host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable'); perform dblink_send_query('lecture'||i,format($q$do $body$ begin execute 'set local role authenticated'; perform set_config('request.jwt.claim.sub',%L,true); perform set_config('request.jwt.claims',%L,true); perform pg_sleep(0.2); begin perform public.select_session('10000000-0000-4000-8000-000000005012'); exception when others then null; end; end $body$;$q$,format('30000000-0000-4000-8000-%s',lpad((10+i)::text,12,'0')),format('{"sub":"30000000-0000-4000-8000-%s","email":"race%s@student.alej.cz"}',lpad((10+i)::text,12,'0'),10+i))); end loop; for i in 1..10 loop perform * from dblink_get_result('lecture'||i) as t(result text); perform * from dblink_get_result('lecture'||i) as t(result text); perform dblink_disconnect('lecture'||i); end loop; end $$;
select is((select count(*) from public.student_selections where session_id='10000000-0000-4000-8000-000000005012'),3::bigint,'ten overlapping attempts for one remaining place stop exactly at room capacity');

-- Concurrent duplicate guest attempts consume one place only.
select dblink_connect('dup_a','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
select dblink_connect('dup_b','host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable');
select dblink_send_query('dup_a',$$do $body$ begin perform pg_sleep(0.2); begin perform public.register_guest('První host','duplicate@example.test'); exception when others then null; end; end $body$;$$);
select dblink_send_query('dup_b',$$do $body$ begin perform pg_sleep(0.2); begin perform public.register_guest('Druhý host','DUPLICATE@example.test'); exception when others then null; end; end $body$;$$);
select * from dblink_get_result('dup_a') as t(result text); select * from dblink_get_result('dup_b') as t(result text);
select * from dblink_get_result('dup_a') as t(result text); select * from dblink_get_result('dup_b') as t(result text);
select dblink_disconnect('dup_a'); select dblink_disconnect('dup_b');
select is((select count(*) from public.guests where event_id='10000000-0000-4000-8000-000000000001' and normalized_email='duplicate@example.test'),1::bigint,'concurrent duplicate guest email consumes one place');
delete from public.guests where normalized_email='duplicate@example.test';

do $$ declare i integer; begin for i in 1..32 loop perform dblink_connect('guest'||i,'host=supabase_db_plejady port=5432 dbname=postgres user=supabase_admin password=postgres sslmode=disable'); perform dblink_send_query('guest'||i,format($q$do $body$ begin perform pg_sleep(0.2); begin perform public.register_guest(%L,%L); exception when others then null; end; end $body$;$q$,format('Host %s',i),format('guest%s@example.test',i))); end loop; for i in 1..32 loop perform * from dblink_get_result('guest'||i) as t(result text); perform * from dblink_get_result('guest'||i) as t(result text); perform dblink_disconnect('guest'||i); end loop; end $$;
select is((select count(*) from public.guests where event_id='10000000-0000-4000-8000-000000000001' and status='active'),30::bigint,'32 overlapping unique guest attempts fill exactly 30 places without overflow');
select * from finish();

delete from public.guests where event_id='10000000-0000-4000-8000-000000000001' and normalized_email like 'guest%@example.test';
delete from auth.users where id between '30000000-0000-4000-8000-000000000001'::uuid and '30000000-0000-4000-8000-000000000064'::uuid;
update public.rooms set capacity=80 where event_id='10000000-0000-4000-8000-000000000001';

-- Local/staging demonstration data. Replace speaker content before production launch.
insert into public.events (id,name,event_date,site_public_at,registration_open_at,registration_close_at,guest_limit)
values ('10000000-0000-4000-8000-000000000001','Plejády – ukázková data',current_date,now()-interval '1 day',now()-interval '1 hour',now()+interval '1 year',30);
insert into public.blocks (id,event_id,display_order,start_time,end_time) values
('10000000-0000-4000-8000-000000001001','10000000-0000-4000-8000-000000000001',1,'08:30','09:30'),
('10000000-0000-4000-8000-000000001002','10000000-0000-4000-8000-000000000001',2,'10:00','11:00'),
('10000000-0000-4000-8000-000000001003','10000000-0000-4000-8000-000000000001',3,'11:30','12:30'),
('10000000-0000-4000-8000-000000001004','10000000-0000-4000-8000-000000000001',4,'13:00','14:00');
insert into public.rooms (id,event_id,room_number,capacity,is_large_room) values
('10000000-0000-4000-8000-000000002001','10000000-0000-4000-8000-000000000001','101',30,false),
('10000000-0000-4000-8000-000000002002','10000000-0000-4000-8000-000000000001','102',30,false),
('10000000-0000-4000-8000-000000002003','10000000-0000-4000-8000-000000000001','103',30,false),
('10000000-0000-4000-8000-000000002004','10000000-0000-4000-8000-000000000001','104',30,false),
('10000000-0000-4000-8000-000000002005','10000000-0000-4000-8000-000000000001','Aula',60,true);
insert into public.lecturers (id,name,short_bio)
select ('10000000-0000-4000-8000-'||lpad((3000+n)::text,12,'0'))::uuid, format('Přednášející %s',lpad(n::text,2,'0')), 'Ukázkový medailon – nahraďte před spuštěním.' from generate_series(1,20) n;
insert into public.lectures (id,title,annotation,lecturer_id)
select ('10000000-0000-4000-8000-'||lpad((4000+n)::text,12,'0'))::uuid,format('Ukázková přednáška %s',lpad(n::text,2,'0')),'Ukázková anotace – nahraďte před spuštěním.',('10000000-0000-4000-8000-'||lpad((3000+n)::text,12,'0'))::uuid from generate_series(1,20) n;
insert into public.sessions (id,event_id,lecture_id,block_id)
select ('10000000-0000-4000-8000-'||lpad((5000+n)::text,12,'0'))::uuid,'10000000-0000-4000-8000-000000000001',('10000000-0000-4000-8000-'||lpad((4000+n)::text,12,'0'))::uuid,('10000000-0000-4000-8000-'||lpad((1000+ceil(n/5.0))::text,12,'0'))::uuid from generate_series(1,20) n;

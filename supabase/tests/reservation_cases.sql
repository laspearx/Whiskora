-- After 20261030120000_reservation_transfer_pipeline.sql (synthetic data from stub_schema.sql)
\set O '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set S '''cccccccc-0000-0000-0000-000000000003'''
\set X '''dddddddd-0000-0000-0000-000000000004'''
\set M '''eeeeeeee-0000-0000-0000-000000000005'''
insert into pet_reservations (id, pet_id, buyer_id) values (101, 1, :B), (102, 1, :X);
select pg_temp.check('resv','staff cannot confirm',            'authenticated', :S, $$select * from farm_set_reservation_status(101,'confirmed')$$, 'denied');
select pg_temp.check('resv','stranger cannot confirm',         'authenticated', :X, $$select * from farm_set_reservation_status(101,'confirmed')$$, 'denied');
select pg_temp.check('resv','anon cannot call',                'anon', null,  $$select * from farm_set_reservation_status(101,'confirmed')$$, 'denied');
select pg_temp.check('resv','owner confirms',                  'authenticated', :O, $$select * from farm_set_reservation_status(101,'confirmed') where reservation_status='confirmed' and pet_status='ติดจอง'$$, 'rows=1');
select pg_temp.check('resv','confirm again is a no-op',        'authenticated', :O, $$select * from farm_set_reservation_status(101,'confirmed') where reservation_status='confirmed'$$, 'rows=1');
select pg_temp.check('resv','second buyer cannot be confirmed','authenticated', :M, $$select * from farm_set_reservation_status(102,'confirmed')$$, 'error:22023 pet_not_listed');  -- pet is ติดจอง after the first confirm
select pg_temp.check('resv','failed confirm left pet reserved','authenticated', :O, $$select 1 from pets where id=1 and status='ติดจอง'$$, 'rows=1');
select pg_temp.check('resv','invalid status rejected',         'authenticated', :O, $$select * from farm_set_reservation_status(102,'converted')$$, 'error:22023 invalid_status');
select pg_temp.check('resv','manager cancels confirmed',       'authenticated', :M, $$select * from farm_set_reservation_status(101,'cancelled') where pet_status='เปิดจอง'$$, 'rows=1');
select pg_temp.check('resv','cancelled cannot be re-confirmed','authenticated', :O, $$select * from farm_set_reservation_status(101,'confirmed')$$, 'error:22023 invalid_transition:cancelled->confirmed');
select pg_temp.check('resv','manager confirms second buyer',   'authenticated', :M, $$select * from farm_set_reservation_status(102,'confirmed') where pet_status='ติดจอง'$$, 'rows=1');
-- transfers
select pg_temp.check('xfer','self transfer blocked',           'authenticated', :O, $$insert into pet_ownership_transfers (pet_id, from_user_id, to_user_id, initiated_by, reservation_id) values (1, auth.uid(), auth.uid(), auth.uid(), 102)$$, 'denied');  -- RLS (pet_transfer_insert_ok) refuses before the CHECK
select pg_temp.check('xfer','send transfer to buyer',          'authenticated', :O, $$insert into pet_ownership_transfers (id, pet_id, from_user_id, to_user_id, initiated_by, reservation_id) values (201, 1, auth.uid(), 'dddddddd-0000-0000-0000-000000000004', auth.uid(), 102)$$, 'rows=1');
select pg_temp.check('xfer','second pending transfer blocked', 'authenticated', :O, $$insert into pet_ownership_transfers (pet_id, from_user_id, to_user_id, initiated_by, reservation_id) values (1, auth.uid(), 'dddddddd-0000-0000-0000-000000000004', auth.uid(), 102)$$, 'error:23505 duplicate key value violates unique constraint "pet_ownershi');
select pg_temp.check('xfer','decline keeps reservation',       'authenticated', :X, $$select * from respond_pet_transfer(201,'decline') where transfer_status='declined'$$, 'rows=1');
select pg_temp.check('xfer','after decline: owner unchanged',  'authenticated', :O, $$select 1 from pets p join pet_reservations r on r.pet_id=p.id where p.id=1 and p.user_id=auth.uid() and r.id=102 and r.status='confirmed'$$, 'rows=1');
select pg_temp.check('xfer','resend after decline',            'authenticated', :O, $$insert into pet_ownership_transfers (id, pet_id, from_user_id, to_user_id, initiated_by, reservation_id) values (202, 1, auth.uid(), 'dddddddd-0000-0000-0000-000000000004', auth.uid(), 102)$$, 'rows=1');
select pg_temp.check('xfer','direct update blocked',           'authenticated', :X, $$update pet_ownership_transfers set status='accepted' where id=202 and status='pending'$$, 'rows=0');
select pg_temp.check('xfer','accept',                          'authenticated', :X, $$select * from respond_pet_transfer(202,'accept') where transfer_status='accepted'$$, 'rows=1');
select pg_temp.check('xfer','accept twice is a no-op',         'authenticated', :X, $$select * from respond_pet_transfer(202,'accept') where transfer_status='accepted'$$, 'rows=1');
select pg_temp.check('xfer','after accept: converted + owner', 'authenticated', :X, $$select 1 from pets p join pet_reservations r on r.pet_id=p.id where p.id=1 and p.user_id=auth.uid() and p.farm_id is null and p.status is null and r.id=102 and r.status='converted'$$, 'rows=1');
select pg_temp.check('xfer','old owner lost health access',    'authenticated', :O, $$select * from get_pet_health(1)$$, 'rows=0');
select pg_temp.check('xfer','new owner has health access',     'authenticated', :X, $$select * from get_pet_health(1)$$, 'rows=1');
select pg_temp.check('xfer','old owner cannot confirm now',    'authenticated', :O, $$select * from farm_set_reservation_status(101,'cancelled')$$, 'denied');

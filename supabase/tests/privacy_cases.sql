-- Run with: psql -v phase=before|after -f privacy_checks.sql -f privacy_cases.sql
-- Synthetic ids: O owner, B buyer, S staff, X stranger, M manager (see stub_schema.sql)
\set O '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set X '''dddddddd-0000-0000-0000-000000000004'''
\set ph '''' :phase ''''
select pg_temp.check(:ph,'anon reads emails',            'anon', null, 'select email from profiles', :'exp_private');
select pg_temp.check(:ph,'anon reads phone/address',     'anon', null, 'select phone, address from profiles', :'exp_private');
select pg_temp.check(:ph,'anon reads public card',       'anon', null, 'select id, full_name, username, avatar_url, cover_url from profiles', 'rows=5');
select pg_temp.check(:ph,'stranger reads other emails',  'authenticated', :X, 'select email from profiles where id <> auth.uid()', :'exp_private');
select pg_temp.check(:ph,'anon reads pet allergies',     'anon', null, 'select allergies, blood_type from pets', :'exp_private');
select pg_temp.check(:ph,'stranger reads pet health',    'authenticated', :X, 'select chronic_diseases, health_notes, traits from pets', :'exp_private');
select pg_temp.check(:ph,'anon reads PET_COLUMNS list',  'anon', null, 'select id, created_at, name, breed, species, gender, color, pattern, coat, ear, leg, eye_color, birth_date, status, price, image_url, cover_url, gallery_urls, user_id, farm_id, litter_id, sire_id, dam_id, is_public, is_neutered, microchip_number, pet_code, note, vaccine_status, weight, pedigree_number, pedigree_image_url, paternal_grandsire, paternal_granddam, maternal_grandsire, maternal_granddam from pets', 'rows=1');
select pg_temp.check(:ph,'anon select * pets',           'anon', null, 'select * from pets', :'exp_private');
select pg_temp.check(:ph,'owner health via RPC',         'authenticated', :O, 'select * from get_pet_health(1)', 'rows=1');
select pg_temp.check(:ph,'stranger health via RPC',      'authenticated', :X, 'select * from get_pet_health(1)', 'rows=0');

-- ─────────────────────────────────────────────────────────────────────────────
-- SYNTHETIC STUB of the Supabase environment for testing migration mechanics locally.
-- Column names/types, the transfer trigger and the profiles column ACLs match production
-- (read 2026-10-30); RLS policies and get_pet_health are simplified stand-ins. Passing here proves the
-- migration SQL is valid and the privilege model behaves as intended — it does NOT
-- prove production is safe. Re-run the checks on real staging.
-- Usage: psql -f stub_schema.sql -f <migrations...> -f privacy_checks.sql
-- ─────────────────────────────────────────────────────────────────────────────
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create table public.profiles (
  id uuid primary key, created_at timestamptz default now(), updated_at timestamptz,
  full_name text, username text, avatar_url text, cover_url text, role text default 'user',
  email text, phone text, address text, house_no text, room_no text, moo text, soi text, road text,
  sub_district text, district text, province text, postal_code text, location text,
  notif_line boolean default true, notif_email boolean default true
);
create table public.pets (
  id bigserial primary key, created_at timestamptz default now(), name text, breed text, species text,
  gender text, color text, pattern text, coat text, ear text, leg text, eye_color text, birth_date date,
  status text, price bigint, image_url text, cover_url text, gallery_urls text, user_id uuid, farm_id bigint,
  litter_id bigint, sire_id bigint, dam_id bigint, is_public boolean default true, is_neutered boolean,
  microchip_number text, pet_code text, note text, vaccine_status text, weight numeric,
  pedigree_number text, pedigree_image_url text, paternal_grandsire text, paternal_granddam text,
  maternal_grandsire text, maternal_granddam text,
  blood_type text, allergies text, chronic_diseases text, health_notes text, traits text
);
create table public.farms (id bigint primary key, user_id text, farm_name text);  -- production: farms.user_id is text
create table public.workspaces (id uuid primary key default gen_random_uuid(), type text, entity_id bigint);
create table public.workspace_members (id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces, user_id uuid, role text);
create table public.pet_reservations (
  id bigserial primary key, pet_id bigint references public.pets, buyer_id uuid, status text default 'pending',
  created_at timestamptz default now(), confirmed_at timestamptz
);
create unique index one_confirmed_reservation_per_pet on public.pet_reservations (pet_id) where status = 'confirmed';
create table public.pet_ownership_transfers (
  id bigserial primary key, pet_id bigint references public.pets, from_user_id uuid, to_user_id uuid,
  initiated_by uuid, status text default 'pending', reservation_id bigint references public.pet_reservations, initiated_at timestamptz default now(), accepted_at timestamptz
);

-- copy of the production trigger (read 2026-10-30)
create function public.sync_pet_owner_on_transfer_accept() returns trigger language plpgsql security definer set search_path to 'public'
as $$ begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    update pets set user_id = new.to_user_id, farm_id = null where id = new.pet_id;
    new.accepted_at := now();
    if new.reservation_id is not null then
      update pet_reservations set status = 'converted' where id = new.reservation_id;
    end if;
  end if; return new; end $$;
create trigger trg_sync_pet_owner_on_transfer_accept before update on public.pet_ownership_transfers
  for each row execute function public.sync_pet_owner_on_transfer_accept();

-- stand-in for get_pet_health (real tier logic unknown): owner only
create function public.get_pet_health(p_pet_id bigint)
returns table (blood_type text, allergies text, chronic_diseases text, health_notes text, traits text)
language sql stable security definer set search_path = public
as $$ select blood_type, allergies, chronic_diseases, health_notes, traits from pets
      where id = p_pet_id and user_id = auth.uid() $$;
grant execute on function public.get_pet_health(bigint) to anon, authenticated;

-- Supabase-style default: table-level ALL for API roles; RLS decides rows.
grant all on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
-- production also has these explicit column ACLs for anon on profiles
grant select (id, created_at, username, avatar_url, updated_at, full_name, location, cover_url) on public.profiles to anon;
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_reservations enable row level security;
alter table public.pet_ownership_transfers enable row level security;
create policy p_read on public.profiles for select using (true);           -- mirrors the observed leak
create policy p_own_upd on public.profiles for update using (id = auth.uid());
create policy p_own_ins on public.profiles for insert with check (id = auth.uid());
create policy pets_read on public.pets for select using (is_public or user_id = auth.uid());
create policy pets_own on public.pets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- same names / effect as the production policies before 20261030120000 (team check simplified to "anyone")
create policy "reservations create by buyer" on public.pet_reservations for insert with check (buyer_id = auth.uid());
create policy "reservations read by buyer or farm team" on public.pet_reservations for select using (true);
create policy "reservations update by buyer or farm team" on public.pet_reservations for update using (true);
create policy "transfers create by pet manager" on public.pet_ownership_transfers for insert with check (initiated_by = auth.uid());
create policy "transfers read by involved parties" on public.pet_ownership_transfers for select using (true);
create policy "transfers update by buyer or initiator" on public.pet_ownership_transfers for update using (to_user_id = auth.uid() or initiated_by = auth.uid());

-- synthetic users / data (no real people)
insert into public.profiles (id, full_name, username, email, phone, address) values
 ('aaaaaaaa-0000-0000-0000-000000000001','Test Owner','owner_t','owner@example.test','000-000-0001','1 Test Rd'),
 ('bbbbbbbb-0000-0000-0000-000000000002','Test Buyer','buyer_t','buyer@example.test','000-000-0002','2 Test Rd'),
 ('cccccccc-0000-0000-0000-000000000003','Test Staff','staff_t','staff@example.test','000-000-0003','3 Test Rd'),
 ('dddddddd-0000-0000-0000-000000000004','Test Stranger','stranger_t','stranger@example.test','000-000-0004','4 Test Rd'),
 ('eeeeeeee-0000-0000-0000-000000000005','Test Manager','manager_t','manager@example.test','000-000-0005','5 Test Rd');
insert into public.pets (id, name, status, user_id, farm_id, is_public, blood_type, allergies) values
 (1,'Synthetic Cat','เปิดจอง','aaaaaaaa-0000-0000-0000-000000000001',99,true,'A','seafood');
insert into public.farms (id, user_id) values (99, 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.workspaces (id, type, entity_id) values ('99999999-0000-0000-0000-000000000099','farm',99);
insert into public.workspace_members (workspace_id, user_id, role) values
 ('99999999-0000-0000-0000-000000000099','aaaaaaaa-0000-0000-0000-000000000001','owner'),
 ('99999999-0000-0000-0000-000000000099','eeeeeeee-0000-0000-0000-000000000005','manager'),
 ('99999999-0000-0000-0000-000000000099','cccccccc-0000-0000-0000-000000000003','staff');
select setval('pets_id_seq', 10);

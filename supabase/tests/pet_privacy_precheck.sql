-- Read-only gate for 20261030140000_pet_privacy_is_public.sql (before applying, and after as a postcheck).
-- ok / STOP / WARN / info. STOP → do not apply. Never edit pets or settings rows to make it pass. Counts only.
with
fn as (select proname, md5(prosrc) m from pg_proc where pronamespace = 'public'::regnamespace),
applied as (select exists (select 1 from fn where proname = 'pet_visible_to') a),
anon_ped as (select count(*) c from information_schema.column_privileges
             where table_schema = 'public' and table_name = 'pets' and grantee in ('anon', 'authenticated') and privilege_type = 'SELECT'
               and column_name in ('sire_id', 'dam_id', 'pedigree_number', 'pedigree_image_url',
                                   'paternal_grandsire', 'paternal_granddam', 'maternal_grandsire', 'maternal_granddam'))
select 1 as n, 'state' as check, case when (select a from applied) then 'after' else 'before' end as result
union all
select 2, 'function bodies are the known ones for this state (md5)',
  case when (select a from applied) then
    case when (select m from fn where proname = 'viewer_can_see') = 'afd80a08c47c15071c128efa8af45a16'
          and (select m from fn where proname = 'get_pet_pedigree') = '72fc98e5de6028a4336c3e5059a9aa67'
          and (select m from fn where proname = 'pet_visible_to') = 'c95458d5fcf48b8a892c5dc49fa3abf8'
          and (select m from fn where proname = 'get_pet_pedigree_fields') = '4842bb75d6c036ac4291e885a0c53319'
         then 'ok' else 'STOP: unexpected body' end
  else
    case when (select m from fn where proname = 'viewer_can_see') = '249f6458b2f78da06d876f2486ddc919'
          and (select m from fn where proname = 'get_pet_pedigree') = '4c6d2bf37df4106d414816d879827724'
         then 'ok' else 'STOP: unexpected body' end
  end
union all
select 3, 'before: no new helper exists yet (no half-applied state)',
  case when (select a from applied) then 'ok (after)'
       when exists (select 1 from fn where proname in ('is_pet_co_owner', 'can_manage_farm_privacy', 'can_manage_pet_privacy', 'get_pet_pedigree_fields'))
       then 'STOP: partially applied' else 'ok' end
union all
select 4, 'pets policies for this state',
  case when (select a from applied) then
    case when exists (select 1 from pg_policies where tablename = 'pets' and policyname = 'Public can view available pets'
                        and qual like '%is_public IS NOT FALSE%')
          and exists (select 1 from pg_policies where tablename = 'pets' and policyname = 'pets read by co-owner or farm team')
         then 'ok' else 'STOP' end
  else
    case when exists (select 1 from pg_policies where tablename = 'pets' and policyname = 'Public can view available pets'
                        and qual = '(status = ''พร้อมย้ายบ้าน''::text)')
          and not exists (select 1 from pg_policies where tablename = 'pets' and policyname = 'pets read by co-owner or farm team')
         then 'ok' else 'STOP: pets policies differ from the reviewed state' end
  end
union all
select 5, 'privacy-settings write policies for this state',
  case when (select a from applied) then
    case when (select count(*) from pg_policies where tablename in ('farm_visibility_settings', 'pet_visibility_settings')
               and policyname in ('farm_visibility write by owner or manager', 'farm_visibility update by owner or manager',
                                  'farm_visibility delete by owner or manager', 'pet_visibility write by owner',
                                  'pet_visibility update by owner', 'pet_visibility delete by owner')) = 6
         then 'ok' else 'STOP' end
  else
    case when (select count(*) from pg_policies where tablename in ('farm_visibility_settings', 'pet_visibility_settings')
               and policyname in ('farm_visibility write by farm team', 'farm_visibility update by farm team',
                                  'farm_visibility delete by farm team', 'pet_visibility write by manager',
                                  'pet_visibility update by manager', 'pet_visibility delete by manager')) = 6
         then 'ok' else 'STOP: settings policies differ from the reviewed state' end
  end
union all
select 6, 'storage pet-photos SELECT policies for this state',
  case when (select a from applied) then
    case when exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'pet-photos read own folder')
          and not exists (select 1 from pg_policies where schemaname = 'storage' and policyname in ('Public read pet photos', 'Public read pet-photos'))
         then 'ok' else 'STOP' end
  else
    case when (select count(*) from pg_policies where schemaname = 'storage' and policyname in ('Public read pet photos', 'Public read pet-photos')) = 2
         then 'ok' else 'STOP: storage policies differ from the reviewed state' end
  end
union all
select 7, 'anon + authenticated SELECT on the 8 pedigree columns (before 16, after 0)',
  case when (select a from applied) then case when (select c from anon_ped) = 0 then 'ok' else 'STOP' end
       else case when (select c from anon_ped) = 16 then 'ok' else 'STOP: ' || (select c from anon_ped) end end
union all
select 7.5, 'access_grants write policies for this state',
  case when (select a from applied) then
    case when (select count(*) from pg_policies where tablename = 'access_grants'
               and policyname in ('access_grants create by pet owner', 'access_grants revoke by granter or owner')) = 2
          and not exists (select 1 from pg_policies where tablename = 'access_grants'
               and policyname in ('access_grants create by pet manager', 'access_grants revoke by granter or manager'))
         then 'ok' else 'STOP' end
  else
    case when (select count(*) from pg_policies where tablename = 'access_grants'
               and policyname in ('access_grants create by pet manager', 'access_grants revoke by granter or manager')) = 2
         then 'ok' else 'STOP: access_grants policies differ from the reviewed state' end
  end
union all
select 7.6, 'access_grants UPDATE: before = every column (anon + authenticated), no trigger; after = authenticated revoked_at only + revoke-only trigger',
  (with up as (select grantee, array_agg(column_name::text order by column_name) cols from information_schema.column_privileges
               where table_schema = 'public' and table_name = 'access_grants' and privilege_type = 'UPDATE'
                 and grantee in ('anon', 'authenticated') group by grantee),
        trg as (select exists (select 1 from pg_trigger where tgrelid = 'public.access_grants'::regclass
                               and tgname = 'access_grants_revoke_only' and not tgisinternal) t)
   select case when (select a from applied) then
            case when (select t from trg) and not exists (select 1 from up where grantee = 'anon')
                  and (select cols from up where grantee = 'authenticated') = array['revoked_at'] then 'ok' else 'STOP' end
          else
            case when not (select t from trg)
                  and (select count(*) from up where cardinality(cols) = (select count(*) from information_schema.columns
                         where table_schema = 'public' and table_name = 'access_grants')) = 2
                 then 'ok' else 'STOP: access_grants UPDATE privileges differ from the reviewed state' end
          end)
-- who is affected (WARN = rows behave differently after apply; never change these rows to pass)
union all
select 8, 'private pets (is_public = false) — hidden from outsiders after apply',
  case when c = 0 then 'ok' else 'WARN: ' || c end from (select count(*) c from public.pets where is_public is false) x
union all
select 9, 'private pets with status พร้อมย้ายบ้าน — readable by anyone before, hidden after',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pets where is_public is false and status = 'พร้อมย้ายบ้าน') x
union all
select 10, 'private pets that are sire/dam of another pet — dropped from other viewers'' pedigree trees after apply',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(distinct par.id) c from public.pets ch join public.pets par on par.id in (ch.sire_id, ch.dam_id)
        where par.is_public is false) x
union all
select 10.5, 'active access grants (scope changes: a grant now covers only its field group, and no longer the card)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.access_grants where revoked_at is null and (expires_at is null or expires_at > now())) x
union all
select 11, 'farm / pet privacy rows (info: existing values are kept; only who may write changes)',
  (select count(*) from public.farm_visibility_settings)::text || ' farm / ' ||
  (select count(*) from public.pet_visibility_settings)::text || ' pet'
union all
select 12, 'pet-photos objects (info: still served by public URL; listing closed after apply)',
  (select count(*) from storage.objects where bucket_id = 'pet-photos')::text
union all
select 13, 'readable pets with pedigree values (info: anon direct reads closed after apply; public pages use the RPC)',
  (select count(*) from public.pets where (is_public is not false) and (sire_id is not null or dam_id is not null
     or pedigree_number is not null or pedigree_image_url is not null or paternal_grandsire is not null
     or paternal_granddam is not null or maternal_grandsire is not null or maternal_granddam is not null))::text
order by 1;

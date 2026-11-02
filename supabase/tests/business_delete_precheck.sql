-- Read-only gate before / after 20261102100000 (no direct API DELETE on farms / shops / services / workspaces).
-- Run inside `begin read only; … rollback;`. Counts and catalog facts only; changes nothing.
-- state: before | after (after = no effective DELETE for anon / authenticated / PUBLIC on any of the 4 tables).
-- delete_rights: EFFECTIVE DELETE per role and table (has_table_privilege covers table grants, PUBLIC and role membership).
-- delete_verdict: after the migration it must be OK; before it is expected to say STOP (anon + authenticated hold DELETE).
-- other_rights_md5: every effective table + column privilege of anon / authenticated / PUBLIC / service_role on the 4
-- tables, EXCEPT exactly one thing: table DELETE of anon and authenticated (the right this migration removes; reported
-- separately in delete_rights / delete_verdict). PUBLIC DELETE and service_role DELETE stay IN the fingerprint. Must be the
-- same value before and after; never narrow this list to make a run match. policies_md5 / triggers_md5 / fks_md5 likewise.
-- *_list columns hold the readable text behind each md5, so a mismatch can be read without another query.
with tbl(t) as (values ('farms'), ('shops'), ('services'), ('workspaces')),
roles(r) as (values ('anon'), ('authenticated'), ('public'), ('service_role')),
del as (
  select r, t, has_table_privilege(r, format('public.%I', t), 'DELETE') d from tbl cross join roles where r <> 'service_role'
),
other_tbl as (
  select r || ':' || t || ':' || p || '=' || has_table_privilege(r, format('public.%I', t), p)::text x
    from tbl cross join roles
    cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN'), ('DELETE')) p(p)
   where not (p = 'DELETE' and r in ('anon', 'authenticated'))
),
other_col as (
  select r || ':' || c.table_name || '.' || c.column_name || ':' || p || '=' ||
         has_column_privilege(r, format('public.%I', c.table_name), c.column_name, p)::text x
    from information_schema.columns c join tbl on tbl.t = c.table_name cross join roles
    cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES')) p(p)
   where c.table_schema = 'public'
),
other as (select string_agg(x, ',' order by x) l from (select x from other_tbl union all select x from other_col) s),
pol as (
  select string_agg(format('%s.%s:%s:%s:%s:%s:%s', c.relname, p.polname, p.polcmd, p.polpermissive,
           (select string_agg(coalesce(rr.rolname, 'public'), '+' order by 1) from unnest(p.polroles) x left join pg_roles rr on rr.oid = x),
           coalesce(pg_get_expr(p.polqual, p.polrelid), '-'), coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '-')), E'\n' order by c.relname, p.polname) l
    from pg_policy p join pg_class c on c.oid = p.polrelid
   where c.relnamespace = 'public'::regnamespace and c.relname in (select t from tbl)
),
trg as (
  select string_agg(c.relname || '.' || g.tgname || ':' || g.tgfoid::regproc::text || ':' || g.tgenabled::text || ':' || g.tgtype::text, ',' order by c.relname, g.tgname) l
    from pg_trigger g join pg_class c on c.oid = g.tgrelid
   where not g.tgisinternal and c.relnamespace = 'public'::regnamespace and c.relname in (select t from tbl)
),
fk as (
  select string_agg(conrelid::regclass::text || '.' || conname || ':' || pg_get_constraintdef(oid), ',' order by conrelid::regclass::text, conname) l
    from pg_constraint
   where contype = 'f' and (confrelid in (select format('public.%I', t)::regclass from tbl) or conrelid in (select format('public.%I', t)::regclass from tbl))
)
select
  case when exists (select 1 from del where d) then 'before' else 'after' end state,
  (select string_agg(r || ':' || t || '=' || case when d then 'DELETE' else '-' end, ' ' order by r, t) from del) delete_rights,
  case when exists (select 1 from del where d) then 'STOP delete still open: ' || (select string_agg(r || ':' || t, ',' order by r, t) from del where d)
       else 'OK' end delete_verdict,
  (select string_agg(relname || '=' || relrowsecurity::text, ' ' order by relname) from pg_class
    where relnamespace = 'public'::regnamespace and relname in (select t from tbl)) rls,
  md5((select l from other)) other_rights_md5,
  md5((select l from pol)) policies_md5,
  md5(coalesce((select l from trg), '')) triggers_md5,
  md5((select l from fk)) fks_md5,
  (select count(*) from public.farms) farms, (select count(*) from public.shops) shops, (select count(*) from public.services) services,
  (select json_object_agg(type, n) from (select type, count(*) n from public.workspaces group by type) w) workspaces_by_type,
  (select count(*) from public.workspace_members) members,
  (select count(*) from public.workspace_invitations) invitations,
  (select l from pol) policies_list,
  (select l from trg) triggers_list;

-- H2 read-only audit (docs/SECURITY_PHASE1.md §H2). Run inside `begin read only; … rollback;` by the owner or with
-- the owner's go-ahead. COUNTS ONLY — no emails, names or ids. A follow-up list for the candidates (ids only) is a
-- separate, explicit request.
-- prereg_pattern: accounts that have a password (email/password signup) AND an OAuth identity whose identity was added
--   LATER than the account was created — the shape of a pre-registration takeover (attacker signs up with the victim's
--   email; the victim later signs in with Google and is linked in). Also matches honest users who added Google later,
--   so it sizes the review, it does not prove abuse.
-- line_real_email: accounts created by the LINE flow with a real (non-placeholder) email — confirmed on LINE's word.
-- legacy_line_*: inputs of the backfill (supabase/scripts/line_identity_backfill.mjs).
with ids as (
  select i.user_id, i.provider, min(i.created_at) first_at from auth.identities i group by 1, 2
)
select
  (select count(*) from auth.users) users,
  (select count(*) from auth.users where encrypted_password is not null and encrypted_password <> '') with_password,
  (select count(*) from auth.users where email_confirmed_at is null) unconfirmed,
  (select count(distinct u.id) from auth.users u join ids o on o.user_id = u.id and o.provider in ('google', 'facebook')
     where u.encrypted_password is not null and u.encrypted_password <> '' and o.first_at > u.created_at + interval '1 minute') prereg_pattern,
  (select count(*) from auth.users u where (u.raw_user_meta_data ->> 'provider') = 'line'
     and u.email not like '%@line.whiskora.internal') line_real_email,
  (select count(*) from auth.users where nullif(raw_user_meta_data ->> 'line_id', '') is not null) legacy_line_user_metadata,
  (select count(*) from auth.users where nullif(raw_app_meta_data ->> 'line_id', '') is not null) line_app_metadata,
  (select count(*) from (select raw_user_meta_data ->> 'line_id' l from auth.users where nullif(raw_user_meta_data ->> 'line_id', '') is not null
     group by 1 having count(*) > 1) d) legacy_line_duplicates,
  (select count(*) from auth.users where email like '%@line.whiskora.internal') placeholder_accounts;

-- Hotfix: users cannot approve their own farm verification.
-- Before (checked on staging): the farm owner could UPDATE farms.is_verified / verified_at / verification_status /
-- verification_note directly ("Users can manage own farms", all columns) and INSERT a farm already verified; the
-- owner could also write farm_verifications.status = 'approved', reviewed_at / reviewed_by / admin_note, and submit a
-- request for a farm they do not own.
--
-- After, for API roles (anon / authenticated — admins included; system paths and SECURITY DEFINER RPCs unaffected):
--   farms INSERT : is_verified false, verified_at / verification_status / verification_note empty.
--   farms UPDATE : is_verified, verified_at, verification_note unchanged; verification_status may only move
--                  null | 'rejected' → 'pending', and only while the caller has a pending request for that farm
--                  (the verify page inserts the request first).
--   farm_verifications INSERT : only for a farm the caller owns; status 'pending'; no review fields; phone not verified.
--   farm_verifications UPDATE : farm, user, status and review fields cannot change.
-- Admin decisions go through admin_review_farm_verification (admin check, sets farms + request, audit log) — the
-- admin page is switched to it in the same PR. Existing rows are not changed (no back-fill / reset).

create or replace function public.farms_verification_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if coalesce(new.is_verified, false) or new.verified_at is not null or new.verification_status is not null
       or new.verification_note is not null then
      raise exception 'verification is decided by an admin' using errcode = '42501';
    end if;
    new.is_verified := false;
    return new;
  end if;
  if new.is_verified is distinct from old.is_verified or new.verified_at is distinct from old.verified_at
     or new.verification_note is distinct from old.verification_note then
    raise exception 'verification is decided by an admin' using errcode = '42501';
  end if;
  if new.verification_status is distinct from old.verification_status then
    if not (new.verification_status = 'pending' and (old.verification_status is null or old.verification_status = 'rejected')
            and exists (select 1 from public.farm_verifications v
                         where v.farm_id = new.id and v.user_id = auth.uid()::text and v.status = 'pending')) then
      raise exception 'verification is decided by an admin' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.farms_verification_guard() from public, anon;
grant execute on function public.farms_verification_guard() to authenticated;

drop trigger if exists farms_verification_guard on public.farms;
create trigger farms_verification_guard before insert or update on public.farms
  for each row execute function public.farms_verification_guard();

create or replace function public.farm_verifications_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.user_id is distinct from auth.uid()::text
       or not exists (select 1 from public.farms f where f.id = new.farm_id and f.user_id = auth.uid()::text) then
      raise exception 'a verification request needs ownership of the farm' using errcode = '42501';
    end if;
    if coalesce(new.status, 'pending') <> 'pending' or new.reviewed_at is not null or new.reviewed_by is not null
       or new.admin_note is not null or coalesce(new.phone_verified, false) then
      raise exception 'verification is decided by an admin' using errcode = '42501';
    end if;
    new.status := 'pending';
    return new;
  end if;
  if new.farm_id is distinct from old.farm_id or new.user_id is distinct from old.user_id
     or new.status is distinct from old.status or new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by or new.admin_note is distinct from old.admin_note
     or new.phone_verified is distinct from old.phone_verified then
    raise exception 'verification is decided by an admin' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public.farm_verifications_guard() from public, anon;
grant execute on function public.farm_verifications_guard() to authenticated;

drop trigger if exists farm_verifications_guard on public.farm_verifications;
create trigger farm_verifications_guard before insert or update on public.farm_verifications
  for each row execute function public.farm_verifications_guard();

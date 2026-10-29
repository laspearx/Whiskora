#!/usr/bin/env python3
"""Privacy checks over the real Supabase HTTP API (PostgREST + RPC + Storage) on whiskora-staging.

Signs in the synthetic QA accounts from supabase/staging/seed_synthetic.sql and checks what each
role can read/write. Expectations are the AFTER-migration target; run it before the migration to
record the baseline (the leak shows up as FAIL).

  STAGING_URL=https://<ref>.supabase.co STAGING_ANON_KEY=... python3 -I staging_api_checks.py <phase>

The password is read from ~/.whiskora/staging_qa_password (chmod 600, never in the repo).
Prints only status codes, row counts and synthetic markers — never tokens or the password.
"""
import json, os, sys, time, urllib.request, urllib.error

URL = os.environ["STAGING_URL"].rstrip("/")
KEY = os.environ["STAGING_ANON_KEY"]
assert "wpxcukrwmegwzfccbbga" in URL, "refusing: not whiskora-staging"
PW = open(os.path.expanduser("~/.whiskora/staging_qa_password")).read().strip()
PHASE = sys.argv[1] if len(sys.argv) > 1 else "run"

U = {k: f"a0000000-0000-4000-8000-00000000000{i}" for i, k in enumerate("OMSVBXA", 1)}
EMAIL = {"O": "owner", "M": "manager", "S": "staff", "V": "viewer", "B": "buyer", "X": "stranger", "A": "admin"}
P1, P2, P3 = 900001, 900002, 900003
ADMIN_ARGS = {"p_search": None, "p_limit": 5000, "p_offset": 0}   # same call as the admin pages


def http(method, path, token=None, body=None, prefer=None):
    h = {"apikey": KEY, "Authorization": f"Bearer {token or KEY}", "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    req = urllib.request.Request(URL + path, method=method, headers=h,
                                 data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, raw.decode(errors="replace")[:200]


def sign_in(k):
    s, b = http("POST", "/auth/v1/token?grant_type=password",
                body={"email": f"whiskora-qa+{EMAIL[k]}@example.com", "password": PW})
    assert s == 200, f"sign-in {k} failed: {s} {str(b)[:120]}"
    return b["access_token"]


def outcome(status, body):
    """'denied' | 'missing' (function/column absent) | 'rows=N' | 'http=N'"""
    if status in (401, 403) or (isinstance(body, dict) and body.get("code") == "42501"):
        return "denied"
    if isinstance(body, dict) and body.get("code") in ("PGRST202", "42883"):
        return "missing"
    if 200 <= status < 300:
        return f"rows={len(body) if isinstance(body, list) else (0 if body is None else 1)}"
    return f"http={status}:{body.get('code') if isinstance(body, dict) else ''}"


results = []


def check(name, expect, status, body, note=""):
    got = outcome(status, body)
    ok = got == expect if not expect.startswith("rows>=") else (
        got.startswith("rows=") and int(got[5:]) >= int(expect[6:]))
    results.append((name, expect, got, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name:<58} expect={expect:<9} got={got} {note}")


def get(name, expect, path, tok=None):
    s, b = http("GET", path, tok)
    check(name, expect, s, b)
    return s, b


def rpc(name, expect, fn, args, tok=None):
    s, b = http("POST", f"/rest/v1/rpc/{fn}", tok, args)
    check(name, expect, s, b)
    return s, b


tok = {k: sign_in(k) for k in U}
print(f"== phase {PHASE}: signed in {len(tok)} QA accounts")

# ── anon ─────────────────────────────────────────────────────────────────────
get("anon profiles.email", "denied", "/rest/v1/profiles?select=email")
get("anon profiles.phone,address", "denied", "/rest/v1/profiles?select=phone,address")
get("anon profiles.location (explicit col ACL)", "denied", "/rest/v1/profiles?select=location")
get("anon profiles select=*", "denied", "/rest/v1/profiles?select=*")
get("anon profiles public card", "rows>=7", "/rest/v1/profiles?select=id,full_name,username,avatar_url,cover_url")
get("anon pets allergies,blood_type", "denied", "/rest/v1/pets?select=allergies,blood_type")
get("anon pets select=*", "denied", "/rest/v1/pets?select=*")
get("anon pets public list (P1 only)", "rows=1", "/rest/v1/pets?select=id,name,status&id=in.(900001,900002,900003)")
rpc("anon rpc get_pet_health(P1)", "rows=0", "get_pet_health", {"p_pet_id": P1})
rpc("anon rpc find_user_by_email", "denied", "find_user_by_email", {"p_email": "whiskora-qa+owner@example.com"})
rpc("anon rpc search_users_for_invite", "denied", "search_users_for_invite", {"p_query": "QA"})
rpc("anon rpc get_my_profile", "denied", "get_my_profile", {})
rpc("anon rpc admin_get_users", "http=400:P0001", "admin_get_users", ADMIN_ARGS)
for t, n in (("vaccines", 0), ("pet_weights", 0), ("pet_activities", 0), ("pet_documents", 0)):
    get(f"anon {t} of P1", f"rows={n}", f"/rest/v1/{t}?select=id&pet_id=eq.{P1}")
s, b = http("PATCH", f"/rest/v1/profiles?id=eq.{U['O']}", None, {"full_name": "hacked"}, "return=representation")
check("anon PATCH owner profile", "denied", s, b)

# ── signed-in: private columns of OTHER people ─────────────────────────────
for k in "OBX":
    get(f"{k} profiles.email of others", "denied", f"/rest/v1/profiles?select=email&id=neq.{U[k]}", tok[k])
    get(f"{k} pets.allergies (any)", "denied", "/rest/v1/pets?select=allergies", tok[k])

# ── owner reads + edits own data ───────────────────────────────────────────
for k in "OX":
    s, b = rpc(f"{k} rpc get_my_profile = own row", "rows=1", "get_my_profile", {}, tok[k])
    if isinstance(b, list) and b:
        own = b[0]["id"] == U[k] and b[0]["email"] == f"whiskora-qa+{EMAIL[k]}@example.com"
        check(f"{k} get_my_profile has own email + id", "rows=1", 200, [1] if own else [])
s, b = http("PATCH", f"/rest/v1/profiles?id=eq.{U['O']}", tok["O"],
            {"phone": "0800000111", "address": "QA address O edited", "updated_at": "now()"}, "return=minimal")
check("O PATCH own phone/address (return=minimal)", "rows=0", s, b)
s, b = http("POST", "/rest/v1/rpc/get_my_profile", tok["O"], {})
check("O edit persisted (via get_my_profile)", "rows=1", s,
      [1] if isinstance(b, list) and b and b[0].get("phone") == "0800000111" else [])
s, b = http("PATCH", f"/rest/v1/profiles?id=eq.{U['O']}", tok["O"], {"phone": "0800000001"}, "return=minimal")
s, b = http("PATCH", f"/rest/v1/profiles?id=eq.{U['X']}", tok["X"], {"role": "admin"}, "return=minimal")
check("X PATCH own role=admin", "denied", s, b, f"[{b.get('code') if isinstance(b, dict) else ''}]")
s, b = http("POST", "/rest/v1/profiles", tok["X"], {"id": U["X"], "role": "admin"},
            "resolution=merge-duplicates,return=minimal")
check("X upsert own profile with role=admin", "denied", s, b, f"[{b.get('code') if isinstance(b, dict) else ''}]")
s, b = http("PATCH", f"/rest/v1/profiles?id=eq.{U['O']}&select=id", tok["X"], {"full_name": "hacked"}, "return=representation")
check("X PATCH owner's profile (RLS: 0 rows)", "rows=0", s, b)
# return=representation without select= means SELECT * → needs the revoked columns → denied for everyone
s, b = http("PATCH", f"/rest/v1/profiles?id=eq.{U['O']}", tok["O"], {"updated_at": "now()"}, "return=representation")
check("O PATCH own profile returning * (needs column list)", "denied", s, b)

# ── pet health via RPC: tier 'owner' (+ farm_team, platform_admin) ──────────
health = {P1: "OMSVA", P2: "OA", P3: "XA"}
for pet, allowed in health.items():
    for k in "OMSVBXA":
        rpc(f"{k} get_pet_health(P{pet - 900000})", "rows=1" if k in allowed else "rows=0",
            "get_pet_health", {"p_pet_id": pet}, tok[k])

# ── related tables, signed in ───────────────────────────────────────────────
vis = {"vaccines": "OMSVBA",           # engaged: reserved buyer sees
       "pet_weights": "OMSVBA",
       "pet_activities": "OMSVA",      # medical_notes: private → farm team/admin only
       "pet_documents": "OMSVA"}       # documents: private
for t, allowed in vis.items():
    for k in "OMSVBXA":
        get(f"{k} {t} of P1", "rows=1" if k in allowed else "rows=0",
            f"/rest/v1/{t}?select=id&pet_id=eq.{P1}", tok[k])

# ── user lookup RPCs ─────────────────────────────────────────────────────────
s, b = rpc("O find_user_by_email(exact buyer)", "rows=1", "find_user_by_email",
           {"p_email": "WHISKORA-QA+buyer@example.com "}, tok["O"])
if isinstance(b, list) and b:
    check("find_user_by_email returns no email field", "rows=1", 200, [] if "email" in b[0] else [1])
rpc("O search_users_for_invite(email prefix)", "rows=0", "search_users_for_invite", {"p_query": "whiskora-qa"}, tok["O"])
rpc("O search_users_for_invite(name 'QA Bu')", "rows=1", "search_users_for_invite", {"p_query": "QA Bu"}, tok["O"])
rpc("O search_users_for_invite(1 char)", "rows=0", "search_users_for_invite", {"p_query": "Q"}, tok["O"])
rpc("X admin_get_users (not admin)", "http=400:P0001", "admin_get_users", ADMIN_ARGS, tok["X"])
rpc("A admin_get_users (admin)", "rows>=7", "admin_get_users", ADMIN_ARGS, tok["A"])

# ── pet writes by owner keep working; others cannot ─────────────────────────
s, b = http("PATCH", f"/rest/v1/pets?id=eq.{P1}", tok["O"], {"allergies": "QA-ALLERGY-P1-EDIT"}, "return=minimal")
check("O PATCH own pet health (return=minimal)", "rows=0", s, b)
s, b = http("POST", "/rest/v1/rpc/get_pet_health", tok["O"], {"p_pet_id": P1})
check("O pet health edit persisted", "rows=1", s,
      [1] if isinstance(b, list) and b and b[0]["allergies"] == "QA-ALLERGY-P1-EDIT" else [])
http("PATCH", f"/rest/v1/pets?id=eq.{P1}", tok["O"], {"allergies": "QA-ALLERGY-P1"}, "return=minimal")
s, b = http("PATCH", f"/rest/v1/pets?id=eq.{P1}&select=id", tok["X"], {"allergies": "x"}, "return=representation")
check("X PATCH owner's pet", "rows=0", s, b)
s, b = http("POST", "/rest/v1/pets?select=id", tok["O"],
            {"name": "QA temp pet", "species": "แมว", "user_id": U["O"], "allergies": "QA-T"}, "return=representation")
check("O INSERT pet returning id", "rows=1", s, b)
if isinstance(b, list) and b:
    s, b = http("DELETE", f"/rest/v1/pets?id=eq.{b[0]['id']}", tok["O"], None, "return=minimal")
    check("O DELETE temp pet", "rows=0", s, b)

# ── storage: private buckets are readable only from the owner's own folder (+ admin for verification) ──
def storage(method, path, token=None, data=None, ctype=None):
    h = {"apikey": KEY, "Authorization": f"Bearer {token or KEY}", "x-upsert": "true"}
    if ctype:
        h["Content-Type"] = ctype
    req = urllib.request.Request(f"{URL}/storage/v1/object/{path}", method=method, headers=h, data=data)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


def scheck(name, expect_ok, status):
    got = "ok" if 200 <= status < 300 else f"http={status}"
    ok = (got == "ok") == expect_ok
    results.append((name, "ok" if expect_ok else "blocked", got, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {name:<58} expect={'ok' if expect_ok else 'blocked':<9} got={got}")


JPG = b"\xff\xd8\xff\xe0QA-synthetic\xff\xd9"
for bucket, ctype, body, readers in (("pet-documents", "application/pdf", b"%PDF-1.4 QA synthetic", "O"),
                                     ("verification-docs", "image/jpeg", JPG, "OA")):
    # unique name: verification-docs has no UPDATE/DELETE policy, so earlier test files stay and cannot be upserted
    obj = f"{bucket}/{U['O']}/qa-{PHASE}-{int(time.time())}.{'pdf' if 'pdf' in ctype else 'jpg'}"
    scheck(f"O upload {bucket} own folder", True, storage("POST", obj, tok["O"], body, ctype))
    scheck(f"anon download {bucket}", False, storage("GET", obj))
    for k in "OMXA":
        scheck(f"{k} download {bucket} (owner's file)", k in readers, storage("GET", f"authenticated/{obj}", tok[k]))
    storage("DELETE", obj, tok["O"])

passed = sum(r[3] for r in results)
print(f"== phase {PHASE}: {passed} passed, {len(results) - passed} failed, 0 skipped (of {len(results)})")
json.dump([dict(zip(("name", "expect", "got", "pass"), r)) for r in results],
          open(os.path.join(os.environ.get("RESULTS_DIR", "."), f"api_{PHASE}.json"), "w"), indent=1)

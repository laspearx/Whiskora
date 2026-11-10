# F4 Phase D2 — browser UAT, part A: real user sessions (no LINE needed)

Preview (branch alias, Vercel Authentication required — sign in to Vercel first):
**https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app/th/login**
Backend: Supabase **staging** only. LINE buttons on this Preview still say "LINE ปิดใช้งานในเวอร์ชันทดสอบ" until part B.

## Test account (staging only, synthetic — you choose the password; it never goes into chat, GitHub or a report)
Supabase dashboard → **whiskora-staging** → Authentication → Users → **Add user → Create new user**:
email `f4uat+browser-<today>@example.com`, a password of your choice, tick **Auto Confirm User** → Create.
(Never use a production account or one of the 8 QA seed accounts.)

## Steps (write Pass / Fail / Not verified + the time for each; I check the staging database and logs alongside)
1. **Email login** — open the URL above → "เคยสมัครด้วยอีเมล? เข้าสู่ระบบที่นี่" → enter the test email + password →
   expect the profile page.
2. **GET /auth/v1/user with the real session** — DevTools (F12) → Network → filter `user` → reload the page →
   a request `…supabase.co/auth/v1/user` with **status 200** (Authorization: Bearer eyJ… = your session JWT).
3. **Session refresh** — DevTools → Application → Local Storage → the `sb-…-auth-token` entry shows `expires_at`;
   stay on the page ≥ 1 h (or come back later) and reload: still signed in, Network shows
   `auth/v1/token?grant_type=refresh_token` 200. (Short form: note the time, I confirm the refresh in the auth logs.)
4. **Profile / Connections** — Profile → การเชื่อมต่อ (Connections): page loads, LINE row shows not connected / disabled
   on preview, Google row shown, no error banner. Settings page loads.
5. **Dashboard regression** — open your profile, a pet list / farm or partner page you normally use, and the home page:
   no error page, data loads.
6. **Password update with the real session** — wherever the app lets you change the password (Profile → Settings), or
   use a second browser to confirm: change it → old password fails, new password works on a fresh login; a second
   browser signed in before the change is signed out on its next action.
7. **Logout + session revocation** — click ออกจากระบบ → back on login; DevTools Local Storage token removed; press
   Back / reload a protected page → asked to sign in. Tell me the time: I confirm the session is gone in staging.

When done: tell me the account email prefix (not the password). I delete that synthetic account and confirm the 8 QA
seed accounts, mappings, pending links, ops and freezes are untouched.

---
## Results — Owner Browser UAT, Part A (2026-11-10, Preview `a22f1b0` / `b048cb1`, Supabase staging)
Tested by the owner in their own browser. Kept separate from automated tests. Account: one new staging account made
through the site's signup (address not recorded here).

| # | Item | Owner result | Server evidence (staging auth / DB logs, read-only) |
|---|---|---|---|
| 1 | Email signup on the site | PASS | 08:01:10 `user_confirmation_requested` + `mail.send confirmation` |
| 2 | Login refused before confirmation | PASS | 08:01:26, 08:02:05 `/token` 400 `email_not_confirmed` |
| 3 | Confirmation mail received + confirmed | PASS | 08:03:00 `user_signedup` (303) |
| 4 | Login after confirmation | PASS | 08:03:00 implicit login; 08:07:11 password login |
| 5 | Profile page | PASS | — |
| 6 | Connections page | PASS | — |
| 7 | Dashboard | PASS | — |
| 8 | Logout | PASS | 08:06:00 `logout` 204; the pre-logout session row is gone (only the 08:07 password session remains) |
| 9 | Login again | PASS | 08:07:11 `login` (password) 200 |

Other log lines in the window: 4 × `/authorize` 400 `provider is not enabled` (07:57–07:59) = the Google button —
Google is disabled on staging (expected). Postgres: no errors. F4 tables: no mapping / pending / op / freeze.

Server-only evidence (not yet observed by the owner): `GET /auth/v1/user` 200 with the user's session at 08:03:02 from
the Preview. Still **NOT VERIFIED**: session refresh, password update with the user's session, refresh-token refusal
after logout (owner-observed), Google OAuth (disabled on staging), all LINE items (Part B).

Product note: the app has no in-app "change password" or "forgot password" screen (no `updateUser({ password })` /
`resetPasswordForEmail` in the code) — the password test below uses the browser console.

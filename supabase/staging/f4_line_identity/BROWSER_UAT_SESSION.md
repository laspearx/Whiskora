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

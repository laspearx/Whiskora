# LINE account recovery — runbook (F4)

For legacy LINE-only accounts (made before F4) whose owner is signed out everywhere. Owners still signed in on any
device should use **Profile → การเชื่อมต่อ → เชื่อม LINE** instead (no admin needed).

## 1. The request
The user signs in with LINE and sees "ต้องยืนยันบัญชีเดิมก่อน" + an 8-character reference. That sign-in proved the
LINE account and stored a request on the legacy account (`line_identity_ops`). The user sends the reference through
the support channel shown on the page. **Never accept a LINE id, email or user id typed by the user.**

## 2. Review (≥ 2 checks on the OLD ACCOUNT, out of band)
```
node supabase/scripts/line_identity_recovery.mjs list --project <ref> [--production]
node supabase/scripts/line_identity_recovery.mjs evidence --request <ref8> --project <ref> [--production]
```
Ask about data that is NOT public: number of pets marked private, the latest income / expense entry, an appointment
in the calendar, a vaccine date of a private pet. Do not use name, profile photo, or anything on public pet / farm pages.
Insufficient → decline (account stays as is; nothing deleted):
```
node … decline --request <ref8> --version <n> --actor <your name> --reason "<why>" --project <ref> --apply
```

## 3. Approve
Dry run first, then `--apply`. The full user id comes from the Supabase dashboard (Auth → Users) for the account
the evidence shows — the script refuses an id that does not match the request.
```
node … approve --request <ref8> --user <full uuid> --version <n> --actor <your name> \
  --reason "<how you verified>" --check "<check 1>" --check "<check 2>" --project <ref> [--production] [--apply]
```
The script: begin (version, freshness ≤ 14 days, reviewer, ≥ 2 checks) → password rotated (every device signed
out) → database verifies the reset → LINE id mapped. Everything is in `line_identity_audit`.
- `rotation failed` → request back to open; run approve again with the new version.
- `reset not verified` / crash after the reset → `node … resume --request <ref8> [--user <uuid>] --apply`.
- `mapping refused` → request `failed`; investigate (another holder?) before anything else.
Access tokens issued before the reset stay valid until they expire — watch the account for that window.
Optional local log: `F4_RECOVERY_LOG=/path/recovery.jsonl` (owner's machine only, never committed).

## 4. Tell the user (templates)
- Approved: "ยืนยันบัญชีเรียบร้อยแล้ว เข้าสู่ระบบด้วย LINE ได้ตามปกติ อุปกรณ์อื่นถูกออกจากระบบเพื่อความปลอดภัย"
- Declined: "ยังยืนยันความเป็นเจ้าของบัญชีเดิมไม่ได้ ข้อมูลบัญชียังอยู่ครบ หากมีข้อมูลเพิ่มเติมติดต่อทีมงานได้อีกครั้ง"

Service-role key: only on the reviewer's machine, never in chat, never committed.

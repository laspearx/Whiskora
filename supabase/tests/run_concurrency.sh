#!/usr/bin/env bash
# Two sessions confirm two different reservations of the same pet at the same moment,
# then two sessions accept the same transfer at the same moment. Synthetic data only.
set -euo pipefail
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
cd "$(dirname "$0")"
C=whiskora-pgconc
docker rm -f $C >/dev/null 2>&1 || true
docker run -d --name $C -e POSTGRES_PASSWORD=test postgres:15 >/dev/null
until docker exec $C pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done; sleep 1
q() { docker exec -i $C psql -U postgres -v ON_ERROR_STOP=0 -qtA "$@"; }
cat stub_schema.sql ../migrations/20261029100000_private_columns.sql ../migrations/20261029200000_reservation_transfer_pipeline.sql | q >/dev/null
q -c "insert into pet_reservations (id, pet_id, buyer_id) values (301,1,'bbbbbbbb-0000-0000-0000-000000000002'),(302,1,'dddddddd-0000-0000-0000-000000000004');"
as_owner="set role authenticated; select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);"
as_mgr="set role authenticated; select set_config('request.jwt.claim.sub','eeeeeeee-0000-0000-0000-000000000005',false);"
( q -c "$as_owner" -c "begin; select reservation_status from farm_set_reservation_status(301,'confirmed'); select pg_sleep(1); commit;" > $T/c1.txt 2>&1 ) &
( sleep 0.2; q -c "$as_mgr" -c "begin; select reservation_status from farm_set_reservation_status(302,'confirmed'); commit;" > $T/c2.txt 2>&1 ) &
wait
echo "session A: $(grep -E 'confirmed|ERROR' $T/c1.txt | tr '\n' ' ')"
echo "session B: $(grep -E 'confirmed|ERROR' $T/c2.txt | tr '\n' ' ')"
echo "confirmed rows: $(q -c "select count(*) from pet_reservations where pet_id=1 and status='confirmed'")  pet status: $(q -c "select status from pets where id=1")"
# double click: same reservation confirmed twice concurrently
q -c "update pet_reservations set status='cancelled' where id in (301,302); update pets set status='เปิดจอง' where id=1; insert into pet_reservations (id,pet_id,buyer_id) values (303,1,'bbbbbbbb-0000-0000-0000-000000000002');"
( q -c "$as_owner" -c "select reservation_status from farm_set_reservation_status(303,'confirmed');" > $T/d1.txt 2>&1 ) &
( q -c "$as_owner" -c "select reservation_status from farm_set_reservation_status(303,'confirmed');" > $T/d2.txt 2>&1 ) &
wait
echo "double-click A: $(grep -E 'confirmed|ERROR' $T/d1.txt | tr '\n' ' ') | B: $(grep -E 'confirmed|ERROR' $T/d2.txt | tr '\n' ' ')"
# concurrent accept of the same transfer
q -c "insert into pet_ownership_transfers (id,pet_id,from_user_id,to_user_id,initiated_by,reservation_id) values (401,1,'aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001',303);"
as_buyer="set role authenticated; select set_config('request.jwt.claim.sub','bbbbbbbb-0000-0000-0000-000000000002',false);"
( q -c "$as_buyer" -c "update pet_ownership_transfers set status='accepted' where id=401 and status='pending';" > $T/e1.txt 2>&1 ) &
( q -c "$as_buyer" -c "update pet_ownership_transfers set status='accepted' where id=401 and status='pending';" > $T/e2.txt 2>&1 ) &
wait
echo "accept results: $(q -c "select count(*) from pet_ownership_transfers where id=401 and status='accepted'") accepted row; reservation: $(q -c "select status from pet_reservations where id=303"); owner is buyer: $(q -c "select user_id='bbbbbbbb-0000-0000-0000-000000000002' from pets where id=1")"
docker rm -f $C >/dev/null

#!/usr/bin/env bash
# Usage: PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run.sh
set -e
cd "$(dirname "$0")/../.."
P="psql -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists funnybloxy_test" -c "create database funnybloxy_test"
for f in supabase/tests/stubs.sql supabase/migrations/*.sql supabase/seed.sql supabase/tests/smoke.sql supabase/tests/exam_review.sql supabase/tests/shop.sql; do
  $P -d funnybloxy_test -f "$f"
done

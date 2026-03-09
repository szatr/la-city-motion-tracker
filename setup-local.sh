#!/bin/bash
set -e

DB_USER="motion_tracker"
DB_NAME="motion_tracker"
DB_PASS="motion_tracker"
DB_PORT="${PGPORT:-5432}"

echo "Creating Postgres user '$DB_USER'..."
psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;" 2>/dev/null \
  || psql postgres -c "ALTER USER $DB_USER CREATEDB;" \
  && echo "  Granted CREATEDB."

echo "Creating database '$DB_NAME'..."
psql postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null \
  || echo "  Database already exists, skipping."

echo "Writing .env..."
cat > .env <<EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:$DB_PORT/$DB_NAME?schema=public"
CRON_SECRET="dev-secret"
EOF

echo "Running Prisma migration..."
npx prisma migrate dev --name init

echo ""
echo "Done! Run 'npx tsx scripts/seed.ts' to import the spreadsheet."

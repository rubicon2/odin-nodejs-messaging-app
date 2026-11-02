#! /usr/bin/env bash

exit_on_fail() {
  if [[ $? -ne 0 ]]; then
    exit 1
  fi
}

echo "Building client..."
pnpm build
exit_on_fail

# Start database and detach from terminal.
echo "Starting docker containers..."
docker compose up -d
# Since container gets detached, need to wait for last process to finish.
wait $!
exit_on_fail

# Just because container is ready does not mean database is ready!
max_attempts=5
current_attempt=0

while
  # Give the db time to initialize.
  sleep 1
  current_attempt=$((current_attempt + 1))
  echo "checking db is ready, attempt ${current_attempt}/${max_attempts}..."
  # If DATABASE_URL ends with ?schema=schema_name then it will fail.
  # So that env variable needs to end with the database name.
  pg_isready -d "${DATABASE_URL}"
  [[ $? -ne 0 && ${current_attempt} -lt ${max_attempts} ]]
do true
done

# If last call to pg_isready had a non-zero
# exit code, db is not ready and probably failed
# to initialize. Because loop condition runs, the
# exit code from pg_isready has been overwritten,
# so run pg_isready again here so we can get the
# exit code.
pg_isready -q -d "${DATABASE_URL}"
exit_on_fail

# Set up the containerized database.
echo "Resetting database..."
npx prisma migrate reset --force
exit_on_fail

echo "Performing database migrations..."
pnpm db:deploy
exit_on_fail

echo "Database is ready"
exit 0

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
# Since container gets detached, need to wait.
wait
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

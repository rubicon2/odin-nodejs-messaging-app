#! /usr/bin/env bash

exit_on_fail() {
  if [[ $? -ne 0 ]]; then
    exit 1
  fi
}

echo "Shutting down docker containers..."
# -v removes volumes.
docker compose down -v
exit_on_fail

echo "Pruning docker cache..."
docker system prune -f
exit_on_fail
echo "Done"
exit 0

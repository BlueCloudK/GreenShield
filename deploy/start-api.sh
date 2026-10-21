#!/bin/sh
set -eu

runtime_env=/opt/greenshield/runtime.env
if [ ! -f "$runtime_env" ] || ! grep -Eq '^DATABASE_URL=postgres(ql)?://' "$runtime_env"; then
    echo 'Configure /opt/greenshield/runtime.env with the Supabase connection URI first.' >&2
    exit 1
fi
chmod 600 "$runtime_env"
if docker container inspect greenshield-api >/dev/null 2>&1; then
    docker stop --time 40 greenshield-api
    docker rm greenshield-api
fi
docker run -d --name greenshield-api --restart unless-stopped \
    --env-file "$runtime_env" \
    -e HOST=0.0.0.0 -e PORT=3000 -e NODE_ENV=production \
    -e APP_ORIGIN=http://127.0.0.1:3000 \
    -p 127.0.0.1:3000:3000 greenshield-api:postgres

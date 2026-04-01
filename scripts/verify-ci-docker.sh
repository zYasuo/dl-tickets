
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

docker run --rm -v "${ROOT}:/ws:ro" node:22-bookworm bash -lc "
set -euo pipefail
mkdir -p /tmp/b /tmp/f
tar -C /ws --exclude='backend/node_modules' -cf - backend | tar -C /tmp/b -xf -
tar -C /ws --exclude='frontend/node_modules' -cf - frontend | tar -C /tmp/f -xf -

cd /tmp/b/backend
npm ci
export DATABASE_URL=postgresql://ci:ci@localhost:5432/ci?schema=public
npm run lint:ci
npm run build
npm run test

cd /tmp/f/frontend
npm ci
export BACKEND_INTERNAL_URL=http://localhost:3000
npm run lint
npm run build
"

echo "verify-ci-docker: OK"

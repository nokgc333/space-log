#!/bin/bash
set -euo pipefail

MODE="${1:-all}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${SRC_DIR:-$REPO}"
PW_VERSION="$(node -p "require('$REPO/node_modules/@playwright/test/package.json').version")"
IMAGE="space-log-ci:pw$PW_VERSION"
STAGE_ROOT="$HOME/.cache/space-log-ci"

usage() {
  echo "usage: scripts/ci-linux/run.sh [all|check|e2e|perf]" >&2
  echo "  check  lint, typecheck, format, unit tests with coverage, build" >&2
  echo "  e2e    end-to-end tests" >&2
  echo "  perf   Lighthouse CI performance budgets" >&2
  echo "  all    the three above in one container (default)" >&2
}

INSTALL='npx --yes npm@11.19.0 ci'
CHECK='npm run lint && npm run typecheck && npm run format:check && npm run test:coverage && npm run build'
E2E='npm run test:e2e'
PERF='export CHROME_PATH="$(node -e "console.log(require(\"@playwright/test\").chromium.executablePath())")" && npm run build && npx lhci autorun --collect.settings.chromeFlags="--no-sandbox --headless=new"'

case "$MODE" in
  check) STEPS="$INSTALL && $CHECK" ;;
  e2e) STEPS="$INSTALL && $E2E" ;;
  perf) STEPS="$INSTALL && $PERF" ;;
  all) STEPS="$INSTALL && $CHECK && $E2E && $PERF" ;;
  *) usage; exit 1 ;;
esac

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "docker is not running" >&2
  exit 1
fi

if [ -z "$(docker images -q "$IMAGE")" ]; then
  docker build --build-arg "PW_VERSION=$PW_VERSION" -t "$IMAGE" "$REPO/scripts/ci-linux"
fi

mkdir -p "$STAGE_ROOT"
STAGE="$(mktemp -d "$STAGE_ROOT/run.XXXXXX")"
trap 'rm -r "$STAGE"' EXIT

if [ -d "$SRC/.git" ]; then
  (cd "$SRC" && git ls-files -co --exclude-standard -z) | rsync -a --from0 --files-from=- "$SRC"/ "$STAGE"/
else
  rsync -a --exclude=node_modules --exclude=.next "$SRC"/ "$STAGE"/
fi

docker run --rm --init --ipc=host -e CI=1 -v "$STAGE":/src:ro "$IMAGE" \
  bash -c "set -e; mkdir -p /work; cp -a /src/. /work/; cd /work; $STEPS"
echo "LINUX CI STEPS PASSED ($MODE)"

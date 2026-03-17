#!/bin/bash
# Dashboard Smoke Test
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# Default: http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo "=== Dashboard Smoke Test ==="
echo "Target: $BASE_URL"
echo ""

check() {
  local label="$1"
  local route="$2"
  local expected="$3"
  printf "  %-40s " "$label"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$route")
  if echo "$expected" | grep -q "$STATUS"; then
    echo "OK ($STATUS)"
    PASS=$((PASS + 1))
  else
    echo "FAIL ($STATUS) — expected one of: $expected"
    FAIL=$((FAIL + 1))
  fi
}

echo "── Auth & Pages ──"
check "Home / Command Center" "/" "200 302 307"
check "Task Board" "/tasks" "200 302 307"
check "Gantt Timeline" "/gantt" "200 302 307"
check "Risk Dashboard" "/risks" "200 302 307"
check "Pipeline Monitor" "/pipelines" "200 302 307"
check "Sign In" "/auth/signin" "200"

echo ""
echo "── API Routes (200=success, 401/307=auth gate working) ──"
check "GET /api/projects" "/api/projects" "200 401 307"
check "GET /api/tasks" "/api/tasks" "200 401 307"
check "GET /api/milestones" "/api/milestones/test" "200 401 404 307"
check "GET /api/risks" "/api/risks" "200 401 307"
check "GET /api/pipelines" "/api/pipelines" "200 401 307"
check "GET /api/knowledge-health" "/api/knowledge-health" "200 401 307"
check "GET /api/life-graph" "/api/life-graph" "200 401 307"
check "GET /api/life-graph/health" "/api/life-graph/health" "200 401 404 307"
check "GET /api/domains" "/api/domains" "200 401 307"
check "GET /api/gantt" "/api/gantt" "200 401 307"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1

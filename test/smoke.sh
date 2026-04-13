#!/usr/bin/env bash
# Smoke tests against a running wrangler dev instance.
# Usage: ./test/smoke.sh [base_url]
# Default base_url: http://localhost:8787

set -euo pipefail

BASE="${1:-http://localhost:8787}"
PASS=0
FAIL=0

ok()   { echo "  PASS: $1"; ((PASS++)); }
fail() { echo "  FAIL: $1"; ((FAIL++)); }

check() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if echo "$actual" | grep -q "$expected"; then
    ok "$label"
  else
    fail "$label (expected to find: $expected)"
    echo "       actual response: $(echo "$actual" | head -5)"
  fi
}

check_status() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [ "$actual" = "$expected" ]; then
    ok "$label"
  else
    fail "$label (expected status $expected, got $actual)"
  fi
}

echo "Running smoke tests against $BASE"
echo

echo "=== GET / ==="
check "support page loads" "$(curl -sf "$BASE/")" "Email Settings"

echo "=== GET /mail/config-v1.1.xml ==="
check "autoconfig XML" "$(curl -sf "$BASE/mail/config-v1.1.xml")" "clientConfig"

echo "=== GET /autodiscover/autodiscover.xml (no body) ==="
check "autodiscover GET" "$(curl -sf "$BASE/autodiscover/autodiscover.xml")" "Autodiscover"

echo "=== POST /autodiscover/autodiscover.xml ==="
BODY='<?xml version="1.0"?><Autodiscover><Request><EMailAddress>user@example.com</EMailAddress></Request></Autodiscover>'
check "autodiscover POST with email" \
  "$(curl -sf -X POST "$BASE/autodiscover/autodiscover.xml" -H 'Content-Type: text/xml' -d "$BODY")" \
  "user@example.com"

echo "=== POST /Autodiscover/Autodiscover.xml (case variant) ==="
check "autodiscover POST case variant" \
  "$(curl -sf -X POST "$BASE/Autodiscover/Autodiscover.xml" -H 'Content-Type: application/xml' -d "$BODY")" \
  "Autodiscover"

echo "=== GET /email.mobileconfig?email=user@example.com ==="
check "mobileconfig with full email" \
  "$(curl -sf "$BASE/email.mobileconfig?email=user@example.com")" \
  "plist"

echo "=== GET /email.mobileconfig?email=user (no @) ==="
check "mobileconfig with username only" \
  "$(curl -sf "$BASE/email.mobileconfig?email=user")" \
  "user@"

echo "=== GET /email.mobileconfig (missing param) → 400 ==="
STATUS=$(curl -so /dev/null -w "%{http_code}" "$BASE/email.mobileconfig")
check_status "mobileconfig missing email → 400" "$STATUS" "400"

echo
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1

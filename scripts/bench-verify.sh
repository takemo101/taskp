#!/usr/bin/env bash
# ベンチマーク結果の検証スクリプト
# Usage: bash scripts/bench-verify.sh <label> <extract.json> <review.json> <transform.json>
set -euo pipefail

LABEL="${1:-}"
EXTRACT_FILE="${2:-bench-extract-result.json}"
REVIEW_FILE="${3:-bench-review-result.json}"
TRANSFORM_FILE="${4:-bench-transform-result.json}"

echo "=========================================="
echo "  Benchmark Verification: ${LABEL}"
echo "=========================================="
echo ""

PASS=0
FAIL=0

check() {
  local desc="$1"
  local result="$2"
  if [[ "$result" == "true" ]]; then
    echo "  ✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc"
    FAIL=$((FAIL + 1))
  fi
}

# --- bench-extract ---
echo "📊 bench-extract ($EXTRACT_FILE)"

if [[ ! -f "$EXTRACT_FILE" ]]; then
  echo "  ❌ File not found"
  FAIL=$((FAIL + 7))
else
  # Engineering avg: (85000+95000+78000+102000)/4 = 90000
  AVG=$(python3 -c "import json; d=json.load(open('$EXTRACT_FILE')); print(d.get('engineering_avg_salary', 'MISSING'))" 2>/dev/null || echo "PARSE_ERROR")
  check "engineering_avg_salary = 90000 (got: $AVG)" "$([ "$AVG" = "90000" ] && echo true || echo false)"

  NAMES=$(python3 -c "
import json
d=json.load(open('$EXTRACT_FILE'))
names=d.get('rating_a_names', [])
print(','.join(names))
" 2>/dev/null || echo "PARSE_ERROR")
  EXPECTED="Alice,Charlie,Frank,Grace,Hank"
  check "rating_a_names = [$EXPECTED] (got: [$NAMES])" "$([ "$NAMES" = "$EXPECTED" ] && echo true || echo false)"

  ENG=$(python3 -c "import json; d=json.load(open('$EXTRACT_FILE')); print(d.get('department_counts',{}).get('Engineering','MISSING'))" 2>/dev/null || echo "PARSE_ERROR")
  check "Engineering count = 4 (got: $ENG)" "$([ "$ENG" = "4" ] && echo true || echo false)"

  MKT=$(python3 -c "import json; d=json.load(open('$EXTRACT_FILE')); print(d.get('department_counts',{}).get('Marketing','MISSING'))" 2>/dev/null || echo "PARSE_ERROR")
  check "Marketing count = 3 (got: $MKT)" "$([ "$MKT" = "3" ] && echo true || echo false)"

  SLS=$(python3 -c "import json; d=json.load(open('$EXTRACT_FILE')); print(d.get('department_counts',{}).get('Sales','MISSING'))" 2>/dev/null || echo "PARSE_ERROR")
  check "Sales count = 3 (got: $SLS)" "$([ "$SLS" = "3" ] && echo true || echo false)"

  VALID=$(python3 -c "import json; json.load(open('$EXTRACT_FILE')); print('true')" 2>/dev/null || echo "false")
  check "Valid JSON" "$VALID"

  KEYS=$(python3 -c "
import json
d=json.load(open('$EXTRACT_FILE'))
keys = {'engineering_avg_salary', 'rating_a_names', 'department_counts'}
print('true' if keys.issubset(d.keys()) else 'false')
" 2>/dev/null || echo "false")
  check "All required keys present" "$KEYS"
fi

echo ""

# --- bench-review ---
echo "🔍 bench-review ($REVIEW_FILE)"

if [[ ! -f "$REVIEW_FILE" ]]; then
  echo "  ❌ File not found"
  FAIL=$((FAIL + 8))
else
  VALID=$(python3 -c "import json; json.load(open('$REVIEW_FILE')); print('true')" 2>/dev/null || echo "false")
  check "Valid JSON" "$VALID"

  if [[ "$VALID" == "true" ]]; then
    HAS_ISSUES=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
print('true' if 'issues' in d and len(d['issues']) > 0 else 'false')
" 2>/dev/null)
    check "Has issues array with items" "$HAS_ISSUES"

    CATEGORIES=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
cats = set(i.get('category','') for i in d.get('issues',[]))
required = {'security', 'error_handling', 'type_safety', 'maintainability', 'validation'}
found = required.intersection(cats)
missing = required - cats
print(f'found={len(found)}/5 missing={missing if missing else \"none\"}')
" 2>/dev/null)
    ALL_CATS=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
cats = set(i.get('category','') for i in d.get('issues',[]))
required = {'security', 'error_handling', 'type_safety', 'maintainability', 'validation'}
print('true' if required.issubset(cats) else 'false')
" 2>/dev/null)
    check "All 5 categories detected ($CATEGORIES)" "$ALL_CATS"

    SQL_INJ=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
found = any('sql' in i.get('description','').lower() or 'injection' in i.get('description','').lower() or 'sql' in i.get('line_hint','').lower() for i in d.get('issues',[]))
print('true' if found else 'false')
" 2>/dev/null)
    check "SQL injection detected" "$SQL_INJ"

    ERR_SWALLOW=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
found = any('ignore' in i.get('description','').lower() or 'swallow' in i.get('description','').lower() or 'silent' in i.get('description','').lower() or 'catch' in i.get('line_hint','').lower() for i in d.get('issues',[]))
print('true' if found else 'false')
" 2>/dev/null)
    check "Error swallowing detected (sendWelcomeEmail)" "$ERR_SWALLOW"

    ANY_TYPE=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
found = any('any' in i.get('description','').lower() or 'any' in i.get('line_hint','').lower() for i in d.get('issues',[]))
print('true' if found else 'false')
" 2>/dev/null)
    check "any type usage detected (getUsers)" "$ANY_TYPE"

    SUMMARY_MATCH=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
s=d.get('summary',{})
issues=d.get('issues',[])
total_ok = s.get('total_issues') == len(issues)
crit = sum(1 for i in issues if i.get('severity')=='critical')
warn = sum(1 for i in issues if i.get('severity')=='warning')
info = sum(1 for i in issues if i.get('severity')=='info')
counts_ok = s.get('critical')==crit and s.get('warning')==warn and s.get('info')==info
print('true' if total_ok and counts_ok else 'false')
" 2>/dev/null)
    check "summary counts match issues array" "$SUMMARY_MATCH"

    FIELDS_OK=$(python3 -c "
import json
d=json.load(open('$REVIEW_FILE'))
required = {'category','severity','location','line_hint','description','suggestion'}
ok = all(required.issubset(i.keys()) for i in d.get('issues',[]))
print('true' if ok else 'false')
" 2>/dev/null)
    check "All issues have required fields" "$FIELDS_OK"
  fi
fi

echo ""

# --- bench-transform ---
echo "📊 bench-transform ($TRANSFORM_FILE)"

if [[ ! -f "$TRANSFORM_FILE" ]]; then
  echo "  ❌ File not found"
  FAIL=$((FAIL + 12))
else
  VALID=$(python3 -c "import json; json.load(open('$TRANSFORM_FILE')); print('true')" 2>/dev/null || echo "false")
  check "Valid JSON" "$VALID"

  if [[ "$VALID" == "true" ]]; then
    INFO_CNT=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(d.get('log_level_counts',{}).get('INFO','?'))" 2>/dev/null)
    check "INFO count = 13 (got: $INFO_CNT)" "$([ "$INFO_CNT" = "13" ] && echo true || echo false)"

    WARN_CNT=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(d.get('log_level_counts',{}).get('WARN','?'))" 2>/dev/null)
    check "WARN count = 3 (got: $WARN_CNT)" "$([ "$WARN_CNT" = "3" ] && echo true || echo false)"

    ERR_CNT=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(d.get('log_level_counts',{}).get('ERROR','?'))" 2>/dev/null)
    check "ERROR count = 3 (got: $ERR_CNT)" "$([ "$ERR_CNT" = "3" ] && echo true || echo false)"

    ERR_ARRAY_LEN=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(len(d.get('errors',[])))" 2>/dev/null)
    check "errors array has 3 items (got: $ERR_ARRAY_LEN)" "$([ "$ERR_ARRAY_LEN" = "3" ] && echo true || echo false)"

    BRUTE=$(python3 -c "
import json
d=json.load(open('$TRANSFORM_FILE'))
events = d.get('security_events',[])
found = any(e.get('severity')=='high' and (e.get('user','')=='charlie' or 'charlie' in e.get('detail','').lower()) for e in events)
print('true' if found else 'false')
" 2>/dev/null)
    check "Brute force for charlie detected (high)" "$BRUTE"

    RATE=$(python3 -c "
import json
d=json.load(open('$TRANSFORM_FILE'))
events = d.get('security_events',[])
found = any(e.get('severity')=='medium' or 'rate' in e.get('type','').lower() for e in events)
print('true' if found else 'false')
" 2>/dev/null)
    check "Rate limit event detected (medium)" "$RATE"

    EXT_IP=$(python3 -c "
import json
d=json.load(open('$TRANSFORM_FILE'))
events = d.get('security_events',[])
found = any('203.0.113' in str(e.get('ip','')) or 'external' in e.get('type','').lower() for e in events)
print('true' if found else 'false')
" 2>/dev/null)
    check "External IP access detected (low)" "$EXT_IP"

    AVG_MS=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(d.get('performance',{}).get('api_avg_response_ms','?'))" 2>/dev/null)
    check "API avg response ≈ 883ms (got: ${AVG_MS}ms)" "$(python3 -c "print('true' if abs(int('${AVG_MS}') - 883) <= 5 else 'false')" 2>/dev/null || echo false)"

    SLOW_CNT=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(len(d.get('performance',{}).get('slow_requests',[])))" 2>/dev/null)
    check "slow_requests has 2 items (got: $SLOW_CNT)" "$([ "$SLOW_CNT" = "2" ] && echo true || echo false)"

    ALICE=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(d.get('user_activity',{}).get('alice','?'))" 2>/dev/null)
    check "alice activity = 3 (got: $ALICE)" "$([ "$ALICE" = "3" ] && echo true || echo false)"

    CHARLIE=$(python3 -c "import json; d=json.load(open('$TRANSFORM_FILE')); print(d.get('user_activity',{}).get('charlie','?'))" 2>/dev/null)
    check "charlie activity = 4 (got: $CHARLIE)" "$([ "$CHARLIE" = "4" ] && echo true || echo false)"
  fi
fi

echo ""
echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=========================================="

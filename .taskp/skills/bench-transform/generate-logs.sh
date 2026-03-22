#!/usr/bin/env bash
set -euo pipefail

cat << 'EOF'
2026-03-22T01:00:12Z INFO  [auth] Login success user=alice ip=192.168.1.10 duration_ms=45
2026-03-22T01:00:15Z INFO  [api] GET /api/users 200 user=alice duration_ms=120
2026-03-22T01:00:18Z WARN  [api] GET /api/users/999 404 user=alice duration_ms=30
2026-03-22T01:01:00Z INFO  [auth] Login success user=bob ip=10.0.0.5 duration_ms=52
2026-03-22T01:01:05Z INFO  [api] POST /api/posts 201 user=bob duration_ms=250
2026-03-22T01:01:10Z ERROR [api] POST /api/posts 500 user=bob duration_ms=5000 error="database timeout"
2026-03-22T01:01:12Z ERROR [db] Connection pool exhausted active=50 max=50
2026-03-22T01:01:15Z WARN  [api] GET /api/health 503 duration_ms=15
2026-03-22T01:02:00Z INFO  [auth] Login failed user=charlie ip=203.0.113.50 reason="invalid password"
2026-03-22T01:02:05Z INFO  [auth] Login failed user=charlie ip=203.0.113.50 reason="invalid password"
2026-03-22T01:02:10Z INFO  [auth] Login failed user=charlie ip=203.0.113.50 reason="invalid password"
2026-03-22T01:02:15Z WARN  [auth] Rate limit triggered user=charlie ip=203.0.113.50
2026-03-22T01:03:00Z INFO  [auth] Login success user=diana ip=192.168.1.20 duration_ms=38
2026-03-22T01:03:05Z INFO  [api] GET /api/posts 200 user=diana duration_ms=85
2026-03-22T01:03:10Z INFO  [api] PUT /api/posts/42 200 user=diana duration_ms=150
2026-03-22T01:03:30Z INFO  [api] DELETE /api/posts/42 200 user=diana duration_ms=90
2026-03-22T01:04:00Z INFO  [auth] Login success user=eve ip=172.16.0.100 duration_ms=41
2026-03-22T01:04:05Z ERROR [api] GET /api/reports 500 user=eve duration_ms=3000 error="out of memory"
2026-03-22T01:04:10Z INFO  [api] GET /api/users 200 user=eve duration_ms=95
2026-03-22T01:05:00Z INFO  [system] Backup completed duration_ms=45000
EOF

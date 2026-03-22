#!/usr/bin/env bash
set -euo pipefail

cat << 'EOF'
[
  {"id": 1, "name": "Alice", "department": "Engineering", "salary": 85000, "years": 3, "rating": "A"},
  {"id": 2, "name": "Bob", "department": "Marketing", "salary": 62000, "years": 7, "rating": "B"},
  {"id": 3, "name": "Charlie", "department": "Engineering", "salary": 95000, "years": 5, "rating": "A"},
  {"id": 4, "name": "Diana", "department": "Sales", "salary": 71000, "years": 2, "rating": "C"},
  {"id": 5, "name": "Eve", "department": "Engineering", "salary": 78000, "years": 1, "rating": "B"},
  {"id": 6, "name": "Frank", "department": "Marketing", "salary": 58000, "years": 4, "rating": "A"},
  {"id": 7, "name": "Grace", "department": "Sales", "salary": 88000, "years": 6, "rating": "A"},
  {"id": 8, "name": "Hank", "department": "Engineering", "salary": 102000, "years": 8, "rating": "A"},
  {"id": 9, "name": "Ivy", "department": "Marketing", "salary": 67000, "years": 3, "rating": "B"},
  {"id": 10, "name": "Jack", "department": "Sales", "salary": 74000, "years": 5, "rating": "B"}
]
EOF

#!/usr/bin/env bash
set -euo pipefail
SRC=src
OUT=out
mkdir -p "$OUT"
javac -d "$OUT" $SRC/com/example/fitness/*.java
echo "Build succeeded. Output in $OUT"


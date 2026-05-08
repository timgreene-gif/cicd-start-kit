#!/usr/bin/env bash
# Build a distributable zip of the screensaver.
# Usage: ./screensaver/package.sh
#
# Output: hardware-screensaver.zip in the repo root.
# Send the zip to your customer. They unzip, double-click index.html,
# press F11 for full-screen.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO_ROOT/hardware-screensaver.zip"

cd "$REPO_ROOT"
rm -f "$OUT"
zip -r "$OUT" screensaver/ \
    -x "screensaver/images/.gitkeep" \
    -x "screensaver/package.sh"

echo
echo "Built: $OUT"
ls -lh "$OUT"

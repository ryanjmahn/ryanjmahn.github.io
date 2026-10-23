#!/bin/sh
# Run every check; non-zero exit if any fails. LIGHTHOUSE=0 skips lighthouse.
cd "$(dirname "$0")/.." || exit 1
status=0
sh scripts/check-partials.sh || status=1
python3 scripts/check.py || status=1
exit $status

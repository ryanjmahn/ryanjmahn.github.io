#!/usr/bin/env bash
# Regenerate every plate photo from the untouched originals in
# assets/img/src/, using the crops in tools/images.json.
#
#   tools/process-images.sh              # everything
#   tools/process-images.sh plate-003-b  # just one output
#
# To add a photo: drop the original in assets/img/src/, add an entry to
# tools/images.json (src, crop centre cx/cy, zoom), run this, then add the
# variant to assets/js/plates.js and a row to CREDITS.md.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/process_images.py "$@"

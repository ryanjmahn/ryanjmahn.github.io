#!/bin/sh
# The header and footer are pasted into every page (no build step).
# Fail if any page's copy differs from index.html's.
cd "$(dirname "$0")/.." || exit 1
fail=0
for part in header footer; do
  ref=$(sed -n "/<!-- partial:$part -->/,/<!-- \/partial:$part -->/p" index.html)
  for f in $(grep -l "<!-- partial:$part -->" *.html */index.html); do
    got=$(sed -n "/<!-- partial:$part -->/,/<!-- \/partial:$part -->/p" "$f")
    [ "$got" = "$ref" ] || { echo "partial drift: $part in $f"; fail=1; }
  done
done
[ $fail = 0 ] && echo "partials: identical"
exit $fail

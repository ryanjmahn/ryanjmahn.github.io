#!/usr/bin/env bash
# Subset Pretendard to exactly the Korean characters the site uses.
# Re-run whenever Korean text is added or changed. Needs fonttools + brotli:
#   pip install fonttools brotli
set -euo pipefail
cd "$(dirname "$0")/.."
chars=$(python3 - <<'PY'
import re, pathlib
pages = ["index.html", "404.html", "diary.html"] + [str(p) for p in pathlib.Path(".").glob("*/index.html")]
text = "".join(pathlib.Path(p).read_text() for p in pages)
print("".join(sorted(set(re.findall(r"[가-힣]", text)))) + "/ ,.")
PY
)
echo "subsetting Pretendard to: $chars"
pyftsubset tools/fonts/PretendardVariable.woff2 \
  --text="$chars" --layout-features='*' --flavor=woff2 \
  --output-file=assets/fonts/pretendard-subset.woff2
ls -l assets/fonts/pretendard-subset.woff2

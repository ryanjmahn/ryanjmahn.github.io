import json, sys, re, collections
import numpy as np
from PIL import Image
out = sys.argv[1]
def lin(c):
    c = c / 255.0
    return np.where(c <= .03928, c / 12.92, ((c + .055) / 1.055) ** 2.4)
def L(rgb):
    r, g, b = lin(rgb[..., 0]), lin(rgb[..., 1]), lin(rgb[..., 2])
    return .2126 * r + .7152 * g + .0722 * b
fails = []; worst = {}; checked = 0
for page in json.load(open(out + "/items.json")):
    img = np.asarray(Image.open(page["shot"]).convert("RGB")).astype(float)
    H, W, _ = img.shape
    for it in page["items"]:
        m = re.match(r"rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)", it["color"])
        if not m: continue
        rgb = np.array([float(m.group(i)) for i in (1, 2, 3)]); a = float(m.group(4) or 1)
        x0, y0 = max(0, int(it["x"])), max(0, int(it["y"])); x1, y1 = min(W, int(it["x"] + it["w"])), min(H, int(it["y"] + it["h"]))
        if x1 <= x0 or y1 <= y0: continue
        bg = img[y0:y1, x0:x1].reshape(-1, 3)
        fg = rgb * a + bg * (1 - a)            # alpha text composited per pixel
        lf, lb = L(fg), L(bg)
        ratio = (np.maximum(lf, lb) + .05) / (np.minimum(lf, lb) + .05)
        r10 = float(np.percentile(ratio, 10))  # contrast over the worst 10% of the background
        large = it["size"] >= 24 or (it["size"] >= 18.66 and it["weight"] >= 700)
        need = 3.0 if large else 4.5
        checked += 1
        key = (page["path"], it["sel"])
        if key not in worst or r10 < worst[key][0]: worst[key] = (r10, need, page["w"], page["v"], it["text"], it["shadow"])
        if r10 < need: fails.append((page["path"], page["w"], page["v"], it["sel"], it["text"], round(r10, 2), need, it["shadow"]))
print(f"checked {checked} text boxes across {len(json.load(open(out + '/items.json')))} page renders")
print(f"below threshold (10th-percentile background): {len(fails)}")
agg = collections.OrderedDict()
for f in fails:
    k = (f[0], f[3], f[4]); agg.setdefault(k, []).append(f"{f[1]}{f[2]}:{f[5]}")
for k, v in agg.items(): print("  FAIL", k[0], "|", k[1], "|", repr(k[2]), "| need", [f for f in fails if (f[0], f[3], f[4]) == k][0][6], "| halo" if [f for f in fails if (f[0], f[3], f[4]) == k][0][7] else "", "|", " ".join(v[:6]))
print("\nlowest ratio per element type (all pages):")
bysel = {}
for (path, sel), (r, need, w, v, t, sh) in worst.items():
    base = sel.split(" @")[0] + (" @" + sel.split(" @")[1] if " @" in sel else "")
    if base not in bysel or r < bysel[base][0]: bysel[base] = (r, need, path, w, v, t)
for sel, (r, need, path, w, v, t) in sorted(bysel.items(), key=lambda x: x[1][0])[:40]:
    print(f"  {r:5.2f} (need {need})  {sel[:60]:60s} {path} {w}{v}")

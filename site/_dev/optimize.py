"""Palette-quantise the landing page PNGs so each stays small. Needs Pillow. Run after shots.cjs."""
import pathlib
from PIL import Image

img = pathlib.Path(__file__).resolve().parent.parent / "img"
for f in sorted(img.glob("*.png")):
    im = Image.open(f)
    if im.mode == "P":
        continue  # already done
    before = f.stat().st_size
    colors = 256 if f.name in ("hero.png", "og.png", "shot-map.png", "step-map.png") else 128
    im.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(f, optimize=True)
    print(f"{f.name:20} {im.width}x{im.height}  {before/1024:7.0f} kB -> {f.stat().st_size/1024:5.0f} kB")

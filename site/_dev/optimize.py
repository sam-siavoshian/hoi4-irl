"""Palette-quantise the PNGs in site/img/ and docs/img/ so each stays small. Needs Pillow. Run after shots.cjs."""
import pathlib
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent.parent
# An octree palette, then error diffusion onto it. Median cut alone spends the palette on the map's greens and turns
# the small accents (the flag, the capital's label, the red of a loss) grey; a palette without dithering bands.
for f in sorted([*(root / "site" / "img").glob("**/*.png"), *(root / "docs" / "img").glob("*.png")]):
    im = Image.open(f)
    if im.mode == "P":
        continue  # already done
    before = f.stat().st_size
    rgb = im.convert("RGB")
    palette = rgb.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    rgb.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG).save(f, optimize=True)
    print(f"{str(f.relative_to(root)):30} {im.width}x{im.height}  {before/1024:7.0f} kB -> {f.stat().st_size/1024:5.0f} kB")

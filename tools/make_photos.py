"""Make every photo the site uses from one photo of Lehan, and the link-preview card.

Usage (from the project root):
    python tools/make_photos.py References/headshot.jpg                 # crops + card, updates content.js
    python tools/make_photos.py References/headshot.jpg --focus 0.5,0.35 --zoom 1.2
    python tools/make_photos.py --card-only                              # the card without a photo
    python tools/make_photos.py References/headshot.jpg --out scratch/   # try it: writes there, content.js untouched

--focus x,y  the point to keep centred (fractions of the photo's width and height; the face, usually).
--zoom z     1 = the largest crop that fits; 1.5 = tighter around the focus point.

Writes into site/assets/img/ (each JPEG well under 300 KB):
    lehan-headshot.jpg   384 x 384   round avatars: start page, XP start menu
    lehan-portrait.jpg   670 x 986   classic home, Paint home, Kitchen home (shown at 335 x 493)
    lehan-wide.jpg       840 x 875   the photo on the first slide (PowerPoint, Overleaf)
    lehan-face.jpg       320 x 320   the Kitchen's chef logo, until an illustrated face exists
    social-card.png      1200 x 630  the picture shown when the site's link is shared (og:image)
and into site/: favicon.ico (16/32/48), favicon.svg, apple-touch-icon.png (180), icon-192.png, the
site icon shown in browser tabs and next to the site in search results (--icons-only: just these);
and points SITE.person.photo / SITE.person.face in site/content.js at them, with alt text
"Lehan Zhang". The placeholder (minion) files stay in assets/img/ until deleted by hand.
"""
import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "site" / "assets" / "img"
CONTENT = ROOT / "site" / "content.js"
FONTS = Path("C:/Windows/Fonts")

SITE = ROOT / "site"
ICON_ZOOM = 1.15   # the site icon: the photo filling the whole square, a little tighter than the avatar

CROPS = {  # name: (width, height, extra zoom on top of --zoom)
    "lehan-headshot.jpg": (384, 384, 1.0),
    "lehan-portrait.jpg": (670, 986, 1.0),
    "lehan-wide.jpg": (840, 875, 1.0),
    "lehan-face.jpg": (320, 320, 1.35),
}

# The card's colours and wording follow the start page (site/index.html).
PAPER, INK, MUTED, ACCENT = "#f7f4ee", "#1d1d1f", "#5f5b55", "#1f4e8c"


def crop(im, w, h, fx, fy, zoom):
    """The largest w:h box around (fx, fy), shrunk by zoom, kept inside the photo; resized to w x h."""
    W, H = im.size
    ratio = w / h
    cw, ch = (W, W / ratio) if W / H < ratio else (H * ratio, H)
    cw, ch = cw / zoom, ch / zoom
    cx = min(max(fx * W, cw / 2), W - cw / 2)
    cy = min(max(fy * H, ch / 2), H - ch / 2)
    box = (round(cx - cw / 2), round(cy - ch / 2), round(cx + cw / 2), round(cy + ch / 2))
    return im.crop(box).resize((w, h), Image.LANCZOS)


def font(names, size):
    for n in names:
        p = FONTS / n
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def card(photo, fx, fy, zoom):
    """1200 x 630 link-preview card: round photo (if any), name, line, address."""
    c = Image.new("RGB", (1200, 630), PAPER)
    d = ImageDraw.Draw(c)
    x = 96
    if photo is not None:
        size = 360
        face = crop(photo, size, size, fx, fy, zoom * 1.1)
        mask = Image.new("L", (size * 4, size * 4), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
        mask = mask.resize((size, size), Image.LANCZOS)
        d.ellipse((90 - 8, 135 - 8, 90 + size + 8, 135 + size + 8), fill="white")
        c.paste(face, (90, 135), mask)
        x = 520
    d.rectangle((0, 0, 1200, 14), fill=ACCENT)
    d.text((x, 190), "Lehan Zhang", font=font(["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"], 84), fill=INK)
    body = font(["segoeui.ttf", "arial.ttf"], 36)
    d.text((x, 310), "Economist and data scientist", font=body, fill=INK)
    d.text((x, 360), "PhD Candidate, AI & Economics Lab, ETH Zurich", font=font(["segoeui.ttf", "arial.ttf"], 30 if photo is not None else 36), fill=MUTED)
    d.text((x, 470), "lehanzhang.com", font=font(["segoeuib.ttf", "arialbd.ttf"], 32), fill=ACCENT)
    return c


def icons(photo, fx, fy, zoom, out):
    """The site icon (browser tab, search results, phone home screen): the photo, square, edge to edge,
    no border (Lehan, 2026-11-03). Same file names as before, so no page's <link> tags change."""
    import base64, io
    sq = crop(photo, 512, 512, fx, fy, zoom * ICON_ZOOM)
    sq.save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    sq.resize((180, 180), Image.LANCZOS).save(out / "apple-touch-icon.png", optimize=True)
    sq.resize((192, 192), Image.LANCZOS).save(out / "icon-192.png", optimize=True)
    buf = io.BytesIO()
    sq.resize((192, 192), Image.LANCZOS).save(buf, "JPEG", quality=85, optimize=True)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 192 192">'
           '<image width="192" height="192" xlink:href="data:image/jpeg;base64,'
           + base64.b64encode(buf.getvalue()).decode() + '"/></svg>')
    (out / "favicon.svg").write_text(svg, encoding="utf-8", newline="\n")
    for n in ("favicon.ico", "favicon.svg", "apple-touch-icon.png", "icon-192.png"):
        print(f"wrote {out / n}  ({(out / n).stat().st_size // 1024} KB)")


def update_content(names):
    js = CONTENT.read_text(encoding="utf-8")
    rel = lambda n: "assets/img/" + n
    subs = [
        (r'(headshot:\s*")[^"]*(")', rel("lehan-headshot.jpg")),
        (r'(portrait:\s*")[^"]*(")', rel("lehan-portrait.jpg")),
        (r'(wide:\s*")[^"]*(")', rel("lehan-wide.jpg")),
        (r'(photo:\s*\{[^}]*?alt:\s*")[^"]*(")', "Lehan Zhang"),
        (r'(face:\s*\{\s*src:\s*")[^"]*(")', rel("lehan-face.jpg")),
        (r'(face:\s*\{[^}]*?alt:\s*")[^"]*(")', "Lehan Zhang"),
    ]
    for pattern, value in subs:
        js, n = re.subn(pattern, lambda m: m.group(1) + value + m.group(2), js, count=1, flags=re.S)
        if n != 1:
            sys.exit(f"content.js: could not find {pattern!r}; nothing was changed in content.js")
    js = js.replace("    // Placeholder photos (the minion photo) until Lehan supplies a professional headshot.\n",
                    "    // Made from one photo by tools/make_photos.py.\n")
    CONTENT.write_text(js, encoding="utf-8", newline="\n")   # keep LF line endings on Windows too


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("photo", nargs="?")
    ap.add_argument("--focus", default="0.5,0.38")
    ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--card-only", action="store_true")
    ap.add_argument("--icons-only", action="store_true", help="only the site icon files (site/favicon.* etc.)")
    ap.add_argument("--out", help="write here instead of site/assets/img/, and leave content.js alone")
    a = ap.parse_args()
    if not a.photo and not a.card_only:
        ap.error("give a photo, or --card-only")
    fx, fy = (float(v) for v in a.focus.split(","))
    out = Path(a.out) if a.out else IMG
    out.mkdir(parents=True, exist_ok=True)

    if a.photo and not a.card_only:
        icons(ImageOps.exif_transpose(Image.open(a.photo)).convert("RGB"), fx, fy, a.zoom, Path(a.out) if a.out else SITE)
        if a.icons_only:
            return

    photo = None
    if a.photo and not a.card_only:
        photo = ImageOps.exif_transpose(Image.open(a.photo)).convert("RGB")
        for name, (w, h, z) in CROPS.items():
            img = crop(photo, w, h, fx, fy, a.zoom * z)
            img.save(out / name, "JPEG", quality=84, optimize=True, progressive=True)
            print(f"wrote {out / name}  ({(out / name).stat().st_size // 1024} KB)")
    c = card(photo, fx, fy, a.zoom)
    c.save(out / "social-card.png", optimize=True)
    print(f"wrote {out / 'social-card.png'}  ({(out / 'social-card.png').stat().st_size // 1024} KB)")

    if photo is not None and not a.out:
        update_content(CROPS)
        print("updated site/content.js (photo paths and alt text). Check every version, then delete the minion files if unused.")


if __name__ == "__main__":
    main()

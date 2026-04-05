"""Generate OG image and PWA icons for Ristoka."""

from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public")
os.makedirs(OUT_DIR, exist_ok=True)

# Brand colors
GREEN_START = (22, 163, 74)    # #16A34A
GREEN_END = (21, 128, 61)     # #15803D
WHITE = (255, 255, 255)
BG_LIGHT = (249, 250, 251)    # #F9FAFB
TEXT_DARK = (31, 41, 55)       # #1F2937
TEXT_MUTED = (107, 114, 128)   # #6B7280


def lerp_color(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90, fill=fill)


def get_font(size):
    """Try to load a nice font, fall back to default."""
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()


def get_bold_font(size):
    """Try to load a bold font."""
    font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()


# ── OG Image (1200×630) ─────────────────────────────────────────

def generate_og_image():
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG_LIGHT)
    draw = ImageDraw.Draw(img)

    # Green gradient band on left side
    band_w = 420
    for x in range(band_w):
        t = x / band_w
        color = lerp_color(GREEN_START, GREEN_END, t)
        draw.line([(x, 0), (x, h)], fill=color)

    # Big "R" logo on left band
    font_r = get_bold_font(180)
    bbox = draw.textbbox((0, 0), "R", font=font_r)
    rw = bbox[2] - bbox[0]
    rh = bbox[3] - bbox[1]
    rx = (band_w - rw) // 2
    ry = (h - rh) // 2 - 30
    draw.text((rx, ry), "R", fill=WHITE, font=font_r)

    # Right side content
    cx = band_w + 60
    cy = 160

    # Title
    font_title = get_bold_font(64)
    draw.text((cx, cy), "Ristoka", fill=TEXT_DARK, font=font_title)

    # Tagline
    font_tag = get_font(30)
    draw.text((cx, cy + 90), "Wholesale Brokerage Platform", fill=GREEN_START, font=font_tag)

    # Description
    font_desc = get_font(24)
    lines = [
        "Browse wholesale products at the best prices.",
        "Order via WhatsApp · Real-time stock · Fast delivery",
    ]
    for i, line in enumerate(lines):
        draw.text((cx, cy + 160 + i * 38), line, fill=TEXT_MUTED, font=font_desc)

    # Bottom domain
    font_url = get_font(22)
    draw.text((cx, h - 80), "ristoka.com", fill=TEXT_MUTED, font=font_url)

    # Subtle green accent line at bottom
    draw.rectangle([0, h - 6, w, h], fill=GREEN_START)

    path = os.path.join(OUT_DIR, "og-image.png")
    img.save(path, "PNG", optimize=True)
    print(f"✓ Created {path} ({w}×{h})")


# ── PWA Icons ────────────────────────────────────────────────────

def generate_icon(size, filename):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Green gradient background with rounded corners
    radius = int(size * 0.22)  # ~22% corner radius like iOS icons
    # Draw gradient
    for y in range(size):
        t = y / size
        color = lerp_color(GREEN_START, GREEN_END, t * 0.6 + 0.2)
        draw.line([(0, y), (size, y)], fill=color)

    # Apply rounded mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    draw_rounded_rect(mask_draw, (0, 0, size, size), radius, fill=255)
    img.putalpha(mask)

    # Draw "R" letter
    font_size = int(size * 0.6)
    font = get_bold_font(font_size)
    bbox = draw.textbbox((0, 0), "R", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = (size - th) // 2 - int(size * 0.05)
    draw.text((tx, ty), "R", fill=WHITE, font=font)

    path = os.path.join(OUT_DIR, filename)
    img.save(path, "PNG", optimize=True)
    print(f"✓ Created {path} ({size}×{size})")


if __name__ == "__main__":
    generate_og_image()
    generate_icon(192, "icon-192.png")
    generate_icon(512, "icon-512.png")
    print("\nAll images generated successfully!")

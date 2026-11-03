"""Generates every SVG in brand/ from one geometric description.
Mark: measured from brand/source/email-signature.png (4x crop), drawn upright, then skewed.
Wordmark: hand-built monoline caps (stroke paths) so logos render identically inside <img>."""
import math, os, sys

OUT = sys.argv[1]
K = 0.5523  # quarter-circle bezier constant
T = 1 / 3   # slant: tan(18.4 deg), measured from both F stems

NAVY, BLUE, SILVER, INK, TINT = "#061E3C", "#0066CC", "#B4B4B4", "#0B1424", "#EEF4FB"
BLUE_ON_DARK, SILVER_ON_DARK, MUTED = "#3D8EF0", "#C5CCD6", "#5A6678"

f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")

# ---------------------------------------------------------------- mark
BASE = 530.0

def sk(p):
    x, y = p
    return (x + T * (BASE - y), y)

def path(segs):
    """segs: ('M',p) ('L',p) ('C',p1,p2,p3) ('Z',)  -> skewed d string + points for bbox"""
    d, pts = [], []
    for s in segs:
        if s[0] == "Z":
            d.append("Z"); continue
        q = [sk(p) for p in s[1:]]
        pts += q
        d.append(s[0] + " ".join(f(a) + " " + f(b) for a, b in q))
    return "".join(d), pts

def F_shape(x0, top, bot, top_len, mid_len, stem=66, bar=54, r=58, mid_at=0.40):
    H = bot - top
    ym = top + mid_at * H
    return [("M", (x0, bot)), ("L", (x0, top + r)),
            ("C", (x0, top + r - K * r), (x0 + r - K * r, top), (x0 + r, top)),
            ("L", (x0 + top_len, top)), ("L", (x0 + top_len, top + bar)),
            ("L", (x0 + stem, top + bar)), ("L", (x0 + stem, ym)),
            ("L", (x0 + mid_len, ym)), ("L", (x0 + mid_len, ym + bar)),
            ("L", (x0 + stem, ym + bar)), ("L", (x0 + stem, bot)), ("Z",)]

def D_shape(xl, top, bot, xr, t=54):
    R = (bot - top) / 2; cx = xr - R; ri = R - t
    return [("M", (xl, top)), ("L", (cx, top)),
            ("C", (cx + K * R, top), (xr, top + R - K * R), (xr, top + R)),
            ("C", (xr, top + R + K * R), (cx + K * R, bot), (cx, bot)),
            ("L", (xl, bot)), ("L", (xl, bot - t)), ("L", (cx, bot - t)),
            ("C", (cx + K * ri, bot - t), (xr - t, top + R + K * ri), (xr - t, top + R)),
            ("C", (xr - t, top + R - K * ri), (cx + K * ri, top + t), (cx, top + t)),
            ("L", (xl, top + t)), ("Z",)]

def mark_shapes(bold=0):
    """bold>0 thickens strokes for favicon use."""
    s, b = 66 + bold, 54 + bold
    return [
        F_shape(25, 45, 470, 307, 208, stem=s, bar=b),
        F_shape(280, 135, 530, 283, 195, stem=s, bar=b),
        D_shape(497 - bold * 0.4, 235, 530, 785 + bold * 0.3, t=b),
    ]

def bez_pts(segs):
    """sample beziers for an honest bbox"""
    out, cur = [], None
    for s in segs:
        if s[0] in "ML":
            cur = sk(s[1]); out.append(cur)
        elif s[0] == "C":
            p0, p1, p2, p3 = cur, sk(s[1]), sk(s[2]), sk(s[3])
            for i in range(21):
                u = i / 20
                out.append(tuple((1-u)**3*a + 3*(1-u)**2*u*b + 3*(1-u)*u*u*c + u**3*d
                                 for a, b, c, d in zip(p0, p1, p2, p3)))
            cur = p3
    return out

def mark_group(colors, bold=0):
    shapes = mark_shapes(bold)
    pts = [p for sh in shapes for p in bez_pts(sh)]
    x0, y0 = min(p[0] for p in pts), min(p[1] for p in pts)
    x1, y1 = max(p[0] for p in pts), max(p[1] for p in pts)
    body = "".join(f'<path fill="{c}" d="{path(sh)[0]}"/>' for sh, c in zip(shapes, colors))
    return body, (x0, y0, x1 - x0, y1 - y0)

LIGHT = (NAVY, BLUE, SILVER)
DARK = ("#FFFFFF", BLUE_ON_DARK, SILVER_ON_DARK)

# ---------------------------------------------------------------- wordmark glyphs (cap height 100)
H = 100.0

def glyph(ch, w):
    """returns (strokes:list[d], fills:list[d], W, lsb_adj, rsb_adj). y down, 0=cap top, 100=baseline."""
    yt, yb, xl = w / 2, H - w / 2, w / 2
    o = 1.6  # overshoot for rounds
    S, P = [], []
    def poly(*pp): P.append("M" + "L".join(f(a) + " " + f(b) for a, b in pp) + "Z")
    def diag(x1, x2, top_w=None):
        """parallelogram from baseline x1 (left edge) to cap x2 (left edge), horizontal cuts"""
        ang = math.atan2(H, abs(x2 - x1))
        hw = w / math.sin(ang)
        return hw
    if ch == "F":
        W = 56; S += [f"M{xl} {H}V{yt}H{W}", f"M{xl} 49H{W-5}"]; adj = (0, -2)
    elif ch == "E":
        W = 56; S += [f"M{W} {yt}H{xl}V{yb}H{W}", f"M{xl} 49H{W-4}"]; adj = (0, 0)
    elif ch == "I":
        W = w; S += [f"M{xl} 0V{H}"]; adj = (0, 0)
    elif ch == "T":
        W = 60; S += [f"M0 {yt}H{W}", f"M{W/2} {yt}V{H}"]; adj = (-3, -3)
    elif ch == "D":
        W = 78; r = (yb - yt) / 2; xr = W - w / 2; xs = xr - r
        S += [f"M{xl} {yt}H{f(xs)}A{f(r)} {f(r)} 0 0 1 {f(xs)} {yb}H{xl}Z"]; adj = (0, -1)
    elif ch in "OG":
        W = 102 if ch == "O" else 98
        cx, cy, rx, ry = W / 2, H / 2, W / 2 - w / 2 + o * 0.5, H / 2 - w / 2 + o
        if ch == "O":
            S += [f"M{f(cx-rx)} {cy}A{f(rx)} {f(ry)} 0 1 1 {f(cx+rx)} {cy}A{f(rx)} {f(ry)} 0 1 1 {f(cx-rx)} {cy}Z"]
        else:
            a = math.radians(-38)
            sx, sy = cx + rx * math.cos(a), cy + ry * math.sin(a)
            S += [f"M{f(sx)} {f(sy)}A{f(rx)} {f(ry)} 0 0 0 {f(cx-rx)} {cy}"
                  f"A{f(rx)} {f(ry)} 0 0 0 {f(cx+rx)} {f(cy+2)}H{f(cx+4)}"]
        adj = (-3, -3)
    elif ch == "S":
        W = 62; cx = W / 2; ym = 48.5
        rx1, rx2 = W / 2 - w / 2 - 1.5, W / 2 - w / 2
        top, bot = yt - o, yb + o
        ry1, ry2 = (ym - top) / 2, (bot - ym) / 2
        cy1, cy2 = top + ry1, ym + ry2
        a1, a2 = math.radians(-28), math.radians(152)
        s1 = (cx + rx1 * math.cos(a1), cy1 + ry1 * math.sin(a1))
        e2 = (cx + rx2 * math.cos(a2), cy2 + ry2 * math.sin(a2))
        S += [f"M{f(s1[0])} {f(s1[1])}A{f(rx1)} {f(ry1)} 0 0 0 {f(cx-rx1)} {f(cy1)}"
              f"A{f(rx1)} {f(ry1)} 0 0 0 {f(cx)} {f(ym)}"
              f"A{f(rx2)} {f(ry2)} 0 0 1 {f(cx+rx2)} {f(cy2)}"
              f"A{f(rx2)} {f(ry2)} 0 0 1 {f(e2[0])} {f(e2[1])}"]
        adj = (-2, -2)
    elif ch == "R":
        W = 64; ym = 54; rb = (ym - yt) / 2; xb = W - w / 2 - rb - 2
        S += [f"M{xl} {H}V{yt}H{f(xb)}A{f(rb)} {f(rb)} 0 0 1 {f(xb)} {ym}H{xl}"]
        hw = w / math.sin(math.atan2(H - ym, W - xb)) / 2
        x1 = xb - 4  # leg starts under bowl
        poly((x1 - hw, ym - w / 2), (x1 + hw, ym - w / 2), (W, H), (W - 2 * hw, H))
        adj = (0, -2)
    elif ch == "P":
        W = 60; ym = 57; rb = (ym - yt) / 2; xb = W - w / 2 - rb
        S += [f"M{xl} {H}V{yt}H{f(xb)}A{f(rb)} {f(rb)} 0 0 1 {f(xb)} {ym}H{xl}"]; adj = (0, -2)
    elif ch == "B":
        W = 64; ym = 48
        r1 = (ym - yt) / 2; x1 = W - w / 2 - r1 - 5
        r2 = (yb - ym) / 2; x2 = W - w / 2 - r2
        S += [f"M{xl} {H}V{yt}H{f(x1)}A{f(r1)} {f(r1)} 0 0 1 {f(x1)} {ym}H{xl}",
              f"M{xl} {ym}H{f(x2)}A{f(r2)} {f(r2)} 0 0 1 {f(x2)} {yb}H{xl}"]
        adj = (0, -1)
    elif ch == "U":
        W = 72; xr = W - w / 2; r = (xr - xl) / 2
        S += [f"M{xl} 0V{f(yb + o - r)}A{f(r)} {f(r)} 0 0 0 {f(xr)} {f(yb + o - r)}V0"]; adj = (0, 0)
    elif ch == "N":
        W = 74
        hw = w / math.sin(math.atan2(H, W - w)) / 2
        S += [f"M{xl} {H}V0", f"M{W - xl} 0V{H}"]
        poly((0, 0), (2 * hw, 0), (W, H), (W - 2 * hw, H))
        adj = (0, 0)
    elif ch == "A":
        W = 78; c = W / 2
        hw = w / math.sin(math.atan2(H, c)) / 2
        poly((0, H), (2 * hw, H), (c + hw * 0.55, 0), (c - hw * 1.45, 0))
        poly((W, H), (W - 2 * hw, H), (c - hw * 0.55, 0), (c + hw * 1.45, 0))
        yc = 70; k = yc / H
        S += [f"M{f(c - c*k + hw*0.2)} {yc}H{f(c + c*k - hw*0.2)}"]
        adj = (-4, -4)
    elif ch == " ":
        return [], [], 30, (0, 0)
    else:
        raise KeyError(ch)
    return S, P, W, adj

def word(text, w, track, color, x=0, y=0, scale=1.0, target_width=None):
    """lay out a line; returns (svg, width_in_user_units). if target_width, tracking is solved."""
    def layout(tr):
        cx, items = 0.0, []
        for i, ch in enumerate(text):
            S, P, W, adj = glyph(ch, w)
            if i: cx += tr + adj[0]
            items.append((cx, S, P))
            cx += W + adj[1]
        return cx, items
    if target_width:
        n = len(text) - 1
        base, _ = layout(0)
        track = (target_width / scale - base) / n
    width, items = layout(track)
    sp, fp = [], []
    for cx, S, P in items:
        t = f' transform="translate({f(cx)} 0)"' if cx else ""
        if S: sp.append(f'<path{t} d="{"".join(S)}"/>')
        if P: fp.append(f'<path{t} d="{"".join(P)}"/>')
    g = (f'<g transform="translate({f(x)} {f(y)}) scale({scale:.4f})">'
         f'<g fill="none" stroke="{color}" stroke-width="{w}" stroke-miterlimit="10">{"".join(sp)}</g>'
         f'<g fill="{color}">{"".join(fp)}</g></g>')
    return g, width * scale

def snowflake(cx, cy, r, color, sw):
    arms = []
    for i in range(6):
        a = math.radians(90 + i * 60)
        ex, ey = cx + r * math.cos(a), cy - r * math.sin(a)
        arms.append(f"M{f(cx)} {f(cy)}L{f(ex)} {f(ey)}")
        bx, by = cx + 0.58 * r * math.cos(a), cy - 0.58 * r * math.sin(a)
        for s in (-1, 1):
            b = a + s * math.radians(40)
            arms.append(f"M{f(bx)} {f(by)}L{f(bx + 0.36*r*math.cos(b))} {f(by - 0.36*r*math.sin(b))}")
    return (f'<path fill="none" stroke="{color}" stroke-width="{f(sw)}" stroke-linecap="round" '
            f'stroke-linejoin="round" d="{"".join(arms)}"/>')

# ---------------------------------------------------------------- compositions
def svg(vb, body, title, w=None, h=None, extra=""):
    size = f' width="{f(w)}" height="{f(h)}"' if w else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(f(v) for v in vb)}"{size} '
            f'role="img" aria-labelledby="t">{extra}<title id="t">{title}</title>{body}</svg>\n')

def mark_svg(colors, title):
    body, (x, y, w, h) = mark_group(colors)
    return svg((x, y, w, h), body, title), (x, y, w, h)

BOLD_W, LIGHT_W = 15, 9

def wordmark_block(dark, x, y, cap):
    """two-line wordmark: FRIGO FOOD / DISTRIBUTION, justified to the same width."""
    c1 = "#FFFFFF" if dark else NAVY
    c2 = SILVER_ON_DARK if dark else "#9AA0A8"
    s = cap / H
    g1, wid = word("FRIGO FOOD", BOLD_W, 19, c1, x, y, s)
    cap2 = cap * 0.62
    g2, _ = word("DISTRIBUTION", LIGHT_W, 0, c2, x, y + cap + cap * 0.42, cap2 / H, target_width=wid)
    return g1 + g2, wid, cap + cap * 0.42 + cap2

def horizontal(dark):
    colors = DARK if dark else LIGHT
    mb, (mx, my, mw, mh) = mark_group(colors)
    cap = mh * 0.26
    block_h = cap * (1 + 0.42 + 0.62)
    gap = mh * 0.26
    wx = mx + mw + gap
    wy = my + (mh - block_h) / 2
    wb, wid, _ = wordmark_block(dark, wx, wy, cap)
    vb = (mx, my - 2, mw + gap + wid + 2, mh + 4)
    return svg(vb, mb + wb, "Frigo Food Distribution")

def stacked(dark=False):
    colors = DARK if dark else LIGHT
    mb, (mx, my, mw, mh) = mark_group(colors)
    cap = mh * 0.15
    s = cap / H
    # line: FRIGO FOOD (bold) + DISTRIBUTION (light) at same cap height
    _, w1 = word("FRIGO FOOD", BOLD_W, 19, NAVY, 0, 0, s)
    _, w2 = word("DISTRIBUTION", LIGHT_W * 1.25, 19, NAVY, 0, 0, s)
    sp = cap * 0.55
    total = w1 + sp + w2
    cxm = mx + mw / 2
    lx = cxm - total / 2
    ly = my + mh + mh * 0.20
    g1, _ = word("FRIGO FOOD", BOLD_W, 19, "#FFFFFF" if dark else NAVY, lx, ly, s)
    g2, _ = word("DISTRIBUTION", LIGHT_W * 1.25, 19, SILVER_ON_DARK if dark else "#9AA0A8", lx + w1 + sp, ly, s)
    ry = ly + cap + cap * 1.25
    snow_r = cap * 0.62
    rule_c = BLUE_ON_DARK if dark else BLUE
    gapx = snow_r * 2.4
    rw = cap * 0.075
    rules = (f'<path fill="none" stroke="{rule_c}" stroke-width="{f(rw)}" '
             f'd="M{f(lx)} {f(ry)}H{f(cxm-gapx)}M{f(cxm+gapx)} {f(ry)}H{f(lx+total)}"/>')
    flake = snowflake(cxm, ry, snow_r, rule_c, cap * 0.11)
    tcap = cap * 0.58
    _, tw = word("REFRIGERATED TRANSPORT", LIGHT_W * 1.3, 30, MUTED, 0, 0, tcap / H)
    ty = ry + cap * 1.15
    gt, _ = word("REFRIGERATED TRANSPORT", LIGHT_W * 1.3, 30, SILVER_ON_DARK if dark else MUTED,
                 cxm - tw / 2, ty, tcap / H)
    pad = cap * 0.2
    x0 = min(mx, lx) - pad
    vb = (x0, my - pad, max(mx + mw, lx + total) + pad - x0, ty + tcap + 2 * pad - my)
    return svg(vb, mb + g1 + g2 + rules + flake + gt, "Frigo Food Distribution — refrigerated transport")

def favicon():
    body, (x, y, w, h) = mark_group(DARK, bold=22)
    size = 1000
    s = size * 0.80 / w
    tx = (size - w * s) / 2 - x * s
    ty = (size - h * s) / 2 - y * s
    bg = f'<rect width="{size}" height="{size}" rx="{size*0.22}" fill="{NAVY}"/>'
    return svg((0, 0, size, size), bg + f'<g transform="translate({f(tx)} {f(ty)}) scale({s:.4f})">{body}</g>',
               "Frigo Food Distribution")

def logo_at(dark, x, y, height):
    """horizontal lockup placed into another composition; returns (svg, width)."""
    colors = DARK if dark else LIGHT
    mb, (mx, my, mw, mh) = mark_group(colors)
    cap = mh * 0.26
    gap = mh * 0.26
    block_h = cap * 2.04
    wb, wid, _ = wordmark_block(dark, mx + mw + gap, my + (mh - block_h) / 2, cap)
    s = height / mh
    return (f'<g transform="translate({f(x)} {f(y)}) scale({s:.4f}) translate({f(-mx)} {f(-my)})">{mb}{wb}</g>',
            (mw + gap + wid) * s)

FONTS = ('<style>@import url("https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&amp;display=swap");'
         '.d{font-family:Archivo,"Helvetica Neue",Arial,sans-serif;font-stretch:118%}'
         '.b{font-family:Archivo,"Helvetica Neue",Arial,sans-serif}</style>')

def social(kind):
    W, Hh = (1584, 396) if kind == "linkedin" else (1200, 630)
    bg = f'<rect width="{W}" height="{Hh}" fill="{NAVY}"/>'
    if kind == "linkedin":
        # left zone is covered by the page avatar on LinkedIn: decorative lanes only there
        west, east = (1270, 290), (1480, 120)
        lx, ly, lh = 520, 78, 62
        hx, hy, hs = 520, 236, 38
        cy, cs = 300, 20
        labels = ""
    else:
        west, east = (770, 210), (1110, 130)
        lx, ly, lh = 80, 76, 84
        hx, hy, hs = 80, 430, 58
        cy, cs = 552, 24
        labels = (f'<g class="b" font-size="15" font-weight="500" fill="#FFFFFF" fill-opacity=".6" letter-spacing=".6" text-anchor="middle">'
                  f'<text x="{west[0]}" y="{west[1] + 40}">NL · BE · DE · UK</text>'
                  f'<text x="{east[0]}" y="{east[1] + 44}">RO · HU · PL · BG</text></g>')
    (ax, ay), (bx, by) = west, east
    def arc(x1, y1, x2, y2, bend):
        mx_, my_ = (x1 + x2) / 2, (y1 + y2) / 2 - bend
        return f"M{x1} {y1}Q{f(mx_)} {f(my_)} {x2} {y2}"
    lanes = (f'<g fill="none" stroke-linecap="round">'
             f'<path d="{arc(ax, ay, bx, by, 70)}" stroke="{BLUE_ON_DARK}" stroke-width="2.5" stroke-dasharray="1 9"/>'
             f'<path d="{arc(ax, ay, bx, by, 130)}" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="1.5" stroke-dasharray="1 9"/>'
             f'<path d="{arc(ax, ay, bx, by, 10)}" stroke="#FFFFFF" stroke-opacity=".10" stroke-width="1.5" stroke-dasharray="1 9"/></g>'
             f'<circle cx="{ax}" cy="{ay}" r="5" fill="#FFFFFF"/>'
             f'<circle cx="{bx}" cy="{by}" r="6" fill="{BLUE_ON_DARK}"/>'
             f'<circle cx="{bx}" cy="{by}" r="16" fill="none" stroke="{BLUE_ON_DARK}" stroke-opacity=".45" stroke-width="1.5"/>')
    logo, _ = logo_at(True, lx, ly, lh)
    head = (f'<g class="d" font-size="{hs}" font-weight="750" letter-spacing="-.4">'
            f'<text x="{hx}" y="{hy}" fill="#FFFFFF">Transport frigorific internațional</text>'
            f'<text x="{hx}" y="{f(hy + hs * 1.16)}" fill="{BLUE_ON_DARK}">FTL &amp; Grupaj</text></g>')
    contact = (f'<text class="b" x="{hx}" y="{f(cy + (34 if kind == "linkedin" else 0))}" font-size="{cs}" font-weight="500" fill="{SILVER_ON_DARK}" xml:space="preserve">'
               f'+40 757 732 732   ·   office@frigofood.ro   ·   www.frigofood.ro</text>')
    edge = f'<rect y="{Hh-6}" width="{W}" height="6" fill="{BLUE}"/>'
    return svg((0, 0, W, Hh), bg + lanes + labels + logo + head + contact + edge,
               "Frigo Food Distribution — Transport frigorific internațional, FTL și grupaj", W, Hh, FONTS)

def livery():
    """side view, viewBox 1200x420, transparent bg. Tractor faces right; trailer is the brand canvas."""
    L = "#A9BBD2"   # light-navy outline, reads on #EEF4FB
    out = []
    out.append(f'<ellipse cx="600" cy="384" rx="570" ry="9" fill="{NAVY}" fill-opacity=".12"/>')
    # trailer box
    tx, ty, tw, th = 40, 70, 850, 250
    out.append(f'<rect x="{tx}" y="{ty}" width="{tw}" height="{th}" rx="8" fill="#FFFFFF" stroke="{L}" stroke-width="2"/>')
    out.append(f'<path d="M{tx+18} {ty+10}V{ty+th-44}" stroke="{L}" stroke-width="1.5"/>')               # rear door seam
    out.append(f'<rect x="{tx+tw-4}" y="{ty+24}" width="20" height="116" rx="4" fill="#F4F7FB" stroke="{L}" stroke-width="2"/>')  # reefer unit
    out.append(f'<path d="M{tx+tw+2} {ty+50}h8M{tx+tw+2} {ty+66}h8M{tx+tw+2} {ty+82}h8M{tx+tw+2} {ty+98}h8" stroke="{L}" stroke-width="1.5"/>')
    # navy skirt band
    out.append(f'<path d="M{tx} {ty+th-34}H{tx+tw}V{ty+th-8}a8 8 0 0 1-8 8H{tx+8}a8 8 0 0 1-8-8Z" fill="{NAVY}"/>')
    out.append(f'<rect x="{tx}" y="{ty+th-38}" width="{tw}" height="4" fill="{BLUE}"/>')
    # logo + copy
    out.append(logo_at(False, tx + 70, ty + 50, 98)[0])
    out.append(f'<text class="d" x="{tx+72}" y="{ty+190}" font-size="27" font-weight="700" fill="{NAVY}">'
               f'Refrigerated Transport <tspan fill="{BLUE}">· FTL &amp; Groupage</tspan></text>')
    out.append(f'<text class="b" x="{tx+tw-36}" y="{ty+th-14}" text-anchor="end" font-size="17" font-weight="600" fill="#FFFFFF" letter-spacing=".4" xml:space="preserve">'
               f'+40 757 732 732    ·    www.frigofood.ro</text>')
    # chassis, landing gear, tail light
    out.append(f'<rect x="{tx+30}" y="{ty+th}" width="{tw-70}" height="12" fill="{NAVY}" fill-opacity=".85"/>')
    out.append(f'<rect x="{tx+560}" y="{ty+th+12}" width="8" height="38" fill="{NAVY}" fill-opacity=".7"/>')
    out.append(f'<rect x="{tx+548}" y="{ty+th+48}" width="32" height="5" rx="2" fill="{NAVY}" fill-opacity=".7"/>')
    def wheel(cx):
        return (f'<circle cx="{cx}" cy="350" r="32" fill="{NAVY}"/><circle cx="{cx}" cy="350" r="15" fill="#E6ECF4"/>'
                f'<circle cx="{cx}" cy="350" r="5" fill="{NAVY}"/>')
    for cx in (130, 206, 282):
        out.append(wheel(cx))
    # tractor: cab-over with roof fairing
    out.append(f'<rect x="900" y="296" width="252" height="20" rx="4" fill="{NAVY}" fill-opacity=".85"/>')
    out.append(f'<path d="M926 130L942 80Q945 72 954 72H1028Q1044 72 1054 84L1090 124Z" fill="#FFFFFF" stroke="{L}" stroke-width="2" stroke-linejoin="round"/>')
    out.append(f'<path d="M920 316V140Q920 128 932 127L1098 120Q1127 119 1135 146L1146 200Q1150 220 1150 240V300Q1150 316 1134 316Z" fill="#FFFFFF" stroke="{L}" stroke-width="2" stroke-linejoin="round"/>')
    out.append(f'<path d="M1042 138L1103 134Q1118 133 1122 147L1132 196H1042Z" fill="{NAVY}" fill-opacity=".9"/>')
    out.append(f'<path d="M1030 136V246" stroke="{L}" stroke-width="1.5"/>')
    out.append(f'<path d="M920 250H1150V300Q1150 316 1134 316H920Z" fill="{NAVY}"/>')
    out.append(f'<rect x="920" y="246" width="230" height="4" fill="{BLUE}"/>')
    out.append(f'<rect x="1134" y="262" width="16" height="9" rx="2" fill="#FFF4D6"/>')
    out.append(f'<path d="M1138 150L1158 144" stroke="{NAVY}" stroke-width="3" stroke-linecap="round"/><rect x="1155" y="138" width="7" height="36" rx="3" fill="{NAVY}"/>')
    mark, (mx, my, mw, mh) = mark_group(LIGHT)
    s = 30 / mh
    out.append(f'<g transform="translate(946 196) scale({s:.4f}) translate({f(-mx)} {f(-my)})">{mark}</g>')
    for cx in (968, 1084):
        out.append(wheel(cx))
    return svg((0, 0, 1200, 420), "".join(out),
               "Frigo Food Distribution reefer semi-trailer livery", extra=FONTS)


def write(name, data):
    p = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(data)

write("logo/ffd-mark.svg", mark_svg(LIGHT, "Frigo Food Distribution mark")[0])
write("logo/ffd-mark-white.svg", mark_svg(DARK, "Frigo Food Distribution mark")[0])
write("logo/ffd-logo-horizontal.svg", horizontal(False))
write("logo/ffd-logo-horizontal-white.svg", horizontal(True))
write("logo/ffd-logo-stacked.svg", stacked(False))
write("logo/favicon.svg", favicon())
write("social/linkedin-banner.svg", social("linkedin"))
write("social/og-image.svg", social("og"))
write("truck-livery.svg", livery())
print("ok")

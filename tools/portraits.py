# Cuts the hero art out of its background and saves trimmed portraits for the game.
import sys, os
from collections import deque
from PIL import Image

SRC, DST = sys.argv[1], sys.argv[2]
FILES = {
  'spiderman':'Strengthening-the-SMB-Sales-Motion.png','wolverine':'wolverine.png','hulk':'hulk.jpeg',
  'ghostrider':'ghostrider.jpeg','scarletwitch':'scarletwitch.jpeg','venom':'venom.jpeg',
  'doctorstrange':'doctorstrange.jpeg','rocketgroot':'rocketandgroot.jpeg','vision':'vision.jpeg','storm':'storm.jpeg',
  'batman':'batman.jpeg','superman':'superman.jpeg','wonderwoman':'images.jpeg','flash':'flash.jpeg',
  'greenlantern':'greenlantern.jpeg','clayface':'clayfec.jpeg','swampthing':'swampthing.jpeg','raven':'raven.jpeg',
  'mrterrific':'mrterrific.jpeg','poisonivy':'poisonivy.jpeg',
}
H = 320
HOLES = {'clayface','ghostrider','wonderwoman','hulk','doctorstrange','swampthing','rocketgroot','venom','raven','batman','greenlantern','flash'}
for cid, fn in FILES.items():
    im = Image.open(os.path.join(SRC, fn)).convert('RGBA')
    has_alpha = im.getextrema()[3][0] < 250
    if not has_alpha:
        w, h = im.size
        px = im.load()
        seen = bytearray(w*h)
        q = deque()
        def bgish(p): return p[0] > 225 and p[1] > 225 and p[2] > 225
        for x in range(w):
            for y in (0, h-1): q.append((x, y))
        for y in range(h):
            for x in (0, w-1): q.append((x, y))
        while q:
            x, y = q.popleft()
            i = y*w+x
            if seen[i]: continue
            seen[i] = 1
            p = px[x, y]
            if not bgish(p): continue
            px[x, y] = (p[0], p[1], p[2], 0)
            if x > 0: q.append((x-1, y))
            if x < w-1: q.append((x+1, y))
            if y > 0: q.append((x, y-1))
            if y < h-1: q.append((x, y+1))
        if cid in HOLES:
            # interior pockets of background (between limbs / chain loops)
            for sy in range(h):
                for sx in range(w):
                    i0 = sy*w+sx
                    if seen[i0] or not bgish(px[sx, sy]): continue
                    comp = []; q.append((sx, sy))
                    while q:
                        x, y = q.popleft(); i = y*w+x
                        if seen[i]: continue
                        seen[i] = 1
                        if not bgish(px[x, y]): continue
                        comp.append((x, y))
                        if x > 0: q.append((x-1, y))
                        if x < w-1: q.append((x+1, y))
                        if y > 0: q.append((x, y-1))
                        if y < h-1: q.append((x, y+1))
                    if len(comp) > 60:
                        for x, y in comp:
                            c = px[x, y]; px[x, y] = (c[0], c[1], c[2], 0)
        # soften the fringe: near-white pixels touching transparency become semi-transparent
        a = im.copy().load()
        for y in range(1, h-1):
            for x in range(1, w-1):
                p = px[x, y]
                if p[3] and p[0] > 200 and p[1] > 200 and p[2] > 200:
                    if any(a[x+dx, y+dy][3] == 0 for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                        px[x, y] = (p[0], p[1], p[2], 90)
    bbox = im.getbbox()
    im = im.crop(bbox)
    r = H / im.size[1]
    im = im.resize((max(1, round(im.size[0]*r)), H), Image.LANCZOS)
    im.save(os.path.join(DST, cid + '.png'), optimize=True)
    print(cid, im.size)

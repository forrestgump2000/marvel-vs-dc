// Math, color and misc helpers shared by every module.
export const W = 640, H = 360;
export const GROUND = 318; // screen y of the floor line
export const DEG = Math.PI / 180;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const easeIn = (t) => t * t;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sign = (v) => (v < 0 ? -1 : 1);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

// limb direction: 0 = straight down, 90 = forward (+x), 180 = up
export const dirv = (a) => [Math.sin(a * DEG), Math.cos(a * DEG)];
export const angOf = (dx, dy) => Math.atan2(dx, dy) / DEG;

const rgbCache = new Map();
export function hexRgb(hex) {
  let c = rgbCache.get(hex);
  if (c) return c;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  rgbCache.set(hex, c);
  return c;
}
const toHex = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
export const rgbHex = (r, g, b) => '#' + toHex(r) + toHex(g) + toHex(b);

// f < 1 darkens, f > 1 lightens toward white
const shadeCache = new Map();
export function shade(hex, f) {
  const key = hex + f;
  let s = shadeCache.get(key);
  if (s) return s;
  const [r, g, b] = hexRgb(hex);
  if (f <= 1) s = rgbHex(r * f, g * f, b * f);
  else {
    const t = f - 1;
    s = rgbHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
  }
  shadeCache.set(key, s);
  return s;
}
export function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}
export function rgba(hex, a) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// tiny seeded RNG so procedural stages look the same every load
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// bitmap-ish arcade text: drawn with a bold font, then crisp because the canvas is low-res
export function text(ctx, str, x, y, opt = {}) {
  const size = opt.size || 12;
  ctx.save();
  ctx.font = `${opt.italic ? 'italic ' : ''}${opt.weight || 900} ${size}px ${opt.font || '"Press Start 2P", "Courier New", monospace'}`;
  ctx.textAlign = opt.align || 'left';
  ctx.textBaseline = opt.base || 'alphabetic';
  if (opt.shadow !== false) {
    ctx.fillStyle = opt.shadowColor || '#000';
    const o = opt.shadowOff || Math.max(1, Math.round(size / 8));
    ctx.fillText(str, x + o, y + o);
  }
  if (opt.stroke) {
    ctx.lineWidth = opt.strokeW || 3;
    ctx.strokeStyle = opt.stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  if (opt.grad) {
    const m = ctx.measureText(str);
    const g = ctx.createLinearGradient(0, y - size, 0, y);
    opt.grad.forEach((c, i) => g.addColorStop(i / (opt.grad.length - 1), c));
    ctx.fillStyle = g;
    void m;
  } else ctx.fillStyle = opt.color || '#fff';
  ctx.fillText(str, x, y);
  ctx.restore();
}

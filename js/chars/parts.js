// Shared painting helpers for character costumes: heads, masks, emblems and suit patterns.
// All head painters draw facing +x, centered at (0,0) with radius r.
import { shade, hexRgb } from '../util.js';

export function headPath(ctx, r, jaw = 1) {
  ctx.beginPath();
  ctx.moveTo(-r * 0.82, -r * 0.5);
  ctx.quadraticCurveTo(-r * 0.6, -r * 1.12, r * 0.05, -r * 1.08);
  ctx.quadraticCurveTo(r * 0.8, -r * 1.0, r * 0.9, -r * 0.35);
  ctx.lineTo(r * 1.0, r * 0.12);
  ctx.quadraticCurveTo(r * 0.98, r * 0.62 * jaw, r * 0.72, r * 0.82 * jaw);
  ctx.quadraticCurveTo(r * 0.4, r * 1.08 * jaw, r * 0.05, r * 1.0 * jaw);
  ctx.quadraticCurveTo(-r * 0.55, r * 0.9, -r * 0.82, r * 0.25);
  ctx.closePath();
}

export function fillHead(ctx, r, c, jaw = 1) {
  headPath(ctx, r, jaw);
  const g = ctx.createRadialGradient(r * 0.3, -r * 0.4, r * 0.2, 0, 0, r * 1.3);
  g.addColorStop(0, shade(c, 1.22));
  g.addColorStop(0.6, c);
  g.addColorStop(1, shade(c, 0.6));
  ctx.fillStyle = g;
  ctx.fill();
}

export function ear(ctx, r, c) {
  ctx.fillStyle = shade(c, 0.85);
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, r * 0.05, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

// human face details: eye, brow, nose, mouth
export function face(ctx, r, opt = {}) {
  const skin = opt.skin || '#d9a07a';
  const expr = opt.expr || 'norm';
  ear(ctx, r, skin);
  // eye
  if (!opt.noEyes) {
    ctx.fillStyle = opt.eyeWhite || '#f4f0ea';
    ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 0.18, r * 0.2, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = opt.iris || '#2a3140';
    ctx.fillRect(r * 0.6, -r * 0.27, r * 0.14, r * 0.18);
  }
  // brow
  ctx.strokeStyle = opt.brow || '#3a2418';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  if (expr === 'shout' || expr === 'angry') { ctx.moveTo(r * 0.3, -r * 0.48); ctx.lineTo(r * 0.85, -r * 0.3); }
  else { ctx.moveTo(r * 0.32, -r * 0.42); ctx.lineTo(r * 0.85, -r * 0.4); }
  ctx.stroke();
  // nose
  ctx.fillStyle = shade(skin, 0.8);
  ctx.beginPath(); ctx.moveTo(r * 0.9, -r * 0.1); ctx.lineTo(r * 1.1, r * 0.25); ctx.lineTo(r * 0.85, r * 0.3); ctx.fill();
  // mouth
  ctx.strokeStyle = shade(skin, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (expr === 'shout') {
    ctx.fillStyle = '#3a0d0d';
    ctx.ellipse(r * 0.72, r * 0.58, r * 0.2, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  } else if (expr === 'hurt') {
    ctx.moveTo(r * 0.5, r * 0.6); ctx.lineTo(r * 0.85, r * 0.52); ctx.stroke();
  } else {
    ctx.moveTo(r * 0.55, r * 0.55); ctx.lineTo(r * 0.88, r * 0.52); ctx.stroke();
  }
  if (opt.lips) { ctx.fillStyle = opt.lips; ctx.fillRect(r * 0.6, r * 0.5, r * 0.3, r * 0.12); }
  if (opt.stubble) { ctx.fillStyle = 'rgba(40,25,20,0.35)'; ctx.beginPath(); ctx.ellipse(r * 0.45, r * 0.65, r * 0.5, r * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }
}

// short hair cap on top/back of the head
export function hairCap(ctx, r, c, style = 'short') {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, r * 0.2);
  ctx.quadraticCurveTo(-r * 1.0, -r * 1.0, r * 0.1, -r * 1.2);
  ctx.quadraticCurveTo(r * 0.85, -r * 1.15, r * 0.95, -r * 0.55);
  if (style === 'curl') { ctx.quadraticCurveTo(r * 0.6, -r * 0.65, r * 0.65, -r * 0.2); ctx.quadraticCurveTo(r * 0.45, -r * 0.5, r * 0.3, -r * 0.7); }
  ctx.quadraticCurveTo(r * 0.2, -r * 0.6, -r * 0.2, -r * 0.62);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.1, -r * 0.5, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(c, 1.4);
  ctx.fillRect(-r * 0.2, -r * 1.05, r * 0.6, r * 0.15);
}

// big white mask lenses with dark rim
export function lens(ctx, r, rim = '#111', fill = '#f4f6ff', size = 1, angry = false) {
  ctx.save();
  ctx.translate(r * 0.55, -r * 0.18);
  ctx.rotate(angry ? 0.35 : 0.2);
  ctx.fillStyle = rim;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.42 * size, r * 0.26 * size, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.ellipse(0.4, 0, r * 0.32 * size, r * 0.17 * size, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function glowEyes(ctx, r, c = '#fff', w = 0.32) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(r * 0.3, -r * 0.28); ctx.lineTo(r * (0.3 + w * 1.6), -r * 0.2); ctx.lineTo(r * 0.36, -r * 0.08); ctx.closePath();
  ctx.fill();
}

// ----- emblems (drawn in torso local frame: centered x=0, y around -T*0.7)
export function spiderEmblem(ctx, x, y, s, c = '#111') {
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.18, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - s * 0.38, s * 0.12, 0, Math.PI * 2); ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.1); ctx.quadraticCurveTo(x + sx * s * 0.5, y - s * 0.6, x + sx * s * 0.55, y - s * 0.95);
    ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sx * s * 0.7, y - s * 0.1, x + sx * s * 0.75, y - s * 0.45);
    ctx.moveTo(x, y + s * 0.05); ctx.quadraticCurveTo(x + sx * s * 0.6, y + s * 0.2, x + sx * s * 0.7, y + s * 0.6);
    ctx.moveTo(x, y + s * 0.1); ctx.quadraticCurveTo(x + sx * s * 0.4, y + s * 0.5, x + sx * s * 0.45, y + s * 1.0);
    ctx.stroke();
  }
}
export function batEmblem(ctx, x, y, s, c = '#111', oval = null) {
  if (oval) { ctx.fillStyle = oval; ctx.beginPath(); ctx.ellipse(x, y, s * 1.1, s * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.15);
  ctx.lineTo(x - s * 0.12, y - s * 0.4); ctx.lineTo(x - s * 0.2, y - s * 0.2);
  ctx.quadraticCurveTo(x - s * 0.6, y - s * 0.35, x - s * 1.0, y - s * 0.3);
  ctx.quadraticCurveTo(x - s * 0.7, y - s * 0.05, x - s * 0.8, y + s * 0.25);
  ctx.quadraticCurveTo(x - s * 0.5, y + s * 0.05, x - s * 0.3, y + s * 0.2);
  ctx.quadraticCurveTo(x - s * 0.15, y + s * 0.1, x, y + s * 0.45);
  ctx.quadraticCurveTo(x + s * 0.15, y + s * 0.1, x + s * 0.3, y + s * 0.2);
  ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.8, y + s * 0.25);
  ctx.quadraticCurveTo(x + s * 0.7, y - s * 0.05, x + s * 1.0, y - s * 0.3);
  ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.35, x + s * 0.2, y - s * 0.2);
  ctx.lineTo(x + s * 0.12, y - s * 0.4);
  ctx.closePath();
  ctx.fill();
}
export function superShield(ctx, x, y, s) {
  ctx.fillStyle = '#f4c81e';
  ctx.beginPath();
  ctx.moveTo(x - s, y - s * 0.55); ctx.lineTo(x - s * 0.6, y - s * 0.85); ctx.lineTo(x + s * 0.6, y - s * 0.85); ctx.lineTo(x + s, y - s * 0.55); ctx.lineTo(x, y + s * 0.8); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c4121a'; ctx.lineWidth = Math.max(1.2, s * 0.22);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.45, y - s * 0.55); ctx.lineTo(x - s * 0.3, y - s * 0.55);
  ctx.quadraticCurveTo(x - s * 0.55, y - s * 0.3, x - s * 0.1, y - s * 0.12);
  ctx.quadraticCurveTo(x + s * 0.45, y + s * 0.05, x + s * 0.05, y + s * 0.3);
  ctx.lineTo(x - s * 0.3, y + s * 0.15);
  ctx.stroke();
  ctx.strokeStyle = '#c4121a'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s * 0.55); ctx.lineTo(x - s * 0.6, y - s * 0.85); ctx.lineTo(x + s * 0.6, y - s * 0.85); ctx.lineTo(x + s, y - s * 0.55); ctx.lineTo(x, y + s * 0.8); ctx.closePath();
  ctx.stroke();
}
export function circleEmblem(ctx, x, y, s, ring, fill) {
  ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, s * 0.78, 0, Math.PI * 2); ctx.fill();
}
export function boltShape(ctx, x, y, s, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.35, y - s * 0.75); ctx.lineTo(x - s * 0.35, y + s * 0.05); ctx.lineTo(x + s * 0.02, y + s * 0.05);
  ctx.lineTo(x - s * 0.35, y + s * 0.78); ctx.lineTo(x + s * 0.4, y - s * 0.12); ctx.lineTo(x + s * 0.02, y - s * 0.12); ctx.closePath();
  ctx.fill();
}
export function lanternEmblem(ctx, x, y, s) {
  circleEmblem(ctx, x, y, s, '#111', '#f8fff8');
  ctx.fillStyle = '#1fa24a';
  ctx.beginPath(); ctx.arc(x, y - s * 0.05, s * 0.48, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f8fff8';
  ctx.beginPath(); ctx.arc(x, y - s * 0.05, s * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1fa24a';
  ctx.fillRect(x - s * 0.65, y - s * 0.62, s * 1.3, s * 0.16);
  ctx.fillRect(x - s * 0.65, y + s * 0.45, s * 1.3, s * 0.16);
}

// spider-web grid lines in a limb's local frame
export function webPattern(ctx, len, w, c = 'rgba(10,10,20,0.55)') {
  ctx.strokeStyle = c; ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let x = -w; x <= w; x += w * 0.6) { ctx.moveTo(x, -3); ctx.lineTo(x * 0.8, len + 3); }
  for (let y = 2; y < len; y += 5) { ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y + 2, w, y); }
  ctx.stroke();
}

export function bandY(ctx, y0, y1, w, c) { ctx.fillStyle = c; ctx.fillRect(-w - 4, y0, w * 2 + 8, y1 - y0); }
export function bandX(ctx, x0, x1, len, c) { ctx.fillStyle = c; ctx.fillRect(x0, -6, x1 - x0, len + 12); }

// irregular organic bumps (moss, bark, clay)
export function texture(ctx, len, w, c1, c2, seed = 1, n = 10) {
  let s = seed * 9301;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? c1 : c2;
    ctx.beginPath();
    ctx.ellipse((rnd() * 2 - 1) * w, rnd() * len, 1 + rnd() * w * 0.5, 1 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
export function barkLines(ctx, len, w, c) {
  ctx.strokeStyle = c; ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let x = -w; x <= w; x += 2.2) { ctx.moveTo(x, -2); ctx.bezierCurveTo(x + 1.5, len * 0.3, x - 1.5, len * 0.6, x + 0.5, len + 2); }
  ctx.stroke();
}

export const rgbOf = (hex) => hexRgb(hex);

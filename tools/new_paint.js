// ------------------------------------------------------------------ painting primitives
// Cel-shaded anatomy: each part is painted flat (base + costume pattern), then a shadow band on the
// side facing away from the light, a highlight band on the lit edge, and a dark inner contour.
const SHADOW = 'rgba(26,10,58,0.42)';
const HILITE = 'rgba(255,248,228,0.32)';
const LIGHT = [0.42, -0.91]; // direction toward the light, in facing-right sprite space

// which local x side of a part rotated by `ang` faces the light (+1 / -1)
export function litSide(ang) {
  const r = -ang * DEG;
  return Math.cos(r) * LIGHT[0] + Math.sin(r) * LIGHT[1] >= 0 ? 1 : -1;
}

// half-width multipliers along each limb (t = 0, .22, .5, .78, 1); side a = +x (front), b = -x (back)
const PROFILES = {
  upperArm: { a: [1.22, 1.14, 1.2, 1.0, 0.86], b: [1.12, 1.08, 1.04, 0.94, 0.86] },
  foreArm: { a: [1.02, 1.18, 1.04, 0.82, 0.74], b: [1.06, 1.12, 0.94, 0.78, 0.72] },
  thigh: { a: [1.1, 1.16, 1.1, 0.96, 0.84], b: [1.08, 1.08, 1.06, 0.92, 0.82] },
  shin: { a: [0.98, 0.96, 0.86, 0.76, 0.7], b: [1.02, 1.3, 1.14, 0.84, 0.7] },
  plain: { a: [1, 1, 1, 1, 1], b: [1, 1, 1, 1, 1] },
};
const TS = [0, 0.22, 0.5, 0.78, 1];

export function limbPath(ctx, len, w1, w2, kind = 'plain', bulge = 0) {
  const pr = PROFILES[kind] || PROFILES.plain;
  const A = TS.map((t, i) => [lerp(w1, w2, t) * pr.a[i] * (i === 2 ? 1 + bulge * 0.06 : 1), t * len]);
  const B = TS.map((t, i) => [-lerp(w1, w2, t) * pr.b[i] * (i === 2 ? 1 + bulge * 0.03 : 1), t * len]);
  ctx.beginPath();
  ctx.moveTo(B[0][0], 0);
  ctx.bezierCurveTo(B[0][0] * 0.95, -w1 * 1.05, A[0][0] * 0.95, -w1 * 1.05, A[0][0], 0);
  for (let i = 1; i < A.length - 1; i++) ctx.quadraticCurveTo(A[i][0], A[i][1], (A[i][0] + A[i + 1][0]) / 2, (A[i][1] + A[i + 1][1]) / 2);
  ctx.lineTo(A[4][0], A[4][1]);
  ctx.bezierCurveTo(A[4][0] * 0.95, len + w2 * 1.1, B[4][0] * 0.95, len + w2 * 1.1, B[4][0], len);
  for (let i = B.length - 2; i > 0; i--) ctx.quadraticCurveTo(B[i][0], B[i][1], (B[i][0] + B[i - 1][0]) / 2, (B[i][1] + B[i - 1][1]) / 2);
  ctx.closePath();
}
// kept for weapons/effects that still want a simple capsule
export function capsulePath(ctx, len, w1, w2, bulge = 0) { limbPath(ctx, len, w1, w2, 'plain', bulge); }

// shading overlay for any shape drawn by pathFn (already clipped by caller)
function celShade(ctx, pathFn, W, s, opts = {}) {
  const d1 = W * (opts.sh || 1.15), d2 = W * (opts.hl || 1.55);
  ctx.translate(-s * d1, opts.dy || 0); pathFn(); ctx.fillStyle = SHADOW; ctx.fill(); ctx.translate(s * d1, -(opts.dy || 0));
  ctx.translate(s * d2, -(opts.dy2 || 0)); pathFn(); ctx.fillStyle = HILITE; ctx.fill(); ctx.translate(-s * d2, opts.dy2 || 0);
}
function dimOverlay(ctx, dim) {
  if (dim >= 1) return;
  ctx.fillStyle = `rgba(14,6,34,${Math.min(0.6, (1 - dim) * 1.25)})`;
  ctx.fillRect(-400, -400, 800, 800);
}

export function matFill(ctx, c, w, dim = 1) { return dim === 1 ? c : shade(c, dim); }

export function toLocal(ctx, a, ang) {
  ctx.translate(a[0], a[1]);
  ctx.rotate(-ang * DEG);
}

export function limb(ctx, a, ang, len, w1, w2, part, f, dim, bulge = 0, kind = 'plain') {
  ctx.save();
  toLocal(ctx, a, ang);
  const path = () => limbPath(ctx, len, w1, w2, kind, bulge);
  path();
  ctx.fillStyle = part.c;
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (part.pat) part.pat(ctx, len, w1, w2, f, dim);
  const W = Math.max(w1, w2);
  const s = litSide(ang);
  celShade(ctx, path, W, s);
  // muscle separation hints
  if (part.muscle !== false && (kind === 'upperArm' || kind === 'thigh')) {
    ctx.strokeStyle = 'rgba(26,10,58,0.28)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-s * W * 0.15, len * 0.18); ctx.quadraticCurveTo(-s * W * 0.45, len * 0.5, -s * W * 0.1, len * 0.86); ctx.stroke();
  }
  if (kind === 'shin' && part.muscle !== false) {
    ctx.fillStyle = 'rgba(255,248,228,0.14)'; ctx.beginPath(); ctx.ellipse(W * 0.2, 1, W * 0.55, W * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  }
  dimOverlay(ctx, dim);
  ctx.restore();
  path();
  ctx.strokeStyle = shade(part.c, 0.38);
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();
}

// heroic V-taper torso: traps, deltoid line, lats, narrow waist, hips
export function torsoPath(ctx, T, b) {
  const { wH, wW, wC, wS } = b;
  const wN = b.headR * 0.62;
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.quadraticCurveTo(-wH * 0.7, 7, -wH, 2);
  ctx.quadraticCurveTo(-wH * 1.04, -T * 0.12, -wW, -T * 0.3);
  ctx.quadraticCurveTo(-wW * 0.98, -T * 0.44, -wC * 1.02, -T * 0.6);
  ctx.quadraticCurveTo(-wC * 1.08, -T * 0.72, -wS * 1.04, -T * 0.84);
  ctx.quadraticCurveTo(-wS * 1.02, -T * 0.96, -wS * 0.7, -T * 0.97);
  ctx.quadraticCurveTo(-wN * 1.4, -T * 0.98, -wN, -T - 2);
  ctx.lineTo(wN, -T - 2);
  ctx.quadraticCurveTo(wN * 1.4, -T * 0.98, wS * 0.7, -T * 0.97);
  ctx.quadraticCurveTo(wS * 1.02, -T * 0.96, wS * 1.04, -T * 0.84);
  ctx.quadraticCurveTo(wC * 1.08, -T * 0.72, wC * 1.02, -T * 0.6);
  ctx.quadraticCurveTo(wW * 0.98, -T * 0.44, wW, -T * 0.3);
  ctx.quadraticCurveTo(wH * 1.04, -T * 0.12, wH, 2);
  ctx.quadraticCurveTo(wH * 0.7, 7, 0, 7);
  ctx.closePath();
}

export function drawTorso(ctx, sk, part, f, look, pelvisOnly = false) {
  const b = sk.b, T = b.torso;
  ctx.save();
  ctx.translate(sk.hip[0], sk.hip[1]);
  ctx.rotate(sk.a.lean * DEG);
  if (pelvisOnly) { ctx.beginPath(); ctx.rect(-80, -T * 0.2, 160, T * 0.2 + 12); ctx.clip(); }
  const path = () => torsoPath(ctx, T, b);
  path();
  ctx.fillStyle = part.c;
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (!part.flat) {
    // pecs, sternum, abs, obliques
    ctx.strokeStyle = 'rgba(26,10,58,0.3)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-b.wC * 0.9, -T * 0.66); ctx.quadraticCurveTo(-b.wC * 0.45, -T * 0.52, -1, -T * 0.6);
    ctx.moveTo(b.wC * 0.9, -T * 0.66); ctx.quadraticCurveTo(b.wC * 0.45, -T * 0.52, 1, -T * 0.6);
    ctx.moveTo(0, -T * 0.86); ctx.lineTo(0, -T * 0.12);
    for (let i = 0; i < 3; i++) { const yy = -T * (0.47 - i * 0.11); ctx.moveTo(-b.wW * 0.6, yy + 1); ctx.quadraticCurveTo(-b.wW * 0.3, yy - 1, 0, yy); ctx.quadraticCurveTo(b.wW * 0.3, yy - 1, b.wW * 0.6, yy + 1); }
    ctx.moveTo(-b.wW * 0.85, -T * 0.5); ctx.quadraticCurveTo(-b.wW * 0.75, -T * 0.25, -b.wH * 0.55, -T * 0.05);
    ctx.moveTo(b.wW * 0.85, -T * 0.5); ctx.quadraticCurveTo(b.wW * 0.75, -T * 0.25, b.wH * 0.55, -T * 0.05);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,248,228,0.16)';
    ctx.beginPath(); ctx.ellipse(b.wC * 0.42, -T * 0.72, b.wC * 0.35, T * 0.07, -0.2, 0, Math.PI * 2); ctx.fill();
  }
  if (part.pat) part.pat(ctx, T, b, f);
  // cel shading: back side in shadow, chest underside, shoulder highlight
  ctx.translate(-b.wS * 1.35, 0); path(); ctx.fillStyle = SHADOW; ctx.fill(); ctx.translate(b.wS * 1.35, 0);
  ctx.fillStyle = 'rgba(26,10,58,0.18)'; ctx.beginPath(); ctx.ellipse(0, -T * 0.55, b.wC * 1.1, T * 0.05, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(b.wS * 1.62, -T * 0.08); path(); ctx.fillStyle = HILITE; ctx.fill(); ctx.translate(-b.wS * 1.62, T * 0.08);
  ctx.restore();
  if (look.torsoOver) look.torsoOver(ctx, T, b, f);
  if (!pelvisOnly) { path(); ctx.strokeStyle = shade(part.c, 0.38); ctx.lineWidth = 0.9; ctx.stroke(); }
  ctx.restore();
}

export function drawNeck(ctx, sk, color) {
  const b = sk.b;
  ctx.save();
  ctx.translate(sk.neck[0], sk.neck[1]);
  ctx.rotate(sk.a.head * DEG);
  const w0 = b.headR * 0.66, w1 = b.headR * 0.5, h = b.neck + b.headR * 0.5;
  ctx.beginPath(); ctx.moveTo(-w0, 3); ctx.quadraticCurveTo(-w1, -h * 0.4, -w1, -h); ctx.lineTo(w1, -h); ctx.quadraticCurveTo(w1, -h * 0.4, w0, 3); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = SHADOW; ctx.fillRect(-w0, -h, w0 * 0.8, h + 3);
  ctx.fillStyle = 'rgba(26,10,58,0.3)'; ctx.fillRect(-w1, -h, w1 * 2, 2.5);
  ctx.restore();
}

export function drawHand(ctx, at, ang, style, part, b, f, dim) {
  const r = b.handR * 1.12;
  const c = part.c, edge = shade(c, 0.38);
  const s = litSide(ang);
  ctx.save();
  toLocal(ctx, at, ang);
  ctx.lineWidth = 0.8; ctx.strokeStyle = edge;
  const fill = (fn) => { ctx.beginPath(); fn(); ctx.fillStyle = c; ctx.fill(); ctx.save(); ctx.clip(); ctx.translate(-s * r * 1.1, 0); ctx.beginPath(); fn(); ctx.fillStyle = SHADOW; ctx.fill(); ctx.restore(); ctx.beginPath(); fn(); ctx.stroke(); };
  if (style === 'open' || style === 'palm') {
    fill(() => { ctx.ellipse(0, r * 0.55, r * 0.95, r * 1.05, 0, 0, Math.PI * 2); });
    for (let i = 0; i < 4; i++) {
      const x = -r * 0.72 + i * r * 0.48;
      fill(() => { ctx.ellipse(x, r * 1.75 + (i === 1 || i === 2 ? r * 0.15 : 0), r * 0.24, r * 0.62, (i - 1.5) * 0.12, 0, Math.PI * 2); });
    }
    fill(() => { ctx.ellipse(r * 1.0, r * 0.75, r * 0.26, r * 0.6, -0.7, 0, Math.PI * 2); });
  } else if (style === 'point') {
    fill(() => { ctx.ellipse(0, r * 0.5, r * 0.9, r * 1.0, 0, 0, Math.PI * 2); });
    fill(() => { ctx.ellipse(-r * 0.2, r * 1.9, r * 0.24, r * 0.85, 0, 0, Math.PI * 2); });
  } else if (style === 'claw' || style === 'talon') {
    fill(() => { ctx.ellipse(0, r * 0.5, r, r * 1.05, 0, 0, Math.PI * 2); });
    ctx.strokeStyle = edge; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.5, r * 1.1); ctx.quadraticCurveTo(i * r * 0.75, r * 2.0, i * r * 0.4 + r * 0.45, r * 2.5); ctx.stroke(); }
    ctx.strokeStyle = c; ctx.lineWidth = 0.8;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.5, r * 1.1); ctx.quadraticCurveTo(i * r * 0.75, r * 2.0, i * r * 0.4 + r * 0.45, r * 2.5); ctx.stroke(); }
  } else {
    // fist: chunky block with knuckle ridge and wrapped thumb
    fill(() => { ctx.roundRect(-r * 1.0, -r * 0.1, r * 2.0, r * 2.05, r * 0.6); });
    ctx.strokeStyle = 'rgba(26,10,58,0.4)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(-r + i * r * 0.5, r * 1.3); ctx.lineTo(-r + i * r * 0.5, r * 1.9); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,248,228,0.3)'; ctx.fillRect(-r * 0.8, r * 1.55, r * 1.6, r * 0.25);
    fill(() => { ctx.ellipse(r * 0.75 * s, r * 0.85, r * 0.32, r * 0.62, 0.2 * s, 0, Math.PI * 2); });
  }
  if (part.pat) part.pat(ctx, r, style, f, dim);
  if (dim < 1) { ctx.globalCompositeOperation = 'source-atop'; dimOverlay(ctx, dim); }
  ctx.restore();
}

export function drawFoot(ctx, at, shinAng, footAng, part, b, f, dim) {
  const L = b.footL * 1.08, h = b.footH * 1.1;
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.rotate(-(footAng - 90) * DEG);
  const type = part.type || 'boot';
  const path = () => {
    ctx.beginPath();
    if (type === 'bare' || type === 'paw') {
      ctx.moveTo(-3, -h); ctx.quadraticCurveTo(L * 0.4, -h * 0.95, L, -1.5);
      ctx.quadraticCurveTo(L + 1.5, 1.5, L * 0.7, 1.8); ctx.lineTo(-4, 1.8); ctx.quadraticCurveTo(-6, -2, -3, -h);
    } else if (type === 'heel') {
      ctx.moveTo(-3, -h - 1); ctx.quadraticCurveTo(L * 0.6, -h * 0.4, L * 0.95, 0);
      ctx.lineTo(L * 0.5, 1); ctx.lineTo(-1, -1); ctx.lineTo(-2, 2.5); ctx.lineTo(-4.5, 2.5); ctx.lineTo(-4.5, -h);
    } else if (type === 'root') {
      ctx.moveTo(-4, -h); ctx.lineTo(L * 0.9, -2); ctx.lineTo(L * 1.15, 1); ctx.lineTo(L * 0.6, 0.5); ctx.lineTo(L * 0.8, 2); ctx.lineTo(-5, 2);
    } else {
      ctx.moveTo(-4.5, -h - 2); ctx.quadraticCurveTo(L * 0.25, -h - 1, L * 0.55, -h * 0.55);
      ctx.quadraticCurveTo(L + 1, -h * 0.35, L + 1, 0); ctx.quadraticCurveTo(L + 1, 2, L * 0.8, 2.2); ctx.lineTo(-5.5, 2.2); ctx.quadraticCurveTo(-6.5, -2, -4.5, -h - 2);
    }
    ctx.closePath();
  };
  path();
  ctx.fillStyle = part.c; ctx.fill();
  ctx.save(); ctx.clip();
  if (type === 'boot' && part.sole !== false) { ctx.fillStyle = shade(part.c, 0.4); ctx.fillRect(-7, 0.4, L + 9, 2.4); }
  if (part.pat) part.pat(ctx, L, h, f, dim);
  ctx.fillStyle = SHADOW; ctx.fillRect(-8, -h * 0.25, L + 12, h + 4);
  ctx.fillStyle = HILITE; ctx.beginPath(); ctx.ellipse(L * 0.35, -h * 0.85, L * 0.4, h * 0.25, 0.15, 0, Math.PI * 2); ctx.fill();
  dimOverlay(ctx, dim);
  ctx.restore();
  path(); ctx.strokeStyle = shade(part.c, 0.38); ctx.lineWidth = 0.9; ctx.stroke();
  ctx.restore();
}

// head shading overlay applied after each character's head painter
export function shadeHead(ctx, r, pathFn) {
  ctx.save();
  pathFn(ctx, r); ctx.clip();
  ctx.translate(-r * 0.95, r * 0.3); pathFn(ctx, r); ctx.fillStyle = 'rgba(26,10,58,0.0)'; ctx.restore();
  ctx.save(); pathFn(ctx, r); ctx.clip();
  ctx.beginPath(); ctx.ellipse(-r * 0.75, r * 0.15, r * 0.75, r * 1.4, 0.15, 0, Math.PI * 2); ctx.fillStyle = SHADOW; ctx.fill();
  ctx.beginPath(); ctx.ellipse(r * 0.35, r * 1.15, r * 0.9, r * 0.35, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(26,10,58,0.25)'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(r * 0.35, -r * 0.75, r * 0.5, r * 0.28, -0.3, 0, Math.PI * 2); ctx.fillStyle = HILITE; ctx.fill();
  ctx.restore();
  ctx.save(); pathFn(ctx, r); ctx.strokeStyle = 'rgba(20,8,30,0.55)'; ctx.lineWidth = 0.8; ctx.stroke(); ctx.restore();
}

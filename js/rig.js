// Skeletal character rig: pose math, inverse kinematics, body-part painting, and the
// pixel-sprite pass that turns smooth vector drawing into crisp, outlined arcade sprites.
import { DEG, clamp, lerp, smooth, easeOut, easeIn, dirv, angOf, shade, makeCanvas } from './util.js';

export const BASE_BODY = {
  thigh: 30, shin: 30, torso: 42, neck: 5, upperArm: 23, foreArm: 21, headR: 9,
  wS: 15, wC: 14, wW: 10, wH: 12, wUA: 5.5, wFA: 4.6, wTh: 7.5, wSh: 5.5, handR: 4.4, footL: 13, footH: 5,
  bUA: 1.5, bFA: 1, bTh: 1.5, bSh: 1.2,
};
export const makeBody = (o) => ({ ...BASE_BODY, ...o });

const NUM = ['x', 'y', 'lean', 'head', 'aF', 'eF', 'aB', 'eB', 'lF', 'kF', 'lB', 'kB', 'rot', 'wl', 'sq', 'ftF', 'ftB', 'gx'];
const DISC = ['hF', 'hB', 'wpn', 'face', 'fx', 'hide'];
export const P0 = { x: 0, y: 0, lean: 0, head: 0, aF: 10, eF: 20, aB: -10, eB: 20, lF: 8, kF: -8, lB: -8, kB: -6, rot: 0, wl: 0, sq: 1, ftF: null, ftB: null, gx: 0, hF: null, hB: null, wpn: null, face: null, fx: null, hide: null };

export function hipHeight(b) { return b.thigh + b.shin - 1; }

// two-bone IK for a leg: returns [thigh abs angle, knee relative angle]
function legIK(hx, hy, fx, fy, T, S) {
  let dx = fx - hx, dy = fy - hy;
  let d = Math.hypot(dx, dy);
  const maxd = T + S - 0.05;
  if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  if (d < 1) d = 1;
  const phi = angOf(dx, dy);
  const cosA = clamp((T * T + d * d - S * S) / (2 * T * d), -1, 1);
  const alpha = Math.acos(cosA) / DEG;
  const thigh = phi + alpha; // knee forward
  const kx = hx + Math.sin(thigh * DEG) * T, ky = hy + Math.cos(thigh * DEG) * T;
  const shin = angOf(fx - kx, fy - ky);
  return [thigh, shin - thigh];
}

// merge a partial pose over a base and solve IK helpers
export function resolvePose(part, base, b) {
  const p = { ...P0, ...(base || {}) };
  for (const k in part) if (k !== 'legs') p[k] = part[k];
  if (part.legs) {
    const [fF, fB, drop = 0, liftF = 0, liftB = 0] = part.legs;
    p.y = drop;
    const hy = -hipHeight(b) + drop;
    const hxF = p.x + b.wH * 0.3, hxB = p.x - b.wH * 0.3;
    [p.lF, p.kF] = legIK(hxF, hy, fF, -liftF, b.thigh, b.shin);
    [p.lB, p.kB] = legIK(hxB, hy, fB, -liftB, b.thigh, b.shin);
    // explicit leg angles win over the IK solution (kicks layered on a stance)
    for (const k of ['lF', 'kF', 'lB', 'kB']) if (part[k] != null) p[k] = part[k];
  }
  return p;
}

export function lerpPose(a, b, t) {
  const o = {};
  for (const k of NUM) {
    const va = a[k], vb = b[k];
    if (va == null || vb == null) o[k] = t < 0.5 ? va : vb;
    else o[k] = va + (vb - va) * t;
  }
  for (const k of DISC) o[k] = t < 0.5 ? a[k] : b[k];
  return o;
}

// keys: [[frame, pose, ease?], ...] sorted
export function sampleKeys(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, p0] = keys[i], [f1, p1, e] = keys[i + 1];
    if (t <= f1) {
      let u = f1 === f0 ? 1 : (t - f0) / (f1 - f0);
      u = e === 'lin' ? u : e === 'out' ? easeOut(u) : e === 'in' ? easeIn(u) : e === 'snap' ? (u < 0.5 ? 0 : 1) : smooth(u);
      return lerpPose(p0, p1, u);
    }
  }
  return keys[keys.length - 1][1];
}

// ------------------------------------------------------------------ skeleton
export function skeleton(p, b) {
  const hip = [p.x, -hipHeight(b) + p.y];
  const L = p.lean * DEG;
  const up = [Math.sin(L), -Math.cos(L)];
  const fw = [Math.cos(L), Math.sin(L)];
  const T = b.torso;
  const neck = [hip[0] + up[0] * T, hip[1] + up[1] * T];
  const sb = [hip[0] + up[0] * (T - 5), hip[1] + up[1] * (T - 5)];
  const so = b.wS * 0.42;
  const shF = [sb[0] + fw[0] * so, sb[1] + fw[1] * so + 1];
  const shB = [sb[0] - fw[0] * so, sb[1] - fw[1] * so - 1];
  const hd = (p.lean + p.head) * DEG;
  const hup = [Math.sin(hd), -Math.cos(hd)];
  const head = [neck[0] + hup[0] * (b.neck + b.headR * 0.85), neck[1] + hup[1] * (b.neck + b.headR * 0.85)];
  const arm = (sh, a, e) => {
    const d1 = dirv(a), d2 = dirv(a + e);
    const el = [sh[0] + d1[0] * b.upperArm, sh[1] + d1[1] * b.upperArm];
    const ha = [el[0] + d2[0] * b.foreArm, el[1] + d2[1] * b.foreArm];
    return [el, ha, a, a + e];
  };
  const [elF, haF, uaF, faF] = arm(shF, p.aF, p.eF);
  const [elB, haB, uaB, faB] = arm(shB, p.aB, p.eB);
  const hipF = [hip[0] + b.wH * 0.3, hip[1]], hipB = [hip[0] - b.wH * 0.3, hip[1]];
  const leg = (h, l, k) => {
    const d1 = dirv(l), d2 = dirv(l + k);
    const kn = [h[0] + d1[0] * b.thigh, h[1] + d1[1] * b.thigh];
    const ft = [kn[0] + d2[0] * b.shin, kn[1] + d2[1] * b.shin];
    return [kn, ft, l, l + k];
  };
  const [knF, ftF, thF, snF] = leg(hipF, p.lF, p.kF);
  const [knB, ftB, thB, snB] = leg(hipB, p.lB, p.kB);
  const footAng = (ft, sn, over) => {
    if (over != null) return over;
    const tt = clamp(-ft[1] / 18, 0, 1);
    return lerp(90, sn + 72, tt);
  };
  const wd = dirv(faF);
  const wpnTip = [haF[0] + wd[0] * (p.wl || 0), haF[1] + wd[1] * (p.wl || 0)];
  const sk = {
    p, b, hip, neck, head, shF, shB, elF, haF, elB, haB, hipF, hipB, knF, ftF, knB, ftB, wpnTip,
    a: { lean: p.lean, head: p.lean + p.head, uaF, faF, uaB, faB, thF, snF, thB, snB, fF: footAng(ftF, snF, p.ftF), fB: footAng(ftB, snB, p.ftB) },
    up, fw,
  };
  if (p.rot) {
    const c = Math.cos(p.rot * DEG), s = Math.sin(p.rot * DEG);
    const ox = hip[0], oy = hip[1] - 8;
    for (const k of ['hip', 'neck', 'head', 'shF', 'shB', 'elF', 'haF', 'elB', 'haB', 'hipF', 'hipB', 'knF', 'ftF', 'knB', 'ftB', 'wpnTip']) {
      const v = sk[k]; const dx = v[0] - ox, dy = v[1] - oy;
      sk[k] = [ox + dx * c - dy * s, oy + dx * s + dy * c];
    }
  }
  return sk;
}

export function bounds(sk) {
  const pts = [sk.head, sk.haF, sk.haB, sk.ftF, sk.ftB, sk.hip, sk.neck, sk.knF, sk.knB, sk.elF, sk.elB, sk.wpnTip];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0 - sk.b.headR, x1, y1];
}

// ------------------------------------------------------------------ painting primitives
export function capsulePath(ctx, len, w1, w2, bulge = 0, bulgeAt = 0.4) {
  const m = Math.max(w1, w2) + bulge;
  ctx.beginPath();
  ctx.moveTo(-w1, 0);
  ctx.quadraticCurveTo(-m, len * bulgeAt, -w2, len);
  ctx.arc(0, len, w2, Math.PI, 0, true);
  ctx.quadraticCurveTo(m - bulge * 0.4, len * bulgeAt, w1, 0);
  ctx.arc(0, 0, w1, 0, Math.PI, true);
  ctx.closePath();
}

export function matFill(ctx, c, w, dim = 1) {
  const base = dim === 1 ? c : shade(c, dim);
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, shade(base, 1.18));
  g.addColorStop(0.32, shade(base, 1.06));
  g.addColorStop(0.62, base);
  g.addColorStop(1, shade(base, 0.6));
  return g;
}

// move into a local frame where +y runs from point a toward point b
export function toLocal(ctx, a, ang) {
  ctx.translate(a[0], a[1]);
  ctx.rotate(-ang * DEG);
}

export function limb(ctx, a, ang, len, w1, w2, part, f, dim, bulge = 0) {
  ctx.save();
  toLocal(ctx, a, ang);
  capsulePath(ctx, len, w1, w2, bulge);
  ctx.fillStyle = matFill(ctx, part.c, Math.max(w1, w2), dim);
  ctx.fill();
  if (part.pat) {
    ctx.save();
    ctx.clip();
    part.pat(ctx, len, w1, w2, f, dim);
    ctx.restore();
  }
  ctx.restore();
}

export function torsoPath(ctx, T, b) {
  const { wH, wW, wC, wS } = b;
  ctx.beginPath();
  ctx.moveTo(-wH, 3);
  ctx.quadraticCurveTo(-wW - 1, -T * 0.25, -wW, -T * 0.42);
  ctx.quadraticCurveTo(-wC - 1.5, -T * 0.62, -wS, -T * 0.86);
  ctx.quadraticCurveTo(-wS * 0.75, -T - 2, 0, -T - 1);
  ctx.quadraticCurveTo(wS * 0.75, -T - 2, wS, -T * 0.86);
  ctx.quadraticCurveTo(wC + 1.5, -T * 0.62, wW, -T * 0.42);
  ctx.quadraticCurveTo(wW + 1, -T * 0.25, wH, 3);
  ctx.quadraticCurveTo(0, 7, -wH, 3);
  ctx.closePath();
}

export function drawTorso(ctx, sk, part, f, look) {
  const b = sk.b, T = b.torso;
  ctx.save();
  ctx.translate(sk.hip[0], sk.hip[1]);
  ctx.rotate(sk.a.lean * DEG);
  torsoPath(ctx, T, b);
  const g = ctx.createLinearGradient(-b.wS, -T, b.wS, 0);
  g.addColorStop(0, shade(part.c, 1.2));
  g.addColorStop(0.45, part.c);
  g.addColorStop(1, shade(part.c, 0.62));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // generic muscle shading: pecs + abs
  if (!part.flat) {
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-b.wC * 0.8, -T * 0.62); ctx.quadraticCurveTo(-b.wC * 0.3, -T * 0.55, 0, -T * 0.63);
    ctx.quadraticCurveTo(b.wC * 0.3, -T * 0.55, b.wC * 0.8, -T * 0.62);
    ctx.moveTo(0, -T * 0.82); ctx.lineTo(0, -T * 0.1);
    for (let i = 0; i < 3; i++) { const yy = -T * (0.46 - i * 0.12); ctx.moveTo(-b.wW * 0.55, yy); ctx.lineTo(b.wW * 0.55, yy); }
    ctx.stroke();
  }
  if (part.pat) part.pat(ctx, T, b, f);
  ctx.restore();
  if (look.torsoOver) look.torsoOver(ctx, T, b, f);
  ctx.restore();
}

export function drawHand(ctx, at, ang, style, part, b, f, dim) {
  const r = b.handR;
  const c = dim === 1 ? part.c : shade(part.c, dim);
  ctx.save();
  toLocal(ctx, at, ang);
  ctx.fillStyle = matFill(ctx, part.c, r, dim);
  if (style === 'open' || style === 'palm') {
    ctx.beginPath();
    ctx.ellipse(0, r * 0.4, r * 0.9, r * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(c, 0.85);
    for (let i = -1; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.42 - r * 0.15, r * 1.5, r * 0.22, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(r * 0.95, r * 0.6, r * 0.22, r * 0.55, -0.6, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'point') {
    ctx.beginPath(); ctx.ellipse(0, r * 0.4, r * 0.85, r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(c, 0.9);
    ctx.fillRect(-r * 0.25, r * 0.8, r * 0.5, r * 1.6);
  } else if (style === 'claw' || style === 'talon') {
    ctx.beginPath(); ctx.ellipse(0, r * 0.4, r, r * 1.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(c, 0.6); ctx.lineWidth = 1.4;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * r * 0.5, r); ctx.quadraticCurveTo(i * r * 0.7, r * 1.9, i * r * 0.4 + r * 0.4, r * 2.4); ctx.stroke();
    }
  } else { // fist
    ctx.beginPath();
    ctx.ellipse(0, r * 0.45, r * 1.02, r * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.9); ctx.lineTo(r * 0.7, r * 0.9); ctx.stroke();
  }
  if (part.pat) part.pat(ctx, r, style, f, dim);
  ctx.restore();
}

export function drawFoot(ctx, at, shinAng, footAng, part, b, f, dim) {
  const L = b.footL, h = b.footH;
  ctx.save();
  ctx.translate(at[0], at[1]);
  // align local +x with the foot direction
  ctx.rotate(-(footAng - 90) * DEG);
  const type = part.type || 'boot';
  ctx.beginPath();
  if (type === 'bare' || type === 'paw') {
    ctx.moveTo(-3, -h); ctx.quadraticCurveTo(L * 0.4, -h * 0.9, L, -1);
    ctx.quadraticCurveTo(L + 1, 1, L * 0.7, 1.5); ctx.lineTo(-4, 1.5); ctx.quadraticCurveTo(-5, -2, -3, -h);
  } else if (type === 'heel') {
    ctx.moveTo(-3, -h - 1); ctx.quadraticCurveTo(L * 0.6, -h * 0.4, L * 0.95, 0);
    ctx.lineTo(L * 0.5, 1); ctx.lineTo(-1, -1); ctx.lineTo(-2, 2); ctx.lineTo(-4, 2); ctx.lineTo(-4, -h);
  } else if (type === 'root') {
    ctx.moveTo(-4, -h); ctx.lineTo(L * 0.9, -2); ctx.lineTo(L * 1.15, 1); ctx.lineTo(L * 0.6, 0.5); ctx.lineTo(L * 0.8, 2); ctx.lineTo(-5, 2); ctx.closePath();
  } else {
    ctx.moveTo(-4, -h - 1); ctx.quadraticCurveTo(L * 0.5, -h, L, -1.5);
    ctx.quadraticCurveTo(L + 1.5, 1, L * 0.8, 2); ctx.lineTo(-5, 2); ctx.quadraticCurveTo(-6, -2, -4, -h - 1);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -h, 0, 2);
  const c = dim === 1 ? part.c : shade(part.c, dim);
  g.addColorStop(0, shade(c, 1.2)); g.addColorStop(1, shade(c, 0.6));
  ctx.fillStyle = g;
  ctx.fill();
  if (type === 'boot' && part.sole !== false) {
    ctx.fillStyle = shade(c, 0.45);
    ctx.fillRect(-5, 0.6, L + 4, 1.6);
  }
  if (part.pat) part.pat(ctx, L, h, f, dim);
  ctx.restore();
}

// flowing cloth: capes, coats, robes. `swing` > 0 blows it backward
export function drawCape(ctx, sk, cape, f, front = false) {
  const t = (f && f.anim ? f.animClock : 0) || 0;
  const sw = (f ? f.capeSw : 0) || 0;
  const L = cape.len, w = cape.w || 22;
  const a = sk.shB, bpt = sk.shF;
  const top = [(a[0] + bpt[0]) / 2, (a[1] + bpt[1]) / 2];
  const ang = clamp(cape.base + sw, -10, 95) * DEG; // backward angle
  const bot = [top[0] - Math.sin(ang) * L, top[1] + Math.cos(ang) * L];
  const perp = [Math.cos(ang), Math.sin(ang)];
  const half = w / 2;
  const bF = [bot[0] + perp[0] * half, bot[1] + perp[1] * half];
  const bB = [bot[0] - perp[0] * half, bot[1] - perp[1] * half];
  const wave = Math.sin(t * 0.12) * 3;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bpt[0], bpt[1] - 1);
  ctx.quadraticCurveTo(bpt[0] - 4 + wave, (bpt[1] + bF[1]) / 2, bF[0], bF[1]);
  const n = cape.style === 'scallop' ? 5 : cape.style === 'tatter' ? 7 : 4;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const x = lerp(bF[0], bB[0], u), y = lerp(bF[1], bB[1], u);
    const mx = lerp(bF[0], bB[0], u - 0.5 / n), my = lerp(bF[1], bB[1], u - 0.5 / n);
    const wob = Math.sin(t * 0.15 + i * 1.7) * 2.5;
    if (cape.style === 'scallop') ctx.quadraticCurveTo(mx - perp[1] * -9, my - 9 + wob, x, y + wob);
    else if (cape.style === 'tatter') { ctx.lineTo(mx + wob, my + 7 + (i % 2) * 5); ctx.lineTo(x, y); }
    else ctx.quadraticCurveTo(mx, my + 5 + wob, x, y + wob * 0.5);
  }
  ctx.quadraticCurveTo(a[0] - 8 - wave, (a[1] + bB[1]) / 2, a[0] - 2, a[1] - 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(bF[0], top[1], bB[0], bot[1]);
  const c = front ? cape.c : shade(cape.c, 0.82);
  g.addColorStop(0, shade(c, 1.15)); g.addColorStop(0.5, c); g.addColorStop(1, shade(c, 0.55));
  ctx.fillStyle = g;
  ctx.fill();
  // folds
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) {
    const u = i / 4;
    ctx.beginPath();
    ctx.moveTo(lerp(bpt[0], a[0], u), lerp(bpt[1], a[1], u) + 3);
    ctx.quadraticCurveTo(lerp(bF[0], bB[0], u) + Math.sin(t * 0.1 + i) * 4, (top[1] + bot[1]) / 2, lerp(bF[0], bB[0], u), lerp(bF[1], bB[1], u) - 2);
    ctx.stroke();
  }
  if (cape.lining) {
    ctx.fillStyle = cape.lining;
    ctx.beginPath(); ctx.moveTo(bpt[0], bpt[1]); ctx.lineTo(bpt[0] - 3, bpt[1] + 6); ctx.lineTo(bF[0], bF[1]); ctx.lineTo(bF[0] + 3, bF[1] - 4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

// long hair locks flowing from the back of the head
export function drawHair(ctx, sk, hair, f) {
  const t = (f ? f.animClock : 0) || 0;
  const sw = ((f ? f.capeSw : 0) || 0) * 0.7;
  const r = sk.b.headR;
  const hd = sk.a.head * DEG;
  const c = Math.cos(hd), s = Math.sin(hd);
  const rootL = (lx, ly) => [sk.head[0] + lx * c - ly * s, sk.head[1] + lx * s + ly * c];
  const n = hair.n || 5;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const root = rootL(-r * (0.2 + u * 0.7), -r * (0.7 - u * 0.9));
    const len = hair.len * (0.75 + 0.35 * Math.sin(i * 2.3 + 1));
    const ang = (hair.base + sw + u * (hair.spread || 25) + Math.sin(t * 0.1 + i) * 6) * DEG;
    const tip = [root[0] - Math.sin(ang) * len, root[1] + Math.cos(ang) * len];
    const mid = [(root[0] + tip[0]) / 2 - Math.cos(ang) * (hair.curl || 6) * Math.sin(t * 0.08 + i), (root[1] + tip[1]) / 2];
    const wv = hair.w || 5;
    ctx.beginPath();
    ctx.moveTo(root[0] + wv, root[1]);
    ctx.quadraticCurveTo(mid[0] + wv, mid[1], tip[0], tip[1]);
    ctx.quadraticCurveTo(mid[0] - wv, mid[1], root[0] - wv, root[1]);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? shade(hair.c, 0.8) : hair.c;
    ctx.fill();
  }
}

// ------------------------------------------------------------------ weapons attached to the front hand
export function drawWeapon(ctx, sk, kind, len, f, look) {
  if (!kind || len <= 0) return;
  const a = sk.haF, tip = sk.wpnTip;
  const t = (f ? f.animClock : 0) || 0;
  const dx = tip[0] - a[0], dy = tip[1] - a[1];
  const ang = Math.atan2(dy, dx);
  const L = Math.hypot(dx, dy);
  ctx.save();
  ctx.translate(a[0], a[1]);
  ctx.rotate(ang);
  const wob = (x, amp, k = 0.25) => Math.sin(x * k - t * 0.5) * amp * (x / L);
  if (kind === 'chain') {
    for (let x = 0; x < L; x += 5) {
      const y = wob(x, 6);
      ctx.fillStyle = (x / 5) % 2 ? '#8a8f9a' : '#c9ced8';
      ctx.fillRect(x - 2, y - 1.5, 5, 3);
    }
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath(); ctx.moveTo(L, wob(L, 6) - 4); ctx.lineTo(L + 9, wob(L, 6)); ctx.lineTo(L, wob(L, 6) + 4); ctx.fill();
  } else if (kind === 'vine' || kind === 'branch' || kind === 'tendril' || kind === 'whip' || kind === 'lasso' || kind === 'web') {
    const col = { vine: '#2f7a2a', branch: '#7a5a2a', tendril: '#15151c', whip: '#ffb030', lasso: '#ffd040', web: '#f4f4f4' }[kind];
    const w0 = { vine: 3, branch: 6, tendril: 4, whip: 1.6, lasso: 1.8, web: 1 }[kind];
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    let px = 0, py = 0;
    for (let x = 4; x <= L; x += 4) {
      const y = kind === 'web' ? 0 : wob(x, kind === 'branch' ? 2 : 7);
      ctx.lineWidth = Math.max(1, w0 * (1 - x / L * 0.6));
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      if (kind === 'vine' && x % 12 === 0) { ctx.fillStyle = '#4fae3a'; ctx.beginPath(); ctx.ellipse(x, y - 3, 3, 1.6, -0.5, 0, Math.PI * 2); ctx.fill(); }
      if (kind === 'branch' && x % 16 === 0) { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 6); ctx.stroke(); }
      px = x; py = y;
    }
    if (kind === 'lasso') { ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(L + 6, py, 7, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (kind === 'branch') { ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.arc(L, py, 6, 0, Math.PI * 2); ctx.fill(); }
    if (kind === 'tendril') { ctx.fillStyle = '#15151c'; ctx.beginPath(); ctx.moveTo(L - 2, py - 4); ctx.lineTo(L + 8, py); ctx.lineTo(L - 2, py + 4); ctx.fill(); }
  } else if (kind === 'mace' || kind === 'hammer') {
    ctx.fillStyle = look && look.mud ? look.mud : '#7a5233';
    ctx.fillRect(0, -3, L, 6);
    const R = 7 + L * 0.12;
    if (kind === 'mace') {
      ctx.beginPath(); ctx.arc(L, 0, R, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 8; i++) { const q = i * Math.PI / 4 + 0.3; ctx.beginPath(); ctx.moveTo(L + Math.cos(q) * R * 0.8, Math.sin(q) * R * 0.8); ctx.lineTo(L + Math.cos(q) * (R + 6), Math.sin(q) * (R + 6)); ctx.lineTo(L + Math.cos(q + 0.3) * R * 0.8, Math.sin(q + 0.3) * R * 0.8); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(L - R * 0.3, -R * 0.3, R * 0.4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(L - 6, -R * 1.2, R * 1.4, R * 2.4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(L + R * 0.8, -R * 1.2, 4, R * 2.4);
    }
  } else if (kind === 'gfist') {
    const R = 6 + L * 0.25;
    ctx.fillStyle = '#3cff6a';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, -2, L - R, 4);
    ctx.beginPath(); ctx.ellipse(L, 0, R, R * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b6ffc8';
    ctx.beginPath(); ctx.ellipse(L - R * 0.2, -R * 0.3, R * 0.5, R * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'sword') {
    ctx.fillStyle = '#c9a43c'; ctx.fillRect(-2, -5, 4, 10);
    const g = ctx.createLinearGradient(0, -3, 0, 3); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8a96aa');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(2, -2.5); ctx.lineTo(L, -1.5); ctx.lineTo(L + 6, 0); ctx.lineTo(L, 1.5); ctx.lineTo(2, 2.5); ctx.fill();
  } else if (kind === 'blade' || kind === 'claws') {
    ctx.strokeStyle = '#e8edf5'; ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(0, i * 2.5); ctx.quadraticCurveTo(L * 0.6, i * 3.2, L, i * 2.2 + 2); ctx.stroke(); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ full character
export function drawCharacter(ctx, sk, f, look) {
  const b = sk.b, A = sk.a, p = sk.p;
  const P = look.parts;
  const DIM = 0.74;
  const hide = p.hide || look.hide;
  if (look.back) look.back(ctx, sk, f);
  if (look.cape) drawCape(ctx, sk, look.cape, f);
  if (look.hair && !look.hairFront) drawHair(ctx, sk, look.hair, f);
  // back arm
  if (!hide || hide.indexOf('armB') < 0) {
    limb(ctx, sk.shB, A.uaB, b.upperArm, b.wUA, b.wFA + 0.6, P.upperArm, f, DIM, b.bUA);
    limb(ctx, sk.elB, A.faB, b.foreArm, b.wFA, b.wFA * 0.78, P.foreArm, f, DIM, b.bFA);
    drawHand(ctx, sk.haB, A.faB, p.hB || look.hand || 'fist', P.hand, b, f, DIM);
  }
  // back leg
  limb(ctx, sk.hipB, A.thB, b.thigh, b.wTh, b.wSh + 0.8, P.thigh, f, DIM, b.bTh);
  limb(ctx, sk.knB, A.snB, b.shin, b.wSh, b.wSh * 0.8, P.shin, f, DIM, b.bSh);
  drawFoot(ctx, sk.ftB, A.snB, A.fB, P.foot, b, f, DIM);
  if (look.midBack) look.midBack(ctx, sk, f);
  drawTorso(ctx, sk, P.torso, f, look);
  // front leg
  limb(ctx, sk.hipF, A.thF, b.thigh, b.wTh, b.wSh + 0.8, P.thigh, f, 1, b.bTh);
  limb(ctx, sk.knF, A.snF, b.shin, b.wSh, b.wSh * 0.8, P.shin, f, 1, b.bSh);
  drawFoot(ctx, sk.ftF, A.snF, A.fF, P.foot, b, f, 1);
  if (look.skirt) look.skirt(ctx, sk, f);
  // neck + head
  ctx.save();
  ctx.translate(sk.neck[0], sk.neck[1]);
  ctx.rotate(A.head * DEG);
  ctx.fillStyle = look.neck || P.torso.c;
  ctx.fillRect(-b.headR * 0.42, -b.neck - 3, b.headR * 0.84, b.neck + 5);
  ctx.restore();
  ctx.save();
  ctx.translate(sk.head[0], sk.head[1]);
  ctx.rotate(A.head * DEG);
  look.head(ctx, b.headR, f, p.face, sk);
  ctx.restore();
  if (look.hair && look.hairFront) drawHair(ctx, sk, look.hair, f);
  if (look.mid) look.mid(ctx, sk, f);
  // front arm
  limb(ctx, sk.shF, A.uaF, b.upperArm, b.wUA, b.wFA + 0.6, P.upperArm, f, 1, b.bUA);
  limb(ctx, sk.elF, A.faF, b.foreArm, b.wFA, b.wFA * 0.78, P.foreArm, f, 1, b.bFA);
  drawWeapon(ctx, sk, p.wpn, p.wl, f, look);
  drawHand(ctx, sk.haF, A.faF, p.hF || look.hand || 'fist', P.hand, b, f, 1);
  if (look.front) look.front(ctx, sk, f);
}

// ------------------------------------------------------------------ pixel sprite buffer
export const SPR_W = 420, SPR_H = 360, SPR_OX = 210, SPR_OY = 300;

export class SpriteBuffer {
  constructor() {
    this.cv = makeCanvas(SPR_W, SPR_H);
    this.ctx = this.cv.getContext('2d', { willReadFrequently: true });
  }
  // draws the character with outline + posterized color into the buffer, returns region drawn
  render(sk, f, look, facing, scale = 1, tint = null) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, SPR_W, SPR_H);
    ctx.setTransform(facing * scale, 0, 0, scale, SPR_OX, SPR_OY);
    const p = sk.p;
    if (p.rot) {
      // skeleton points are already rotated for hitboxes; draw from an unrotated copy
      sk = skeleton({ ...p, rot: 0 }, sk.b);
      const ox = sk.hip[0], oy = sk.hip[1] - 8;
      ctx.translate(ox, oy); ctx.rotate(p.rot * DEG); ctx.translate(-ox, -oy);
    }
    if (p.sq && p.sq !== 1) { ctx.translate(0, 0); ctx.scale(1 / Math.sqrt(p.sq), p.sq); }
    drawCharacter(ctx, sk, f, look);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // pixel pass over the bounding region
    const bb = bounds(sk);
    const m = 70 * scale;
    let x0 = Math.floor(SPR_OX + Math.min(bb[0] * facing, bb[2] * facing) * scale - m);
    let x1 = Math.ceil(SPR_OX + Math.max(bb[0] * facing, bb[2] * facing) * scale + m);
    let y0 = Math.floor(SPR_OY + bb[1] * scale - m), y1 = Math.ceil(SPR_OY + bb[3] * scale + 30);
    if (p.rot) { x0 = 0; x1 = SPR_W; y0 = 0; y1 = SPR_H; }
    x0 = clamp(x0, 0, SPR_W - 2); x1 = clamp(x1, x0 + 2, SPR_W); y0 = clamp(y0, 0, SPR_H - 2); y1 = clamp(y1, y0 + 2, SPR_H);
    const w = x1 - x0, h = y1 - y0;
    const img = ctx.getImageData(x0, y0, w, h);
    const d = img.data;
    const n = w * h;
    const solid = new Uint8Array(n);
    const Q = 22;
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      if (d[j + 3] > 105) {
        solid[i] = 1;
        d[j + 3] = 255;
        d[j] = Math.min(255, Math.round(d[j] / Q) * Q);
        d[j + 1] = Math.min(255, Math.round(d[j + 1] / Q) * Q);
        d[j + 2] = Math.min(255, Math.round(d[j + 2] / Q) * Q);
      } else d[j + 3] = 0;
    }
    const oc = look.outlineRGB || [12, 8, 16];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (solid[i]) continue;
        if (solid[i - 1] || solid[i + 1] || solid[i - w] || solid[i + w]) {
          const j = i * 4;
          d[j] = oc[0]; d[j + 1] = oc[1]; d[j + 2] = oc[2]; d[j + 3] = 255;
        }
      }
    }
    if (tint) {
      const [tr, tg, tb, ta] = tint;
      for (let i = 0, j = 0; i < n; i++, j += 4) {
        if (!d[j + 3]) continue;
        d[j] = d[j] + (tr - d[j]) * ta; d[j + 1] = d[j + 1] + (tg - d[j + 1]) * ta; d[j + 2] = d[j + 2] + (tb - d[j + 2]) * ta;
      }
    }
    ctx.putImageData(img, x0, y0);
    this.region = [x0, y0, w, h];
    return this.region;
  }
}

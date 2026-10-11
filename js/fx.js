// Particles, hit sparks, and the drawing code for every projectile, beam, eruption and aura.
import { W, H, rand, randi, clamp, lerp, shade, rgba, text, DEG } from './util.js';

const TAU = Math.PI * 2;

export class FX {
  constructor() { this.list = []; }
  add(p) { p.t = 0; this.list.push(p); return p; }
  update() {
    for (const p of this.list) {
      p.t++;
      p.x += p.vx || 0; p.y += p.vy || 0;
      if (p.g) p.vy += p.g;
      if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
      if (p.rot != null) p.rot += p.vr || 0;
    }
    this.list = this.list.filter((p) => p.t < p.life);
    if (this.list.length > 900) this.list.splice(0, this.list.length - 900);
  }

  // ---------- emitters
  spark(x, y, kind, color = '#ffd040', dir = 1, fxKind) {
    if (kind === 'block') {
      this.add({ type: 'hex', x, y, life: 12, r: 10, color: '#9fd8ff', add: true });
      for (let i = 0; i < 6; i++) this.add({ type: 'line', x, y, vx: dir * rand(1, 4), vy: rand(-3, 3), life: 10, len: 6, color: '#e0f4ff', add: true });
      return;
    }
    if (kind === 'slash' || fxKind === 'slash') {
      for (let i = 0; i < 3; i++) this.add({ type: 'slash', x: x + rand(-6, 6), y: y + rand(-8, 8), life: 10, len: 40 + i * 6, ang: -0.6 + rand(-0.3, 0.3) + (i - 1) * 0.15, color: '#ffffff', c2: color, add: true });
      for (let i = 0; i < 8; i++) this.add({ type: 'line', x, y, vx: dir * rand(2, 7), vy: rand(-5, 3), life: 12, len: 7, color: '#fff7c0', add: true, g: 0.2 });
      return;
    }
    const big = kind === 'big' || kind === 'huge';
    const huge = kind === 'huge';
    this.add({ type: 'flash', x, y, life: huge ? 10 : 6, r: huge ? 40 : big ? 24 : 12, color: '#ffffff', add: true });
    this.add({ type: 'star', x, y, life: big ? 10 : 7, r: huge ? 46 : big ? 28 : 15, n: big ? 8 : 6, color: big ? color : '#fff4b0', c2: '#ffffff', rot: rand(0, 1), add: true });
    this.add({ type: 'ring', x, y, life: big ? 14 : 9, r: 4, vr0: big ? 3.2 : 2, color: big ? color : '#fff0a0', add: true });
    const n = huge ? 22 : big ? 14 : 7;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const s = rand(2, big ? 9 : 5);
      this.add({ type: 'line', x, y, vx: Math.cos(a) * s + dir * 2, vy: Math.sin(a) * s, life: randi(8, 16), len: rand(4, 10), color: i % 3 ? '#fff6c8' : color, add: true, drag: 0.9 });
    }
    if (fxKind === 'fire' || fxKind === 'elec' || fxKind === 'magic') this.burst(x, y, color);
  }
  dust(x, y, n = 4) {
    for (let i = 0; i < n * 2; i++) this.add({ type: 'smoke', x: x + rand(-10, 10), y: y - 2, vx: rand(-1.6, 1.6), vy: rand(-1.2, -0.2), life: randi(14, 24), r: rand(3, 6), grow: 0.25, color: '#c8b8a0', a: 0.5 });
  }
  ring(x, y, color = '#fff') { this.add({ type: 'ring', x, y, life: 14, r: 6, vr0: 3, color, add: true }); }
  burst(x, y, color = '#fff') {
    this.add({ type: 'flash', x, y, life: 8, r: 18, color, add: true });
    for (let i = 0; i < 10; i++) { const a = rand(0, TAU), s = rand(1, 5); this.add({ type: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: randi(10, 20), s: 2, color, add: true, drag: 0.92 }); }
  }
  explosion(x, y, color = '#ffa020') {
    this.add({ type: 'flash', x, y, life: 12, r: 46, color: '#fff6c0', add: true });
    this.add({ type: 'ring', x, y, life: 18, r: 10, vr0: 4, color, add: true });
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU), s = rand(0.5, 3); this.add({ type: 'smoke', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.6, life: randi(20, 36), r: rand(6, 12), grow: 0.4, color: i % 2 ? '#ff7a10' : '#ffd040', a: 0.9, add: true }); }
    for (let i = 0; i < 8; i++) this.add({ type: 'smoke', x: x + rand(-10, 10), y: y + rand(-10, 10), vx: rand(-1, 1), vy: rand(-1.5, -0.5), life: 40, r: 8, grow: 0.3, color: '#3a3030', a: 0.6 });
  }
  flame(x, y, n = 3, color = '#ff7a1a') {
    for (let i = 0; i < n; i++) this.add({ type: 'flame', x: x + rand(-8, 8), y: y + rand(-6, 6), vx: rand(-0.5, 0.5), vy: rand(-2.5, -1), life: randi(14, 24), r: rand(3, 6), color, add: true });
  }
  puff(x, y, color = '#888') { for (let i = 0; i < 4; i++) this.add({ type: 'smoke', x: x + rand(-8, 8), y: y + rand(-8, 8), vx: rand(-1, 1), vy: rand(-1, 0), life: 24, r: 5, grow: 0.3, color, a: 0.6 }); }
  puffBig(x, y, kind = 'smoke', color) {
    const c = color || (kind === 'smoke' ? '#5a5a66' : kind === 'dark' ? '#3a1060' : kind === 'magic' ? '#ffb030' : kind === 'mud' ? '#6b4a2a' : kind === 'leaf' ? '#3a8a2a' : '#b0f0ff');
    for (let i = 0; i < 18; i++) { const a = rand(0, TAU), s = rand(0.5, 3); this.add({ type: 'smoke', x: x + rand(-10, 10), y: y + rand(-30, 30), vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: randi(20, 34), r: rand(6, 11), grow: 0.35, color: c, a: 0.8, add: kind === 'magic' || kind === 'speed' }); }
    if (kind === 'magic') this.add({ type: 'mandala', x, y, life: 24, r: 34, color: '#ffb030', add: true });
    if (kind === 'bats') for (let i = 0; i < 10; i++) this.add({ type: 'bat', x, y: y + rand(-20, 20), vx: rand(-4, 4), vy: rand(-4, -1), life: 40, s: rand(4, 7), color: '#111' });
    if (kind === 'leaf') for (let i = 0; i < 12; i++) this.add({ type: 'leaf', x, y: y + rand(-30, 30), vx: rand(-3, 3), vy: rand(-3, 1), life: 40, s: 4, rot: rand(0, 6), vr: rand(-0.3, 0.3), color: i % 2 ? '#4fae3a' : '#2f7a2a', g: 0.05 });
  }
  text(x, y, str, color = '#fff') { this.add({ type: 'text', x, y, vy: -0.8, life: 60, str, color }); }
  superFlash(x, y, color) {
    this.add({ type: 'ring', x, y, life: 30, r: 10, vr0: 8, color: '#fff', add: true });
    this.add({ type: 'ring', x, y, life: 30, r: 4, vr0: 5, color, add: true });
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; this.add({ type: 'line', x, y, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: 22, len: 18, color: i % 2 ? '#fff' : color, add: true }); }
  }
  afterimage(f) { this.add({ type: 'flash', x: f.x, y: f.y - 60, life: 8, r: 30, color: f.def.color, add: true }); }
  beamSpark(x, y, color) { for (let i = 0; i < 2; i++) this.add({ type: 'dot', x, y: y + rand(-6, 6), vx: rand(-2, 2), vy: rand(-3, 1), life: 12, s: 2, color, add: true }); }
  rocks(x, y, n = 6, color = '#6a5a4a') { for (let i = 0; i < n; i++) this.add({ type: 'shard', x: x + rand(-14, 14), y, vx: rand(-3, 3), vy: rand(-8, -3), g: 0.4, life: 40, s: rand(3, 6), rot: rand(0, 6), vr: rand(-0.3, 0.3), color }); }
  leaves(x, y, n = 6) { for (let i = 0; i < n; i++) this.add({ type: 'leaf', x: x + rand(-14, 14), y: y + rand(-10, 10), vx: rand(-2, 2), vy: rand(-3, 0), g: 0.06, life: 50, s: 4, rot: rand(0, 6), vr: rand(-0.2, 0.2), color: i % 2 ? '#4fae3a' : '#7ad04a' }); }

  // ---------- render particles
  draw(ctx, toS) {
    for (const p of this.list) {
      const [x, y] = toS(p.x, p.y);
      const k = 1 - p.t / p.life;
      ctx.save();
      if (p.add) ctx.globalCompositeOperation = 'lighter';
      switch (p.type) {
        case 'line': {
          ctx.strokeStyle = p.color; ctx.globalAlpha = k; ctx.lineWidth = 2;
          const l = Math.hypot(p.vx, p.vy) || 1;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (p.vx / l) * p.len, y - (p.vy / l) * p.len); ctx.stroke();
          break;
        }
        case 'dot': ctx.fillStyle = p.color; ctx.globalAlpha = k; ctx.fillRect(Math.round(x), Math.round(y), p.s, p.s); break;
        case 'flash': ctx.fillStyle = p.color; ctx.globalAlpha = k * 0.9; ctx.beginPath(); ctx.arc(x, y, p.r * (0.6 + 0.4 * k), 0, TAU); ctx.fill(); break;
        case 'ring': ctx.strokeStyle = p.color; ctx.globalAlpha = k; ctx.lineWidth = 2 + k * 2; ctx.beginPath(); ctx.arc(x, y, p.r + p.t * p.vr0, 0, TAU); ctx.stroke(); break;
        case 'hex': {
          ctx.strokeStyle = p.color; ctx.globalAlpha = k; ctx.lineWidth = 2; const r = p.r + p.t * 1.5;
          ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 6 * TAU; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.2); } ctx.stroke(); break;
        }
        case 'star': {
          const r = p.r * (0.5 + 0.5 * Math.min(1, p.t / 3)) * (0.7 + 0.3 * k);
          ctx.globalAlpha = k;
          ctx.fillStyle = p.color;
          starPath(ctx, x, y, r, r * 0.35, p.n, p.rot); ctx.fill();
          ctx.fillStyle = p.c2;
          starPath(ctx, x, y, r * 0.55, r * 0.2, p.n, p.rot + 0.3); ctx.fill();
          break;
        }
        case 'slash': {
          ctx.globalAlpha = k;
          ctx.translate(x, y); ctx.rotate(p.ang);
          const L = p.len * Math.min(1, p.t / 2 + 0.3);
          ctx.fillStyle = p.c2; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -5, L / 2, 0); ctx.quadraticCurveTo(0, 2, -L / 2, 0); ctx.fill();
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -2.5, L / 2, 0); ctx.quadraticCurveTo(0, 1, -L / 2, 0); ctx.fill();
          break;
        }
        case 'smoke': ctx.fillStyle = p.color; ctx.globalAlpha = (p.a || 0.6) * k; ctx.beginPath(); ctx.arc(x, y, p.r + p.t * (p.grow || 0.2), 0, TAU); ctx.fill(); break;
        case 'flame': {
          ctx.globalAlpha = k;
          const r = p.r * k + 1;
          ctx.fillStyle = k > 0.6 ? '#fff2a0' : p.color;
          ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.quadraticCurveTo(x + r, y - r * 0.4, x, y + r * 0.6); ctx.quadraticCurveTo(x - r, y - r * 0.4, x, y - r * 2.2); ctx.fill();
          break;
        }
        case 'shard': ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, 1.2); break;
        case 'leaf': ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, TAU); ctx.fill(); break;
        case 'bat': { ctx.translate(x, y); const fl = Math.sin(p.t * 0.8) * 0.6; ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-p.s, -p.s * fl); ctx.lineTo(-p.s * 0.5, p.s * 0.2); ctx.lineTo(0, p.s * 0.3); ctx.lineTo(p.s * 0.5, p.s * 0.2); ctx.lineTo(p.s, -p.s * fl); ctx.closePath(); ctx.fill(); break; }
        case 'mandala': ctx.globalAlpha = k; drawMandala(ctx, x, y, p.r * (1 + p.t * 0.02), p.t * 0.05, p.color); break;
        case 'text': ctx.globalAlpha = Math.min(1, k * 2); text(ctx, p.str, x, y, { size: 8, align: 'center', color: p.color, stroke: '#000', strokeW: 3 }); break;
      }
      ctx.restore();
    }
  }

  drawBeam(ctx, b, toS) {
    const [x0, y0] = toS(b.x, b.y);
    const [x1, y1] = toS(lerp(b.x, b.ex, b.cur), lerp(b.y, b.ey, b.cur));
    const t = b.t;
    const fade = Math.max(0.05, b.t > b.dur - 6 ? (b.dur - b.t) / 6 : 1);
    const w = b.w * fade * (0.85 + 0.15 * Math.sin(t * 0.8));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (b.look === 'ice') {
      ctx.strokeStyle = rgba('#9fe8ff', 0.5); ctx.lineWidth = w * 1.6; line(ctx, x0, y0, x1, y1);
      for (let i = 0; i < 10; i++) { const u = ((i / 10) + t * 0.03) % 1; const px = lerp(x0, x1, u), py = lerp(y0, y1, u) + Math.sin(i * 3 + t * 0.4) * w * 0.5; ctx.fillStyle = '#e8fbff'; ctx.fillRect(px, py, 3, 3); }
    } else if (b.look === 'lightning') {
      for (let k = 0; k < 2; k++) { ctx.strokeStyle = k ? '#fff' : b.color; ctx.lineWidth = k ? 2 : 5; bolt(ctx, x0, y0, x1, y1, 10, 14); }
    } else {
      ctx.strokeStyle = rgba(b.color, 0.35); ctx.lineWidth = w * 1.7; line(ctx, x0, y0, x1, y1);
      ctx.strokeStyle = b.color; ctx.lineWidth = w; line(ctx, x0, y0, x1, y1);
      ctx.strokeStyle = b.core; ctx.lineWidth = w * 0.4; line(ctx, x0, y0, x1, y1);
      // energy ripples
      ctx.strokeStyle = rgba(b.core, 0.6); ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const u = ((i / 6) + t * 0.05) % 1; const px = lerp(x0, x1, u), py = lerp(y0, y1, u); ctx.beginPath(); ctx.ellipse(px, py, 3, w * 0.7, 0, 0, TAU); ctx.stroke(); }
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x0, y0, w * 0.7, 0, TAU); ctx.fill();
    ctx.fillStyle = b.color; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(x1, y1, Math.max(0.5, w * 0.9 + Math.sin(t) * 2), 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawAura(ctx, a, toS, back) {
    const f = a.f;
    const pos = a.at ? f.point(a.at) : [f.x, f.y + (a.y || -60) * f.sc];
    const [x, y] = toS(pos[0], pos[1]);
    const k = 1 - a.t / a.dur;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, k * 2);
    if (a.kind === 'sphere' && !back) {
      const r = a.r * (0.6 + 0.4 * Math.min(1, a.t / 5));
      const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r);
      g.addColorStop(0, rgba(a.color, 0)); g.addColorStop(0.75, rgba(a.color, 0.35)); g.addColorStop(1, rgba(a.color, 0.9));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) bolt(ctx, x + Math.cos(a.t * 0.3 + i * 2) * r, y + Math.sin(a.t * 0.3 + i * 2) * r, x + Math.cos(a.t * 0.3 + i * 2 + 1.2) * r, y + Math.sin(a.t * 0.3 + i * 2 + 1.2) * r, 4, 6);
    } else if (a.kind === 'mandala' && !back) {
      drawMandala(ctx, x, y, a.r, a.t * 0.08, a.color);
    } else if (a.kind === 'flare' && back) {
      for (let i = 0; i < 6; i++) {
        const fx = x + Math.sin(i * 1.7 + a.t * 0.3) * 22, fy = y + 50 - ((a.t * 3 + i * 15) % 100);
        ctx.fillStyle = a.color; ctx.globalAlpha = 0.5 * k;
        ctx.beginPath(); ctx.moveTo(fx, fy - 14); ctx.quadraticCurveTo(fx + 6, fy, fx, fy + 6); ctx.quadraticCurveTo(fx - 6, fy, fx, fy - 14); ctx.fill();
      }
      ctx.strokeStyle = a.color; ctx.globalAlpha = 0.5 * k; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 58, 30, 6, 0, 0, TAU); ctx.stroke();
    } else if (a.kind === 'dark' && back) {
      const g = ctx.createRadialGradient(x, y, 5, x, y, a.r);
      g.addColorStop(0, rgba(a.color, 0.6)); g.addColorStop(1, rgba(a.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, a.r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- shape helpers
function starPath(ctx, x, y, r1, r2, n, rot) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU; const r = i % 2 ? r2 : r1; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
}
function line(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
export function bolt(ctx, x0, y0, x1, y1, segs = 8, jag = 10) {
  ctx.beginPath(); ctx.moveTo(x0, y0);
  for (let i = 1; i < segs; i++) { const u = i / segs; ctx.lineTo(lerp(x0, x1, u) + rand(-jag, jag), lerp(y0, y1, u) + rand(-jag, jag) * 0.6); }
  ctx.lineTo(x1, y1); ctx.stroke();
}
export function drawMandala(ctx, x, y, r, rot, color) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.stroke();
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); ctx.lineTo(Math.cos(a + Math.PI / 2) * r * 0.78, Math.sin(a + Math.PI / 2) * r * 0.78); }
  ctx.stroke();
  ctx.rotate(-rot * 2);
  ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; ctx.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); } ctx.closePath(); ctx.stroke();
  ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + Math.PI; ctx.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); } ctx.closePath(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = color; ctx.fillRect(Math.cos(a) * r * 0.89 - 1, Math.sin(a) * r * 0.89 - 1, 2, 2); }
  ctx.restore();
}
function orb(ctx, x, y, r, color, core = '#fff', glow = 1.8) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * glow);
  g.addColorStop(0, rgba(color, 0.9)); g.addColorStop(0.5, rgba(color, 0.35)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * glow, 0, TAU); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.5, 0, TAU); ctx.fill();
}
function skull(ctx, x, y, s, dir) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath(); ctx.arc(0, -2, s, 0, TAU); ctx.fill();
  ctx.fillRect(-s * 0.2, s * 0.4, s * 1.1, s * 0.6);
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.2, s * 0.28, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.2, s * 0.24, 0, TAU); ctx.fill();
  ctx.fillRect(0, s * 0.55, s * 0.9, 1.5);
  ctx.restore();
}

// ---------------------------------------------------------------- projectile drawing
export function drawProj(ctx, p, toS, G) {
  const [x, y] = toS(p.x, p.y);
  const t = p.t, d = p.facing || 1;
  const look = p.look || p.kind;
  const c = p.color || '#fff';
  ctx.save();
  if (p.kind === 'erupt') { drawErupt(ctx, p, x, y, toS, G); ctx.restore(); return; }
  if (p.tether) { drawTether(ctx, p, toS); ctx.restore(); return; }
  switch (look) {
    case 'web': {
      ctx.translate(x, y); ctx.rotate(t * 0.1);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.stroke(); }
      for (let r = 4; r <= 11; r += 3.5) { ctx.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      break;
    }
    case 'fireskull': {
      for (let i = 0; i < 6; i++) { const fx = x - d * (6 + i * 5), fy = y + Math.sin(t * 0.5 + i) * 4; ctx.fillStyle = i < 2 ? '#ffe070' : i < 4 ? '#ff8a10' : '#c02000'; ctx.globalAlpha = 1 - i * 0.14; ctx.beginPath(); ctx.arc(fx, fy, 9 - i, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      skull(ctx, x, y, 8, d);
      break;
    }
    case 'hex': case 'chaos': {
      ctx.globalCompositeOperation = 'lighter';
      orb(ctx, x, y, 7, '#ff2050', '#ffd0e0');
      ctx.strokeStyle = '#ff6080'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, y, 10 + i * 3, t * 0.2 + i * 2, t * 0.2 + i * 2 + 2); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#ff3060'; ctx.fillRect(x - d * (10 + i * 7) + rand(-3, 3), y + rand(-5, 5), 2, 2); }
      break;
    }
    case 'chaossphere': {
      ctx.globalCompositeOperation = 'lighter';
      const r = 18 + Math.sin(t * 0.3) * 2;
      orb(ctx, x, y, r, '#c01040', '#ff7090', 1.4);
      ctx.strokeStyle = '#ffb0c0'; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) bolt(ctx, x, y, x + Math.cos(t * 0.2 + i * 1.6) * r * 1.3, y + Math.sin(t * 0.2 + i * 1.6) * r * 1.3, 4, 4);
      break;
    }
    case 'tendril': {
      ctx.strokeStyle = '#101018'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - d * 34, y + Math.sin(t * 0.6) * 5); ctx.quadraticCurveTo(x - d * 16, y - 8, x, y); ctx.stroke();
      ctx.fillStyle = '#101018'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + d * 14, y); ctx.lineTo(x, y + 6); ctx.fill();
      ctx.strokeStyle = '#e8e8ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - d * 30, y); ctx.quadraticCurveTo(x - d * 16, y - 6, x, y - 1); ctx.stroke();
      break;
    }
    case 'eldritch': case 'bolt': {
      ctx.globalCompositeOperation = 'lighter';
      orb(ctx, x, y, 6, '#ff9a1a', '#fff5c0');
      ctx.strokeStyle = '#ffcf40'; ctx.lineWidth = 2; bolt(ctx, x - d * 30, y, x, y, 5, 5);
      drawMandala(ctx, x, y, 11, t * 0.2, '#ffb030');
      break;
    }
    case 'laser': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = c; ctx.lineWidth = 5; line(ctx, x - d * 18, y, x + d * 4, y);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; line(ctx, x - d * 16, y, x + d * 4, y);
      break;
    }
    case 'grenade': case 'spore': case 'bomb': {
      ctx.translate(x, y); ctx.rotate(t * 0.3);
      if (look === 'spore') { ctx.fillStyle = '#6a8a2a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8e060'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.fillRect(Math.cos(a) * 6 - 1, Math.sin(a) * 6 - 1, 3, 3); } }
      else { ctx.fillStyle = '#3a4a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff3a2a'; ctx.fillRect(-2, -8, 4, 3); if (t % 8 < 4) { ctx.fillStyle = '#fff'; ctx.fillRect(-1, -9, 2, 2); } }
      break;
    }
    case 'tornado': case 'whirlwind': {
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 9; i++) {
        const yy = y + 30 - i * 8, rw = 6 + i * 3;
        ctx.strokeStyle = i % 2 ? '#e8f4ff' : '#9ab8d0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 0.3 + i * 0.7) * 4, yy, rw, 3, 0, t * 0.4 + i, t * 0.4 + i + 4.5); ctx.stroke();
      }
      break;
    }
    case 'batarang': {
      ctx.translate(x, y); ctx.rotate(t * 0.6);
      ctx.fillStyle = '#20232a';
      ctx.beginPath(); ctx.moveTo(-11, -3); ctx.quadraticCurveTo(-5, -1, 0, -5); ctx.quadraticCurveTo(5, -1, 11, -3); ctx.quadraticCurveTo(6, 2, 0, 1); ctx.quadraticCurveTo(-6, 2, -11, -3); ctx.fill();
      ctx.fillStyle = '#7a8090'; ctx.fillRect(-6, -2, 12, 1);
      break;
    }
    case 'shield': {
      ctx.translate(x, y); ctx.scale(Math.cos(t * 0.5), 1);
      ctx.fillStyle = '#c0c4cc'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c4121a'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4c81e'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; starPath(ctx, 0, 0, 3.5, 1.5, 5, -Math.PI / 2); ctx.fill();
      break;
    }
    case 'ring': case 'ringblast': {
      ctx.globalCompositeOperation = 'lighter';
      orb(ctx, x, y, 8, '#2cff5a', '#d0ffd8');
      ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 12 + Math.sin(t * 0.5) * 2, 0, TAU); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#5aff7a'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(x - d * (10 + i * 8), y, 5 - i, 0, TAU); ctx.fill(); }
      break;
    }
    case 'bullet': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#5aff7a'; ctx.fillRect(x - 6, y - 1.5, 12, 3);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, y - 0.5, 6, 1);
      break;
    }
    case 'clay': case 'mud': {
      ctx.fillStyle = '#7a5233';
      ctx.beginPath(); ctx.ellipse(x, y, 11, 9, t * 0.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9a6e45'; ctx.beginPath(); ctx.ellipse(x - 3, y - 3, 5, 3, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#6b4a2a'; ctx.beginPath(); ctx.arc(x - d * (12 + i * 6), y + Math.sin(t + i) * 3, 3 - i * 0.6, 0, TAU); ctx.fill(); }
      break;
    }
    case 'raven': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(x, y); ctx.scale(d, 1);
      const fl = Math.sin(t * 0.5);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, 'rgba(160,60,255,0.6)'); g.addColorStop(1, 'rgba(80,0,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#1a0830';
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(6, -3); ctx.lineTo(-4, -18 * fl - 4); ctx.lineTo(-10, -2); ctx.lineTo(-20, 2); ctx.lineTo(-10, 4); ctx.lineTo(-4, 16 * fl + 6); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0a0ff'; ctx.fillRect(9, -2, 3, 2);
      break;
    }
    case 'tsphere': {
      ctx.translate(x, y);
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e0e4ec'; ctx.beginPath(); ctx.arc(-2, -2, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d42020'; ctx.fillRect(-4, -4, 8, 2); ctx.fillRect(-1, -4, 2, 8);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ff6060'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 9 + (t % 10) * 0.5, 0, TAU); ctx.stroke();
      break;
    }
    case 'thorns': {
      ctx.translate(x, y); ctx.scale(d, 1); ctx.rotate(Math.atan2(p.vy, Math.abs(p.vx)));
      ctx.fillStyle = '#2f6a1a'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-8, -3); ctx.lineTo(-6, 0); ctx.lineTo(-8, 3); ctx.fill();
      ctx.fillStyle = '#9be23a'; ctx.fillRect(-5, -0.5, 10, 1);
      break;
    }
    case 'pollen': {
      for (let i = 0; i < 14; i++) { const a = i * 2.4 + t * 0.05, r = 6 + (i % 5) * 5; ctx.fillStyle = i % 2 ? 'rgba(190,230,80,0.55)' : 'rgba(255,200,240,0.5)'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, 4 + (i % 3), 0, TAU); ctx.fill(); }
      break;
    }
    case 'lightningball': case 'zap': {
      ctx.globalCompositeOperation = 'lighter';
      orb(ctx, x, y, 7, '#a0d8ff', '#fff');
      ctx.strokeStyle = '#e0f4ff'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) bolt(ctx, x, y, x + rand(-18, 18), y + rand(-18, 18), 3, 4);
      ctx.strokeStyle = '#80c0ff'; ctx.lineWidth = 2; bolt(ctx, x - d * 26, y, x, y, 5, 5);
      break;
    }
    case 'ice': {
      ctx.translate(x, y); ctx.rotate(t * 0.2);
      ctx.fillStyle = '#c8f2ff'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 0); ctx.lineTo(0, 8); ctx.lineTo(-5, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-1, -6, 2, 6);
      break;
    }
    case 'wave': case 'rock': case 'gamma': {
      const col = look === 'gamma' ? '#5aff4a' : '#7a6a58';
      for (let i = 0; i < 4; i++) {
        const xx = x - d * i * 9, hh = (p.h + 8) * (1 - i * 0.2) * (0.8 + 0.2 * Math.sin(t * 0.8 + i));
        ctx.fillStyle = i % 2 ? shade(col, 0.8) : col;
        ctx.beginPath(); ctx.moveTo(xx - 8, y + p.h / 2); ctx.lineTo(xx - 3, y + p.h / 2 - hh); ctx.lineTo(xx + 3, y + p.h / 2 - hh * 0.8); ctx.lineTo(xx + 8, y + p.h / 2); ctx.fill();
      }
      if (look === 'gamma') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(90,255,74,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, 26, p.h * 0.7, 0, 0, TAU); ctx.fill(); }
      if (t % 4 === 0) G.fx.rocks(p.x, -2, 1, look === 'gamma' ? '#4a8a3a' : '#6a5a4a');
      break;
    }
    case 'mudwave': {
      const hgt = p.h;
      ctx.fillStyle = '#6b4a2a';
      ctx.beginPath(); ctx.moveTo(x - d * 70, y + hgt / 2);
      for (let i = 0; i <= 10; i++) { const xx = x - d * 70 + d * i * 9; ctx.lineTo(xx, y + hgt / 2 - hgt * Math.sin(i / 10 * Math.PI * 0.9) - Math.sin(t * 0.4 + i) * 6); }
      ctx.lineTo(x + d * 20, y + hgt / 2); ctx.fill();
      ctx.fillStyle = '#8a6440'; ctx.fillRect(x - d * 30 - 10, y - hgt * 0.3, 20, 6);
      ctx.fillStyle = '#1a0a00'; ctx.fillRect(x + d * 2 - 2, y - hgt * 0.35, 4, 4); ctx.fillRect(x + d * 10 - 2, y - hgt * 0.35, 4, 4);
      break;
    }
    case 'bike': {
      ctx.translate(x, y + 18); ctx.scale(d, 1);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ff8a10' : '#ffd040'; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(-30 - i * 8, -6 + Math.sin(t + i) * 5, 8 - i * 0.6, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      for (const wx of [-20, 22]) { ctx.fillStyle = '#ff6a10'; ctx.beginPath(); ctx.arc(wx, 6, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#20161a'; ctx.beginPath(); ctx.arc(wx, 6, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd040'; ctx.fillRect(wx - 1, -1, 2, 14); }
      ctx.fillStyle = '#2a2a33'; ctx.beginPath(); ctx.moveTo(-22, -2); ctx.lineTo(10, -10); ctx.lineTo(26, -4); ctx.lineTo(20, 4); ctx.lineTo(-18, 4); ctx.fill();
      ctx.fillStyle = '#b0b4c0'; ctx.fillRect(14, -16, 3, 12); ctx.fillRect(10, -18, 10, 2);
      // rider
      ctx.fillStyle = '#18181e'; ctx.fillRect(-6, -34, 12, 26); ctx.fillRect(4, -30, 14, 5);
      skull(ctx, 2, -42, 6, 1);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#ff8a10' : '#ffd040'; ctx.beginPath(); ctx.arc(-2 - i * 3, -50 - i * 2 + Math.sin(t * 0.7 + i) * 2, 6 - i, 0, TAU); ctx.fill(); }
      break;
    }
    case 'jet': case 'construct': {
      ctx.translate(x, y); ctx.scale(d, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(40,255,90,0.35)';
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(10, -14); ctx.lineTo(-20, -50); ctx.lineTo(-34, -50); ctx.lineTo(-20, -12); ctx.lineTo(-60, -10); ctx.lineTo(-70, -26); ctx.lineTo(-78, -26); ctx.lineTo(-72, 0); ctx.lineTo(-78, 26); ctx.lineTo(-70, 26); ctx.lineTo(-60, 10); ctx.lineTo(-20, 12); ctx.lineTo(-34, 50); ctx.lineTo(-20, 50); ctx.lineTo(10, 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#d8ffe0'; ctx.beginPath(); ctx.ellipse(30, -3, 12, 4, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(80,255,120,0.4)'; ctx.beginPath(); ctx.arc(-80 - i * 10, rand(-4, 4), 6 - i * 0.6, 0, TAU); ctx.fill(); }
      break;
    }
    case 'batwing': {
      ctx.translate(x, y); ctx.scale(d, 1);
      ctx.fillStyle = '#16181e';
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(20, -6); ctx.lineTo(-10, -40); ctx.lineTo(-20, -28); ctx.lineTo(-30, -36); ctx.lineTo(-40, -20); ctx.lineTo(-56, -6); ctx.lineTo(-56, 6); ctx.lineTo(-40, 20); ctx.lineTo(-30, 36); ctx.lineTo(-20, 28); ctx.lineTo(-10, 40); ctx.lineTo(20, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a6aaa'; ctx.beginPath(); ctx.ellipse(28, -2, 10, 3, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#80c0ff' : '#ffffff'; ctx.beginPath(); ctx.arc(-58 - i * 7, 0, 5 - i * 0.6, 0, TAU); ctx.fill(); }
      if (t % 12 === 0 && p.lastSpawn !== t && t > 0) { p.lastSpawn = t; const m = G.spawnProj(p.owner, { kind: 'missile', look: 'missile', vx: 6, vy: 4, from: 'hip', life: 50, w: 12, h: 8, dmg: 30, hits: 1, boom: true, boomDmg: 30, color: '#ffa020', grav: 0.05 }); m.x = p.x; m.y = p.y + 10; m.team = p.team; }
      break;
    }
    case 'missile': {
      ctx.translate(x, y); ctx.scale(d, 1); ctx.rotate(0.4);
      ctx.fillStyle = '#c8ccd4'; ctx.fillRect(-7, -2, 12, 4); ctx.fillStyle = '#d42020'; ctx.fillRect(5, -2, 3, 4);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffa020'; ctx.beginPath(); ctx.arc(-9, 0, 3 + Math.random() * 2, 0, TAU); ctx.fill();
      break;
    }
    case 'giantraven': {
      ctx.translate(x, y); ctx.scale(d, 1);
      const fl = Math.sin(t * 0.25);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 110); g.addColorStop(0, 'rgba(170,70,255,0.6)'); g.addColorStop(1, 'rgba(60,0,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#1a0630';
      ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(40, -12); ctx.lineTo(10, -100 * fl - 20); ctx.lineTo(-20, -30); ctx.lineTo(-90, -10); ctx.lineTo(-60, 4); ctx.lineTo(-90, 20); ctx.lineTo(-20, 22); ctx.lineTo(10, 90 * fl + 30); ctx.lineTo(40, 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff60ff'; ctx.fillRect(48, -6, 6, 4);
      break;
    }
    case 'gfist': {
      ctx.translate(x, y); ctx.scale(d, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(40,255,90,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 26, 0, 0, TAU); ctx.fill();
      ctx.fillRect(-60, -12, 40, 24);
      ctx.strokeStyle = '#a0ffb8'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(18, -16 + i * 10, 10, 5, 0, -1.5, 1.5); ctx.stroke(); }
      break;
    }
    case 'sphere': case 'orb': default: {
      ctx.globalCompositeOperation = 'lighter';
      orb(ctx, x, y, p.r || 8, c, p.core || '#fff');
      break;
    }
  }
  ctx.restore();
}

function drawTether(ctx, p, toS) {
  const [x0, y0] = toS(p.ox, p.oy);
  const [x1, y1] = toS(p.x, p.y);
  const look = p.look;
  ctx.lineCap = 'round';
  if (look === 'chain') {
    const n = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 5));
    for (let i = 0; i < n; i++) { const u = i / n; ctx.fillStyle = i % 2 ? '#8a8f9a' : '#d8dde8'; ctx.fillRect(lerp(x0, x1, u) - 2, lerp(y0, y1, u) + Math.sin(u * 10 + p.t) * 2 - 1.5, 5, 3); }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#ff8a10'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(lerp(x0, x1, Math.random()), lerp(y0, y1, Math.random()) - 2, 3, 0, TAU); ctx.fill(); }
  } else if (look === 'lasso') {
    ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 10, x1, y1); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,230,120,0.5)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x1, y1, 10, 7, 0, 0, TAU); ctx.stroke();
  } else if (look === 'tendril' || look === 'vine') {
    ctx.strokeStyle = look === 'vine' ? '#2f7a2a' : '#101018'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(lerp(x0, x1, 0.3), y0 - 12 * Math.sin(p.t * 0.4), lerp(x0, x1, 0.7), y1 + 12 * Math.sin(p.t * 0.4), x1, y1); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x1, y1, 5, 0, TAU); ctx.fill();
  } else if (look === 'grapple') {
    ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 1.5; line(ctx, x0, y0, x1, y1);
    ctx.fillStyle = '#9aa0aa'; ctx.save(); ctx.translate(x1, y1); ctx.rotate(Math.atan2(y1 - y0, x1 - x0)); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-2, -5); ctx.lineTo(0, 0); ctx.lineTo(-2, 5); ctx.fill(); ctx.restore();
  } else if (look === 'ring') {
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#3cff6a'; ctx.lineWidth = 4; line(ctx, x0, y0, x1, y1); ctx.strokeStyle = '#d0ffd8'; ctx.lineWidth = 1.5; line(ctx, x0, y0, x1, y1);
    ctx.fillStyle = 'rgba(60,255,106,0.5)'; ctx.beginPath(); ctx.arc(x1, y1, 9, 0, TAU); ctx.fill();
  } else { // web
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; line(ctx, x0, y0, x1, y1);
    ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x1 - 6, y1 - 6); ctx.lineTo(x1 + 6, y1 + 6); ctx.moveTo(x1 + 6, y1 - 6); ctx.lineTo(x1 - 6, y1 + 6); ctx.moveTo(x1 - 8, y1); ctx.lineTo(x1 + 8, y1); ctx.stroke();
  }
}

// things bursting from the ground (or striking from the sky)
function drawErupt(ctx, p, x, y, toS, G) {
  const pre = p.delay && p.t < p.delay;
  const groundY = toS(0, 0)[1];
  const k = pre ? 0 : Math.min(1, (p.t - (p.delay || 0)) / 5);
  const life = p.life - (p.delay || 0);
  const tt = p.t - (p.delay || 0);
  const fade = tt > life - 8 ? (life - tt) / 8 : 1;
  const h = p.h * k * fade;
  const w = p.w;
  const look = p.look;
  const c = p.color || '#fff';
  if (pre) {
    // warning glow on the floor
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(c === '#fff' ? '#ffcc66' : c, 0.25 + 0.2 * Math.sin(p.t * 0.8));
    ctx.beginPath(); ctx.ellipse(x, groundY, w * 0.7, 4, 0, 0, TAU); ctx.fill();
    if (look === 'lightning' || look === 'hail' || look === 'meteor') { ctx.fillStyle = 'rgba(200,220,255,0.15)'; ctx.fillRect(x - w / 2, 0, w, groundY); }
    if (p.t % 3 === 0 && (look === 'roots' || look === 'pillar' || look === 'spikes' || look === 'mudhand')) G.fx.rocks(p.x, -1, 1, look === 'roots' ? '#5a4a2a' : '#6a5a4a');
    return;
  }
  if (tt === 0) {
    if (G) { if (p.sfx) G.sfx(p.sfx); G.shake(p.hyper ? 5 : 3); }
    if (look === 'pillar' || look === 'spikes' || look === 'mudhand') G.fx.rocks(p.x, -2, 8);
    if (look === 'roots' || look === 'tree' || look === 'flytrap' || look === 'vines') G.fx.leaves(p.x, -20, 8);
    if (look === 'hellfire') G.fx.flame(p.x, -10, 10, '#ff7a1a');
  }
  const t = p.t;
  switch (look) {
    case 'lightning': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#a8d8ff', 0.25 * fade); ctx.fillRect(x - w, 0, w * 2, groundY);
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = i ? '#ffffff' : '#7ab8ff'; ctx.lineWidth = i ? 2 : 7; bolt(ctx, x + rand(-6, 6), 0, x, groundY, 12, 12); }
      ctx.fillStyle = '#fff'; ctx.globalAlpha = fade; ctx.beginPath(); ctx.ellipse(x, groundY, 30, 8, 0, 0, TAU); ctx.fill();
      break;
    }
    case 'hail': case 'meteor': {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const fy = ((tt * 14 + i * 40) % (groundY + 20));
        ctx.save(); ctx.translate(x + (i - 2) * 8, fy); ctx.rotate(0.3);
        ctx.fillStyle = look === 'meteor' ? '#ff7a1a' : '#c8f2ff'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(6, 0); ctx.lineTo(0, 10); ctx.lineTo(-6, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-1, -8, 2, 8);
        ctx.restore();
      }
      break;
    }
    case 'roots': case 'vines': {
      for (let i = -2; i <= 2; i++) {
        const hh = h * (1 - Math.abs(i) * 0.18);
        const bx = x + i * w * 0.18;
        ctx.strokeStyle = look === 'vines' ? '#2f7a2a' : '#5a4022'; ctx.lineWidth = 6 - Math.abs(i);
        ctx.beginPath(); ctx.moveTo(bx, groundY);
        ctx.bezierCurveTo(bx + Math.sin(t * 0.2 + i) * 10, groundY - hh * 0.4, bx - Math.sin(t * 0.2 + i) * 10, groundY - hh * 0.7, bx + i * 4, groundY - hh);
        ctx.stroke();
        if (look === 'vines') { ctx.fillStyle = '#4fae3a'; ctx.beginPath(); ctx.ellipse(bx + 5, groundY - hh * 0.5, 4, 2, 0.5, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = '#3a8a2a'; ctx.beginPath(); ctx.arc(bx + i * 4, groundY - hh, 3, 0, TAU); ctx.fill(); }
      }
      break;
    }
    case 'pillar': case 'spikes': case 'icespike': {
      const col = look === 'icespike' ? '#bfeeff' : look === 'spikes' ? (c !== '#fff' ? c : '#7a5233') : '#7a6a58';
      const n = look === 'pillar' ? 1 : 4;
      for (let i = 0; i < n; i++) {
        const bx = x + (n > 1 ? (i - 1.5) * w * 0.25 : 0), ww = n > 1 ? w * 0.22 : w * 0.6, hh = h * (n > 1 ? 0.7 + 0.3 * ((i * 7) % 3) / 2 : 1);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(bx - ww, groundY); ctx.lineTo(bx - ww * 0.3, groundY - hh); ctx.lineTo(bx + ww * 0.2, groundY - hh * 0.92); ctx.lineTo(bx + ww, groundY); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(bx - ww * 0.6, groundY); ctx.lineTo(bx - ww * 0.3, groundY - hh); ctx.lineTo(bx - ww * 0.1, groundY); ctx.fill();
      }
      break;
    }
    case 'hellfire': case 'fire': {
      for (let i = 0; i < 16; i++) {
        const fy = groundY - ((tt * 6 + i * 13) % Math.max(10, h));
        const fx = x + Math.sin(i * 2.1 + t * 0.4) * w * 0.35;
        const r = 10 * (1 - (groundY - fy) / Math.max(10, h)) + 3;
        ctx.fillStyle = i % 3 === 0 ? '#fff2a0' : i % 3 === 1 ? '#ff8a10' : '#d02000';
        ctx.globalAlpha = fade * 0.9;
        ctx.beginPath(); ctx.moveTo(fx, fy - r * 2); ctx.quadraticCurveTo(fx + r, fy, fx, fy + r * 0.6); ctx.quadraticCurveTo(fx - r, fy, fx, fy - r * 2); ctx.fill();
      }
      if (c === '#ff3050' || p.skull) skull(ctx, x, groundY - h * 0.8, 9, 1);
      break;
    }
    case 'bands': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const yy = groundY - 30 - i * 26;
        ctx.strokeStyle = '#ff2030'; ctx.lineWidth = 4 * fade;
        ctx.beginPath(); ctx.ellipse(x, yy, w * 0.55 * (1.3 - k * 0.3), 7, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#ffb0b0'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      break;
    }
    case 'darkhand': case 'mudhand': {
      const col = look === 'darkhand' ? '#1a0630' : '#6b4a2a';
      if (look === 'darkhand') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba('#a040ff', 0.35 * fade); ctx.beginPath(); ctx.ellipse(x, groundY - h / 2, w * 0.7, h * 0.6, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x - 10, groundY); ctx.lineTo(x - 12, groundY - h * 0.6);
      for (let i = 0; i < 4; i++) { const fx = x - 14 + i * 9; ctx.lineTo(fx, groundY - h * (0.85 + (i % 2) * 0.1)); ctx.lineTo(fx + 4, groundY - h * 0.65); }
      ctx.lineTo(x + 14, groundY - h * 0.5); ctx.lineTo(x + 10, groundY); ctx.fill();
      if (look === 'darkhand') { ctx.fillStyle = '#e080ff'; ctx.fillRect(x - 2, groundY - h * 0.55, 4, 2); }
      break;
    }
    case 'tendrils': {
      for (let i = -3; i <= 3; i++) {
        const bx = x + i * w * 0.12, hh = h * (1 - Math.abs(i) * 0.12);
        ctx.strokeStyle = '#101018'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(bx, groundY); ctx.quadraticCurveTo(bx + Math.sin(t * 0.3 + i) * 14, groundY - hh * 0.5, bx + i * 6, groundY - hh); ctx.stroke();
        ctx.fillStyle = '#101018'; ctx.beginPath(); ctx.moveTo(bx + i * 6 - 4, groundY - hh); ctx.lineTo(bx + i * 6, groundY - hh - 10); ctx.lineTo(bx + i * 6 + 4, groundY - hh); ctx.fill();
        ctx.strokeStyle = '#d8d8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 1, groundY); ctx.quadraticCurveTo(bx + Math.sin(t * 0.3 + i) * 14 - 1, groundY - hh * 0.5, bx + i * 6 - 1, groundY - hh); ctx.stroke();
      }
      break;
    }
    case 'gfist': case 'hammer': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#3cff6a', 0.5 * fade);
      if (look === 'gfist') {
        const top = groundY - h;
        ctx.fillRect(x - 12, top + 30, 24, h - 30);
        ctx.beginPath(); ctx.ellipse(x, top + 22, 26, 24, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#c0ffd0'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x - 12 + i * 8, top + 4, 4, 8, 0, Math.PI, 0); ctx.stroke(); }
      } else {
        const ang = (1 - k) * -1.6;
        ctx.save(); ctx.translate(x - (p.facing || 1) * 50, groundY); ctx.rotate(ang * (p.facing || 1));
        ctx.fillRect(-4, -90, 8, 70); ctx.fillRect(-26, -112, 52, 30);
        ctx.strokeStyle = '#c0ffd0'; ctx.lineWidth = 2; ctx.strokeRect(-26, -112, 52, 30);
        ctx.restore();
      }
      break;
    }
    case 'flytrap': case 'tree': {
      const top = groundY - h;
      if (look === 'tree') {
        ctx.fillStyle = '#4a3420'; ctx.fillRect(x - 14, top + 40, 28, h - 40);
        ctx.fillStyle = '#2f7a2a';
        for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i) * 34, top + 30 + Math.sin(i * 1.3) * 22, 26, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#4fae3a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - 20 + i * 10, top + 18, 10, 0, TAU); ctx.fill(); }
      } else {
        ctx.strokeStyle = '#2f7a2a'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(x, groundY); ctx.quadraticCurveTo(x + 18, groundY - h * 0.5, x, top + 40); ctx.stroke();
        const open = 0.6 * (1 - Math.min(1, tt / 18)) + 0.05;
        for (const s of [-1, 1]) {
          ctx.save(); ctx.translate(x, top + 40); ctx.rotate(s * open);
          ctx.fillStyle = '#c42040'; ctx.beginPath(); ctx.ellipse(0, -s * 2, 40, 20, 0, s > 0 ? Math.PI : 0, s > 0 ? TAU : Math.PI); ctx.fill();
          ctx.fillStyle = '#2f7a2a'; ctx.lineWidth = 4; ctx.strokeStyle = '#2f7a2a'; ctx.beginPath(); ctx.ellipse(0, -s * 2, 40, 20, 0, s > 0 ? Math.PI : 0, s > 0 ? TAU : Math.PI); ctx.stroke();
          ctx.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 10 - 3, -s * 2); ctx.lineTo(i * 10, -s * 10); ctx.lineTo(i * 10 + 3, -s * 2); ctx.fill(); }
          ctx.restore();
        }
      }
      break;
    }
    case 'geyser': case 'mudgeyser': {
      const col = look === 'mudgeyser' ? '#6b4a2a' : c;
      ctx.fillStyle = col; ctx.globalAlpha = 0.85 * fade;
      ctx.beginPath(); ctx.moveTo(x - w / 2, groundY); ctx.quadraticCurveTo(x - w * 0.2, groundY - h * 0.5, x - w * 0.3, groundY - h); ctx.lineTo(x + w * 0.3, groundY - h); ctx.quadraticCurveTo(x + w * 0.2, groundY - h * 0.5, x + w / 2, groundY); ctx.fill();
      break;
    }
    case 'tsbeam': {
      ctx.globalCompositeOperation = 'lighter';
      const sy = groundY - 150;
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(x, sy, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 6 * fade; line(ctx, x, sy, x, groundY);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * fade; line(ctx, x, sy, x, groundY);
      break;
    }
    case 'reality': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#ff1040', 0.3 * fade); ctx.fillRect(x - w / 2, 0, w, groundY);
      for (let i = 0; i < 4; i++) { ctx.strokeStyle = i % 2 ? '#ff90a0' : '#ff2050'; ctx.lineWidth = 3; bolt(ctx, x + rand(-w / 3, w / 3), 0, x + rand(-w / 3, w / 3), groundY, 8, 16); }
      break;
    }
    case 'mirror': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#ffd080', fade); ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.05; line(ctx, x, groundY - 70, x + Math.cos(a) * 90, groundY - 70 + Math.sin(a) * 90); }
      drawMandala(ctx, x, groundY - 70, 40, t * 0.1, '#ffb030');
      break;
    }
    case 'blast': default: {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(c === '#fff' ? '#ffcc40' : c, 0.5 * fade);
      ctx.beginPath(); ctx.ellipse(x, groundY - h / 2, w / 2, h / 2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.5 * fade); ctx.beginPath(); ctx.ellipse(x, groundY - h / 2, w / 4, h / 3, 0, 0, TAU); ctx.fill();
      break;
    }
  }
}
export { orb, skull, starPath };

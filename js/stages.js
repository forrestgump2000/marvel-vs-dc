// Procedurally painted parallax stages. Layers are pre-rendered once, then scrolled.
import { W, H, GROUND, makeCanvas, seeded, shade, rgba, lerp } from './util.js';

const STAGE_W = 1100;
const span = (f) => Math.ceil(W + (STAGE_W - W) * f) + 4;

function layer(f, h, draw) {
  const c = makeCanvas(span(f), h);
  const ctx = c.getContext('2d');
  draw(ctx, c.width, h);
  return { c, f };
}
function sky(top, mid, bot) {
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, top); g.addColorStop(0.6, mid); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  return { c, ctx };
}
function stars(ctx, n, rnd, w, h, col = '#fff') {
  for (let i = 0; i < n; i++) { ctx.fillStyle = rnd() < 0.2 ? col : rgba(col, 0.5 + rnd() * 0.5); ctx.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), rnd() < 0.1 ? 2 : 1, 1); }
}
// a row of buildings with lit windows
function skyline(ctx, w, base, rnd, o) {
  let x = -10;
  while (x < w) {
    const bw = o.minW + rnd() * (o.maxW - o.minW);
    const bh = o.minH + rnd() * (o.maxH - o.minH);
    const top = base - bh;
    ctx.fillStyle = o.color;
    ctx.fillRect(Math.floor(x), Math.floor(top), Math.ceil(bw), Math.ceil(bh) + 60);
    if (o.spires && rnd() < 0.35) { ctx.beginPath(); ctx.moveTo(x + bw * 0.3, top); ctx.lineTo(x + bw * 0.5, top - 20 - rnd() * 30); ctx.lineTo(x + bw * 0.7, top); ctx.fill(); }
    if (o.ledges) { ctx.fillStyle = shade(o.color, 1.25); ctx.fillRect(Math.floor(x) - 1, Math.floor(top), Math.ceil(bw) + 2, 2); }
    if (o.antenna && rnd() < 0.3) { ctx.fillStyle = o.color; ctx.fillRect(Math.floor(x + bw / 2), Math.floor(top - 14), 1, 14); if (o.blink) { ctx.fillStyle = '#ff3030'; ctx.fillRect(Math.floor(x + bw / 2) - 1, Math.floor(top - 15), 3, 2); } }
    if (o.tank && rnd() < 0.3) { const tx = x + bw * 0.4; ctx.fillStyle = o.color; ctx.fillRect(tx, top - 14, 12, 10); ctx.fillRect(tx + 1, top - 4, 1, 4); ctx.fillRect(tx + 10, top - 4, 1, 4); ctx.beginPath(); ctx.moveTo(tx - 1, top - 14); ctx.lineTo(tx + 6, top - 19); ctx.lineTo(tx + 13, top - 14); ctx.fill(); }
    // windows
    const ws = o.win;
    if (ws) for (let wy = top + 4; wy < base - 2; wy += ws.gy) for (let wx = x + 3; wx < x + bw - 3; wx += ws.gx) {
      if (rnd() < ws.p) { ctx.fillStyle = rnd() < 0.15 ? ws.c2 : ws.c; ctx.fillRect(Math.floor(wx), Math.floor(wy), ws.w, ws.h); }
    }
    x += bw + (o.gap ? rnd() * o.gap : 0);
  }
}
function floorStrip(ctx, camL, camY, o) {
  const y0 = GROUND - camY;
  const g = ctx.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, o.top); g.addColorStop(1, o.bot);
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0 + 2);
  ctx.fillStyle = o.edge; ctx.fillRect(0, y0, W, 2);
  if (o.lines) {
    ctx.strokeStyle = o.lines; ctx.lineWidth = 1;
    const step = o.step || 48;
    const start = Math.floor(camL / step) * step - step * 4;
    ctx.beginPath();
    for (let X = start; X < camL + W + step * 4; X += step) {
      const xa = X - camL, xb = (X - camL - W / 2) * 1.5 + W / 2;
      ctx.moveTo(xa, y0 + 2); ctx.lineTo(xb, H);
    }
    for (const yy of [0.25, 0.55, 0.9]) { const y = y0 + (H - y0) * yy; ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }
}

// ======================================================================= stage definitions
function gotham() {
  const rnd = seeded(7);
  const s = sky('#06060f', '#1a1430', '#3a2a40');
  stars(s.ctx, 60, rnd, W, 160);
  s.ctx.fillStyle = '#f4ecd0'; s.ctx.beginPath(); s.ctx.arc(520, 70, 26, 0, Math.PI * 2); s.ctx.fill();
  s.ctx.fillStyle = '#1a1430'; s.ctx.beginPath(); s.ctx.arc(510, 64, 24, 0, Math.PI * 2); s.ctx.fill();
  const far = layer(0.15, H, (ctx, w) => skyline(ctx, w, 250, rnd, { minW: 20, maxW: 46, minH: 60, maxH: 170, color: '#14121e', spires: true, antenna: true, blink: true, win: { gx: 5, gy: 6, w: 2, h: 2, p: 0.12, c: '#c8a040', c2: '#fff0a0' } }));
  const mid = layer(0.45, H, (ctx, w) => {
    skyline(ctx, w, 290, rnd, { minW: 40, maxW: 90, minH: 80, maxH: 190, color: '#1e1a28', ledges: true, spires: true, gap: 10, win: { gx: 8, gy: 10, w: 3, h: 4, p: 0.2, c: '#e8b040', c2: '#fff4c0' } });
    // gargoyles
    for (let x = 60; x < w; x += 260) { ctx.fillStyle = '#0e0c14'; ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x + 10, 186); ctx.lineTo(x + 16, 192); ctx.lineTo(x + 24, 180); ctx.lineTo(x + 22, 200); ctx.fill(); }
  });
  const near = layer(1, H, (ctx, w) => {
    // rooftop props: chimneys, vents, ledge
    for (let x = 30; x < w; x += 170 + rnd() * 120) {
      ctx.fillStyle = '#2a2632'; ctx.fillRect(x, GROUND - 46, 26, 46); ctx.fillStyle = '#3a3442'; ctx.fillRect(x - 3, GROUND - 50, 32, 6);
      ctx.fillStyle = '#1a1820'; ctx.fillRect(x + 50, GROUND - 22, 34, 22); ctx.fillStyle = '#4a4452'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 53, GROUND - 19 + i * 5, 28, 2);
    }
  });
  return {
    name: 'GOTHAM ROOFTOPS', music: 'gotham', sky: s.c, layers: [far, mid, near],
    floor: { top: '#3a3640', bot: '#18161e', edge: '#5a5462', lines: 'rgba(0,0,0,0.3)', step: 60 },
    anim: (ctx, camL, camY, t) => {
      // bat signal sweeping across the clouds
      const ang = Math.sin(t * 0.008) * 0.35;
      const sx = 420 - camL * 0.15, sy = 250 - camY * 0.15;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const tx = sx + Math.sin(ang) * 260 - 40, ty = 60;
      const g = ctx.createLinearGradient(sx, sy, tx, ty); g.addColorStop(0, 'rgba(255,240,180,0.25)'); g.addColorStop(1, 'rgba(255,240,180,0.05)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 3, sy); ctx.lineTo(tx - 40, ty); ctx.lineTo(tx + 40, ty); ctx.lineTo(sx + 3, sy); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,180,0.35)'; ctx.beginPath(); ctx.ellipse(tx, ty, 36, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(10,10,20,0.85)';
      ctx.beginPath(); ctx.moveTo(tx, ty - 4); ctx.lineTo(tx - 6, ty - 10); ctx.lineTo(tx - 10, ty - 4); ctx.lineTo(tx - 26, ty - 8); ctx.lineTo(tx - 18, ty + 4); ctx.lineTo(tx - 8, ty + 2); ctx.lineTo(tx, ty + 10); ctx.lineTo(tx + 8, ty + 2); ctx.lineTo(tx + 18, ty + 4); ctx.lineTo(tx + 26, ty - 8); ctx.lineTo(tx + 10, ty - 4); ctx.lineTo(tx + 6, ty - 10); ctx.fill();
      if (t % 400 < 6) { ctx.fillStyle = 'rgba(220,220,255,0.25)'; ctx.fillRect(0, 0, W, H); }
    },
    front: (ctx, camL, camY, t) => {
      ctx.strokeStyle = 'rgba(160,170,210,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < 70; i++) { const x = (i * 97 + t * 3 - camL * 0.2) % (W + 40) - 20, y = (i * 53 + t * 9) % H; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9); }
      ctx.stroke();
    },
  };
}

function nyc() {
  const rnd = seeded(21);
  const s = sky('#2a1a4a', '#d0506a', '#ffb060');
  s.ctx.fillStyle = '#ffe0a0'; s.ctx.beginPath(); s.ctx.arc(330, 230, 40, 0, Math.PI * 2); s.ctx.fill();
  s.ctx.fillStyle = 'rgba(255,240,200,0.4)'; for (let i = 0; i < 4; i++) s.ctx.fillRect(250, 210 + i * 10, 160, 3);
  for (let i = 0; i < 6; i++) { s.ctx.fillStyle = 'rgba(255,180,200,0.35)'; s.ctx.beginPath(); s.ctx.ellipse(rnd() * W, 40 + rnd() * 120, 50 + rnd() * 40, 6, 0, 0, Math.PI * 2); s.ctx.fill(); }
  const far = layer(0.15, H, (ctx, w) => {
    skyline(ctx, w, 260, rnd, { minW: 16, maxW: 34, minH: 50, maxH: 140, color: '#5a2a5a', antenna: true, win: { gx: 4, gy: 5, w: 2, h: 2, p: 0.1, c: '#ffd080', c2: '#fff' } });
    // iconic spire tower
    const x = w * 0.5; ctx.fillStyle = '#4a2050'; ctx.fillRect(x - 14, 110, 28, 160); ctx.fillRect(x - 9, 80, 18, 30); ctx.fillRect(x - 5, 60, 10, 20); ctx.fillRect(x - 1, 30, 2, 30);
  });
  const mid = layer(0.45, H, (ctx, w) => skyline(ctx, w, 295, rnd, { minW: 40, maxW: 80, minH: 80, maxH: 170, color: '#3a1a3a', ledges: true, tank: true, gap: 8, win: { gx: 7, gy: 9, w: 3, h: 4, p: 0.25, c: '#ffc870', c2: '#fff' } }));
  const near = layer(1, H, (ctx, w) => {
    // billboard + water tower
    ctx.fillStyle = '#2a1a22'; ctx.fillRect(200, GROUND - 120, 4, 120); ctx.fillRect(320, GROUND - 120, 4, 120);
    ctx.fillStyle = '#f0e6d0'; ctx.fillRect(180, GROUND - 170, 164, 56); ctx.fillStyle = '#c4121a'; ctx.fillRect(184, GROUND - 166, 156, 48);
    ctx.fillStyle = '#fff'; ctx.font = '900 16px "Press Start 2P", monospace'; ctx.fillText('NEW YORK', 198, GROUND - 136);
    ctx.font = '900 8px "Press Start 2P", monospace'; ctx.fillText('THE CITY NEVER SLEEPS', 190, GROUND - 124);
    const tx = 760; ctx.fillStyle = '#3a2420'; ctx.fillRect(tx, GROUND - 120, 50, 60); ctx.beginPath(); ctx.moveTo(tx - 4, GROUND - 120); ctx.lineTo(tx + 25, GROUND - 140); ctx.lineTo(tx + 54, GROUND - 120); ctx.fill();
    ctx.fillStyle = '#2a1a18'; for (let i = 0; i < 4; i++) ctx.fillRect(tx + 4 + i * 13, GROUND - 60, 3, 60);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 5; i++) ctx.fillRect(tx, GROUND - 116 + i * 12, 50, 2);
    void w;
  });
  return {
    name: 'MANHATTAN SUNSET', music: 'nyc', sky: s.c, layers: [far, mid, near],
    floor: { top: '#6a4a48', bot: '#2a1a1a', edge: '#9a6a60', lines: 'rgba(0,0,0,0.25)', step: 54 },
    anim: (ctx, camL, camY, t) => {
      ctx.fillStyle = '#2a1020';
      for (let i = 0; i < 5; i++) { const x = (i * 140 + t * 0.6) % (W + 60) - 30, y = 80 + Math.sin(t * 0.03 + i) * 10 + i * 12; const f = Math.sin(t * 0.3 + i) * 3; ctx.fillRect(x - 4, y - f, 4, 1); ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 1, y - f, 4, 1); }
    },
  };
}

function metropolis() {
  const rnd = seeded(33);
  const s = sky('#3a7ad8', '#80b8f0', '#d0e8ff');
  for (let i = 0; i < 9; i++) { const x = rnd() * W, y = 30 + rnd() * 130, r = 14 + rnd() * 20; s.ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 4; k++) { s.ctx.beginPath(); s.ctx.arc(x + k * r * 0.7, y + Math.sin(k) * 4, r * (0.7 + 0.3 * Math.sin(k * 2)), 0, Math.PI * 2); s.ctx.fill(); } }
  const far = layer(0.15, H, (ctx, w) => skyline(ctx, w, 260, rnd, { minW: 20, maxW: 40, minH: 60, maxH: 160, color: '#7a9ac8', antenna: true }));
  const mid = layer(0.45, H, (ctx, w) => {
    skyline(ctx, w, 295, rnd, { minW: 40, maxW: 80, minH: 90, maxH: 180, color: '#5a7aa8', ledges: true, gap: 6, win: { gx: 6, gy: 8, w: 3, h: 4, p: 0.5, c: '#a8d0f8', c2: '#ffffff' } });
    // golden globe tower
    const x = w * 0.45; ctx.fillStyle = '#4a6a98'; ctx.fillRect(x - 20, 70, 40, 230); ctx.fillStyle = '#6a8ab8'; ctx.fillRect(x - 16, 70, 4, 230);
    ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.arc(x, 52, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a07a10'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, 52, 22, 8, 0, 0, Math.PI * 2); ctx.moveTo(x, 30); ctx.lineTo(x, 74); ctx.ellipse(x, 52, 10, 22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, 52, 30, 6, -0.3, 0, Math.PI * 2); ctx.stroke();
  });
  const near = layer(1, H, (ctx, w) => { for (let x = 80; x < w; x += 220) { ctx.fillStyle = '#8a9ab0'; ctx.fillRect(x, GROUND - 70, 4, 70); ctx.fillStyle = '#c8d8e8'; ctx.fillRect(x - 8, GROUND - 74, 20, 6); ctx.fillStyle = '#fffbe0'; ctx.fillRect(x - 4, GROUND - 68, 12, 3); } });
  return {
    name: 'METROPOLIS PLAZA', music: 'metropolis', sky: s.c, layers: [far, mid, near],
    floor: { top: '#c8c0b0', bot: '#6a6458', edge: '#f0e8d8', lines: 'rgba(60,50,40,0.35)', step: 40 },
    anim: (ctx, camL, camY, t) => {
      const x = ((t * 0.25) % (W + 200)) - 100, y = 70;
      ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.ellipse(x, y, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a0a0b0'; ctx.fillRect(x - 8, y + 8, 16, 4); ctx.fillStyle = '#c4121a'; ctx.fillRect(x - 20, y - 2, 40, 3);
    },
  };
}

function sanctum() {
  const rnd = seeded(44);
  const s = sky('#120820', '#24103a', '#3a1a40');
  const far = layer(0.15, H, (ctx, w) => {
    ctx.fillStyle = '#2a1430'; ctx.fillRect(0, 0, w, H);
    // great round window with sigil
    const x = w * 0.5, y = 130;
    ctx.fillStyle = '#4a2a20'; ctx.beginPath(); ctx.arc(x, y, 92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9ad0ff'; ctx.beginPath(); ctx.arc(x, y, 84, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a2a20'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(x, y, 50, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.6) * 70, y + Math.sin(a + 0.6) * 70, x + Math.cos(a) * 84, y + Math.sin(a) * 84); ctx.stroke(); }
    // pillars & arches
    for (let px = 20; px < w; px += 110) { ctx.fillStyle = '#3a1e30'; ctx.fillRect(px, 40, 24, 260); ctx.fillStyle = '#4a2838'; ctx.fillRect(px + 3, 40, 4, 260); }
  });
  const mid = layer(0.45, H, (ctx, w) => {
    // bookshelves
    for (let x = 0; x < w; x += 140) {
      ctx.fillStyle = '#2a1408'; ctx.fillRect(x + 10, 170, 100, 140);
      for (let sh = 0; sh < 5; sh++) {
        ctx.fillStyle = '#4a2a14'; ctx.fillRect(x + 10, 178 + sh * 26, 100, 3);
        for (let b = 0; b < 12; b++) { ctx.fillStyle = ['#7a1a1a', '#1a3a6a', '#2a5a2a', '#6a5a1a', '#4a1a4a'][Math.floor(rnd() * 5)]; ctx.fillRect(x + 13 + b * 8, 158 + sh * 26 + rnd() * 4, 6, 20 - rnd() * 4); }
      }
    }
  });
  const near = layer(1, H, (ctx, w) => {
    // the staircase banister and a relic case
    ctx.fillStyle = '#3a1a10'; ctx.fillRect(0, GROUND - 40, w, 4);
    for (let x = 0; x < w; x += 18) ctx.fillRect(x, GROUND - 40, 3, 40);
    for (let x = 300; x < w; x += 500) { ctx.fillStyle = '#c8a040'; ctx.fillRect(x, GROUND - 90, 40, 6); ctx.fillStyle = 'rgba(160,200,255,0.25)'; ctx.fillRect(x + 4, GROUND - 84, 32, 44); ctx.fillStyle = '#a01818'; ctx.fillRect(x + 12, GROUND - 76, 16, 30); }
  });
  return {
    name: 'SANCTUM SANCTORUM', music: 'sanctum', sky: s.c, layers: [far, mid, near],
    floor: { top: '#5a3420', bot: '#2a140a', edge: '#8a5a30', lines: 'rgba(0,0,0,0.35)', step: 30 },
    anim: (ctx, camL, camY, t) => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const x = (i * 83 - camL * 0.3 + 2000) % W, y = 80 + (i * 37) % 160 + Math.sin(t * 0.02 + i) * 10;
        ctx.fillStyle = 'rgba(255,170,60,0.6)'; ctx.fillRect(x, y, 2, 2);
        ctx.strokeStyle = 'rgba(255,170,60,0.25)'; ctx.beginPath(); ctx.arc(x, y, 6 + Math.sin(t * 0.05 + i) * 2, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    },
  };
}

function swamp() {
  const rnd = seeded(55);
  const s = sky('#04100c', '#0e2a20', '#2a4a30');
  stars(s.ctx, 40, rnd, W, 120, '#d0ffe0');
  s.ctx.fillStyle = '#e0f0c0'; s.ctx.beginPath(); s.ctx.arc(140, 70, 22, 0, Math.PI * 2); s.ctx.fill();
  const tree = (ctx, x, base, h, col, moss) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 10, base); ctx.lineTo(x - 5, base - h); ctx.lineTo(x + 5, base - h); ctx.lineTo(x + 12, base); ctx.fill();
    for (let i = 0; i < 5; i++) { const by = base - h * (0.5 + i * 0.1); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x + (i % 2 ? 30 : -30), by - 20, x + (i % 2 ? 50 : -50), by - 10); ctx.stroke(); if (moss) for (let k = 0; k < 4; k++) { ctx.strokeStyle = moss; ctx.lineWidth = 1; ctx.beginPath(); const mx = x + (i % 2 ? 1 : -1) * (15 + k * 9); ctx.moveTo(mx, by - 12); ctx.lineTo(mx + 1, by + 8 + k * 3); ctx.stroke(); } }
  };
  const far = layer(0.15, H, (ctx, w) => { for (let x = 0; x < w; x += 40 + rnd() * 30) tree(ctx, x, 280, 120 + rnd() * 60, '#0a1a12', null); });
  const mid = layer(0.45, H, (ctx, w) => { for (let x = 20; x < w; x += 90 + rnd() * 60) tree(ctx, x, 300, 160 + rnd() * 60, '#14281a', '#3a5a2a'); });
  const near = layer(1, H, (ctx, w) => {
    for (let x = 0; x < w; x += 300) { ctx.fillStyle = '#1a2a14'; ctx.fillRect(x + 40, GROUND - 30, 8, 30); for (let k = 0; k < 6; k++) { ctx.strokeStyle = '#2f6a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 100 + k * 6, GROUND); ctx.quadraticCurveTo(x + 104 + k * 6, GROUND - 20, x + 96 + k * 8, GROUND - 30 - k * 2); ctx.stroke(); } }
  });
  return {
    name: 'THE BAYOU', music: 'swamp', sky: s.c, layers: [far, mid, near],
    floor: { top: '#3a3018', bot: '#14120a', edge: '#5a4a28', lines: 'rgba(0,0,0,0.4)', step: 22 },
    anim: (ctx, camL, camY, t) => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const x = (i * 71 + Math.sin(t * 0.01 + i) * 30 - camL * 0.5 + 3000) % W, y = 150 + (i * 29) % 140 + Math.cos(t * 0.02 + i) * 10; const a = 0.4 + 0.4 * Math.sin(t * 0.08 + i * 2); ctx.fillStyle = `rgba(200,255,120,${a})`; ctx.fillRect(x, y, 2, 2); }
      ctx.restore();
    },
    front: (ctx, camL, camY, t) => {
      const g = ctx.createLinearGradient(0, GROUND - 70, 0, GROUND + 10);
      g.addColorStop(0, 'rgba(160,200,170,0)'); g.addColorStop(1, 'rgba(160,200,170,0.22)');
      ctx.fillStyle = g;
      for (let i = 0; i < 3; i++) { const x = ((t * (0.2 + i * 0.1) - camL * 0.6 + i * 300) % (W + 400)) - 200; ctx.beginPath(); ctx.ellipse(x, GROUND - 10, 220, 50, 0, 0, Math.PI * 2); ctx.fill(); }
    },
  };
}

function oa() {
  const rnd = seeded(66);
  const s = sky('#020208', '#0a0a2a', '#1a1040');
  stars(s.ctx, 220, rnd, W, GROUND);
  for (let i = 0; i < 5; i++) { const g = s.ctx.createRadialGradient(rnd() * W, rnd() * 200, 5, rnd() * W, rnd() * 200, 140); g.addColorStop(0, 'rgba(80,40,160,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); s.ctx.fillStyle = g; s.ctx.fillRect(0, 0, W, H); }
  s.ctx.fillStyle = '#3a2a6a'; s.ctx.beginPath(); s.ctx.arc(80, 90, 40, 0, Math.PI * 2); s.ctx.fill(); s.ctx.fillStyle = '#5a4a9a'; s.ctx.beginPath(); s.ctx.arc(70, 82, 34, 0, Math.PI * 2); s.ctx.fill();
  const far = layer(0.15, H, (ctx, w) => {
    for (let x = 0; x < w; x += 30 + rnd() * 40) { const h = 60 + rnd() * 140; ctx.fillStyle = '#10182a'; ctx.beginPath(); ctx.moveTo(x, 280); ctx.lineTo(x + 8, 280 - h); ctx.lineTo(x + 16, 280); ctx.fill(); ctx.fillStyle = '#2cff5a'; if (rnd() < 0.5) ctx.fillRect(x + 7, 280 - h * 0.7, 2, 2); }
  });
  const mid = layer(0.45, H, (ctx, w) => {
    // central power battery
    const x = w * 0.5;
    ctx.fillStyle = '#16302a'; ctx.fillRect(x - 40, 190, 80, 110);
    ctx.fillStyle = '#1fa24a'; ctx.beginPath(); ctx.moveTo(x - 50, 190); ctx.lineTo(x - 30, 60); ctx.lineTo(x + 30, 60); ctx.lineTo(x + 50, 190); ctx.fill();
    ctx.fillStyle = '#7dff9a'; ctx.fillRect(x - 24, 70, 48, 110);
    ctx.fillStyle = '#16302a'; for (let i = 0; i < 5; i++) ctx.fillRect(x - 24, 80 + i * 22, 48, 4);
    ctx.fillStyle = '#0e201a'; ctx.fillRect(x - 56, 50, 112, 14);
    for (let i = 0; i < w; i += 160) { if (Math.abs(i - x) < 120) continue; ctx.fillStyle = '#14202a'; ctx.fillRect(i, 200, 30, 100); ctx.fillStyle = '#1fa24a'; ctx.fillRect(i + 4, 210, 22, 3); }
  });
  const near = layer(1, H, () => {});
  return {
    name: 'PLANET OA', music: 'oa', sky: s.c, layers: [far, mid, near],
    floor: { top: '#1a3a2a', bot: '#081410', edge: '#3cff6a', lines: 'rgba(60,255,106,0.25)', step: 50 },
    anim: (ctx, camL, camY, t) => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const x = W / 2 + (STAGE_W / 2 - W / 2 - camL) * 0.45, y = 125 - camY * 0.45;
      const r = 70 + Math.sin(t * 0.05) * 10;
      const g = ctx.createRadialGradient(x, y, 10, x, y, r); g.addColorStop(0, 'rgba(120,255,150,0.4)'); g.addColorStop(1, 'rgba(0,255,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) { const lx = ((t * 1.5 + i * 230) % (W + 100)) - 50; ctx.fillStyle = 'rgba(60,255,106,0.8)'; ctx.fillRect(lx, 40 + i * 30, 6, 2); ctx.fillStyle = 'rgba(60,255,106,0.3)'; ctx.fillRect(lx - 20, 40 + i * 30, 20, 2); }
      ctx.restore();
    },
  };
}

export const STAGES = [
  { id: 'gotham', make: gotham, label: 'GOTHAM ROOFTOPS', side: 'dc' },
  { id: 'nyc', make: nyc, label: 'MANHATTAN SUNSET', side: 'marvel' },
  { id: 'metropolis', make: metropolis, label: 'METROPOLIS PLAZA', side: 'dc' },
  { id: 'sanctum', make: sanctum, label: 'SANCTUM SANCTORUM', side: 'marvel' },
  { id: 'swamp', make: swamp, label: 'THE BAYOU', side: 'dc' },
  { id: 'oa', make: oa, label: 'PLANET OA', side: 'dc' },
];

const cache = {};
export function getStage(id) {
  if (cache[id]) return cache[id];
  const def = STAGES.find((s) => s.id === id) || STAGES[0];
  const st = def.make();
  st.id = def.id;
  st.drawBack = (ctx, camL, camY, t) => {
    ctx.drawImage(st.sky, 0, Math.round(-camY * 0.05));
    if (st.anim) st.anim(ctx, camL, camY, t);
    for (const l of st.layers) ctx.drawImage(l.c, Math.round(-camL * l.f), Math.round(-camY * (l.f * 0.8 + 0.1)));
    floorStrip(ctx, camL, camY, st.floor);
  };
  st.drawFront = (ctx, camL, camY, t) => { if (st.front) st.front(ctx, camL, camY, t); };
  // tiny preview for stage select
  st.thumb = makeCanvas(W, H);
  st.drawBack(st.thumb.getContext('2d'), (STAGE_W - W) / 2, 0, 0);
  cache[id] = st;
  return st;
}
void lerp;

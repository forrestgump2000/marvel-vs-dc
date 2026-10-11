// MARVEL roster: costume art, stances, normals, specials and hypers for each hero.
import { makeBody } from '../rig.js';
import { T } from '../moves.js';
import { shade, rand } from '../util.js';
import { orb, skull, bolt, drawMandala } from '../fx.js';
import {
  fillHead, headPath, face, hairCap, lens, glowEyes, spiderEmblem, webPattern, bandY, bandX, texture, barkLines, circleEmblem,
} from './parts.js';

const P = (c, pat) => ({ c, pat });

// ======================================================================= SPIDER-MAN
const SP_R = '#c8141e', SP_B = '#1d3f8f';
const spidey = {
  id: 'spiderman', name: 'SPIDER-MAN', side: 'marvel', color: '#e8202a', trail: '#ff5050', arch: 'agile',
  body: makeBody({ wS: 14, wC: 12.5, wW: 9, wH: 11, wUA: 5, wFA: 4.2, wTh: 7, wSh: 5, torso: 41 }),
  stats: { hp: 950, walk: 3, back: 2.6, jump: 12, jumpX: 3.8, dash: 7.5, double: true, power: 0.95 },
  face: [0.5, 0.1],
  stance: { legs: [20, -22, 16], lean: 20, head: -16, aF: 70, eF: 70, aB: 40, eB: 90, hF: 'open' },
  look: {
    parts: {
      torso: P(SP_R, (ctx, T, b) => {
        ctx.fillStyle = SP_B;
        ctx.beginPath(); ctx.moveTo(-b.wS - 2, -T * 0.86); ctx.lineTo(-b.wC * 0.5, -T * 0.7); ctx.lineTo(-b.wW * 0.6, -T * 0.12); ctx.lineTo(-b.wH - 2, 0); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(b.wS + 2, -T * 0.86); ctx.lineTo(b.wC * 0.5, -T * 0.7); ctx.lineTo(b.wW * 0.6, -T * 0.12); ctx.lineTo(b.wH + 2, 0); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.translate(0, -T); webPattern(ctx, T * 0.9, b.wS, 'rgba(20,10,20,0.5)'); ctx.restore();
        bandY(ctx, -T * 0.12, -T * 0.03, b.wH, SP_R);
        bandY(ctx, -T * 0.03, 12, b.wH, SP_B);
        spiderEmblem(ctx, 0, -T * 0.68, 7, '#140c12');
      }),
      upperArm: P(SP_R, (ctx, l, w) => webPattern(ctx, l, w)),
      foreArm: P(SP_R, (ctx, l, w) => { webPattern(ctx, l, w); ctx.fillStyle = '#c0c4cc'; ctx.fillRect(-w, l - 4, w * 2, 2); }),
      hand: P(SP_R),
      thigh: P(SP_B),
      shin: P(SP_B, (ctx, l, w) => { ctx.fillStyle = SP_R; ctx.fillRect(-w - 3, l * 0.38, w * 2 + 6, l); ctx.save(); ctx.translate(0, l * 0.38); webPattern(ctx, l * 0.62, w); ctx.restore(); }),
      foot: { c: SP_R, type: 'bare' },
    },
    head: (ctx, r) => {
      fillHead(ctx, r, SP_R);
      ctx.save(); headPath(ctx, r); ctx.clip();
      ctx.strokeStyle = 'rgba(20,10,20,0.55)'; ctx.lineWidth = 0.6;
      for (let i = 0; i < 6; i++) { const a = -0.6 + i * 0.45; ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.1); ctx.lineTo(r * 0.55 + Math.cos(a + 1.6) * r * 2, -r * 0.1 + Math.sin(a + 1.6) * r * 2); ctx.stroke(); }
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.1, k * r * 0.45, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      lens(ctx, r, '#111', '#f4f6ff', 1.05, true);
    },
    front: (ctx, sk, f) => {
      if (f.move && (f.move.name === 'WEB SWING')) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sk.haF[0], sk.haF[1]); ctx.lineTo(sk.haF[0] + 60, -320); ctx.stroke();
      }
    },
  },
  normals: {
    hk: { wind: { lean: -10, lB: 30, kB: -120 }, hit: { lB: 150, kB: -5, lF: 20, kF: -70, lean: -45, aF: 60, aB: -60 }, box: { at: 'ftB', r: 13 } },
    jhk: { hit: { lF: 80, kF: 0, lB: 80, kB: 0, lean: -30, aF: 140, aB: 130 } },
    chp: { hit: { aB: 170, eB: 0, aF: 150, eF: 20, legs: [18, -20, -2], lean: -12 } },
  },
  specials: [
    T.proj({ name: 'WEB BALL', wind: { aF: 60, eF: 120, hF: 'open' }, fire: { aF: 92, eF: 0, hF: 'open', lean: 18, legs: [24, -20, 12] }, fireAt: 10, sfx: 'web', p: { look: 'web', vx: 8.5, w: 22, h: 22, dmg: 40, web: 45, life: 70 } }),
    T.dive({ name: 'WEB SWING', start: 6, dur: 24, vx: 8, vy: -1, wind: { aF: 160, eF: 0, lean: -10 }, pose: { lF: 75, kF: 0, lB: 30, kB: -50, aF: 165, eF: 0, aB: 140, eB: 10, lean: -25, hF: 'open' }, box: { at: 'ftF', r: 14 }, dmg: 32, every: 9, kd: true }),
    T.upper({ name: 'SPIDER STING', up: { aF: 168, eF: 0, aB: 60, eB: 60, lF: 50, kF: -90, lB: -10, kB: -30, lean: -8 }, dmg: 30, launch: 11, vx: 2.5, vy: -12.5 }),
    T.pull({ name: 'WEB THROW', look: 'web', wind: { aF: 50, eF: 120 }, fire: { aF: 92, eF: 0, hF: 'open', lean: 14 }, dmg: 45 }),
  ],
  hypers: [
    T.hyperRush({ name: 'MAXIMUM SPIDER', blink: true, n: 14, gap: 4, fx: 'big', color: '#ff3030', speed: 11, go: { legs: [26, -24, 14], lean: 30, aF: 90, eF: 0, aB: -40, eB: 30 },
      frames: [{ lF: 100, kF: 0, lean: -20, rot: -20 }, { aF: 92, eF: 0, lean: 25 }, { lB: 130, kB: 0, lean: -40 }, { aB: 160, eB: 0, aF: 140, legs: [16, -16, 0] }], fin: 140, finPose: { lF: 120, kF: 0, lean: -40, aF: 160, aB: 150 } }),
    T.proj({ name: 'WEB STORM', count: 10, interval: 4, fireAt: 10, len: 60, hold: 40, wind: { aF: 60, eF: 120 }, fire: { aF: 95, eF: 0, aB: 85, eB: 0, hF: 'open', hB: 'open', lean: 18 }, sfx: 'web', p: { look: 'web', vx: 9.5, spread: 0.55, w: 24, h: 24, dmg: 24, web: 20, life: 70 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Is that all you got?', 'Thwip!', 'Spider-sense says... nah.'], hyper: ['Maximum Spider!', 'Here comes the web!'], win: ['Your friendly neighborhood hero, signing off!', 'Should\'ve stayed in the cape-only league.'] },
  anims: {
    taunt: (S) => [[0, S], [8, { legs: [6, -6, 0], lean: -8, aF: 120, eF: 10, aB: 100, eB: 20, hF: 'point', hB: 'point', head: -10 }], [44, { legs: [6, -6, 0], lean: -8, aF: 125, eF: 10, aB: 100, eB: 20, hF: 'point', hB: 'point', head: -10 }], [58, S]],
    win: (S) => [[0, S], [12, { legs: [4, -10, 26], lean: 10, aF: 160, eF: 0, hF: 'point', aB: 40, eB: 90, head: -20 }], [40, { legs: [4, -10, 26], lean: 10, aF: 165, eF: 0, hF: 'point', aB: 40, eB: 90, head: -20 }]],
  },
};

// ======================================================================= WOLVERINE
const WV_Y = '#f2c418', WV_B = '#22406e', WV_K = '#1c1c22', SKIN_W = '#d8a07a';
function claws(ctx, at, ang, len = 18) {
  ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(-ang * Math.PI / 180);
  ctx.strokeStyle = '#eef2f8'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 2.2, 3); ctx.quadraticCurveTo(i * 2.6 + 1, len * 0.6, i * 1.6 + 2, len); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,130,150,0.8)'; ctx.lineWidth = 0.6;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 2.2 + 0.6, 4); ctx.lineTo(i * 1.6 + 2.2, len - 2); ctx.stroke(); }
  ctx.restore();
}
const wolverine = {
  id: 'wolverine', name: 'WOLVERINE', side: 'marvel', color: '#f2c418', trail: '#ffffff', arch: 'brawler',
  body: makeBody({ thigh: 27, shin: 27, torso: 40, wS: 17.5, wC: 15.5, wW: 12, wH: 12.5, wUA: 6.5, wFA: 5.6, wTh: 8.5, wSh: 6.5, headR: 9.5, handR: 4.8 }),
  stats: { hp: 1000, walk: 2.8, back: 2.3, jump: 11.5, dash: 7.5, double: false, power: 1.0 },
  face: [0.48, 0.1],
  stance: { legs: [15, -19, 12], lean: 20, head: -8, aF: 62, eF: 60, aB: 42, eB: 70 },
  look: {
    neck: SKIN_W,
    parts: {
      torso: P(WV_Y, (ctx, T, b) => {
        ctx.fillStyle = WV_B;
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(s * b.wS, -T * 0.86); ctx.lineTo(s * b.wC * 0.62, -T * 0.6); ctx.lineTo(s * b.wW * 0.8, -T * 0.1); ctx.lineTo(s * (b.wH + 2), 0); ctx.lineTo(s * (b.wS + 4), -T * 0.5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = WV_K;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * b.wW, -T * (0.6 - i * 0.14)); ctx.lineTo(s * b.wW * 0.45, -T * (0.56 - i * 0.14)); ctx.lineTo(s * b.wW, -T * (0.52 - i * 0.14)); ctx.fill(); }
          ctx.fillStyle = WV_B;
        }
        ctx.fillStyle = WV_K; ctx.beginPath(); ctx.moveTo(-b.wC * 0.4, -T); ctx.lineTo(0, -T * 0.72); ctx.lineTo(b.wC * 0.4, -T); ctx.fill();
        bandY(ctx, -T * 0.13, -T * 0.03, b.wH, '#d8a810');
        ctx.fillStyle = '#c4121a'; ctx.fillRect(-4, -T * 0.135, 8, T * 0.11);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -T * 0.13); ctx.lineTo(3, -T * 0.04); ctx.moveTo(3, -T * 0.13); ctx.lineTo(-3, -T * 0.04); ctx.stroke();
      }),
      upperArm: P(SKIN_W),
      foreArm: P(WV_B, (ctx, l, w) => { bandY(ctx, l * 0.75, l * 0.85, w, '#e8b818'); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-w, l * 0.3, w * 2, 1); }),
      hand: P(WV_B, (ctx, r) => { ctx.fillStyle = WV_Y; ctx.fillRect(-r * 0.4, -r * 0.2, r * 0.8, r * 0.6); }),
      thigh: P(WV_Y, (ctx, l, w) => { bandX(ctx, -w - 1, -w * 0.3, l, WV_B); }),
      shin: P(WV_B, (ctx, l, w) => { bandY(ctx, l * 0.1, l * 0.22, w, WV_K); bandY(ctx, l * 0.5, l * 0.6, w, WV_K); ctx.fillStyle = WV_Y; ctx.fillRect(-w, -4, w * 2, 6); }),
      foot: { c: '#2c3448', type: 'boot' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, SKIN_W);
      face(ctx, r, { skin: SKIN_W, expr: fc || 'angry', noEyes: true, stubble: true });
      ctx.save(); headPath(ctx, r); ctx.clip();
      ctx.fillStyle = WV_Y; ctx.fillRect(-r * 1.2, -r * 1.3, r * 2.4, r * 1.15);
      ctx.fillStyle = WV_K;
      ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.55); ctx.quadraticCurveTo(r * 0.4, -r * 0.2, r * 1.1, -r * 0.35); ctx.lineTo(r * 1.1, 0); ctx.quadraticCurveTo(r * 0.5, r * 0.05, -r * 0.4, -r * 0.05); ctx.closePath(); ctx.fill();
      ctx.restore();
      // fins
      ctx.fillStyle = WV_K;
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.4); ctx.quadraticCurveTo(-r * 0.6, -r * 1.2, -r * 1.3, -r * 2.0); ctx.quadraticCurveTo(-r * 0.4, -r * 1.3, r * 0.2, -r * 0.7); ctx.fill();
      ctx.fillStyle = '#3a4a6a'; ctx.beginPath(); ctx.moveTo(-r * 0.25, -r * 0.55); ctx.quadraticCurveTo(-r * 0.6, -r * 1.2, -r * 1.1, -r * 1.75); ctx.quadraticCurveTo(-r * 0.4, -r * 1.2, 0, -r * 0.7); ctx.fill();
      glowEyes(ctx, r, '#ffffff', 0.3);
    },
    midBack: (ctx, sk) => claws(ctx, sk.haB, sk.a.faB, 17),
    mid: (ctx, sk, f) => {
      // shoulder pad
      ctx.save(); ctx.translate(sk.shF[0], sk.shF[1]); ctx.rotate(-sk.a.uaF * Math.PI / 180 * 0.4);
      ctx.fillStyle = WV_B; ctx.beginPath(); ctx.ellipse(0, 1, 8, 6, 0, Math.PI, 0); ctx.lineTo(8, 4); ctx.lineTo(-8, 4); ctx.fill();
      ctx.fillStyle = WV_Y; ctx.fillRect(-8, 2, 16, 2.4);
      ctx.restore();
    },
    front: (ctx, sk) => claws(ctx, sk.haF, sk.a.faF, 19),
  },
  normals: {
    lp: { fxKind: 'slash', trail: true, sfx: 'slash', box: { at: 'haF', r: 12, dx: 0 } },
    hp: { fxKind: 'slash', trail: true, sfx: 'slash', dmg: 82, wind: { aB: 140, eB: 40, lean: -6 }, hit: { aB: 70, eB: 0, aF: 10, eF: 90, lean: 28, legs: [24, -14, 10] }, box: { at: 'haB', r: 15 } },
    chp: { fxKind: 'slash', trail: true, sfx: 'slash' },
    jhp: { fxKind: 'slash', trail: true, sfx: 'slash' },
    clp: { fxKind: 'slash', sfx: 'slash' },
  },
  specials: [
    T.rush({ name: 'BERSERKER BARRAGE', start: 7, dur: 26, speed: 3.6, dmg: 16, every: 4, spark: 'slash', sfx: 'slash', trail: true,
      frames: [{ aF: 95, eF: 0, aB: 20, eB: 110, lean: 22, legs: [22, -16, 12] }, { aB: 100, eB: 0, aF: 30, eF: 120, lean: 28, legs: [24, -14, 12] }, { aF: 60, eF: 0, aB: 130, eB: 10, lean: 18, legs: [22, -16, 12] }], finisher: 40, kd: true }),
    T.dive({ name: 'DRILL CLAW', start: 8, dur: 18, vx: 11, vy: -1, pose: { lean: 75, aF: 92, eF: 0, aB: 88, eB: 0, lF: -15, kF: -10, lB: -25, kB: -10 }, spin: 0, dmg: 22, every: 4, box: { at: 'haF', r: 16 }, sfx: 'slash', trail: true }),
    T.upper({ name: 'TORNADO CLAW', up: { aF: 170, eF: 0, aB: 150, eB: 10, lF: 30, kF: -60, lB: -10, kB: -30 }, spin: 1080, rise: 26, dmg: 16, every: 4, launch: 10, sfx: 'slash', trail: true, box: { at: 'haF', r: 18 } }),
    T.buff({ name: 'HEALING FACTOR', sfx: 'heal', b: { heal: 40, regen: 0.9, t: 140, color: '#80ff90', aura: 'flare' }, len: 46 }),
  ],
  hypers: [
    T.hyperRush({ name: 'WEAPON X', blink: true, n: 16, gap: 3, fx: 'slash', color: '#ffe060', sfx: 'slash', speed: 12,
      frames: [{ aF: 95, eF: 0, aB: 20, eB: 110, lean: 22 }, { aB: 100, eB: 0, aF: 30, eF: 120, lean: 28 }, { aF: 170, eF: 0, aB: 150, lean: -10 }, { aF: 40, eF: 0, aB: 60, lean: 40 }], fin: 150, finFx: 'slash',
      finPose: { aF: 170, eF: 0, aB: 165, eB: 0, lean: -15, legs: [14, -16, 0] } }),
    T.buff({ name: 'BERSERKER RAGE', sfx: 'roar', b: { rage: true, t: 540, color: '#ff3020', aura: 'flare', auraT: 60 }, len: 50, armor: true, meter: 100,
      pose: { legs: [16, -16, 16], lean: -14, aF: 30, eF: 100, aB: 30, eB: 100, face: 'shout', head: -20 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Come on, bub.', 'That all ya got?'], hyper: ['Snikt!', 'Weapon X!'], win: ['I\'m the best there is at what I do.', 'Heal up, bub. You\'ll need it.'] },
  anims: {
    taunt: (S) => [[0, S], [10, { ...S, aF: 120, eF: 40, aB: 20, eB: 30, lean: 0, head: -10 }], [24, { ...S, aF: 125, eF: 40, aB: 20, eB: 30, lean: 0, head: -10 }], [30, { ...S, aF: 120, eF: 20, lean: 0 }], [50, S]],
  },
};

// ======================================================================= HULK
const HK_G = '#4c9a2a', HK_P = '#5a3a8a';
const hulk = {
  id: 'hulk', name: 'HULK', side: 'marvel', color: '#5adc3a', trail: '#9aff7a', arch: 'heavy',
  body: makeBody({ thigh: 34, shin: 32, torso: 52, neck: 2, upperArm: 30, foreArm: 28, headR: 11, wS: 28, wC: 25, wW: 18, wH: 17, wUA: 11, wFA: 10, wTh: 13, wSh: 10, handR: 8, footL: 18, footH: 7, bUA: 4, bFA: 3, bTh: 3, bSh: 2.5 }),
  stats: { hp: 1250, walk: 2.0, back: 1.6, jump: 11, jumpX: 3.2, dash: 6, power: 1.2, flip: false },
  face: [0.55, 0.1], ai: 'rush',
  look: {
    neck: HK_G,
    parts: {
      torso: P(HK_G, (ctx, T, b) => {
        ctx.strokeStyle = 'rgba(10,40,0,0.45)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(-b.wC * 0.4, -T * 0.68, b.wC * 0.45, 0.2, 2.6); ctx.arc(b.wC * 0.4, -T * 0.68, b.wC * 0.45, 0.5, 2.9); ctx.stroke();
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-4, -T * (0.42 - i * 0.12), 3.5, 2.6, 0, 0, Math.PI * 2); ctx.ellipse(4, -T * (0.42 - i * 0.12), 3.5, 2.6, 0, 0, Math.PI * 2); ctx.stroke(); }
        bandY(ctx, -T * 0.08, 6, b.wH, HK_P);
        ctx.fillStyle = shade(HK_P, 0.7); ctx.fillRect(-b.wH, -T * 0.08, b.wH * 2, 2);
      }),
      upperArm: P(HK_G, (ctx, l, w) => { ctx.strokeStyle = 'rgba(10,40,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w * 0.2, l * 0.2); ctx.quadraticCurveTo(w * 0.5, l * 0.5, -w * 0.1, l * 0.8); ctx.stroke(); }),
      foreArm: P(HK_G, (ctx, l, w) => { ctx.strokeStyle = 'rgba(10,40,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, l * 0.1); ctx.lineTo(w * 0.3, l * 0.7); ctx.stroke(); }),
      hand: P(HK_G),
      thigh: P(HK_P, (ctx, l, w) => { ctx.strokeStyle = shade(HK_P, 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w * 0.5, l * 0.3); ctx.lineTo(w * 0.2, l * 0.6); ctx.stroke(); }),
      shin: P(HK_G, (ctx, l, w) => {
        ctx.fillStyle = HK_P; ctx.beginPath(); ctx.moveTo(-w - 2, -4); ctx.lineTo(w + 2, -4); ctx.lineTo(w + 2, l * 0.3); ctx.lineTo(w * 0.4, l * 0.42); ctx.lineTo(0, l * 0.3); ctx.lineTo(-w * 0.5, l * 0.48); ctx.lineTo(-w - 2, l * 0.32); ctx.closePath(); ctx.fill();
      }),
      foot: { c: HK_G, type: 'bare' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, HK_G, 1.1);
      hairCap(ctx, r * 1.02, '#16180f');
      face(ctx, r, { skin: HK_G, expr: fc || 'angry', brow: '#16180f', iris: '#3a7a1a' });
      ctx.fillStyle = '#ffffff'; ctx.fillRect(r * 0.5, r * 0.5, r * 0.4, r * 0.12);
    },
  },
  normals: {
    lp: { hit: { aF: 90, eF: 0, lean: 26, legs: [20, -16, 8] } },
  },
  specials: [
    T.proj({ name: 'GAMMA WAVE', fireAt: 16, len: 40, wind: { aF: 175, eF: 20, aB: 170, eB: 20, lean: -10 }, fire: { aF: 50, eF: 0, aB: 45, eB: 0, lean: 50, legs: [20, -16, 20] }, sfx: 'boom', from: 'ground',
      p: { look: 'gamma', vx: 6.5, ground: true, w: 30, h: 26, dmg: 70, life: 80, kd: true }, ev: [[16, (f, G) => { G.shake(8); G.fx.rocks(f.x + f.facing * 30, -2, 10); }]] }),
    T.rush({ name: 'GAMMA CHARGE', start: 10, dur: 22, speed: 8, dmg: 30, every: 8, armor: [1, 30], go: { legs: [24, -24, 14], lean: 40, aF: 20, eF: 60, aB: -20, eB: 60, head: 10 }, box: { at: 'shF', r: 22 }, finisher: 50, kd: true, sfx: 'hitH' }),
    T.slam({ name: 'GAMMA LEAP', vx: 5, vy: -13.5, dmg: 100, waveDmg: 55, wave: 'gamma', both: true }),
    T.erupt({ name: 'THUNDERCLAP', castAt: 12, wind: { aF: 110, eF: 30, aB: 110, eB: 30, lean: -10, hF: 'open', hB: 'open' }, cast: { aF: 90, eF: 0, aB: 88, eB: 0, lean: 15, hF: 'open', hB: 'open' }, sfx: 'boom',
      e: { kind: 'blast', at: 'front', dist: 70, delay: 1, dur: 14, w: 90, h: 100, dmg: 75, kd: true, color: '#9aff7a' }, ev: [[12, (f, G) => { G.shake(8); G.flash('#cfffc0', 0.3); }]] }),
  ],
  hypers: [
    T.hyperRain({ name: 'GAMMA QUAKE', n: 8, dur: 50, castAt: 18, wind: { aF: 175, eF: 10, aB: 170, eB: 10, lean: -15 }, cast: { aF: 60, eF: 0, aB: 55, eB: 0, lean: 55, legs: [22, -16, 24] }, sfx: 'boom',
      e: { kind: 'pillar', at: 'sweep', dist: 60, step: 60, delay: 4, dur: 26, w: 46, h: 120, dmg: 45, launch: 10 }, ev: [[18, (f, G) => { G.shake(16); }]] }),
    T.hyperRush({ name: 'GAMMA CRUSH', n: 8, gap: 7, fx: 'big', color: '#7aff4a', speed: 9, go: { legs: [24, -24, 14], lean: 35, aF: 90, eF: 0, aB: -30 },
      frames: [{ aF: 92, eF: 0, lean: 30 }, { aB: 95, eB: 0, aF: 20, lean: 34 }, { aF: 175, aB: 170, eF: 0, eB: 0, lean: -15 }, { aF: 60, aB: 55, eF: 0, eB: 0, lean: 50 }], fin: 220, finPose: { aF: 60, aB: 55, eF: 0, eB: 0, lean: 55, legs: [22, -16, 24] } }),
  ],
  assist: 0,
  quotes: { taunt: ['HULK SMASH!', 'Puny hero!'], hyper: ['HULK SMASH!', 'RAAAGH!'], win: ['HULK IS STRONGEST THERE IS!', 'Puny cape-people.'] },
};

// ======================================================================= GHOST RIDER
const GR_K = '#1c1c24';
function flameCrown(ctx, sk, f, frame, scale = 1) {
  const [hx, hy] = sk.head;
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI - Math.PI;
    const len = (14 + Math.sin(frame * 0.4 + i * 1.7) * 5) * scale;
    const bx = hx + Math.cos(a) * 7 - 2, by = hy + Math.sin(a) * 7;
    ctx.fillStyle = i % 3 === 0 ? '#fff2a0' : i % 3 === 1 ? '#ff9a10' : '#e03000';
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.quadraticCurveTo(bx - 6 - Math.sin(frame * 0.3 + i) * 4, by - len * 0.5, bx - 6 + Math.sin(frame * 0.5 + i) * 3, by - len); ctx.quadraticCurveTo(bx + 2, by - len * 0.4, bx + 3, by); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
const ghostrider = {
  id: 'ghostrider', name: 'GHOST RIDER', side: 'marvel', color: '#ff7a1a', trail: '#ffb030', arch: 'brawler',
  body: makeBody({ thigh: 33, shin: 33, torso: 44, wS: 16.5, wC: 15, wW: 11, wH: 12, wUA: 5.8, wFA: 5, wTh: 7.4, wSh: 5.6 }),
  stats: { hp: 1000, walk: 2.4, back: 2.0, jump: 11.5, dash: 7, power: 1.05 },
  face: [0.42, 0.13],
  stance: { legs: [14, -16, 6], lean: 8, head: 4, aF: 30, eF: 70, aB: 15, eB: 50 },
  look: {
    neck: '#2a2420',
    parts: {
      torso: P(GR_K, (ctx, T, b) => {
        ctx.fillStyle = '#34343e'; ctx.beginPath(); ctx.moveTo(-b.wC * 0.6, -T); ctx.lineTo(0, -T * 0.55); ctx.lineTo(b.wC * 0.6, -T); ctx.lineTo(b.wC * 0.2, -T * 0.92); ctx.lineTo(0, -T * 0.65); ctx.lineTo(-b.wC * 0.2, -T * 0.92); ctx.fill();
        ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -T * 0.6); ctx.lineTo(4, -T * 0.05); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-b.wC * 0.7, -T * 0.8, 3, T * 0.5);
        // chain wrapped across the body
        for (let i = 0; i < 9; i++) { const u = i / 8; ctx.fillStyle = i % 2 ? '#8a8f9a' : '#d0d4dc'; ctx.fillRect(-b.wS + u * b.wS * 2 - 2, -T * 0.82 + u * T * 0.5 - 1.5, 5, 3); }
        bandY(ctx, -T * 0.1, -T * 0.02, b.wH, '#111');
        ctx.fillStyle = '#9a9aa6'; ctx.fillRect(-3, -T * 0.1, 6, T * 0.08);
      }),
      upperArm: P(GR_K, (ctx, l, w) => { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-w * 0.6, 0, 2, l); }),
      foreArm: P(GR_K),
      hand: P('#141418', (ctx, r) => { ctx.fillStyle = '#c0c4cc'; for (let i = -1; i <= 1; i++) ctx.fillRect(i * r * 0.5 - 0.5, r * 1.2, 1.4, 2); }),
      thigh: P(GR_K), shin: P(GR_K), foot: { c: '#121216', type: 'boot' },
    },
    head: (ctx, r) => {
      // skull
      ctx.fillStyle = '#efe4c8';
      headPath(ctx, r * 0.95); ctx.fill();
      ctx.fillStyle = '#2a1408';
      ctx.beginPath(); ctx.ellipse(r * 0.5, -r * 0.2, r * 0.26, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.05, -r * 0.18, r * 0.18, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6a10'; ctx.fillRect(r * 0.45, -r * 0.24, r * 0.12, r * 0.1);
      ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.moveTo(r * 0.85, r * 0.05); ctx.lineTo(r * 0.98, r * 0.3); ctx.lineTo(r * 0.75, r * 0.3); ctx.fill();
      ctx.fillStyle = '#efe4c8'; ctx.fillRect(r * 0.3, r * 0.55, r * 0.65, r * 0.3);
      ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(r * 0.3, r * 0.68); ctx.lineTo(r * 0.95, r * 0.68); for (let i = 0; i < 4; i++) { ctx.moveTo(r * (0.38 + i * 0.15), r * 0.55); ctx.lineTo(r * (0.38 + i * 0.15), r * 0.85); } ctx.stroke();
    },
    mid: (ctx, sk) => {
      // shoulder spikes
      ctx.fillStyle = '#c8ccd4';
      for (const s of [sk.shF, sk.shB]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s[0] - 4 + i * 4, s[1] - 2); ctx.lineTo(s[0] - 3 + i * 4, s[1] - 8); ctx.lineTo(s[0] - 2 + i * 4, s[1] - 2); ctx.fill(); }
    },
    glow: (ctx, sk, f, frame) => flameCrown(ctx, sk, f, frame),
    glowNormal: true,
  },
  normals: {
    hp: { dmg: 78, st: 9, rec: 18, wind: { aF: 140, eF: 30, wpn: 'chain', wl: 20, lean: -6 }, hit: { aF: 92, eF: 0, wpn: 'chain', wl: 78, lean: 16, legs: [20, -14, 6] }, box: { at: 'wpnTip', r: 13 } },
    chp: { wind: { aF: 20, eF: 40, wpn: 'chain', wl: 20 }, hit: { aF: 168, eF: 0, wpn: 'chain', wl: 60, legs: [14, -16, 0], lean: -10 }, box: { at: 'wpnTip', r: 15 } },
    jhp: { hit: { aF: 55, eF: 0, wpn: 'chain', wl: 55, lean: 10 }, box: { at: 'wpnTip', r: 14 } },
  },
  specials: [
    T.proj({ name: 'HELLFIRE BLAST', fireAt: 12, wind: { aF: 40, eF: 120, hF: 'open' }, fire: { aF: 92, eF: 0, hF: 'open', lean: 14 }, sfx: 'fire', p: { look: 'fireskull', vx: 7, w: 24, h: 20, dmg: 50, burn: 80, life: 90 } }),
    T.pull({ name: 'PENANCE CHAIN', look: 'chain', wind: { aF: 150, eF: 30 }, fire: { aF: 92, eF: 0, lean: 18 }, dmg: 45, sfx: 'whooshH' }),
    T.upper({ name: 'HELLFIRE UPPERCUT', up: { aF: 170, eF: 0, aB: 50, lF: 40, kF: -90, lB: -10, kB: -40, wpn: 'chain', wl: 40 }, dmg: 32, launch: 10, sfx: 'fire', glow: '#ff8a10' }),
    T.grab({ name: 'PENANCE STARE', range: 55, dmg: 170, hits: 5, fx: 'big', len: 70, hold: [[10, { aF: 90, eF: 30, aB: 80, eB: 40, lean: 20, head: 10 }], [60, { aF: 90, eF: 30, aB: 80, eB: 40, lean: 25, head: 14 }]],
      onGrab: (f, o, G) => { G.fx.flame(o.x, o.y - 60, 6); G.sfx('fire'); o.burn = 60; } }),
  ],
  hypers: [
    T.hyperVehicle({ name: 'HELL RIDE', ride: true, castAt: 14, rec: 70, wind: { aF: 160, eF: 10, aB: 150, lean: -10 }, sfx: 'roar', from: 'hip', p: { look: 'bike', vx: 9, w: 80, h: 70, ground: true, dmg: 30, hits: 7, every: 5, life: 110, burn: 120, kd: true } }),
    T.hyperRain({ name: 'SPIRIT OF VENGEANCE', n: 9, dur: 60, castAt: 16, cast: { aF: 92, eF: 0, aB: 85, eB: 0, lean: 10, hF: 'open', hB: 'open' }, sfx: 'fire', e: { kind: 'hellfire', at: 'sweep', dist: 50, step: 52, delay: 4, dur: 30, w: 44, h: 130, dmg: 24, hits: 2, every: 10, launch: 8, burn: 60 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Look into my eyes.', 'Your soul is stained.'], hyper: ['Feel the penance!', 'Vengeance rides!'], win: ['Justice is served... hot.', 'Innocent blood demands vengeance.'] },
};

// ======================================================================= SCARLET WITCH
const SW_R = '#8a1426', SW_D = '#4a0a14', SW_SKIN = '#e8c0a8';
function redGlowHands(ctx, sk, f, frame) {
  for (const h of [sk.haF, sk.haB]) {
    const r = 9 + Math.sin(frame * 0.3) * 2;
    const g = ctx.createRadialGradient(h[0], h[1], 1, h[0], h[1], r);
    g.addColorStop(0, 'rgba(255,90,110,0.9)'); g.addColorStop(1, 'rgba(255,0,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h[0], h[1], r, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 2; i++) { ctx.fillStyle = '#ff6080'; ctx.fillRect(h[0] + Math.sin(frame * 0.2 + i * 3) * 8, h[1] - ((frame * 1.5 + i * 7) % 16), 1.5, 1.5); }
  }
}
const scarlet = {
  id: 'scarletwitch', name: 'SCARLET WITCH', side: 'marvel', color: '#ff2050', trail: '#ff5070', arch: 'caster',
  body: makeBody({ thigh: 31, shin: 31, torso: 39, wS: 12.5, wC: 12, wW: 8, wH: 11.5, wUA: 4.2, wFA: 3.7, wTh: 6.6, wSh: 4.6, headR: 8.5, handR: 3.7, bUA: 0.5, bFA: 0.5 }),
  stats: { hp: 900, walk: 2.2, back: 2.0, jump: 11, dash: 6, float: true, airdash: true, power: 1.0 },
  face: [0.52, 0.1], ai: 'zone',
  look: {
    female: true,
    neck: SW_SKIN,
    hair: { c: '#7a2a1a', len: 26, base: 18, spread: 30, n: 6, w: 5, curl: 7 },
    parts: {
      torso: P(SW_R, (ctx, T, b) => {
        ctx.fillStyle = SW_SKIN; ctx.beginPath(); ctx.moveTo(-b.wS - 2, -T * 1.05); ctx.lineTo(-b.wC * 0.55, -T * 0.82); ctx.lineTo(-b.wC * 0.3, -T * 1.05); ctx.fill(); ctx.beginPath(); ctx.moveTo(b.wS + 2, -T * 1.05); ctx.lineTo(b.wC * 0.55, -T * 0.82); ctx.lineTo(b.wC * 0.3, -T * 1.05); ctx.fill();
        ctx.strokeStyle = SW_D; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -T * 0.95); ctx.lineTo(-2, -T * 0.1); ctx.moveTo(3, -T * 0.95); ctx.lineTo(2, -T * 0.1); ctx.stroke();
        ctx.fillStyle = '#1a0a0e'; ctx.fillRect(-b.wS, -T * 1.02, b.wS * 2, 3);
        bandY(ctx, -T * 0.08, 0, b.wH, '#2a0a10');
      }),
      upperArm: P(SW_SKIN), foreArm: P(SW_R, (ctx, l, w) => { ctx.fillStyle = SW_D; ctx.fillRect(-w, l * 0.5, w * 2, 1); }), hand: P('#e8a090'),
      thigh: P('#1e1216'), shin: P('#1e1216'), foot: { c: '#14090c', type: 'boot' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, SW_SKIN, 0.95);
      face(ctx, r, { skin: SW_SKIN, expr: fc, iris: '#c02040', brow: '#5a2010', lips: '#a03040' });
      ctx.fillStyle = '#7a2a1a';
      ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.6); ctx.quadraticCurveTo(-r * 1.2, -r * 1.1, r * 0.2, -r * 1.2); ctx.quadraticCurveTo(r * 0.9, -r * 1.1, r * 1.0, -r * 0.5); ctx.quadraticCurveTo(r * 0.5, -r * 0.75, 0, -r * 0.6); ctx.quadraticCurveTo(-r * 0.4, -r * 0.2, -r * 0.3, r * 0.6); ctx.fill();
      // tiara
      ctx.fillStyle = '#b0182c'; ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.85); ctx.lineTo(r * 0.5, -r * 0.95); ctx.lineTo(r * 0.9, -r * 0.6); ctx.lineTo(r * 1.05, -r * 1.25); ctx.lineTo(r * 0.7, -r * 0.82); ctx.lineTo(r * 0.3, -r * 1.35); ctx.lineTo(r * 0.2, -r * 1.0); ctx.closePath(); ctx.fill();
    },
    skirt: (ctx, sk, f) => {
      const h = sk.hip, t = f ? f.animClock : 0;
      const kF = sk.knF, kB = sk.knB;
      const sw = (f ? f.capeSw : 0) * 0.3;
      ctx.fillStyle = '#1a0a0e';
      ctx.beginPath();
      ctx.moveTo(h[0] - 12, h[1] - 4); ctx.lineTo(h[0] + 12, h[1] - 4);
      ctx.quadraticCurveTo(Math.max(kF[0], kB[0]) + 10, (h[1] + kF[1]) / 2, Math.max(kF[0], kB[0]) + 14 - sw, Math.max(kF[1], kB[1]) + 22 + Math.sin(t * 0.1) * 2);
      ctx.lineTo(Math.min(kF[0], kB[0]) - 18 - sw, Math.max(kF[1], kB[1]) + 24);
      ctx.quadraticCurveTo(Math.min(kF[0], kB[0]) - 12, (h[1] + kB[1]) / 2, h[0] - 12, h[1] - 4);
      ctx.fill();
      ctx.fillStyle = SW_R;
      ctx.beginPath(); ctx.moveTo(h[0] - 10, h[1] - 4); ctx.lineTo(h[0] + 10, h[1] - 4); ctx.lineTo(h[0] + 14, h[1] + 14); ctx.lineTo(h[0] + 2, h[1] + 24); ctx.lineTo(h[0] - 14, h[1] + 14); ctx.fill();
      ctx.strokeStyle = '#c03040'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(h[0] - 6, h[1] + 4); ctx.lineTo(h[0] - 10, h[1] + 30); ctx.moveTo(h[0] + 6, h[1] + 4); ctx.lineTo(h[0] + 10, h[1] + 30); ctx.stroke();
    },
    cape: { c: '#5a0a16', len: 70, w: 30, base: 10 },
    glow: redGlowHands,
  },
  normals: { hp: { sparkColor: '#ff3060' } },
  specials: [
    T.proj({ name: 'HEX BOLT', fireAt: 10, wind: { aF: 50, eF: 110 }, fire: { aF: 92, eF: 0, hF: 'palm', lean: 10 }, sfx: 'magic', p: { look: 'hex', vx: 8, w: 22, h: 18, dmg: 42, life: 80, color: '#ff2050' } }),
    T.proj({ name: 'CHAOS SPHERE', fireAt: 16, len: 40, wind: { aF: 130, eF: 40, aB: 120, eB: 40 }, fire: { aF: 95, eF: 10, aB: 90, eB: 10, hF: 'palm', hB: 'palm' }, sfx: 'energy', p: { look: 'chaossphere', vx: 2.6, w: 36, h: 36, dmg: 16, hits: 6, every: 8, life: 160, color: '#ff2050' } }),
    T.burst({ name: 'HEX BURST', r: 54, color: '#ff2050', dmg: 18, launch: 9, sfx: 'zap' }),
    T.erupt({ name: 'TELEKINESIS', castAt: 14, wind: { aF: 60, eF: 60, aB: 50 }, cast: { aF: 140, eF: 10, aB: 120, eB: 30, hF: 'open', hB: 'open', lean: -6 }, sfx: 'magic', e: { kind: 'blast', at: 'opp', delay: 18, dur: 16, w: 50, h: 120, dmg: 60, launch: 12, color: '#ff2050' } }),
  ],
  hypers: [
    T.hyperRain({ name: 'NO MORE', n: 8, dur: 60, castAt: 18, cast: { aF: 165, eF: 0, aB: 155, eB: 0, hF: 'open', hB: 'open', lean: -10, head: -15 }, sfx: 'thunder', e: { kind: 'reality', at: 'scatter', spread: 90, delay: 10, dur: 22, w: 60, h: 360, dmg: 32, launch: 6 },
      ev: [[18, (f, G) => G.flash('#ff1040', 0.6)]] }),
    T.hyperBeam({ name: 'CHAOS MAGIC', fire: { aF: 92, eF: 0, aB: 90, eB: 5, hF: 'palm', hB: 'palm', lean: 6 }, b: { color: '#ff1a4a', core: '#ffd0dc', w: 40, dmg: 20 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Reality bends for me.', 'You can\'t win this.'], hyper: ['No more.', 'Chaos reigns!'], win: ['I can rewrite your whole story.', 'Reality has spoken.'] },
};

// ======================================================================= VENOM
const VN_K = '#16161e';
const venom = {
  id: 'venom', name: 'VENOM', side: 'marvel', color: '#e8e8ff', trail: '#a0a0c0', arch: 'heavy',
  body: makeBody({ thigh: 33, shin: 33, torso: 50, upperArm: 28, foreArm: 26, headR: 11, wS: 24, wC: 21, wW: 14, wH: 14, wUA: 9, wFA: 8, wTh: 10.5, wSh: 8, handR: 6.5, footL: 16, bUA: 3, bFA: 2, bTh: 2 }),
  stats: { hp: 1150, walk: 2.4, back: 2.0, jump: 12, dash: 7, double: true, power: 1.1 },
  face: [0.5, 0.12],
  stance: { legs: [18, -18, 10], lean: 24, head: 12, aF: 40, eF: 50, aB: 25, eB: 50, hF: 'claw', hB: 'claw' },
  look: {
    hand: 'claw',
    neck: VN_K,
    parts: {
      torso: P(VN_K, (ctx, T, b) => {
        ctx.fillStyle = '#eef0ff';
        ctx.beginPath(); ctx.ellipse(0, -T * 0.66, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-2, -T * 0.72); ctx.quadraticCurveTo(-b.wS * 0.6, -T * 0.95, -b.wS * 0.9, -T * 0.86); ctx.quadraticCurveTo(-b.wS * 0.5, -T * 0.8, -1, -T * 0.66); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2, -T * 0.72); ctx.quadraticCurveTo(b.wS * 0.6, -T * 0.95, b.wS * 0.9, -T * 0.86); ctx.quadraticCurveTo(b.wS * 0.5, -T * 0.8, 1, -T * 0.66); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-2, -T * 0.6); ctx.quadraticCurveTo(-b.wW, -T * 0.4, -b.wW * 0.9, -T * 0.2); ctx.quadraticCurveTo(-b.wW * 0.5, -T * 0.4, 0, -T * 0.58); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2, -T * 0.6); ctx.quadraticCurveTo(b.wW, -T * 0.4, b.wW * 0.9, -T * 0.2); ctx.quadraticCurveTo(b.wW * 0.5, -T * 0.4, 0, -T * 0.58); ctx.fill();
        ctx.fillStyle = 'rgba(120,140,220,0.25)'; ctx.fillRect(-b.wC * 0.6, -T * 0.8, 2, T * 0.6);
      }),
      upperArm: P(VN_K, (ctx, l, w) => { ctx.fillStyle = 'rgba(120,140,220,0.25)'; ctx.fillRect(-w * 0.6, 2, 2, l * 0.8); }),
      foreArm: P(VN_K), hand: P(VN_K), thigh: P(VN_K), shin: P(VN_K), foot: { c: VN_K, type: 'paw' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, VN_K, 1.05);
      // eyes
      ctx.fillStyle = '#f6f8ff';
      ctx.beginPath(); ctx.moveTo(r * 0.15, -r * 0.55); ctx.quadraticCurveTo(r * 0.9, -r * 0.75, r * 1.0, -r * 0.2); ctx.quadraticCurveTo(r * 0.6, -r * 0.05, r * 0.15, -r * 0.55); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.55); ctx.quadraticCurveTo(-r * 0.6, -r * 0.6, -r * 0.55, -r * 0.2); ctx.quadraticCurveTo(-r * 0.3, -r * 0.3, -r * 0.2, -r * 0.55); ctx.fill();
      // giant toothy maw
      const open = fc === 'shout' ? 1.6 : 1;
      ctx.fillStyle = '#5a0a14';
      ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.15); ctx.quadraticCurveTo(r * 0.3, r * (0.25 + 0.4 * open), r * 1.1, r * 0.1); ctx.quadraticCurveTo(r * 0.4, r * 0.15, -r * 0.5, r * 0.15); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 7; i++) { const x = -r * 0.4 + i * r * 0.22; ctx.beginPath(); ctx.moveTo(x, r * 0.1); ctx.lineTo(x + r * 0.08, r * 0.38); ctx.lineTo(x + r * 0.16, r * 0.1); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, r * (0.25 + 0.38 * open)); ctx.lineTo(x + r * 0.08, r * (0.05 + 0.3 * open)); ctx.lineTo(x + r * 0.16, r * (0.25 + 0.38 * open)); ctx.fill(); }
      // tongue
      ctx.fillStyle = '#d03050';
      ctx.beginPath(); ctx.moveTo(r * 0.4, r * 0.4); ctx.quadraticCurveTo(r * 1.2, r * 0.9, r * 0.9, r * 1.4); ctx.quadraticCurveTo(r * 0.8, r * 0.9, r * 0.2, r * 0.45); ctx.fill();
    },
    back: (ctx, sk, f) => {
      // writhing tendrils off the back
      const t = f ? f.animClock : 0;
      ctx.strokeStyle = VN_K; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.lineWidth = 3 - i * 0.6;
        const sx = sk.shB[0], sy = sk.shB[1] + 4 + i * 6;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx - 14, sy - 10 + Math.sin(t * 0.1 + i) * 8, sx - 24, sy + 6, sx - 30 + Math.sin(t * 0.08 + i) * 6, sy - 14 + Math.cos(t * 0.1 + i) * 8); ctx.stroke();
      }
    },
  },
  normals: { hp: { dmg: 100 }, jhp: { wind: { aF: 170, eF: 0, aB: 170, eB: 0 } } },
  specials: [
    T.proj({ name: 'WEB TENDRIL', fireAt: 10, wind: { aF: 40, eF: 120 }, fire: { aF: 92, eF: 0, hF: 'open', lean: 18 }, sfx: 'web', p: { look: 'tendril', vx: 9, w: 30, h: 12, dmg: 45, life: 50, stunLock: 22 } }),
    T.grab({ name: 'SYMBIOTE FEAST', range: 60, dmg: 180, hits: 5, fx: 'big', len: 72, hold: [[10, { aF: 90, eF: 30, aB: 80, eB: 40, lean: 35, head: 25, face: 'shout' }], [60, { aF: 100, eF: 30, aB: 90, eB: 40, lean: 40, head: 30, face: 'shout' }]],
      onGrab: (f, o, G) => { G.sfx('roar'); } }),
    T.upper({ name: 'VENOM RUSH', up: { aF: 170, eF: 0, aB: 160, eB: 10, lF: 40, kF: -90, lB: -10, kB: -40, face: 'shout' }, dmg: 34, launch: 11, vx: 3 }),
    T.rush({ name: 'VENOM FANG', start: 8, dur: 16, speed: 9, dmg: 30, every: 6, go: { legs: [26, -26, 18], lean: 55, head: 30, aF: 80, eF: 0, aB: 70, eB: 0, face: 'shout' }, box: { at: 'head', r: 18 }, finisher: 50, kd: true, sfx: 'hitH' }),
  ],
  hypers: [
    T.hyperRush({ name: 'DEATH BITE', n: 10, gap: 5, fx: 'big', color: '#c0c0ff', speed: 10, go: { legs: [26, -26, 18], lean: 55, head: 30, aF: 80, eF: 0, aB: 70, eB: 0, face: 'shout' },
      frames: [{ aF: 95, eF: 0, lean: 34, face: 'shout' }, { aB: 98, eB: 0, aF: 20, lean: 38, face: 'shout' }, { lean: 60, head: 40, face: 'shout', aF: 60, aB: 50 }], fin: 200, finPose: { lean: 60, head: 40, face: 'shout', aF: 160, aB: 150 } }),
    T.hyperRain({ name: 'SYMBIOTE SURGE', n: 7, dur: 50, castAt: 16, cast: { aF: 70, eF: 0, aB: 60, eB: 0, lean: 50, legs: [22, -16, 24], face: 'shout' }, sfx: 'roar', e: { kind: 'tendrils', at: 'sweep', dist: 60, step: 60, delay: 4, dur: 28, w: 56, h: 120, dmg: 36, launch: 9 } }),
  ],
  assist: 3,
  quotes: { taunt: ['We are VENOM!', 'Tasty...'], hyper: ['We are Venom!', 'Eyes, lungs, pancreas...'], win: ['So many snacks, so little time.', 'We are hungry.'] },
};

// ======================================================================= DOCTOR STRANGE
const DS_B = '#1d3a6a', DS_R = '#a01818', DS_SKIN = '#e0b090';
function eldritchHands(ctx, sk, f, frame) {
  for (const h of [sk.haF, sk.haB]) {
    if (f.state !== 'move' && frame % 60 > 30) continue;
    drawMandala(ctx, h[0], h[1], 6, frame * 0.1, '#ffb030');
  }
}
const strange = {
  id: 'doctorstrange', name: 'DR. STRANGE', side: 'marvel', color: '#ff9a1a', trail: '#ffc040', arch: 'caster',
  body: makeBody({ thigh: 31, shin: 31, torso: 43, wS: 15, wC: 13.5, wW: 10, wH: 11.5 }),
  stats: { hp: 950, walk: 2.3, back: 2.2, jump: 11, dash: 6.5, float: true, airdash: true, power: 1.0 },
  face: [0.62, 0.1], ai: 'zone',
  stance: { legs: [12, -14, 4], lean: 2, head: -4, aF: 70, eF: 60, aB: 40, eB: 70, hF: 'point', hB: 'open' },
  look: {
    neck: DS_SKIN,
    cape: { c: DS_R, len: 84, w: 32, base: 14, lining: '#ffcf40' },
    parts: {
      torso: P(DS_B, (ctx, T, b) => {
        ctx.fillStyle = '#2a4a80'; ctx.beginPath(); ctx.moveTo(-b.wC * 0.7, -T); ctx.lineTo(b.wC * 0.2, -T * 0.4); ctx.lineTo(b.wC * 0.5, -T * 0.4); ctx.lineTo(-b.wC * 0.4, -T); ctx.fill();
        bandY(ctx, -T * 0.32, -T * 0.16, b.wW + 2, '#3a2a1a');
        ctx.fillStyle = '#ffcf40'; ctx.fillRect(-2, -T * 0.3, 4, T * 0.12);
        // eye of agamotto
        ctx.fillStyle = '#c8a030'; ctx.beginPath(); ctx.arc(0, -T * 0.78, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3aff6a'; ctx.beginPath(); ctx.arc(0, -T * 0.78, 1.8, 0, Math.PI * 2); ctx.fill();
      }),
      upperArm: P(DS_B), foreArm: P('#2a2a36', (ctx, l, w) => { for (let i = 0; i < 3; i++) bandY(ctx, l * (0.2 + i * 0.25), l * (0.24 + i * 0.25), w, '#4a3a2a'); }), hand: P(DS_SKIN),
      thigh: P('#1a1a26'), shin: P('#1a1a26'), foot: { c: '#14141c', type: 'boot' },
    },
    skirt: (ctx, sk, f) => {
      const h = sk.hip, t = f ? f.animClock : 0, sw = (f ? f.capeSw : 0) * 0.3;
      ctx.fillStyle = DS_B;
      ctx.beginPath(); ctx.moveTo(h[0] - 12, h[1] - 6); ctx.lineTo(h[0] + 12, h[1] - 6);
      ctx.quadraticCurveTo(sk.knF[0] + 8, h[1] + 10, sk.knF[0] + 6 - sw, sk.knF[1] + 4 + Math.sin(t * 0.1) * 2);
      ctx.lineTo(sk.knB[0] - 8 - sw, sk.knB[1] + 6);
      ctx.quadraticCurveTo(sk.knB[0] - 8, h[1] + 10, h[0] - 12, h[1] - 6); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(h[0] - 2, h[1], 2, 20);
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, DS_SKIN);
      face(ctx, r, { skin: DS_SKIN, expr: fc, brow: '#2a1a10', iris: '#4a6a7a' });
      hairCap(ctx, r, '#2a1a10');
      ctx.fillStyle = '#c8c8c8'; ctx.fillRect(-r * 0.55, -r * 0.6, r * 0.25, r * 0.7);
      ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.6); ctx.lineTo(r * 0.95, r * 0.65); ctx.lineTo(r * 0.75, r * 1.05); ctx.lineTo(r * 0.45, r * 0.95); ctx.fill();
      ctx.fillRect(r * 0.55, r * 0.38, r * 0.4, r * 0.08);
    },
    mid: (ctx, sk) => {
      // high collar of the cloak
      ctx.fillStyle = DS_R;
      ctx.beginPath(); ctx.moveTo(sk.neck[0] - 8, sk.neck[1] + 4); ctx.lineTo(sk.neck[0] - 10, sk.neck[1] - 12); ctx.lineTo(sk.neck[0] - 2, sk.neck[1] - 4); ctx.closePath(); ctx.fill();
    },
    glow: eldritchHands,
  },
  normals: { hp: { sparkColor: '#ffb030', hit: { aF: 92, eF: 0, hF: 'palm', wpn: 'whip', wl: 40, aB: 70, lean: 10 }, box: { at: 'wpnTip', r: 12 } } },
  specials: [
    T.proj({ name: 'BOLTS OF BEDEVILMENT', fireAt: 10, wind: { aF: 60, eF: 110 }, fire: { aF: 92, eF: 0, hF: 'palm', lean: 10 }, sfx: 'magic', count: 2, interval: 8, p: { look: 'eldritch', vx: 8.5, w: 22, h: 18, dmg: 30, life: 70, color: '#ff9a1a' } }),
    T.teleport({ name: 'EYE OF AGAMOTTO', to: 'behind', fx: 'magic', wind: { aF: 120, eF: 40, aB: 30, hF: 'point' } }),
    T.shield({ name: 'SHIELD OF SERAPHIM', kind: 'mandala', color: '#ffb030' }),
    T.erupt({ name: 'CRIMSON BANDS', castAt: 14, wind: { aF: 120, eF: 30 }, cast: { aF: 92, eF: 0, aB: 70, eB: 50, hF: 'point', lean: 8 }, sfx: 'magic', e: { kind: 'bands', at: 'opp', delay: 14, dur: 30, w: 50, h: 110, dmg: 40, stunLock: 50, color: '#ff2030' } }),
  ],
  hypers: [
    T.hyperBeam({ name: 'SEVEN RINGS OF RAGGADORR', fire: { aF: 92, eF: 0, aB: 88, eB: 5, hF: 'palm', hB: 'palm', lean: 6 }, from: 'haF', b: { color: '#ff9a1a', core: '#fff5c0', w: 44, dmg: 20 },
      ev: [[12, (f, G) => G.aura(f, { kind: 'mandala', color: '#ffb030', r: 34, dur: 70, at: 'haF' })]] }),
    T.hyperGiant({ name: 'MIRROR DIMENSION', cast: { aF: 160, eF: 10, aB: 150, eB: 10, hF: 'open', hB: 'open', lean: -6 }, sfx: 'magic', rec: 70, e: { kind: 'mirror', at: 'opp', delay: 10, dur: 70, w: 160, h: 170, dmg: 16, hits: 12, every: 5, stun: 30 } }),
  ],
  assist: 0,
  quotes: { taunt: ['By the Hoary Hosts!', 'I\'ve seen this ending.'], hyper: ['By the Seven Rings!', 'Welcome to the Mirror Dimension!'], win: ['Of 14 million futures, this was the one.', 'Dormammu... wait, wrong guy.'] },
};

// ======================================================================= ROCKET & GROOT
const GT_W = '#8a6a3a', GT_M = '#6a8a2a';
function rocket(ctx, sk, f) {
  const t = f ? f.animClock : 0;
  const x = sk.shB[0] - 2, y = sk.shB[1] - 16 + Math.sin(t * 0.15) * 1;
  const shooting = f && f.move && /ROCKET|HADRON|GRENADE/.test(f.move.name || '');
  ctx.save(); ctx.translate(x, y);
  // tail
  ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(-6, 8); ctx.quadraticCurveTo(-18, 10, -20, 0); ctx.quadraticCurveTo(-14, 6, -5, 4); ctx.fill();
  ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(-18, 2, 3, 2, 0.5, 0, Math.PI * 2); ctx.fill();
  // body (red jumpsuit)
  ctx.fillStyle = '#b0202a'; ctx.beginPath(); ctx.ellipse(0, 6, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b030'; ctx.fillRect(-1, 2, 3, 3);
  // head
  ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(1, -5, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-3, -14); ctx.lineTo(0, -9); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -9); ctx.lineTo(4, -14); ctx.lineTo(6, -8); ctx.fill();
  ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(5, -3, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(1, -7, 6, 2); ctx.fillStyle = '#fff'; ctx.fillRect(4, -7, 1.5, 1.5);
  ctx.fillStyle = '#111'; ctx.fillRect(8, -4, 2, 2);
  // big gun
  const ang = shooting ? 0 : -0.25;
  ctx.rotate(ang);
  ctx.fillStyle = '#3a4a5a'; ctx.fillRect(0, -1, 26, 7);
  ctx.fillStyle = '#5a7a8a'; ctx.fillRect(4, -3, 14, 3);
  ctx.fillStyle = '#2a3440'; ctx.fillRect(22, -2, 6, 9);
  ctx.fillStyle = '#80e0ff'; ctx.fillRect(10, 1, 6, 2);
  ctx.restore();
}
const groot = {
  id: 'rocketgroot', name: 'ROCKET & GROOT', side: 'marvel', color: '#c8a050', trail: '#9adc5a', arch: 'heavy',
  body: makeBody({ thigh: 38, shin: 37, torso: 50, upperArm: 33, foreArm: 31, headR: 10, wS: 19, wC: 15, wW: 11, wH: 12, wUA: 6, wFA: 5.5, wTh: 7.5, wSh: 6, handR: 6, footL: 17, bUA: 1.5, bFA: 1.5, bTh: 1.5 }),
  stats: { hp: 1100, walk: 2.2, back: 1.9, jump: 11, dash: 6.5, power: 1.05, flip: false },
  face: [0.62, 0.32],
  stance: { legs: [18, -16, 6], lean: 12, head: 6, aF: 35, eF: 40, aB: 15, eB: 40, hF: 'talon', hB: 'talon' },
  look: {
    hand: 'talon', neck: GT_W,
    parts: {
      torso: P(GT_W, (ctx, T, b) => { ctx.save(); ctx.translate(0, -T); barkLines(ctx, T, b.wS, 'rgba(60,40,10,0.55)'); ctx.restore(); texture(ctx, -T, b.wS, GT_M, '#9aae3a', 3, 9); ctx.fillStyle = GT_M; ctx.beginPath(); ctx.ellipse(-b.wC * 0.5, -T * 0.75, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }),
      upperArm: P(GT_W, (ctx, l, w) => { barkLines(ctx, l, w, 'rgba(60,40,10,0.5)'); texture(ctx, l, w, GT_M, '#9aae3a', 5, 3); }),
      foreArm: P(GT_W, (ctx, l, w) => barkLines(ctx, l, w, 'rgba(60,40,10,0.5)')),
      hand: P(GT_W),
      thigh: P(GT_W, (ctx, l, w) => { barkLines(ctx, l, w, 'rgba(60,40,10,0.5)'); texture(ctx, l, w, GT_M, '#9aae3a', 7, 4); }),
      shin: P(GT_W, (ctx, l, w) => barkLines(ctx, l, w, 'rgba(60,40,10,0.5)')),
      foot: { c: GT_W, type: 'root' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, GT_W, 1.1);
      ctx.save(); headPath(ctx, r, 1.1); ctx.clip(); ctx.translate(0, -r * 1.2); barkLines(ctx, r * 2.4, r, 'rgba(60,40,10,0.5)'); ctx.restore();
      ctx.fillStyle = GT_W; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-r * 0.6 + i * r * 0.35, -r * 0.8); ctx.lineTo(-r * 0.7 + i * r * 0.4, -r * 1.5 - (i % 2) * 3); ctx.lineTo(-r * 0.4 + i * r * 0.35, -r * 0.85); ctx.fill(); }
      ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 0.15, r * 0.15, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0c060'; ctx.fillRect(r * 0.55, -r * 0.2, r * 0.07, r * 0.07);
      ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 1; ctx.beginPath();
      if (fc === 'shout') { ctx.fillStyle = '#2a1a08'; ctx.ellipse(r * 0.65, r * 0.5, r * 0.22, r * 0.18, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.moveTo(r * 0.45, r * 0.5); ctx.lineTo(r * 0.9, r * 0.45); ctx.stroke(); }
    },
    mid: rocket,
  },
  normals: {
    hp: { st: 10, rec: 18, wind: { aF: 60, eF: 100, wpn: 'branch', wl: 5 }, hit: { aF: 90, eF: 0, wpn: 'branch', wl: 50, lean: 20 }, box: { at: 'wpnTip', r: 13 } },
    chp: { hit: { aF: 172, eF: 0, wpn: 'branch', wl: 40, legs: [18, -16, 0], lean: -10 }, box: { at: 'wpnTip', r: 15 } },
  },
  specials: [
    T.proj({ name: 'ROCKET BLASTER', fireAt: 8, count: 3, interval: 6, len: 34, sfx: 'laser', from: 'shB', p: { look: 'laser', vx: 11, w: 22, h: 8, dmg: 22, life: 60, color: '#ff40c0', dy: -14 } }),
    T.proj({ name: 'GRENADE TOSS', fireAt: 10, sfx: 'whoosh', from: 'shB', p: { look: 'grenade', vx: 4.2, vy: -7.5, grav: 0.35, w: 14, h: 14, dmg: 20, life: 120, boom: true, boomDmg: 60, color: '#ffa020', dy: -14 } }),
    T.upper({ name: 'BRANCH UPPERCUT', up: { aF: 172, eF: 0, wpn: 'branch', wl: 50, aB: 40, lF: 40, kF: -90, lB: -10, kB: -40 }, box: { at: 'wpnTip', r: 16 }, dmg: 34, launch: 11, vy: -10.5, vx: 2 }),
    T.erupt({ name: 'ROOT SPIKE', castAt: 14, wind: { aF: 60, eF: 40, aB: 40 }, cast: { aF: 30, eF: 0, aB: 20, eB: 0, lean: 30, legs: [20, -16, 16] }, sfx: 'plant', e: { kind: 'roots', at: 'opp', delay: 18, dur: 22, w: 46, h: 100, dmg: 60, launch: 12 } }),
  ],
  hypers: [
    T.hyperRain({ name: 'I AM GROOT', n: 8, dur: 56, castAt: 18, cast: { aF: 35, eF: 0, aB: 25, eB: 0, lean: 40, legs: [22, -16, 22], face: 'shout' }, sfx: 'plant', e: { kind: 'roots', at: 'sweep', dist: 50, step: 55, delay: 4, dur: 26, w: 50, h: 130, dmg: 34, launch: 10 } }),
    T.hyperBeam({ name: 'HADRON ENFORCER', from: 'shB', fire: { aF: 40, eF: 40, lean: -4 }, b: { color: '#ff40c0', core: '#ffffff', w: 34, dmg: 22, angle: 0 } }),
  ],
  assist: 0,
  quotes: { taunt: ['I am Groot.', 'Rocket: Ain\'t nothin\' like me, \'cept me!'], hyper: ['I AM GROOT!', 'Rocket: Light \'em up!'], win: ['I am Groot. (Translation: We won.)', 'Rocket: Pay up, capes.'] },
};

// ======================================================================= VISION
const VS_R = '#b0182e', VS_G = '#1f7a4e', VS_Y = '#e8d040', VS_C = '#1a6a6a';
const vision = {
  id: 'vision', name: 'VISION', side: 'marvel', color: '#f0d040', trail: '#ffe870', arch: 'caster',
  body: makeBody({ thigh: 32, shin: 32, torso: 44, wS: 15.5, wC: 14, wW: 10, wH: 11.5 }),
  stats: { hp: 1000, walk: 2.4, back: 2.2, jump: 11.5, dash: 7, float: true, airdash: true, power: 1.0 },
  face: [0.75, 0.1], ai: 'zone',
  stance: { legs: [10, -12, 2], lean: 0, head: -4, aF: 50, eF: 50, aB: 20, eB: 30, hF: 'open', hB: 'fist' },
  look: {
    neck: VS_R,
    cape: { c: VS_C, len: 76, w: 32, base: 12 },
    parts: {
      torso: P(VS_R, (ctx, T, b) => {
        ctx.fillStyle = VS_G;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * b.wS, -T * 0.9); ctx.lineTo(s * b.wC * 0.4, -T * 0.6); ctx.lineTo(s * b.wW * 0.5, -T * 0.05); ctx.lineTo(s * (b.wH + 2), 0); ctx.lineTo(s * (b.wS + 3), -T * 0.5); ctx.fill(); }
        ctx.strokeStyle = VS_Y; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-b.wC * 0.4, -T * 0.95); ctx.lineTo(0, -T * 0.7); ctx.lineTo(b.wC * 0.4, -T * 0.95); ctx.moveTo(0, -T * 0.7); ctx.lineTo(0, -T * 0.45); ctx.moveTo(-b.wW * 0.6, -T * 0.25); ctx.lineTo(-b.wW * 0.1, -T * 0.4); ctx.lineTo(b.wW * 0.6, -T * 0.25); ctx.stroke();
        ctx.fillStyle = VS_G; ctx.fillRect(-b.wH, -T * 0.06, b.wH * 2, T * 0.08);
      }),
      upperArm: P(VS_G), foreArm: P(VS_G, (ctx, l, w) => bandY(ctx, l * 0.8, l, w, '#1a5a3a')), hand: P(VS_G),
      thigh: P(VS_R, (ctx, l, w) => { bandX(ctx, -w * 0.3, -w * 0.05, l, VS_Y); bandX(ctx, w * 0.2, w + 2, l, VS_G); }),
      shin: P(VS_R, (ctx, l, w) => bandX(ctx, w * 0.3, w + 2, l, VS_G)),
      foot: { c: VS_R, type: 'boot', sole: false },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, VS_R);
      ctx.strokeStyle = 'rgba(40,0,0,0.5)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.9); ctx.quadraticCurveTo(r * 0.1, -r * 0.4, r * 0.4, r * 0.9); ctx.moveTo(r * 0.1, -r * 1.05); ctx.quadraticCurveTo(r * 0.5, -r * 0.6, r * 0.95, -r * 0.4); ctx.stroke();
      glowEyes(ctx, r, '#fff6a0', 0.28);
      ctx.strokeStyle = '#3a0008'; ctx.beginPath(); ctx.moveTo(r * 0.55, r * 0.55); ctx.lineTo(r * 0.9, r * 0.52); ctx.stroke();
      ctx.fillStyle = VS_Y; ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.75); ctx.lineTo(r * 0.75, -r * 0.6); ctx.lineTo(r * 0.55, -r * 0.45); ctx.lineTo(r * 0.38, -r * 0.6); ctx.fill();
    },
    mid: (ctx, sk) => { ctx.fillStyle = VS_C; ctx.beginPath(); ctx.moveTo(sk.neck[0] - 9, sk.neck[1] + 5); ctx.lineTo(sk.neck[0] - 12, sk.neck[1] - 14); ctx.lineTo(sk.neck[0] - 1, sk.neck[1] - 3); ctx.fill(); },
    glow: (ctx, sk, f, frame) => {
      const [hx, hy] = sk.head;
      const r = 2.5 + Math.sin(frame * 0.2) * 0.8;
      const g = ctx.createRadialGradient(hx + 5, hy - 6, 0, hx + 5, hy - 6, r * 2);
      g.addColorStop(0, 'rgba(255,240,120,0.9)'); g.addColorStop(1, 'rgba(255,200,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx + 5, hy - 6, r * 2, 0, Math.PI * 2); ctx.fill();
    },
  },
  normals: { hp: { sparkColor: '#ffe060' } },
  specials: [
    T.beam({ name: 'SOLAR BEAM', start: 12, dur: 24, rec: 14, from: 'eyes', fire: { aF: 40, eF: 30, head: 0, lean: -2 }, b: { color: '#ffd030', core: '#ffffff', w: 12, len: 360, dmg: 12, every: 5 } }),
    T.rush({ name: 'PHASE DASH', start: 6, dur: 22, speed: 8, dmg: 34, every: 30, inv: [1, 26], go: { legs: [14, -16, 4], lean: 25, aF: 90, eF: 0, aB: -30, eB: 20, hF: 'open' }, box: { at: 'haF', r: 16 }, sfx: 'hitM' }),
    T.slam({ name: 'DENSITY DROP', vx: 3.5, vy: -14, dmg: 110, waveDmg: 40, wave: 'rock', both: true, top: { aF: 170, aB: 165 }, down: { aF: -20, aB: -20, lean: 0, lF: 0, kF: 0, lB: 0, kB: 0 }, box: { at: 'hip', r: 26 } }),
    T.beam({ name: 'MIND BEAM', start: 12, dur: 20, rec: 14, from: 'eyes', fire: { aF: 40, eF: 30, head: 20, lean: 10 }, b: { color: '#ffd030', core: '#ffffff', w: 12, len: 340, dmg: 13, every: 5, angle: 28 } }),
  ],
  hypers: [
    T.hyperBeam({ name: 'MIND STONE OVERLOAD', from: 'eyes', fire: { aF: 70, eF: 40, aB: 60, eB: 40, hF: 'open', hB: 'open', head: 0, lean: -6 }, b: { color: '#ffd030', core: '#ffffff', w: 48, dmg: 22 } }),
  ],
  assist: 0,
  quotes: { taunt: ['I calculate my victory.', 'Your odds are poor.'], hyper: ['Mind Stone, overload.', 'Maximum density.'], win: ['Logic prevails.', 'I am... unbeatable.'] },
};

// ======================================================================= STORM
const ST_K = '#15151c', ST_G = '#d8b030', ST_SKIN = '#7a4a30';
const storm = {
  id: 'storm', name: 'STORM', side: 'marvel', color: '#a0d8ff', trail: '#e0f4ff', arch: 'caster',
  body: makeBody({ thigh: 32, shin: 32, torso: 40, wS: 13, wC: 12.5, wW: 8.5, wH: 11.5, wUA: 4.4, wFA: 3.8, wTh: 6.8, wSh: 4.8, headR: 8.5, handR: 3.8, bUA: 0.5 }),
  stats: { hp: 900, walk: 2.4, back: 2.2, jump: 11.5, dash: 7, float: true, airdash: true, power: 1.0 },
  face: [0.5, 0.15], ai: 'zone',
  look: {
    female: true,
    neck: ST_SKIN,
    cape: { c: '#3a3a4a', len: 74, w: 40, base: 8, lining: '#c8ccd8' },
    hair: { c: '#f4f4fa', len: 22, base: -10, spread: 70, n: 7, w: 6, curl: 8 },
    hairFront: false,
    parts: {
      torso: P(ST_K, (ctx, T, b) => {
        ctx.fillStyle = ST_SKIN; ctx.beginPath(); ctx.ellipse(0, -T * 0.25, b.wW * 0.6, T * 0.14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = ST_G; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-b.wS, -T * 0.92); ctx.lineTo(b.wW * 0.8, -T * 0.42); ctx.moveTo(b.wS, -T * 0.92); ctx.lineTo(-b.wW * 0.8, -T * 0.42); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-b.wW * 0.6, -T * 0.08); ctx.lineTo(0, 2); ctx.lineTo(b.wW * 0.6, -T * 0.08); ctx.stroke();
      }),
      upperArm: P(ST_K), foreArm: P(ST_K, (ctx, l, w) => bandY(ctx, l * 0.85, l * 0.92, w, ST_G)), hand: P(ST_K),
      thigh: P(ST_K, (ctx, l, w) => { ctx.strokeStyle = ST_G; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(w, l * 0.3); ctx.stroke(); }),
      shin: P(ST_K), foot: { c: ST_K, type: 'heel' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, ST_SKIN, 0.95);
      face(ctx, r, { skin: ST_SKIN, expr: fc, noEyes: true, brow: '#e0e0e8', lips: '#5a2a20' });
      glowEyes(ctx, r, f && f.state === 'move' ? '#e8f8ff' : '#c8e8ff', 0.26);
      ctx.fillStyle = '#f4f4fa';
      ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.4); ctx.quadraticCurveTo(-r * 1.3, -r * 1.3, r * 0.3, -r * 1.35); ctx.quadraticCurveTo(r * 1.0, -r * 1.2, r * 1.0, -r * 0.6); ctx.quadraticCurveTo(r * 0.4, -r * 0.8, -r * 0.2, -r * 0.6); ctx.quadraticCurveTo(-r * 0.5, 0, -r * 0.3, r * 0.4); ctx.fill();
      ctx.strokeStyle = ST_G; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.75); ctx.lineTo(r * 0.85, -r * 0.62); ctx.stroke();
    },
    glow: (ctx, sk, f, frame) => {
      if (f.state === 'move' && frame % 6 < 3) { ctx.strokeStyle = '#c8e8ff'; ctx.lineWidth = 1; bolt(ctx, sk.haF[0], sk.haF[1], sk.haF[0] + rand(-14, 14), sk.haF[1] + rand(-14, 14), 3, 3); }
    },
  },
  normals: { hp: { sparkColor: '#a0d8ff', fxKind: 'elec', sfx: 'zap' } },
  specials: [
    T.proj({ name: 'LIGHTNING ATTACK', fireAt: 10, wind: { aF: 150, eF: 20 }, fire: { aF: 92, eF: 0, hF: 'open', lean: 10 }, sfx: 'zap', p: { look: 'lightningball', vx: 9.5, w: 22, h: 18, dmg: 45, life: 70 } }),
    T.proj({ name: 'WHIRLWIND', fireAt: 14, len: 40, wind: { aF: 140, eF: 30, aB: 130, eB: 30 }, fire: { aF: 100, eF: 20, aB: 95, eB: 20, hF: 'open', hB: 'open' }, sfx: 'whooshH', p: { look: 'tornado', vx: 3.2, w: 40, h: 70, dmg: 14, hits: 5, every: 8, life: 140, launch: 7, dy: 20 } }),
    T.burst({ name: 'LIGHTNING SPHERE', r: 52, color: '#80c0ff', dmg: 18, launch: 9, sfx: 'zap' }),
    T.erupt({ name: 'HAIL STORM', castAt: 14, wind: { aF: 120, eF: 30, aB: 110, eB: 30 }, cast: { aF: 165, eF: 0, aB: 160, eB: 0, hF: 'open', hB: 'open', lean: -6 }, sfx: 'whooshH', e: { kind: 'hail', at: 'opp', sky: true, delay: 16, dur: 34, w: 60, h: 120, dmg: 18, hits: 4, every: 8, color: '#c8f2ff', freeze: 20 } }),
  ],
  hypers: [
    T.hyperRain({ name: 'LIGHTNING STORM', n: 10, dur: 64, castAt: 16, sfx: 'thunder', e: { kind: 'lightning', at: 'scatter', spread: 110, sky: true, delay: 10, dur: 14, w: 40, h: 300, dmg: 28, kd: true, color: '#a0d8ff' }, ev: [[16, (f, G) => G.flash('#e0f4ff', 0.5)]] }),
    T.hyperBeam({ name: 'ELEMENTAL FURY', fire: { aF: 92, eF: 0, aB: 88, eB: 5, hF: 'open', hB: 'open' }, sfx: 'thunder', b: { look: 'lightning', color: '#80c0ff', core: '#ffffff', w: 36, dmg: 22 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Feel the fury of the storm!', 'The skies obey me.'], hyper: ['Lightning, strike!', 'Feel the storm!'], win: ['Do you know what happens to a toad struck by lightning?', 'The storm has passed.'] },
};

export const MARVEL = [spidey, wolverine, hulk, ghostrider, scarlet, venom, strange, groot, vision, storm];
export { orb, skull, circleEmblem };

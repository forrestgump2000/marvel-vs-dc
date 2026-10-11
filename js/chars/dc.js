// DC roster: costume art, stances, normals, specials and hypers for each hero.
import { makeBody } from '../rig.js';
import { T } from '../moves.js';
import { shade, rand } from '../util.js';
import { bolt } from '../fx.js';
import {
  fillHead, headPath, face, hairCap, lens, glowEyes, batEmblem, superShield, circleEmblem, boltShape, lanternEmblem, bandY, bandX, texture, barkLines,
} from './parts.js';

const P = (c, pat) => ({ c, pat });

// ======================================================================= BATMAN
const BM_G = '#5c6272', BM_K = '#1a1f2c', BM_SKIN = '#d8a07a';
const batman = {
  id: 'batman', name: 'BATMAN', side: 'dc', color: '#3a5a9a', trail: '#8aa0d0', arch: 'brawler',
  body: makeBody({ thigh: 31, shin: 31, torso: 44, wS: 18, wC: 16, wW: 11.5, wH: 12.5, wUA: 6.5, wFA: 5.8, wTh: 8, wSh: 6, headR: 9.2, handR: 4.8 }),
  stats: { hp: 1000, walk: 2.6, back: 2.2, jump: 11.5, dash: 7, power: 1.05 },
  face: [0.48, 0.1],
  stance: { legs: [14, -16, 6], lean: 10, head: -4, aF: 50, eF: 95, aB: 30, eB: 110 },
  look: {
    neck: BM_K,
    cape: { c: '#1c2232', len: 82, w: 40, base: 4, style: 'scallop' },
    parts: {
      torso: P(BM_G, (ctx, T, b) => {
        batEmblem(ctx, 0, -T * 0.72, 9, '#0e1016', '#d8b030');
        batEmblem(ctx, 0, -T * 0.72, 8.2, '#0e1016');
        bandY(ctx, -T * 0.13, -T * 0.02, b.wH, '#3a3420');
        ctx.fillStyle = '#c89a30'; for (let i = -2; i <= 2; i++) ctx.fillRect(i * 5 - 2, -T * 0.13, 4, T * 0.1);
      }),
      upperArm: P(BM_G),
      foreArm: P(BM_K, (ctx, l, w) => { ctx.fillStyle = BM_K; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-w, l * (0.2 + i * 0.18)); ctx.lineTo(-w - 4, l * (0.28 + i * 0.18)); ctx.lineTo(-w, l * (0.32 + i * 0.18)); ctx.fill(); } }),
      hand: P(BM_K), thigh: P(BM_G), shin: P(BM_K, (ctx, l, w) => { ctx.fillStyle = BM_G; ctx.fillRect(-w - 2, -4, w * 2 + 4, l * 0.2); }), foot: { c: '#12141c', type: 'boot' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, BM_SKIN);
      face(ctx, r, { skin: BM_SKIN, expr: fc || 'angry', noEyes: true });
      ctx.save(); headPath(ctx, r); ctx.clip();
      ctx.fillStyle = BM_K;
      ctx.beginPath(); ctx.moveTo(-r * 1.2, r * 1.2); ctx.lineTo(-r * 1.2, -r * 1.4); ctx.lineTo(r * 1.3, -r * 1.4); ctx.lineTo(r * 1.3, r * 0.1); ctx.lineTo(r * 0.75, r * 0.15); ctx.quadraticCurveTo(r * 0.4, r * 0.3, r * 0.2, r * 0.25); ctx.lineTo(r * 0.0, r * 1.2); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = BM_K; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.8); ctx.lineTo(-r * 0.15, -r * 1.75); ctx.lineTo(r * 0.15, -r * 0.95); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * 0.25, -r * 0.9); ctx.lineTo(r * 0.45, -r * 1.7); ctx.lineTo(r * 0.7, -r * 0.85); ctx.fill();
      glowEyes(ctx, r, '#f4f6ff', 0.3);
    },
  },
  normals: { hk: { hit: { lB: 120, kB: -4, lean: -26 } } },
  specials: [
    T.proj({ name: 'BATARANG', fireAt: 10, wind: { aF: 160, eF: 40, lean: -6 }, fire: { aF: 92, eF: 0, hF: 'open', lean: 18, legs: [20, -14, 8] }, sfx: 'whoosh', p: { look: 'batarang', vx: 9, w: 20, h: 12, dmg: 32, hits: 2, every: 20, life: 120, ret: 26 } }),
    T.pull({ name: 'GRAPPLE GUN', look: 'grapple', wind: { aF: 60, eF: 120 }, fire: { aF: 95, eF: 0, lean: 10 }, dmg: 40, sfx: 'laser' }),
    T.upper({ name: 'CAPE UPPERCUT', up: { aF: 170, eF: 0, aB: 30, eB: 60, lF: 40, kF: -90, lB: -10, kB: -30 }, dmg: 32, launch: 11 }),
    T.teleport({ name: 'SMOKE PELLET', to: 'behind', fx: 'smoke', wind: { aF: 40, eF: 120, aB: 30, lean: 10 } }),
  ],
  hypers: [
    T.hyperRush({ name: 'DARK KNIGHT ASSAULT', blink: true, n: 12, gap: 5, fx: 'big', color: '#8aa0d0', speed: 11,
      frames: [{ aF: 92, eF: 0, lean: 22 }, { aB: 95, eB: 0, aF: 20, lean: 26 }, { lB: 120, kB: 0, lean: -25 }, { aF: 170, eF: 0, legs: [14, -16, 0], lean: -10 }], fin: 160,
      finPose: { aB: 170, eB: 0, aF: 30, legs: [14, -16, 0], lean: -12 }, ev: [[6, (f, G) => G.fx.puffBig(f.x, f.y - 60, 'bats')]] }),
    T.hyperVehicle({ name: 'BATWING STRIKE', castAt: 14, rec: 60, cast: { aF: 160, eF: 0, hF: 'point', lean: -6 }, sfx: 'blast', from: 'hip', p: { look: 'batwing', vx: 8, w: 110, h: 50, dy: -110, dmg: 25, hits: 4, every: 8, life: 140 } }),
  ],
  assist: 0,
  quotes: { taunt: ['I\'m Batman.', 'I always have a plan.'], hyper: ['Justice!', 'I am vengeance!'], win: ['Criminals are a superstitious, cowardly lot.', 'Prep time beats power.'] },
};

// ======================================================================= SUPERMAN
const SM_B = '#1f4fbf', SM_R = '#c4121a', SM_SKIN = '#e8b890';
const superman = {
  id: 'superman', name: 'SUPERMAN', side: 'dc', color: '#2a6cf0', trail: '#80b0ff', arch: 'brawler',
  body: makeBody({ thigh: 32, shin: 32, torso: 45, wS: 18.5, wC: 16.5, wW: 11.5, wH: 12.5, wUA: 6.6, wFA: 5.8, wTh: 8, wSh: 6, headR: 9.2, handR: 4.8 }),
  stats: { hp: 1150, walk: 2.5, back: 2.2, jump: 12, dash: 8, float: true, airdash: true, power: 1.15 },
  face: [0.5, 0.1],
  stance: { legs: [12, -14, 3], lean: 4, head: -6, aF: 45, eF: 100, aB: 25, eB: 110 },
  look: {
    neck: SM_B,
    cape: { c: SM_R, len: 84, w: 38, base: 6 },
    parts: {
      torso: P(SM_B, (ctx, T, b) => { superShield(ctx, 0, -T * 0.7, 8.5); bandY(ctx, -T * 0.12, -T * 0.03, b.wH, SM_R); ctx.fillStyle = '#f4c81e'; ctx.fillRect(-3, -T * 0.12, 6, T * 0.09); }),
      upperArm: P(SM_B), foreArm: P(SM_B, (ctx, l, w) => bandY(ctx, l * 0.85, l, w, SM_R)), hand: P(SM_SKIN),
      thigh: P(SM_B), shin: P(SM_B, (ctx, l, w) => { ctx.fillStyle = SM_R; ctx.beginPath(); ctx.moveTo(-w - 2, l * 0.35); ctx.lineTo(0, l * 0.25); ctx.lineTo(w + 2, l * 0.35); ctx.lineTo(w + 2, l + 6); ctx.lineTo(-w - 2, l + 6); ctx.fill(); }),
      foot: { c: SM_R, type: 'boot', sole: false },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, SM_SKIN);
      face(ctx, r, { skin: SM_SKIN, expr: fc, iris: '#2a5ad0', brow: '#141420' });
      hairCap(ctx, r, '#141420', 'curl');
    },
    glow: (ctx, sk, f) => {
      if (f.move && /HEAT/.test(f.move.name || '')) { const [hx, hy] = sk.head; ctx.fillStyle = 'rgba(255,40,30,0.8)'; ctx.beginPath(); ctx.arc(hx + 6, hy - 2, 4, 0, Math.PI * 2); ctx.fill(); }
    },
  },
  normals: { hp: { dmg: 90 } },
  specials: [
    T.beam({ name: 'HEAT VISION', start: 10, dur: 22, rec: 14, from: 'eyes', fire: { head: 0, lean: -2, aF: 30, eF: 100 }, b: { color: '#ff2a1a', core: '#ffe0a0', w: 10, len: 380, dmg: 13, every: 5 } }),
    T.beam({ name: 'FREEZE BREATH', start: 12, dur: 24, rec: 16, from: 'eyes', fire: { head: 6, lean: 6, aF: 30, eF: 100, face: 'shout' }, b: { look: 'ice', color: '#9fe8ff', core: '#ffffff', w: 16, len: 200, dmg: 9, every: 6, freeze: 45 } }),
    T.upper({ name: 'SUPER UPPERCUT', up: { aF: 172, eF: 0, aB: 20, eB: 30, lF: 10, kF: -20, lB: -10, kB: -30, lean: -5 }, dmg: 38, launch: 12, vx: 2, vy: -14 }),
    T.dive({ name: 'FLYING CHARGE', start: 8, dur: 20, vx: 12, vy: 0, pose: { lean: 80, aF: 92, eF: 0, aB: -20, eB: 10, lF: -10, kF: -10, lB: -20, kB: -20 }, dmg: 30, every: 7, box: { at: 'haF', r: 16 }, kd: true }),
  ],
  hypers: [
    T.hyperRush({ name: 'KRYPTONIAN CRUSH', n: 10, gap: 5, fx: 'big', color: '#80b0ff', speed: 13, go: { lean: 80, aF: 92, eF: 0, aB: -20, legs: [20, -30, 20, 10, 20] },
      frames: [{ aF: 92, eF: 0, lean: 22 }, { aB: 95, eB: 0, aF: 20, lean: 26 }, { aF: 170, eF: 0, aB: 165, eB: 0, lean: -15 }, { aF: 60, aB: 55, eF: 0, eB: 0, lean: 45 }], fin: 220,
      finPose: { aF: 170, eF: 0, aB: 20, legs: [12, -14, 0], lean: -12 } }),
    T.hyperBeam({ name: 'HEAT VISION MAX', from: 'eyes', fire: { head: 0, lean: -4, aF: 30, eF: 100, aB: 20, eB: 110 }, b: { color: '#ff2a1a', core: '#ffe0a0', w: 40, dmg: 23 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Up, up and away!', 'I\'m holding back. A lot.'], hyper: ['This ends now!', 'Up, up and away!'], win: ['There\'s a right and a wrong. You chose wrong.', 'Truth, justice, and a better tomorrow.'] },
};

// ======================================================================= WONDER WOMAN
const WW_R = '#c4121a', WW_B = '#1a3a9a', WW_G = '#e8b830', WW_SKIN = '#e8b890';
const wonder = {
  id: 'wonderwoman', name: 'WONDER WOMAN', side: 'dc', color: '#e8b830', trail: '#ffe080', arch: 'brawler',
  body: makeBody({ thigh: 33, shin: 32, torso: 40, wS: 14, wC: 13.5, wW: 8.8, wH: 12, wUA: 4.8, wFA: 4.2, wTh: 7.2, wSh: 5, headR: 8.6, handR: 4 }),
  stats: { hp: 1050, walk: 2.6, back: 2.3, jump: 12, dash: 7.5, float: true, power: 1.1 },
  face: [0.6, 0.12],
  look: {
    female: true,
    neck: WW_SKIN,
    hair: { c: '#14141e', len: 30, base: 15, spread: 30, n: 7, w: 5.5, curl: 8 },
    parts: {
      torso: P(WW_R, (ctx, T, b) => {
        ctx.fillStyle = WW_SKIN; ctx.beginPath(); ctx.moveTo(-b.wS - 3, -T * 1.1); ctx.lineTo(-b.wS - 3, -T * 0.82); ctx.quadraticCurveTo(0, -T * 0.92, b.wS + 3, -T * 0.82); ctx.lineTo(b.wS + 3, -T * 1.1); ctx.fill();
        ctx.fillStyle = WW_G; ctx.beginPath(); ctx.moveTo(-b.wC, -T * 0.82); ctx.lineTo(0, -T * 0.66); ctx.lineTo(b.wC, -T * 0.82); ctx.lineTo(b.wC * 0.6, -T * 0.86); ctx.lineTo(0, -T * 0.74); ctx.lineTo(-b.wC * 0.6, -T * 0.86); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3, -T * 0.66); ctx.lineTo(0, -T * 0.55); ctx.lineTo(3, -T * 0.66); ctx.fill();
        bandY(ctx, -T * 0.2, -T * 0.1, b.wH, WW_G);
        ctx.fillStyle = WW_B; ctx.fillRect(-b.wH - 3, -T * 0.1, b.wH * 2 + 6, T * 0.2);
        ctx.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) ctx.fillRect(i * 5 - 1, -T * 0.05, 2, 2);
      }),
      upperArm: P(WW_SKIN), foreArm: P(WW_SKIN, (ctx, l, w) => { bandY(ctx, l * 0.5, l * 0.95, w, '#d0d4dc'); bandY(ctx, l * 0.6, l * 0.66, w, WW_G); }), hand: P(WW_SKIN),
      thigh: P(WW_SKIN), shin: P(WW_R, (ctx, l, w) => { ctx.fillStyle = WW_SKIN; ctx.fillRect(-w - 2, -4, w * 2 + 4, l * 0.12); ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-1, l * 0.12, 2, l * 0.88); }),
      foot: { c: WW_R, type: 'boot', sole: false },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, WW_SKIN, 0.95);
      face(ctx, r, { skin: WW_SKIN, expr: fc, iris: '#2a4ad0', brow: '#14141e', lips: '#b02030' });
      ctx.fillStyle = '#14141e';
      ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.8); ctx.quadraticCurveTo(-r * 1.3, -r * 1.2, r * 0.2, -r * 1.25); ctx.quadraticCurveTo(r * 1.0, -r * 1.1, r * 1.0, -r * 0.4); ctx.quadraticCurveTo(r * 0.5, -r * 0.7, 0, -r * 0.6); ctx.quadraticCurveTo(-r * 0.4, -r * 0.1, -r * 0.3, r * 0.8); ctx.fill();
      ctx.fillStyle = WW_G; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.82); ctx.lineTo(r * 0.95, -r * 0.6); ctx.lineTo(r * 0.95, -r * 0.45); ctx.lineTo(-r * 0.3, -r * 0.68); ctx.fill();
      ctx.fillStyle = WW_R; ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.82); ctx.lineTo(r * 0.65, -r * 0.6); ctx.lineTo(r * 0.45, -r * 0.62); ctx.fill();
    },
    mid: (ctx, sk) => { ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(sk.hipB[0] - 3, sk.hipB[1] + 2, 3.5, 4.5, 0.3, 0, Math.PI * 2); ctx.stroke(); },
  },
  normals: { hp: { dmg: 85, fxKind: 'big' } },
  specials: [
    T.pull({ name: 'LASSO OF TRUTH', look: 'lasso', wind: { aF: 160, eF: 40 }, fire: { aF: 92, eF: 0, lean: 16, legs: [20, -14, 8] }, dmg: 45, sfx: 'whooshH' }),
    T.proj({ name: 'SHIELD TOSS', fireAt: 12, wind: { aF: 40, eF: 120, lean: -6 }, fire: { aF: 92, eF: 0, hF: 'open', lean: 16 }, sfx: 'whooshH', p: { look: 'shield', vx: 8.5, w: 24, h: 24, dmg: 55, life: 80, kd: true } }),
    T.upper({ name: 'BRACELET UPPERCUT', up: { aF: 172, eF: 0, aB: 160, eB: 10, lF: 40, kF: -90, lB: -10, kB: -30 }, dmg: 34, launch: 11, glow: '#e0e8ff' }),
    T.rush({ name: 'AMAZON SWORD', start: 8, dur: 16, speed: 7, dmg: 26, every: 6, go: { aF: 92, eF: 0, wpn: 'sword', wl: 36, lean: 25, legs: [24, -20, 10] }, box: { at: 'wpnTip', r: 14 }, finisher: 50, kd: true, sfx: 'slash', spark: 'slash', trail: true }),
  ],
  hypers: [
    T.hyperRain({ name: 'WRATH OF THE GODS', n: 8, dur: 56, castAt: 16, sfx: 'thunder', cast: { aF: 170, eF: 0, aB: 20, eB: 30, hF: 'open', lean: -8 }, e: { kind: 'lightning', at: 'scatter', spread: 100, sky: true, delay: 8, dur: 14, w: 44, h: 300, dmg: 32, kd: true, color: '#ffe080' }, ev: [[16, (f, G) => G.flash('#fff6c0', 0.5)]] }),
    T.hyperRush({ name: 'AMAZONIAN FURY', n: 10, gap: 5, fx: 'slash', color: '#ffe080', speed: 11, go: { aF: 92, eF: 0, wpn: 'sword', wl: 36, lean: 25, legs: [24, -20, 10] },
      frames: [{ aF: 92, eF: 0, wpn: 'sword', wl: 36, lean: 22 }, { aF: 170, eF: 0, wpn: 'sword', wl: 36, lean: -10 }, { aF: 40, eF: 0, wpn: 'sword', wl: 36, lean: 40 }], fin: 180, finPose: { aF: 170, eF: 0, wpn: 'sword', wl: 36, legs: [12, -14, 0], lean: -12 } }),
  ],
  assist: 1,
  quotes: { taunt: ['Is that the best Man\'s world can offer?', 'Kneel.'], hyper: ['By the gods!', 'For Themyscira!'], win: ['The truth always wins.', 'I fight for those who cannot.'] },
};

// ======================================================================= FLASH
const FL_R = '#c8141e', FL_Y = '#f4c81e';
const flash = {
  id: 'flash', name: 'THE FLASH', side: 'dc', color: '#ff3020', trail: '#ffe040', arch: 'agile',
  body: makeBody({ wS: 14.5, wC: 13, wW: 9.2, wH: 11.2, wUA: 5, wFA: 4.3, wTh: 7.2, wSh: 5, torso: 42 }),
  stats: { hp: 920, walk: 4.2, back: 3.4, jump: 12, jumpX: 4.4, dash: 11, double: false, airdash: true, power: 0.92 },
  face: [0.45, 0.12],
  runPose: { legs: [26, -30, 10, 0, 16], lean: 45, aF: -50, eF: 90, aB: 80, eB: 70 },
  look: {
    parts: {
      torso: P(FL_R, (ctx, T, b) => { circleEmblem(ctx, 0, -T * 0.72, 7.5, FL_Y, '#fff'); boltShape(ctx, 0, -T * 0.72, 9, FL_Y); ctx.strokeStyle = FL_R; ctx.lineWidth = 0.6; ctx.stroke(); bandY(ctx, -T * 0.12, -T * 0.05, b.wH, FL_Y); ctx.strokeStyle = 'rgba(80,0,0,0.4)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-b.wC * 0.8, -T * 0.5); ctx.lineTo(-b.wW, -T * 0.2); ctx.moveTo(b.wC * 0.8, -T * 0.5); ctx.lineTo(b.wW, -T * 0.2); ctx.stroke(); }),
      upperArm: P(FL_R), foreArm: P(FL_R, (ctx, l, w) => { ctx.fillStyle = FL_Y; ctx.beginPath(); ctx.moveTo(-w, l * 0.7); ctx.lineTo(w, l * 0.6); ctx.lineTo(w, l * 0.7); ctx.lineTo(-w, l * 0.8); ctx.fill(); }), hand: P(FL_R),
      thigh: P(FL_R), shin: P(FL_R, (ctx, l, w) => { ctx.fillStyle = FL_Y; ctx.beginPath(); ctx.moveTo(-w - 2, l * 0.55); ctx.lineTo(w + 2, l * 0.45); ctx.lineTo(w + 2, l + 6); ctx.lineTo(-w - 2, l + 6); ctx.fill(); }),
      foot: { c: FL_Y, type: 'boot', sole: false },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, FL_R);
      ctx.save(); headPath(ctx, r); ctx.clip();
      ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.moveTo(r * 0.2, r * 0.25); ctx.lineTo(r * 1.2, r * 0.15); ctx.lineTo(r * 1.2, r * 1.2); ctx.lineTo(r * 0.1, r * 1.2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#8a4a30'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r * 0.55, r * 0.6); ctx.lineTo(r * 0.9, r * 0.56); ctx.stroke();
      lens(ctx, r, '#6a0a0a', '#ffffff', 0.75, true);
      // lightning ear wings
      ctx.fillStyle = FL_Y; ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.1); ctx.lineTo(-r * 0.6, -r * 0.6); ctx.lineTo(-r * 0.35, -r * 0.5); ctx.lineTo(-r * 0.9, -r * 1.2); ctx.lineTo(-r * 0.2, -r * 0.55); ctx.lineTo(-r * 0.4, -r * 0.6); ctx.lineTo(r * 0.1, -r * 0.2); ctx.fill();
    },
    glow: (ctx, sk, f, frame) => {
      const fast = f.state === 'dash' || f.state === 'walkF' || f.state === 'move' || f.buffs.speed;
      if (!fast || frame % 3) return;
      ctx.strokeStyle = frame % 6 ? '#ffe040' : '#ffffff'; ctx.lineWidth = 1.2;
      const pts = [sk.hip, sk.neck, sk.haF, sk.ftF, sk.ftB];
      const a = pts[(frame >> 1) % 5], b = pts[((frame >> 1) + 2) % 5];
      bolt(ctx, a[0], a[1], b[0] + rand(-8, 8), b[1] + rand(-8, 8), 4, 5);
    },
  },
  normals: {
    lp: { st: 2, rec: 5 }, lk: { st: 3, rec: 6 },
    hp: { every: 4, act: 9, dmg: 24, hit: { aF: 90, eF: 0, aB: 90, eB: 0, lean: 20 }, box: { at: 'haF', r: 14 } },
  },
  specials: [
    T.rush({ name: 'SPEED FORCE RUSH', start: 4, dur: 22, speed: 10, dmg: 14, every: 3, sfx: 'hitL', trail: true,
      frames: [{ aF: 92, eF: 0, aB: 20, eB: 110, lean: 30, legs: [24, -20, 10] }, { aB: 95, eB: 0, aF: 30, eF: 110, lean: 32, legs: [24, -20, 10] }], finisher: 40, kd: true }),
    T.proj({ name: 'LIGHTNING THROW', fireAt: 8, wind: { aF: 150, eF: 30, lean: -10 }, fire: { aF: 92, eF: 0, hF: 'open', lean: 22 }, sfx: 'zap', p: { look: 'lightningball', vx: 11, w: 20, h: 16, dmg: 38, life: 60 } }),
    T.burst({ name: 'TORNADO SPIN', r: 50, color: '#ffe040', dmg: 14, launch: 10, sfx: 'whooshH', pose: { aF: 90, eF: 0, aB: -90, eB: 0, lean: 0, hF: 'open', hB: 'open' } }),
    T.dive({ name: 'SPEED SLIDE', start: 4, dur: 18, vx: 12, vy: 0, wind: {}, pose: { y: 46, lean: -40, lF: 85, kF: 0, lB: 60, kB: -60, aF: -40, eF: 0, aB: -60, eB: 20, rot: 0 }, box: { at: 'ftF', r: 14 }, dmg: 40, every: 30, kd: true }),
  ],
  hypers: [
    T.hyperRush({ name: 'INFINITE MASS PUNCH', start: 4, n: 6, gap: 4, fx: 'big', color: '#ffe040', speed: 18, blink: true,
      frames: [{ aF: 92, eF: 0, lean: 30 }, { aB: 95, eB: 0, lean: 32 }], fin: 280, finPose: { aB: 95, eB: -5, aF: 10, eF: 90, lean: 35, legs: [28, -20, 12] }, finFx: 'huge' }),
    T.buff({ name: 'SPEED FORCE', sfx: 'zap', meter: 100, b: { speed: true, t: 420, color: '#ffe040', aura: 'flare' }, len: 40, pose: { legs: [10, -12, 14], lean: 20, aF: 20, eF: 90, aB: 20, eB: 90 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Too slow!', 'Blink and you\'ll miss it.'], hyper: ['Fastest man alive!', 'Speed Force!'], win: ['I\'m the fastest man alive.', 'Sorry, I was busy winning.'] },
};

// ======================================================================= GREEN LANTERN
const GL_G = '#1fa24a', GL_K = '#141418', GL_SKIN = '#e8b890';
const lantern = {
  id: 'greenlantern', name: 'GREEN LANTERN', side: 'dc', color: '#2cff5a', trail: '#7dff9a', arch: 'brawler',
  body: makeBody({ thigh: 32, shin: 32, torso: 43, wS: 16.5, wC: 15, wW: 10.5, wH: 12 }),
  stats: { hp: 1000, walk: 2.5, back: 2.2, jump: 11.5, dash: 7, float: true, airdash: true, power: 1.0 },
  face: [0.55, 0.1],
  look: {
    neck: GL_G,
    parts: {
      torso: P(GL_G, (ctx, T, b) => {
        ctx.fillStyle = GL_K;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * b.wS * 1.1, -T * 0.8); ctx.quadraticCurveTo(s * b.wC * 0.6, -T * 0.5, s * b.wW * 0.5, -T * 0.1); ctx.lineTo(s * (b.wH + 2), 2); ctx.lineTo(s * (b.wS + 3), -T * 0.5); ctx.fill(); }
        lanternEmblem(ctx, 0, -T * 0.72, 7.5);
      }),
      upperArm: P(GL_K, (ctx, l, w) => bandX(ctx, -w * 0.2, w + 2, l, GL_G)), foreArm: P(GL_K, (ctx, l, w) => bandX(ctx, -w * 0.1, w + 2, l, GL_G)), hand: P('#f4f4f4'),
      thigh: P(GL_K, (ctx, l, w) => bandX(ctx, 0, w + 2, l, GL_G)), shin: P(GL_G, (ctx, l, w) => bandX(ctx, -w - 2, -w * 0.3, l * 0.4, GL_K)), foot: { c: GL_G, type: 'boot', sole: false },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, GL_SKIN);
      face(ctx, r, { skin: GL_SKIN, expr: fc, noEyes: true, brow: '#4a2a14' });
      hairCap(ctx, r, '#4a2a14');
      ctx.fillStyle = GL_G; ctx.beginPath(); ctx.moveTo(r * 0.15, -r * 0.35); ctx.lineTo(r * 1.0, -r * 0.42); ctx.lineTo(r * 1.0, -r * 0.02); ctx.lineTo(r * 0.25, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(r * 0.5, -r * 0.27, r * 0.3, r * 0.14);
    },
    glow: (ctx, sk, f, frame) => {
      const h = sk.haF;
      const r = 5 + Math.sin(frame * 0.25) * 1.5;
      const g = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], r * 2);
      g.addColorStop(0, 'rgba(120,255,150,0.95)'); g.addColorStop(1, 'rgba(0,255,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h[0], h[1], r * 2, 0, Math.PI * 2); ctx.fill();
    },
  },
  normals: {
    hp: { dmg: 80, wind: { aF: 40, eF: 120 }, hit: { aF: 92, eF: 0, wpn: 'gfist', wl: 30, lean: 16 }, box: { at: 'wpnTip', r: 15 }, sparkColor: '#3cff6a' },
    chp: { hit: { aF: 170, eF: 0, wpn: 'gfist', wl: 26, legs: [12, -14, 0], lean: -10 }, wind: { aF: 20, eF: 120 }, box: { at: 'wpnTip', r: 16 }, sparkColor: '#3cff6a' },
  },
  specials: [
    T.proj({ name: 'RING BLAST', fireAt: 10, wind: { aF: 50, eF: 110 }, fire: { aF: 92, eF: 0, lean: 10 }, sfx: 'energy', p: { look: 'ringblast', vx: 9, w: 22, h: 20, dmg: 42, life: 70, color: '#2cff5a' } }),
    T.erupt({ name: 'CONSTRUCT HAMMER', castAt: 14, wind: { aF: 160, eF: 20 }, cast: { aF: 80, eF: 0, lean: 20 }, sfx: 'boom', e: { kind: 'hammer', at: 'front', dist: 90, delay: 6, dur: 18, w: 70, h: 110, dmg: 80, kd: true, color: '#3cff6a' } }),
    T.erupt({ name: 'GIANT FIST', castAt: 10, wind: { aF: 20, eF: 120 }, cast: { aF: 172, eF: 0, lean: -8 }, sfx: 'energy', e: { kind: 'gfist', at: 'front', dist: 46, delay: 2, dur: 18, w: 60, h: 140, dmg: 60, launch: 12, color: '#3cff6a' }, inv: [1, 12] }),
    T.proj({ name: 'MINIGUN CONSTRUCT', fireAt: 10, count: 8, interval: 3, len: 50, hold: 26, fire: { aF: 92, eF: 0, aB: 85, eB: 20, lean: 6 }, sfx: 'laser', p: { look: 'bullet', vx: 12, w: 14, h: 6, dmg: 9, life: 50, spread: 0.3, color: '#3cff6a' } }),
  ],
  hypers: [
    T.hyperVehicle({ name: 'JET CONSTRUCT', castAt: 14, rec: 50, cast: { aF: 92, eF: 0, lean: 10 }, sfx: 'blast', from: 'hip', p: { look: 'jet', vx: 9, w: 150, h: 90, dy: -30, dmg: 30, hits: 7, every: 5, life: 110 } }),
    T.hyperBeam({ name: 'LANTERN\'S LIGHT', fire: { aF: 92, eF: 0, aB: 40, eB: 90, lean: 4 }, b: { color: '#2cff5a', core: '#e0ffe8', w: 44, dmg: 21 } }),
  ],
  assist: 0,
  quotes: { taunt: ['In brightest day...', 'My will is unbreakable.'], hyper: ['Beware my power!', 'Green Lantern\'s light!'], win: ['In blackest night, no evil escapes my sight.', 'All it takes is will.'] },
};

// ======================================================================= CLAYFACE
const CF = '#7a5233', CF_L = '#9a6e45', CF_D = '#5a3a20';
const clayface = {
  id: 'clayface', name: 'CLAYFACE', side: 'dc', color: '#b07a40', trail: '#c8945a', arch: 'heavy',
  body: makeBody({ thigh: 32, shin: 30, torso: 54, neck: 0, upperArm: 31, foreArm: 30, headR: 11, wS: 30, wC: 26, wW: 20, wH: 18, wUA: 12, wFA: 11, wTh: 13, wSh: 11, handR: 8.5, footL: 18, footH: 8, bUA: 4, bFA: 4, bTh: 3, bSh: 3 }),
  stats: { hp: 1300, walk: 1.8, back: 1.5, jump: 10.5, dash: 5.5, power: 1.15, flip: false },
  face: [0.42, 0.16], ai: 'rush',
  stance: { legs: [18, -16, 10], lean: 26, head: 18, aF: 15, eF: 30, aB: 5, eB: 30 },
  look: {
    neck: CF, mud: CF,
    parts: {
      torso: P(CF, (ctx, T, b) => {
        texture(ctx, -T, b.wS, CF_L, CF_D, 11, 18);
        ctx.strokeStyle = 'rgba(40,20,5,0.5)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-b.wC + i * 5, -T * (0.9 - i * 0.1)); ctx.quadraticCurveTo(0, -T * (0.8 - i * 0.12), b.wC - i * 4, -T * (0.88 - i * 0.1)); ctx.stroke(); }
      }),
      upperArm: P(CF, (ctx, l, w) => texture(ctx, l, w, CF_L, CF_D, 13, 6)), foreArm: P(CF, (ctx, l, w) => texture(ctx, l, w, CF_L, CF_D, 17, 6)), hand: P(CF),
      thigh: P(CF, (ctx, l, w) => texture(ctx, l, w, CF_L, CF_D, 19, 6)), shin: P(CF, (ctx, l, w) => texture(ctx, l, w, CF_L, CF_D, 23, 6)), foot: { c: CF_D, type: 'paw' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, CF, 1.05);
      ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 0.25, r * 0.16, r * 0.1, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = CF_D; ctx.fillRect(r * 0.3, -r * 0.5, r * 0.6, r * 0.12);
      // jagged grin
      ctx.fillStyle = '#2a1408';
      ctx.beginPath(); ctx.moveTo(r * 0.0, r * 0.3); ctx.quadraticCurveTo(r * 0.5, r * (fc === 'shout' ? 1.0 : 0.75), r * 1.05, r * 0.25); ctx.lineTo(r * 0.0, r * 0.3); ctx.fill();
      ctx.fillStyle = '#e8d8a0';
      for (let i = 0; i < 6; i++) { const x = r * 0.08 + i * r * 0.16; ctx.beginPath(); ctx.moveTo(x, r * 0.3); ctx.lineTo(x + r * 0.06, r * 0.48); ctx.lineTo(x + r * 0.12, r * 0.3); ctx.fill(); }
    },
    front: (ctx, sk, f) => {
      // dripping mud
      const t = f ? f.animClock : 0;
      ctx.fillStyle = CF_D;
      for (let i = 0; i < 3; i++) { const p = [sk.elF, sk.haF, sk.knF][i]; const d = (t * 0.6 + i * 9) % 18; ctx.beginPath(); ctx.ellipse(p[0] + 2, p[1] + 6 + d, 1.6, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }
    },
  },
  normals: {
    hp: { dmg: 120, wind: { aF: 175, eF: 20, wpn: 'mace', wl: 10, lean: -15, aB: 20, eB: 30 }, hit: { aF: 70, eF: 0, wpn: 'mace', wl: 34, lean: 35, aB: 10, eB: 30, legs: [20, -14, 14] }, box: { at: 'wpnTip', r: 18 } },
    chk: { hit: { aF: 80, eF: 0, wpn: 'hammer', wl: 30, aB: 30, lean: 45 }, box: { at: 'wpnTip', r: 16 } },
  },
  specials: [
    T.proj({ name: 'CLAY BALL', fireAt: 14, wind: { aF: 170, eF: 30, lean: -10 }, fire: { aF: 85, eF: 0, lean: 25 }, sfx: 'splat', p: { look: 'clay', vx: 6, vy: -2, grav: 0.08, w: 24, h: 20, dmg: 55, life: 90, stunLock: 24 } }),
    (c) => {
      const S = c.S;
      const wind = c.R({ ...S, aF: 175, eF: 10, wpn: 'hammer', wl: 20, lean: -18, legs: [18, -16, 0] });
      const hit = c.R({ ...S, aF: 60, eF: 0, wpn: 'hammer', wl: 60, lean: 45, legs: [24, -14, 20] });
      return {
        name: 'HAMMER ARM', keys: [[0, c.R(S)], [14, wind, 'out'], [18, hit, 'lin'], [28, hit], [46, c.R(S)]], len: 46, armor: [1, 18],
        hits: [{ a: 17, b: 24, box: { at: 'wpnTip', r: 24 }, dmg: 130, stun: 26, bstun: 18, push: 5, lvl: 'high', kd: true, hs: 12, sfx: 'boom', spark: 'huge', chip: true }],
        ev: [[18, (f, G) => { G.shake(10); G.fx.rocks(f.point('wpnTip')[0], -2, 10, '#5a3a20'); }]],
      };
    },
    T.erupt({ name: 'MUD SPIKES', castAt: 10, cast: { aF: 160, eF: 10, aB: 150, eB: 10, lean: -10, face: 'shout' }, sfx: 'splat', e: { kind: 'spikes', at: 'self', delay: 1, dur: 18, w: 120, h: 90, dmg: 50, launch: 11, color: '#7a5233' }, inv: [1, 14] }),
    T.teleport({ name: 'MUD SLIDE', to: 'front', fx: 'mud', vanish: { legs: [16, -16, 40], lean: 60, aF: 0, aB: 0 } }),
  ],
  hypers: [
    T.hyperVehicle({ name: 'MUD AVALANCHE', castAt: 16, rec: 60, cast: { aF: 160, eF: 0, aB: 150, eB: 0, lean: -12, face: 'shout' }, sfx: 'splat', from: 'ground', p: { look: 'mudwave', vx: 6, ground: true, w: 90, h: 110, dmg: 26, hits: 8, every: 6, life: 120, stunLock: 10 } }),
    T.hyperGiant({ name: 'CLAY CRUSHER', cast: { aF: 60, eF: 0, aB: 55, lean: 50, legs: [22, -16, 24], face: 'shout' }, sfx: 'splat', e: { kind: 'mudhand', at: 'opp', delay: 14, dur: 34, w: 80, h: 160, dmg: 40, hits: 6, every: 6, launch: 12 } }),
  ],
  assist: 0,
  quotes: { taunt: ['I can be anyone. Even you.', 'Get your hands dirty!'], hyper: ['Drown in me!', 'Let\'s get messy!'], win: ['What a mess you\'ve made.', 'Back to the mud with you.'] },
};

// ======================================================================= SWAMP THING
const SW_G = '#5a7a2a', SW_L = '#8aa040', SW_D = '#3a4a1a';
const swamp = {
  id: 'swampthing', name: 'SWAMP THING', side: 'dc', color: '#7ac03a', trail: '#a0e060', arch: 'heavy',
  body: makeBody({ thigh: 35, shin: 34, torso: 52, upperArm: 30, foreArm: 28, headR: 10.5, wS: 25, wC: 22, wW: 15, wH: 15, wUA: 9.5, wFA: 8.5, wTh: 11, wSh: 9, handR: 7, footL: 17, bUA: 3, bFA: 2, bTh: 2 }),
  stats: { hp: 1200, walk: 2.0, back: 1.7, jump: 11, dash: 6, power: 1.1, flip: false },
  face: [0.42, 0.1],
  look: {
    neck: SW_G,
    parts: {
      torso: P(SW_G, (ctx, T, b) => { texture(ctx, -T, b.wS, SW_L, SW_D, 31, 20); ctx.save(); ctx.translate(0, -T); barkLines(ctx, T, b.wS, 'rgba(30,40,10,0.45)'); ctx.restore(); ctx.fillStyle = '#4fae3a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-b.wS + i * b.wS * 0.5, -T * 0.9, 4, 2, i, 0, Math.PI * 2); ctx.fill(); } }),
      upperArm: P(SW_G, (ctx, l, w) => { texture(ctx, l, w, SW_L, SW_D, 37, 6); barkLines(ctx, l, w, 'rgba(30,40,10,0.4)'); }), foreArm: P(SW_G, (ctx, l, w) => texture(ctx, l, w, SW_L, SW_D, 41, 6)), hand: P(SW_G),
      thigh: P(SW_G, (ctx, l, w) => { texture(ctx, l, w, SW_L, SW_D, 43, 7); barkLines(ctx, l, w, 'rgba(30,40,10,0.4)'); }), shin: P(SW_G, (ctx, l, w) => texture(ctx, l, w, SW_L, SW_D, 47, 7)), foot: { c: SW_D, type: 'root' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, SW_L, 1.05);
      ctx.fillStyle = SW_D; ctx.fillRect(r * 0.2, -r * 0.55, r * 0.8, r * 0.18);
      ctx.fillStyle = '#ff3020'; ctx.beginPath(); ctx.ellipse(r * 0.6, -r * 0.22, r * 0.14, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = SW_D; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r * 0.45, r * 0.5); ctx.lineTo(r * 0.95, r * 0.45); ctx.stroke();
      ctx.fillStyle = '#4fae3a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-r * 0.6 + i * r * 0.3, -r * 0.95, 3, 1.6, -0.5 + i * 0.3, 0, Math.PI * 2); ctx.fill(); }
    },
    back: (ctx, sk, f) => {
      const t = f ? f.animClock : 0;
      ctx.strokeStyle = SW_D; ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) { const p = [sk.shF, sk.shB, sk.elB, sk.hipB][i]; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] - 6, p[1] + 8, p[0] - 4 + Math.sin(t * 0.1 + i) * 3, p[1] + 16); ctx.stroke(); }
    },
  },
  normals: {
    hp: { wind: { aF: 160, eF: 20, wpn: 'vine', wl: 10 }, hit: { aF: 92, eF: 0, wpn: 'vine', wl: 60, lean: 20 }, box: { at: 'wpnTip', r: 14 } },
  },
  specials: [
    T.erupt({ name: 'ROOT ERUPTION', castAt: 14, wind: { aF: 60, eF: 40 }, cast: { aF: 30, eF: 0, aB: 20, eB: 0, lean: 30, legs: [20, -16, 16], hF: 'open' }, sfx: 'plant', e: { kind: 'roots', at: 'opp', delay: 18, dur: 24, w: 50, h: 110, dmg: 60, launch: 12 } }),
    T.proj({ name: 'BOG BOMB', fireAt: 12, wind: { aF: 170, eF: 30, lean: -10 }, fire: { aF: 92, eF: 0, lean: 20 }, sfx: 'whoosh', p: { look: 'spore', vx: 4.5, vy: -7, grav: 0.35, w: 16, h: 16, dmg: 20, life: 120, boom: true, boomDmg: 55, color: '#9be23a', poison: 120 } }),
    T.upper({ name: 'VINE UPPERCUT', up: { aF: 172, eF: 0, wpn: 'vine', wl: 50, lF: 40, kF: -90, lB: -10, kB: -40 }, box: { at: 'wpnTip', r: 16 }, dmg: 34, launch: 11, vy: -10.5 }),
    T.teleport({ name: 'SWAMP SINK', to: 'behind', fx: 'leaf', vanish: { legs: [16, -16, 40], lean: 50, aF: 0, aB: 0 } }),
  ],
  hypers: [
    T.hyperGiant({ name: 'WRATH OF THE GREEN', cast: { aF: 165, eF: 0, aB: 160, eB: 0, hF: 'open', hB: 'open', lean: -10, face: 'shout' }, sfx: 'plant', e: { kind: 'tree', at: 'opp', delay: 14, dur: 40, w: 90, h: 190, dmg: 34, hits: 7, every: 6, launch: 13 } }),
    T.hyperRain({ name: 'THE ROT', n: 8, dur: 56, castAt: 16, cast: { aF: 30, eF: 0, aB: 20, eB: 0, lean: 40, legs: [22, -16, 22], hF: 'open' }, sfx: 'plant', e: { kind: 'vines', at: 'sweep', dist: 50, step: 55, delay: 4, dur: 26, w: 50, h: 120, dmg: 30, launch: 9, poison: 90 } }),
  ],
  assist: 0,
  quotes: { taunt: ['The Green is all.', 'Root and rot.'], hyper: ['The Green answers!', 'Return to the earth!'], win: ['I am the protector of the Green.', 'Nature always wins.'] },
};

// ======================================================================= RAVEN
const RV_C = '#2a1848', RV_K = '#1a1024', RV_SKIN = '#c8bcc8';
const raven = {
  id: 'raven', name: 'RAVEN', side: 'dc', color: '#a040ff', trail: '#d080ff', arch: 'caster',
  body: makeBody({ thigh: 30, shin: 30, torso: 37, wS: 12.5, wC: 12, wW: 8, wH: 11.2, wUA: 4.2, wFA: 3.6, wTh: 6.6, wSh: 4.6, headR: 8.4, handR: 3.6, bUA: 0.5 }),
  stats: { hp: 900, walk: 2.2, back: 2.2, jump: 11, dash: 6.5, float: true, airdash: true, power: 1.0 },
  face: [0.5, 0.15], ai: 'zone',
  stance: { legs: [8, -10, 0], lean: 0, head: -2, aF: 70, eF: 40, aB: 50, eB: 40, hF: 'open', hB: 'open', y: -6 },
  look: {
    female: true,
    neck: RV_K,
    cape: { c: RV_C, len: 86, w: 46, base: 10, style: 'tatter' },
    parts: {
      torso: P(RV_K, (ctx, T, b) => {
        ctx.fillStyle = '#c01030'; ctx.beginPath(); ctx.arc(0, -T * 0.86, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d8b030'; ctx.lineWidth = 0.8; ctx.stroke();
        bandY(ctx, -T * 0.08, -T * 0.02, b.wH, '#d8b030');
        for (let i = -1; i <= 1; i++) { ctx.fillStyle = '#c01030'; ctx.beginPath(); ctx.arc(i * 6, -T * 0.05, 1.8, 0, Math.PI * 2); ctx.fill(); }
      }),
      upperArm: P(RV_K), foreArm: P(RV_K), hand: P(RV_SKIN),
      thigh: P('#5a3a8a'), shin: P('#5a3a8a', (ctx, l, w) => { const g = ctx.createLinearGradient(0, 0, 0, l); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(160,30,90,0.7)'); ctx.fillStyle = g; ctx.fillRect(-w - 2, 0, w * 2 + 4, l + 6); }), foot: { c: '#8a2a6a', type: 'heel' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, RV_SKIN, 0.95);
      face(ctx, r, { skin: RV_SKIN, expr: fc, iris: '#6a2aa0', brow: '#3a1a5a', lips: '#5a2a6a' });
      ctx.fillStyle = '#6a3aa0'; ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.6); ctx.quadraticCurveTo(-r * 0.8, -r * 0.8, r * 0.3, -r * 0.9); ctx.quadraticCurveTo(r * 0.9, -r * 0.8, r * 0.95, -r * 0.4); ctx.quadraticCurveTo(r * 0.3, -r * 0.6, -r * 0.1, -r * 0.4); ctx.lineTo(-r * 0.2, r * 0.6); ctx.fill();
      // hood
      ctx.fillStyle = RV_C;
      ctx.beginPath(); ctx.moveTo(-r * 1.1, r * 1.0); ctx.quadraticCurveTo(-r * 1.4, -r * 1.4, r * 0.3, -r * 1.35); ctx.quadraticCurveTo(r * 1.2, -r * 1.2, r * 1.15, -r * 0.3); ctx.lineTo(r * 0.85, -r * 0.6); ctx.quadraticCurveTo(r * 0.2, -r * 1.05, -r * 0.5, -r * 0.6); ctx.quadraticCurveTo(-r * 0.7, 0, -r * 0.5, r * 1.0); ctx.fill();
      ctx.fillStyle = '#c01030'; ctx.fillRect(r * 0.62, -r * 0.62, r * 0.12, r * 0.12);
    },
    glow: (ctx, sk, f, frame) => {
      if (f.state !== 'move') return;
      for (const h of [sk.haF, sk.haB]) { const g = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 10); g.addColorStop(0, 'rgba(200,120,255,0.9)'); g.addColorStop(1, 'rgba(120,0,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h[0], h[1], 10, 0, Math.PI * 2); ctx.fill(); }
    },
  },
  normals: { hp: { sparkColor: '#c060ff' }, chp: { sparkColor: '#c060ff' } },
  specials: [
    T.proj({ name: 'SOUL SELF', fireAt: 12, wind: { aF: 140, eF: 30, aB: 130, eB: 30 }, fire: { aF: 95, eF: 0, aB: 90, eB: 10, hF: 'palm', hB: 'palm' }, sfx: 'magic', p: { look: 'raven', vx: 7.5, w: 32, h: 26, dmg: 48, life: 80, home: true } }),
    T.teleport({ name: 'DARK PORTAL', to: 'behind', fx: 'dark' }),
    T.burst({ name: 'DARK BURST', r: 54, color: '#9040ff', dmg: 18, launch: 9, sfx: 'magic' }),
    T.erupt({ name: 'AZARATH GRASP', castAt: 14, wind: { aF: 60, eF: 60 }, cast: { aF: 30, eF: 20, aB: 20, eB: 20, hF: 'open', hB: 'open', lean: 10 }, sfx: 'magic', e: { kind: 'darkhand', at: 'opp', delay: 16, dur: 30, w: 46, h: 90, dmg: 45, stunLock: 45, color: '#a040ff' } }),
  ],
  hypers: [
    T.hyperVehicle({ name: 'AZARATH METRION ZINTHOS', castAt: 18, rec: 60, cast: { aF: 165, eF: 0, aB: 160, eB: 0, hF: 'open', hB: 'open', lean: -10 }, sfx: 'roar', from: 'hip', p: { look: 'giantraven', vx: 6.5, w: 150, h: 130, dy: -20, dmg: 26, hits: 8, every: 6, life: 130 }, ev: [[18, (f, G) => G.flash('#6020a0', 0.6)]] }),
    T.hyperBeam({ name: 'TRIGON\'S WRATH', fire: { aF: 92, eF: 0, aB: 90, eB: 5, hF: 'palm', hB: 'palm' }, b: { color: '#b040ff', core: '#ffd0ff', w: 44, dmg: 21 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Azarath Metrion Zinthos.', 'I\'m not in the mood.'], hyper: ['Azarath Metrion Zinthos!', 'Feel the darkness!'], win: ['Don\'t make me angry.', 'Darkness always wins.'] },
};

// ======================================================================= MR. TERRIFIC
const MT_W = '#e8e8ee', MT_K = '#18181e', MT_SKIN = '#5a3420';
const terrific = {
  id: 'mrterrific', name: 'MR. TERRIFIC', side: 'dc', color: '#ff3a3a', trail: '#ffffff', arch: 'brawler',
  body: makeBody({ thigh: 32, shin: 32, torso: 43, wS: 16, wC: 14.5, wW: 10.5, wH: 12 }),
  stats: { hp: 980, walk: 2.7, back: 2.4, jump: 11.5, dash: 7.5, double: true, power: 1.0 },
  face: [0.4, 0.1],
  look: {
    neck: MT_K,
    parts: {
      torso: P(MT_W, (ctx, T, b) => {
        ctx.fillStyle = MT_K; ctx.beginPath(); ctx.moveTo(-b.wS - 2, -T); ctx.lineTo(-b.wC * 0.4, -T * 0.6); ctx.lineTo(-b.wW * 0.6, 4); ctx.lineTo(-b.wH - 3, 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c8c8d0'; ctx.fillRect(-b.wW * 0.6, -T * 0.6, 1.5, T * 0.6);
        ctx.fillStyle = '#d42020'; ctx.fillRect(-b.wC * 0.6, -T * 0.48, b.wC * 0.4, 1.5);
        circleEmblem(ctx, b.wC * 0.15, -T * 0.72, 6.5, '#a0a4ac', '#1a1a20');
        ctx.fillStyle = '#d42020'; ctx.fillRect(b.wC * 0.15 - 4, -T * 0.77, 8, 2.5); ctx.fillRect(b.wC * 0.15 - 1.2, -T * 0.77, 2.4, 8);
      }),
      upperArm: P(MT_K, (ctx, l, w) => bandX(ctx, w * 0.2, w + 2, l, MT_W)), foreArm: P(MT_W, (ctx, l, w) => { bandX(ctx, -w - 2, -w * 0.2, l, MT_K); bandY(ctx, l * 0.85, l, w, MT_K); }), hand: P('#2a2a30'),
      thigh: P(MT_K, (ctx, l, w) => bandX(ctx, w * 0.1, w + 2, l, MT_W)), shin: P(MT_K, (ctx, l, w) => bandX(ctx, w * 0.2, w + 2, l * 0.6, MT_W)), foot: { c: '#f0f0f4', type: 'boot' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, MT_SKIN);
      face(ctx, r, { skin: MT_SKIN, expr: fc, noEyes: true, brow: '#1a0a05' });
      hairCap(ctx, r, '#140a05');
      ctx.fillStyle = MT_K; ctx.beginPath(); ctx.moveTo(r * 0.15, -r * 0.42); ctx.lineTo(r * 1.0, -r * 0.42); ctx.lineTo(r * 1.0, -r * 0.08); ctx.lineTo(r * 0.7, -r * 0.08); ctx.lineTo(r * 0.7, r * 0.5); ctx.lineTo(r * 0.5, r * 0.5); ctx.lineTo(r * 0.5, -r * 0.08); ctx.lineTo(r * 0.15, -r * 0.08); ctx.fill();
      ctx.fillStyle = '#f0f0ff'; ctx.fillRect(r * 0.72, -r * 0.3, r * 0.2, r * 0.1); ctx.fillRect(r * 0.25, -r * 0.3, r * 0.18, r * 0.1);
    },
    glow: (ctx, sk, f, frame) => {
      // orbiting T-spheres
      for (let i = 0; i < 2; i++) {
        const a = frame * 0.06 + i * Math.PI;
        const x = sk.neck[0] + Math.cos(a) * 26, y = sk.neck[1] - 6 + Math.sin(a) * 8;
        ctx.fillStyle = 'rgba(255,80,80,0.35)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8dce4'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d42020'; ctx.fillRect(x - 2, y - 2, 4, 1); ctx.fillRect(x - 0.5, y - 2, 1, 4);
      }
    },
  },
  specials: [
    T.proj({ name: 'T-SPHERE SHOT', fireAt: 10, wind: { aF: 100, eF: 60, hF: 'point' }, fire: { aF: 92, eF: 0, hF: 'point', lean: 8 }, sfx: 'laser', count: 2, interval: 8, p: { look: 'tsphere', vx: 7, w: 16, h: 16, dmg: 28, life: 90, home: true } }),
    T.erupt({ name: 'T-SPHERE STRIKE', castAt: 12, wind: { aF: 140, eF: 20, hF: 'point' }, cast: { aF: 160, eF: 0, hF: 'point', lean: -4 }, sfx: 'laser', e: { kind: 'tsbeam', at: 'opp', delay: 20, dur: 16, w: 26, h: 150, dmg: 50, kd: true, color: '#ff4040' } }),
    T.upper({ name: 'RISING KICK', up: { lF: 150, kF: 0, lB: -10, kB: -40, aF: 60, aB: -40, lean: -30 }, box: { at: 'ftF', r: 15 }, dmg: 32, launch: 11, spin: -360 }),
    T.counter({ name: 'FAIR PLAY' }),
  ],
  hypers: [
    T.hyperRain({ name: 'T-SPHERE BARRAGE', n: 12, dur: 60, castAt: 14, cast: { aF: 165, eF: 0, aB: 40, eB: 90, hF: 'point', lean: -6 }, sfx: 'laser', e: { kind: 'tsbeam', at: 'scatter', spread: 100, delay: 8, dur: 12, w: 26, h: 150, dmg: 22, kd: false, stun: 20 } }),
    T.hyperRush({ name: 'GENIUS STRIKE', blink: true, n: 12, gap: 4, fx: 'big', color: '#ff4040', speed: 11,
      frames: [{ aF: 92, eF: 0, lean: 22 }, { lF: 100, kF: 0, lean: -20 }, { aB: 95, eB: 0, aF: 20, lean: 26 }, { lB: 125, kB: 0, lean: -30 }], fin: 160, finPose: { lF: 130, kF: 0, lean: -40, aF: 60, aB: -40 } }),
  ],
  assist: 0,
  quotes: { taunt: ['Fair play.', 'I ran the numbers. You lose.'], hyper: ['Calculated!', 'T-Spheres, engage!'], win: ['Third smartest man alive. First in this fight.', 'Fair play always wins.'] },
};

// ======================================================================= POISON IVY
const PI_G = '#2f6a2a', PI_SKIN = '#cfe0b8', PI_H = '#c42a1a';
const ivy = {
  id: 'poisonivy', name: 'POISON IVY', side: 'dc', color: '#5adc3a', trail: '#9be23a', arch: 'caster',
  body: makeBody({ thigh: 32, shin: 32, torso: 39, wS: 12.5, wC: 12.5, wW: 7.8, wH: 11.8, wUA: 4.1, wFA: 3.6, wTh: 6.8, wSh: 4.5, headR: 8.4, handR: 3.6, bUA: 0.5 }),
  stats: { hp: 920, walk: 2.4, back: 2.2, jump: 11.5, dash: 7, power: 1.0 },
  face: [0.48, 0.1], ai: 'zone',
  stance: { legs: [8, -12, 2], lean: -2, head: -4, aF: 50, eF: 70, aB: 20, eB: 60, hF: 'open', hB: 'open' },
  look: {
    female: true,
    neck: PI_SKIN,
    hair: { c: PI_H, len: 30, base: 20, spread: 30, n: 7, w: 5.5, curl: 9 },
    parts: {
      torso: P(PI_G, (ctx, T, b) => {
        ctx.fillStyle = PI_SKIN; ctx.beginPath(); ctx.moveTo(-b.wS - 3, -T * 1.1); ctx.lineTo(-b.wS - 3, -T * 0.78); ctx.lineTo(0, -T * 0.55); ctx.lineTo(b.wS + 3, -T * 0.78); ctx.lineTo(b.wS + 3, -T * 1.1); ctx.fill();
        ctx.fillStyle = '#4a9a3a';
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-b.wC + i * b.wC * 0.4, -T * (0.8 - (i % 2) * 0.05), 3.5, 1.8, (i - 3) * 0.4, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = PI_SKIN; ctx.beginPath(); ctx.moveTo(-b.wH - 3, -T * 0.05); ctx.lineTo(-b.wH * 0.4, -T * 0.25); ctx.lineTo(-b.wH * 0.3, 6); ctx.lineTo(-b.wH - 3, 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(b.wH + 3, -T * 0.05); ctx.lineTo(b.wH * 0.4, -T * 0.25); ctx.lineTo(b.wH * 0.3, 6); ctx.lineTo(b.wH + 3, 6); ctx.fill();
      }),
      upperArm: P(PI_SKIN), foreArm: P(PI_G), hand: P(PI_G),
      thigh: P(PI_SKIN, (ctx, l, w) => { ctx.fillStyle = PI_G; ctx.fillRect(-w - 2, l * 0.5, w * 2 + 4, l); for (let i = 0; i < 3; i++) { ctx.fillStyle = '#4a9a3a'; ctx.beginPath(); ctx.moveTo(-w + i * w * 0.8, l * 0.5); ctx.lineTo(-w + i * w * 0.8 + 2, l * 0.4); ctx.lineTo(-w + i * w * 0.8 + 4, l * 0.5); ctx.fill(); } }),
      shin: P(PI_G), foot: { c: '#1f4a1a', type: 'heel' },
    },
    head: (ctx, r, f, fc) => {
      fillHead(ctx, r, PI_SKIN, 0.95);
      face(ctx, r, { skin: PI_SKIN, expr: fc, iris: '#2a8a2a', brow: '#8a1a10', lips: '#2a6a2a' });
      ctx.fillStyle = PI_H;
      ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.7); ctx.quadraticCurveTo(-r * 1.4, -r * 1.3, r * 0.3, -r * 1.35); ctx.quadraticCurveTo(r * 1.1, -r * 1.2, r * 1.05, -r * 0.3); ctx.quadraticCurveTo(r * 0.6, -r * 0.8, 0, -r * 0.65); ctx.quadraticCurveTo(-r * 0.4, -r * 0.1, -r * 0.3, r * 0.7); ctx.fill();
      ctx.fillStyle = '#4a9a3a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-r * 0.4 + i * r * 0.5, -r * 1.15, 3, 1.5, i * 0.6, 0, Math.PI * 2); ctx.fill(); }
    },
  },
  normals: {
    hp: { sparkColor: '#9be23a', wind: { aF: 160, eF: 20, wpn: 'vine', wl: 10 }, hit: { aF: 92, eF: 0, wpn: 'vine', wl: 70, lean: 14, hF: 'open' }, box: { at: 'wpnTip', r: 13 } },
    chp: { hit: { aF: 170, eF: 0, wpn: 'vine', wl: 50, legs: [8, -12, 0] }, box: { at: 'wpnTip', r: 14 } },
  },
  specials: [
    T.proj({ name: 'THORN SHOT', fireAt: 10, count: 3, interval: 1, wind: { aF: 60, eF: 110 }, fire: { aF: 92, eF: 0, hF: 'open', lean: 10 }, sfx: 'whoosh', p: { look: 'thorns', vx: 9, w: 16, h: 8, dmg: 20, life: 60, spread: 1.0, poison: 40 } }),
    T.proj({ name: 'POLLEN CLOUD', fireAt: 12, wind: { aF: 100, eF: 60 }, fire: { aF: 90, eF: 20, hF: 'palm', lean: 4 }, sfx: 'plant', p: { look: 'pollen', vx: 1.8, w: 46, h: 40, dmg: 6, hits: 8, every: 12, life: 170, poison: 60, stun: 10, push: 0 } }),
    T.upper({ name: 'VINE LASH', up: { aF: 170, eF: 0, wpn: 'vine', wl: 50, lF: 40, kF: -90, lB: -10, kB: -40 }, box: { at: 'wpnTip', r: 15 }, dmg: 30, launch: 11, vy: -10.5 }),
    T.grab({ name: 'KISS OF DEATH', range: 52, dmg: 150, hits: 3, fx: 'small', len: 64, hold: [[10, { aF: 90, eF: 60, aB: 80, eB: 60, lean: 16, head: 10 }], [54, { aF: 90, eF: 60, aB: 80, eB: 60, lean: 18, head: 12 }]],
      onGrab: (f, o, G) => { o.poison = 240; G.fx.puff(o.x, o.y - 80, '#ff70c0'); G.sfx('plant'); } }),
  ],
  hypers: [
    T.hyperGiant({ name: 'VENUS FLYTRAP', cast: { aF: 30, eF: 20, aB: 20, eB: 20, hF: 'open', hB: 'open', lean: 10 }, sfx: 'plant', e: { kind: 'flytrap', at: 'opp', delay: 14, dur: 36, w: 80, h: 150, dmg: 40, hits: 6, every: 6, launch: 12, poison: 120 } }),
    T.hyperRain({ name: 'THORN STORM', n: 9, dur: 54, castAt: 14, cast: { aF: 165, eF: 0, aB: 160, eB: 0, hF: 'open', hB: 'open', lean: -6 }, sfx: 'plant', e: { kind: 'vines', at: 'sweep', dist: 50, step: 52, delay: 4, dur: 26, w: 48, h: 120, dmg: 28, launch: 9, poison: 60 } }),
  ],
  assist: 1,
  quotes: { taunt: ['Care to stop and smell the roses?', 'You\'re in my garden now.'], hyper: ['Feed, my darlings!', 'Bloom!'], win: ['Mother Nature always gets the last word.', 'Lovely. Now be fertilizer.'] },
};

export const DC = [batman, superman, wonder, flash, lantern, clayface, swamp, raven, terrific, ivy];
void shade; void texture;

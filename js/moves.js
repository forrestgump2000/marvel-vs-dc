// Move + animation builders. Every character gets a full set of shared-motion animations
// (tuned per archetype and per character), normals with frame data, and unique specials/hypers
// built from parameterized templates.
import { resolvePose, hipHeight } from './rig.js';

// --------------------------------------------------------------- archetype stances & normals
export const ARCH = {
  agile: {
    stance: { legs: [18, -20, 10], lean: 14, head: -10, aF: 55, eF: 80, aB: 30, eB: 100 },
    n: {
      lp: { st: 3, act: 3, rec: 6, dmg: 28, wind: { aF: 60, eF: 120 }, hit: { aF: 88, eF: 0, lean: 18 }, box: { at: 'haF', r: 8 } },
      hp: { st: 6, act: 4, rec: 14, dmg: 68, wind: { aB: 40, eB: 120, lean: 5 }, hit: { aB: 92, eB: -5, aF: 20, eF: 90, lean: 24, legs: [24, -18, 8] }, box: { at: 'haB', r: 10 } },
      lk: { st: 4, act: 3, rec: 8, dmg: 32, wind: { lF: 70, kF: -110 }, hit: { lF: 88, kF: -5, lean: -8 }, box: { at: 'ftF', r: 9 } },
      hk: { st: 7, act: 5, rec: 14, dmg: 78, wind: { lean: -10, lB: 40, kB: -100 }, hit: { lB: 122, kB: -8, lean: -26, aF: 30, aB: -40 }, box: { at: 'ftB', r: 12 } },
      clp: { st: 3, act: 3, rec: 6, dmg: 24, wind: { aF: 60, eF: 110 }, hit: { aF: 85, eF: 5 }, box: { at: 'haF', r: 8 } },
      chp: { st: 7, act: 5, rec: 16, dmg: 66, launch: 13.5, wind: { aB: 30, eB: 120 }, hit: { aB: 168, eB: 0, legs: [18, -20, 2], lean: -8 }, box: { at: 'haB', r: 13 } },
      clk: { st: 4, act: 3, rec: 8, dmg: 26, lvl: 'low', hit: { lF: 82, kF: -2, lean: 4 }, box: { at: 'ftF', r: 9 } },
      chk: { st: 7, act: 5, rec: 18, dmg: 66, lvl: 'low', kd: true, wind: { lean: 20 }, hit: { lF: 88, kF: 0, lean: 28, aF: 100, eF: 0, aB: 150 }, box: { at: 'ftF', r: 11 } },
      jlp: { st: 3, act: 6, rec: 6, dmg: 26, hit: { aF: 78, eF: 0 }, box: { at: 'haF', r: 9 } },
      jhp: { st: 6, act: 6, rec: 10, dmg: 62, lvl: 'high', wind: { aF: 160, eF: 20 }, hit: { aF: 55, eF: 0, lean: 15 }, box: { at: 'haF', r: 12 } },
      jlk: { st: 3, act: 8, rec: 6, dmg: 30, hit: { lF: 80, kF: -40 }, box: { at: 'knF', r: 10 } },
      jhk: { st: 6, act: 8, rec: 10, dmg: 70, lvl: 'high', spike: true, hit: { lF: 62, kF: 0, lB: -10, kB: -70, lean: -12 }, box: { at: 'ftF', r: 12 } },
    },
  },
  brawler: {
    stance: { legs: [13, -15, 4], lean: 6, head: -5, aF: 40, eF: 100, aB: 25, eB: 110 },
    n: {
      lp: { st: 4, act: 3, rec: 7, dmg: 32, wind: { aF: 50, eF: 115 }, hit: { aF: 90, eF: 0, lean: 12 }, box: { at: 'haF', r: 9 } },
      hp: { st: 7, act: 4, rec: 16, dmg: 80, wind: { aB: 30, eB: 130, lean: -4 }, hit: { aB: 93, eB: 0, aF: 20, eF: 100, lean: 22, legs: [22, -14, 6] }, box: { at: 'haB', r: 11 } },
      lk: { st: 5, act: 3, rec: 9, dmg: 35, wind: { lF: 70, kF: -100 }, hit: { lF: 80, kF: -5, lean: -6 }, box: { at: 'ftF', r: 9 } },
      hk: { st: 8, act: 4, rec: 17, dmg: 85, wind: { lB: 50, kB: -110, lean: -8 }, hit: { lB: 110, kB: -6, lean: -22, aF: 50, aB: -30 }, box: { at: 'ftB', r: 12 } },
      clp: { st: 4, act: 3, rec: 7, dmg: 26, hit: { aF: 86, eF: 5 }, box: { at: 'haF', r: 8 } },
      chp: { st: 7, act: 5, rec: 18, dmg: 72, launch: 13.5, wind: { aB: 20, eB: 130 }, hit: { aB: 170, eB: -5, legs: [14, -16, 0], lean: -10 }, box: { at: 'haB', r: 13 } },
      clk: { st: 5, act: 3, rec: 9, dmg: 28, lvl: 'low', hit: { lF: 80, kF: -2, lean: 4 }, box: { at: 'ftF', r: 9 } },
      chk: { st: 8, act: 5, rec: 20, dmg: 70, lvl: 'low', kd: true, hit: { lF: 86, kF: 0, lean: 26, aF: 110, eF: 0 }, box: { at: 'ftF', r: 11 } },
      jlp: { st: 4, act: 6, rec: 6, dmg: 30, hit: { aF: 76, eF: 0 }, box: { at: 'haF', r: 9 } },
      jhp: { st: 7, act: 6, rec: 10, dmg: 68, lvl: 'high', wind: { aF: 165, eF: 30, aB: 160 }, hit: { aF: 50, eF: 0, aB: 40, lean: 18 }, box: { at: 'haF', r: 13 } },
      jlk: { st: 4, act: 8, rec: 6, dmg: 32, hit: { lF: 82, kF: -40 }, box: { at: 'knF', r: 10 } },
      jhk: { st: 7, act: 8, rec: 10, dmg: 75, lvl: 'high', spike: true, hit: { lF: 65, kF: 0, lB: -15, kB: -70, lean: -10 }, box: { at: 'ftF', r: 12 } },
    },
  },
  heavy: {
    stance: { legs: [16, -16, 6], lean: 18, head: 8, aF: 25, eF: 45, aB: 10, eB: 40 },
    n: {
      lp: { st: 5, act: 3, rec: 9, dmg: 40, wind: { aF: 40, eF: 120 }, hit: { aF: 88, eF: 5, lean: 22 }, box: { at: 'haF', r: 12 } },
      hp: { st: 11, act: 5, rec: 20, dmg: 110, armor: true, kd: true, wind: { aF: 175, eF: 20, aB: 170, eB: 20, lean: -15, legs: [16, -16, 0] }, hit: { aF: 70, eF: 5, aB: 65, eB: 5, lean: 35, legs: [20, -14, 14] }, box: { at: 'haF', r: 17 } },
      lk: { st: 6, act: 3, rec: 10, dmg: 42, wind: { lF: 60, kF: -90 }, hit: { lF: 78, kF: -8 }, box: { at: 'ftF', r: 11 } },
      hk: { st: 10, act: 4, rec: 20, dmg: 100, wind: { lF: 70, kF: -100, lean: 5 }, hit: { lF: 95, kF: -5, lean: -10 }, box: { at: 'ftF', r: 14 } },
      clp: { st: 5, act: 3, rec: 9, dmg: 34, hit: { aF: 84, eF: 5 }, box: { at: 'haF', r: 11 } },
      chp: { st: 9, act: 5, rec: 20, dmg: 85, launch: 13, wind: { aF: 20, eF: 120 }, hit: { aF: 170, eF: -5, legs: [16, -16, 0], lean: -10 }, box: { at: 'haF', r: 16 } },
      clk: { st: 6, act: 3, rec: 10, dmg: 36, lvl: 'low', hit: { lF: 78, kF: -4 }, box: { at: 'ftF', r: 11 } },
      chk: { st: 10, act: 5, rec: 22, dmg: 90, lvl: 'low', kd: true, hit: { aF: 80, eF: -5, aB: 70, lean: 45 }, box: { at: 'haF', r: 15, dy: 20 } },
      jlp: { st: 5, act: 6, rec: 7, dmg: 38, hit: { aF: 75, eF: 0 }, box: { at: 'haF', r: 12 } },
      jhp: { st: 9, act: 6, rec: 12, dmg: 90, lvl: 'high', spike: true, wind: { aF: 175, aB: 175, eF: 0, eB: 0 }, hit: { aF: 60, aB: 55, eF: 0, eB: 0, lean: 25 }, box: { at: 'haF', r: 16 } },
      jlk: { st: 5, act: 8, rec: 7, dmg: 40, hit: { lF: 80, kF: -40 }, box: { at: 'knF', r: 13 } },
      jhk: { st: 8, act: 8, rec: 12, dmg: 85, lvl: 'high', hit: { lF: 40, kF: -10, lB: 10, kB: -20, lean: 0 }, box: { at: 'ftF', r: 15 } },
    },
  },
  caster: {
    stance: { legs: [10, -12, 2], lean: 2, head: -3, aF: 60, eF: 40, aB: 35, eB: 30, hF: 'open', hB: 'open' },
    n: {
      lp: { st: 4, act: 3, rec: 7, dmg: 28, wind: { aF: 50, eF: 100 }, hit: { aF: 90, eF: 0, hF: 'palm', lean: 8 }, box: { at: 'haF', r: 10 } },
      hp: { st: 8, act: 6, rec: 16, dmg: 72, energy: true, wind: { aF: 40, eF: 120, aB: 60, eB: 100, lean: -5 }, hit: { aF: 92, eF: 0, aB: 88, eB: 10, hF: 'palm', hB: 'palm', lean: 10 }, box: { at: 'haF', r: 16, dx: 22 } },
      lk: { st: 5, act: 3, rec: 8, dmg: 30, wind: { lF: 70, kF: -100 }, hit: { lF: 84, kF: -5, lean: -6 }, box: { at: 'ftF', r: 9 } },
      hk: { st: 8, act: 5, rec: 16, dmg: 75, energy: true, wind: { lB: 40, kB: -100 }, hit: { lB: 115, kB: -5, lean: -20, aF: 60, aB: -40 }, box: { at: 'ftB', r: 13 } },
      clp: { st: 4, act: 3, rec: 7, dmg: 24, hit: { aF: 82, eF: 5, hF: 'palm' }, box: { at: 'haF', r: 9 } },
      chp: { st: 8, act: 7, rec: 18, dmg: 68, launch: 13.5, energy: true, wind: { aF: 30, eF: 60, aB: 30 }, hit: { aF: 165, eF: 0, aB: 150, eB: 10, hF: 'palm', legs: [10, -12, 0] }, box: { at: 'haF', r: 15, dy: -6 } },
      clk: { st: 5, act: 3, rec: 9, dmg: 26, lvl: 'low', hit: { lF: 82, kF: -2 }, box: { at: 'ftF', r: 9 } },
      chk: { st: 8, act: 5, rec: 20, dmg: 66, lvl: 'low', kd: true, hit: { lF: 88, kF: 0, lean: 25, aF: 120, eF: 0 }, box: { at: 'ftF', r: 11 } },
      jlp: { st: 4, act: 6, rec: 6, dmg: 26, hit: { aF: 80, eF: 0, hF: 'palm' }, box: { at: 'haF', r: 10 } },
      jhp: { st: 7, act: 8, rec: 10, dmg: 64, lvl: 'high', energy: true, hit: { aF: 45, eF: 0, aB: 40, eB: 0, hF: 'palm', hB: 'palm' }, box: { at: 'haF', r: 16, dx: 8 } },
      jlk: { st: 4, act: 8, rec: 6, dmg: 30, hit: { lF: 82, kF: -40 }, box: { at: 'knF', r: 10 } },
      jhk: { st: 7, act: 8, rec: 10, dmg: 70, lvl: 'high', hit: { lF: 62, kF: 0, lB: -10, kB: -70, lean: -10 }, box: { at: 'ftF', r: 12 } },
    },
  },
};

const CROUCH_KEYS = ['clp', 'chp', 'clk', 'chk'];
const AIR_KEYS = ['jlp', 'jhp', 'jlk', 'jhk'];

// deep-ish merge for normals: wind/hit pose objects merge field by field
function mergeNormal(a, b) {
  if (!b) return a;
  const o = { ...a, ...b };
  if (a.wind || b.wind) o.wind = { ...(a.wind || {}), ...(b.wind || {}) };
  if (a.hit || b.hit) o.hit = { ...(a.hit || {}), ...(b.hit || {}) };
  if (b.box) o.box = { ...b.box };
  return o;
}

// legs helper: shift a stance's legs
function L(S, dF = 0, dB = 0, dDrop = 0, liftF = 0, liftB = 0) {
  const [f, b, d] = S.legs;
  return [f + dF, b + dB, d + dDrop, liftF, liftB];
}

// --------------------------------------------------------------- build all animations & moves
export function buildCharacter(def) {
  const B = def.body;
  const arch = ARCH[def.arch];
  const S = { ...arch.stance, ...(def.stance || {}) };
  const Sres = resolvePose(S, null, B);
  const R = (pp, base = Sres) => resolvePose(typeof pp === 'function' ? pp(B, S) : pp, base, B);
  const hipH = hipHeight(B);

  const crouchP = { ...S, legs: L(S, 2, -2, 24), lean: S.lean + 12, aF: S.aF + 8, aB: S.aB + 8, ...(def.crouch || {}) };
  const Cres = R(crouchP);
  const jumpP = { y: -6, lF: 60, kF: -105, lB: 25, kB: -95, aF: S.aF + 30, eF: 60, aB: S.aB + 40, eB: 50, lean: S.lean - 4, legs: undefined, ...(def.jumpPose || {}) };
  delete jumpP.legs;
  const Jres = R(jumpP);
  const fallP = { ...jumpP, lF: 25, kF: -40, lB: -10, kB: -45, aF: S.aF + 50, aB: S.aB + 70 };
  const lieP = { legs: undefined, rot: -90, y: hipH - 12, lF: 5, kF: -5, lB: -5, kB: -10, aF: 160, eF: 10, aB: 150, eB: 10, lean: 0, head: 0, face: 'hurt' };
  delete lieP.legs;

  const A = {}; // animations: { keys:[[f,pose,ease]], len, loop }
  const anim = (name, keys, loop = false) => {
    A[name] = { keys: keys.map(([f, p, e]) => [f, R(p), e]), len: keys[keys.length - 1][0], loop };
  };
  const breath = { ...S, legs: L(S, 0, 0, 2), aF: S.aF + 4, aB: S.aB + 5, lean: S.lean + 2, head: S.head + 2 };
  anim('idle', [[0, S], [26, breath], [52, S]], true);
  const sp = def.stats.walk > 3 ? 1.4 : 1;
  anim('walkF', [
    [0, S],
    [8, { ...S, legs: L(S, 9 * sp, 2, -2, 7, 0), lean: S.lean + 4 }],
    [16, { ...S, legs: L(S, 3, -3, 0) }],
    [24, { ...S, legs: L(S, 0, 8 * sp, -2, 0, 6), lean: S.lean + 2 }],
    [32, S]], true);
  anim('walkB', [
    [0, S],
    [8, { ...S, legs: L(S, 0, -8, -2, 0, 6), lean: S.lean - 4 }],
    [16, { ...S, legs: L(S, -3, -2, 0) }],
    [24, { ...S, legs: L(S, -8, 0, -2, 6, 0), lean: S.lean - 2 }],
    [32, S]], true);
  anim('crouch', [[0, S], [4, crouchP]]);
  anim('cidle', [[0, crouchP], [30, { ...crouchP, legs: L(crouchP, 0, 0, 1), aF: crouchP.aF + 3 }], [60, crouchP]], true);
  anim('jsquat', [[0, S], [4, { ...S, legs: L(S, 0, 0, 12), lean: S.lean + 6 }]]);
  anim('jump', [[0, { ...jumpP, lF: 10, kF: -20, lB: -10, kB: -30 }], [10, jumpP], [26, fallP]]);
  anim('flip', [[0, jumpP], [6, { ...jumpP, rot: 0 }], [30, { ...jumpP, lF: 90, kF: -140, lB: 80, kB: -140, rot: 360 }, 'lin'], [40, fallP]]);
  anim('flipB', [[0, jumpP], [6, { ...jumpP, rot: 0 }], [30, { ...jumpP, lF: 90, kF: -140, lB: 80, kB: -140, rot: -360 }, 'lin'], [40, fallP]]);
  anim('fall', [[0, fallP], [20, { ...fallP, lF: 15, lB: -15 }]]);
  anim('land', [[0, { ...S, legs: L(S, 0, 0, 14), lean: S.lean + 8 }], [6, S]]);
  const runP = { legs: [22, -26, 8, 0, 10], lean: 34, aF: -30, eF: 90, aB: 60, eB: 80, head: -20, ...(def.runPose || {}) };
  anim('dashF', [[0, S], [4, runP], [10, { ...runP, legs: [8, -14, 8, 8, 0], aF: 50, aB: -30 }], [16, S]]);
  anim('dashB', [[0, S], [4, { legs: [4, -30, 6, 6, 0], lean: -14, aF: 60, eF: 100, aB: 40, eB: 100 }], [16, S]]);
  const guard = { ...S, legs: L(S, -1, -5, 4), lean: S.lean - 8, aF: 70, eF: 120, aB: 60, eB: 125, head: S.head + 10, hF: 'fist', hB: 'fist', ...(def.guard || {}) };
  anim('block', [[0, guard], [8, { ...guard, legs: L(guard, 0, 0, 1) }]]);
  anim('cblock', [[0, { ...crouchP, aF: 75, eF: 115, aB: 65, eB: 120, lean: crouchP.lean - 4, hF: 'fist', hB: 'fist' }]]);
  anim('ablock', [[0, { ...jumpP, aF: 75, eF: 115, aB: 65, eB: 120 }]]);
  const hitHi = { ...S, legs: L(S, -2, -6, 4), lean: -18, head: -22, aF: -20, eF: 40, aB: -45, eB: 30, face: 'hurt', hF: 'open', hB: 'open' };
  const hitGut = { ...S, legs: L(S, 2, -4, 10), lean: 34, head: 20, aF: 20, eF: 50, aB: 10, eB: 60, face: 'hurt', hF: 'open' };
  anim('hit', [[0, hitHi], [6, hitHi], [14, S]]);
  anim('hit2', [[0, hitGut], [6, hitGut], [14, S]]);
  anim('chit', [[0, { ...crouchP, lean: 4, head: -20, face: 'hurt' }], [10, crouchP]]);
  const airHit = { y: -4, rot: -25, lean: -20, head: -20, aF: 150, eF: 30, aB: 120, eB: 40, lF: 30, kF: -60, lB: -20, kB: -40, face: 'hurt', hF: 'open', hB: 'open' };
  anim('airhit', [[0, airHit], [18, { ...airHit, rot: -55 }]]);
  anim('tumble', [[0, { ...airHit, rot: 0 }], [24, { ...airHit, rot: -360 }, 'lin']], true);
  anim('kd', [[0, { ...airHit, rot: -60 }], [8, lieP], [10, { ...lieP, y: lieP.y - 3 }], [14, lieP]]);
  anim('lie', [[0, lieP]]);
  anim('getup', [[0, lieP], [8, { ...crouchP, rot: -40, y: 20 }], [16, crouchP], [24, S]]);
  anim('ko', [[0, { ...airHit, rot: -60 }], [8, lieP], [12, { ...lieP, y: lieP.y - 4 }], [18, lieP]]);
  anim('tagin', [[0, { y: -10, lF: 70, kF: -10, lB: -20, kB: -70, aF: -40, eF: 30, aB: -60, eB: 30, lean: -10, rot: 0 }]]);
  anim('tagout', [[0, jumpP], [30, { ...jumpP, rot: -360 }]]);
  anim('throw', [[0, S], [3, { ...S, aF: 85, eF: 10, aB: 80, eB: 20, lean: S.lean + 14, hF: 'open', hB: 'open' }], [12, { ...S, aF: 85, eF: 10, aB: 80, eB: 20, lean: S.lean + 14 }],
    [18, { ...S, aF: 170, eF: 20, aB: 160, eB: 20, lean: -25, legs: L(S, 4, -4, 6) }], [32, S]]);
  anim('throwMiss', [[0, S], [3, { ...S, aF: 85, eF: 10, aB: 80, eB: 20, lean: S.lean + 14, hF: 'open', hB: 'open' }], [20, S]]);
  anim('thrown', [[0, hitHi], [12, { ...hitHi, rot: -30, y: -20 }]]);
  anim('dizzy', [[0, { ...S, lean: -10, head: 20, aF: -10, aB: -15, face: 'hurt' }], [20, { ...S, lean: 10, head: -20, aF: 0, aB: -5, face: 'hurt' }], [40, { ...S, lean: -10, head: 20, aF: -10, aB: -15, face: 'hurt' }]], true);
  const chargeP = { ...S, legs: L(S, 2, -2, 10), lean: S.lean + 10, aF: 30, eF: 100, aB: 20, eB: 110, face: 'shout' };
  anim('charge', [[0, S], [8, chargeP], [16, { ...chargeP, aF: 160, eF: 10, aB: 150, eB: 10, lean: -12, legs: L(S, 2, -2, 0) }], [40, { ...chargeP, aF: 160, eF: 10, aB: 150, eB: 10, lean: -12, legs: L(S, 2, -2, 0) }], [52, S]]);

  // custom character animations: intro, taunt, win, and any extras
  for (const k of ['intro', 'taunt', 'win', ...Object.keys(def.anims || {})]) {
    const src = (def.anims && def.anims[k]) || DEFAULT_SHOW[def.arch][k];
    if (src) anim(k, src(S, crouchP), k === 'win');
  }

  // ---- normals
  const N = {};
  for (const k of Object.keys(arch.n)) {
    const nd = mergeNormal(arch.n[k], def.normals && def.normals[k]);
    N[k] = buildNormal(k, nd, R, S, crouchP, jumpP);
  }
  // throw
  N.throw = {
    id: 'throw', kind: 'throw', len: 32, keys: A.throw.keys, hits: [], ev: [], throwAt: 3, name: 'THROW',
  };

  // ---- specials & hypers
  const ctx = { R, S, crouchP, jumpP, fallP, B, def, hipH, Sres };
  const SP = (def.specials || []).map((s, i) => finishMove(s(ctx), 'special', i));
  const HY = (def.hypers || []).map((s, i) => finishMove(s(ctx), 'hyper', i));

  return { anims: A, normals: N, specials: SP, hypers: HY, stanceRes: Sres };
}

function buildNormal(id, nd, R, S, crouchP, jumpP) {
  const crouch = CROUCH_KEYS.includes(id), air = AIR_KEYS.includes(id);
  const baseP = crouch ? crouchP : air ? { ...jumpP, ...(nd.airBase || {}) } : S;
  const base = R(baseP);
  const wind = R({ ...baseP, ...(nd.wind || {}) }, base);
  const hitp = R({ ...baseP, ...(nd.hit || {}) }, base);
  const { st, act, rec } = nd;
  const len = st + act + rec;
  const keys = [[0, base], [Math.max(1, st - 1), wind, 'out'], [st, hitp, 'lin'], [st + act, hitp], [len, base]];
  const heavy = id.includes('h');
  const hit = {
    a: st, b: st + act, box: nd.box, dmg: nd.dmg,
    stun: nd.stun || (heavy ? 20 : 13), bstun: nd.bstun || (heavy ? 15 : 10),
    push: nd.push ?? (heavy ? 5 : 3), lvl: nd.lvl || (air ? 'high' : crouch && id.endsWith('k') ? 'low' : 'mid'),
    launch: nd.launch, kd: nd.kd, spike: nd.spike, armor: nd.armor,
    hs: heavy ? 9 : 6, sfx: nd.sfx || (heavy ? 'hitH' : 'hitL'), spark: heavy ? 'big' : 'small',
    every: nd.every, glow: nd.glow, energy: nd.energy, fxKind: nd.fxKind, wpn: nd.wpn, sparkColor: nd.sparkColor,
  };
  const mv = {
    id, kind: 'normal', name: id.toUpperCase(), len, keys, hits: [hit], ev: [], air, crouch,
    armor: nd.armor ? [1, st + act] : null, trail: nd.trail, vel: nd.vel || null, whiff: heavy ? 'whooshH' : 'whoosh',
  };
  if (nd.ev) mv.ev = nd.ev;
  return mv;
}

function finishMove(m, kind, idx) {
  m.kind = kind;
  m.idx = idx;
  m.ev = m.ev || [];
  m.hits = m.hits || [];
  m.len = m.len || m.keys[m.keys.length - 1][0];
  if (kind === 'hyper') m.meter = m.meter || 100;
  return m;
}

// --------------------------------------------------------------- default show animations by archetype
const DEFAULT_SHOW = {
  agile: {
    intro: (S) => [[0, { ...S, rot: -360, y: -60 }], [20, { ...S, rot: 0, y: -10 }, 'lin'], [28, { ...S, legs: [18, -20, 22] }], [60, S]],
    taunt: (S) => [[0, S], [10, { legs: [8, -8, 0], lean: -4, aF: 140, eF: 20, aB: -20, eB: 20, hF: 'point' }], [50, { legs: [8, -8, 0], lean: -4, aF: 150, eF: 10, aB: -20, eB: 20, hF: 'point' }], [60, S]],
    win: (S) => [[0, S], [14, { legs: [6, -6, 0], lean: -6, aF: 160, eF: 10, aB: 20, eB: 120, hF: 'point' }], [40, { legs: [6, -6, 0], lean: -6, aF: 165, eF: 5, aB: 20, eB: 120, hF: 'point' }]],
  },
  brawler: {
    intro: (S) => [[0, { legs: [6, -6, 0], lean: 0, aF: 10, eF: 10, aB: -10, eB: 10 }], [30, { legs: [6, -6, 0], lean: 0, aF: 30, eF: 120, aB: 20, eB: 120 }], [50, S]],
    taunt: (S) => [[0, S], [10, { legs: [8, -10, 0], lean: -6, aF: 60, eF: 120, aB: 30, eB: 130, head: -10, hF: 'open' }], [20, { legs: [8, -10, 0], lean: -6, aF: 60, eF: 140, aB: 30, eB: 130, head: -10, hF: 'open' }], [30, { legs: [8, -10, 0], lean: -6, aF: 60, eF: 110, aB: 30, eB: 130, head: -10, hF: 'open' }], [40, { legs: [8, -10, 0], lean: -6, aF: 60, eF: 140, aB: 30, eB: 130, head: -10, hF: 'open' }], [55, S]],
    win: (S) => [[0, S], [16, { legs: [8, -8, 0], lean: -8, aF: 170, eF: 0, aB: -10, eB: 30, head: -14 }], [40, { legs: [8, -8, 0], lean: -8, aF: 172, eF: 0, aB: -10, eB: 30, head: -14 }]],
  },
  heavy: {
    intro: (S) => [[0, { ...S, legs: [16, -16, 20], lean: 40, aF: 0, aB: 0 }], [20, { legs: [16, -16, 0], lean: -15, aF: 150, eF: 40, aB: 140, eB: 40, face: 'shout' }], [44, { legs: [16, -16, 0], lean: -15, aF: 150, eF: 40, aB: 140, eB: 40, face: 'shout' }], [60, S]],
    taunt: (S) => [[0, S], [12, { legs: [16, -16, 10], lean: 30, aF: 60, eF: 100, aB: 60, eB: 100, face: 'shout' }], [24, { legs: [16, -16, 12], lean: 34, aF: 30, eF: 60, aB: 30, eB: 60, face: 'shout' }], [36, { legs: [16, -16, 10], lean: 30, aF: 60, eF: 100, aB: 60, eB: 100, face: 'shout' }], [56, S]],
    win: (S) => [[0, S], [16, { legs: [16, -16, 0], lean: -10, aF: 140, eF: 60, aB: 130, eB: 70, face: 'shout' }], [40, { legs: [16, -16, 2], lean: -12, aF: 145, eF: 60, aB: 135, eB: 70, face: 'shout' }]],
  },
  caster: {
    intro: (S) => [[0, { ...S, y: -40, aF: 120, eF: 20, aB: 110, eB: 20 }], [30, { ...S, y: -10, aF: 140, eF: 10, aB: 130, eB: 10 }], [50, S]],
    taunt: (S) => [[0, S], [12, { ...S, aF: 100, eF: 60, aB: 100, eB: 60, lean: -4, hF: 'open', hB: 'open' }], [44, { ...S, aF: 110, eF: 50, aB: 105, eB: 50, lean: -4, hF: 'open', hB: 'open' }], [56, S]],
    win: (S) => [[0, S], [16, { legs: [8, -8, 0], aF: 130, eF: 30, aB: 120, eB: 30, lean: -6, hF: 'open', hB: 'open' }], [40, { legs: [8, -8, 0], aF: 135, eF: 30, aB: 125, eB: 30, lean: -6, hF: 'open', hB: 'open' }]],
  },
};

// --------------------------------------------------------------- special-move templates
// Each returns a spec object consumed by the fighter runtime. `ctx.R` resolves poses for that body.
// Poses may be partial objects (merged over the stance).
const sk = (c, p) => c.R(typeof p === 'function' ? p(c.S) : { ...c.S, ...p });
const air = (c, p) => c.R({ ...c.jumpP, ...p });

export const T = {
  // fires a projectile. o.p is the projectile spec (see fx.js Projectile)
  proj: (o) => (c) => {
    const at = o.fireAt || 12;
    const base = o.air ? air : sk;
    const keys = [[0, base(c, {})], [at - 4, base(c, o.wind || {}), 'out'], [at, base(c, o.fire || {}), 'lin'], [at + (o.hold || 8), base(c, o.fire || {})], [o.len || at + 22, base(c, {})]];
    const count = o.count || 1;
    const ev = [];
    for (let i = 0; i < count; i++) ev.push([at + i * (o.interval || 6), (f, G) => G.spawnProj(f, { ...o.p, from: o.from || 'haF', idx: i, n: count })]);
    if (o.sfx) ev.unshift([at, (f, G) => G.sfx(o.sfx)]);
    if (o.ev) ev.push(...o.ev);
    return { name: o.name, keys, ev, air: !!o.air, airOk: o.airOk, hits: o.hits || [], vel: o.vel, inv: o.inv, len: o.len || at + 22, cmd: o.cmd };
  },
  // continuous beam from a body point
  beam: (o) => (c) => {
    const st = o.start || 14, dur = o.dur || 30;
    const len = st + dur + (o.rec || 16);
    const base = o.air ? air : sk;
    const keys = [[0, base(c, {})], [st - 4, base(c, o.wind || {}), 'out'], [st, base(c, o.fire || {})], [st + dur, base(c, o.fire2 || o.fire || {})], [len, base(c, {})]];
    const ev = [[st, (f, G) => { G.sfx(o.sfx || 'beam'); G.startBeam(f, { ...o.b, dur, from: o.from || 'haF' }); }]];
    if (o.ev) ev.push(...o.ev);
    return { name: o.name, keys, ev, air: !!o.air, airOk: o.airOk, len, grav: o.air ? false : undefined, cmd: o.cmd, meter: o.meter, inv: o.inv };
  },
  // dashing multi-hit strike
  rush: (o) => (c) => {
    const st = o.start || 8, dur = o.dur || 18, len = st + dur + (o.rec || 14);
    const gp = o.go || {};
    const keys = [[0, sk(c, {})], [st - 2, sk(c, o.wind || {}), 'out']];
    if (o.frames) { // alternating attack poses during the rush
      const n = o.frames.length;
      for (let i = 0; i <= Math.floor(dur / 4); i++) keys.push([st + i * 4, sk(c, o.frames[i % n]), 'snap']);
    } else keys.push([st, sk(c, gp), 'lin'], [st + dur, sk(c, gp)]);
    keys.push([len, sk(c, {})]);
    keys.sort((a, b) => a[0] - b[0]);
    const hits = [{ a: st, b: st + dur, box: o.box || { at: 'haF', r: 16 }, dmg: o.dmg || 22, every: o.every || 5, stun: 18, bstun: 12, push: 0.5, lvl: 'mid', hs: 4, sfx: o.sfx || 'hitM', spark: o.spark || 'small', chip: true, keepVel: true, glow: o.glow, energy: o.energy },
      ...(o.finisher ? [{ a: st + dur - 3, b: st + dur, box: o.box || { at: 'haF', r: 18 }, dmg: o.finisher, stun: 24, bstun: 14, push: 6, kd: o.kd, launch: o.launch, hs: 10, sfx: 'hitH', spark: 'big', chip: true }] : [])];
    return { name: o.name, keys, hits, vel: [[st, o.speed || 7, 0], [st + dur, 0, 0]], len, ev: o.ev || [], trail: o.trail, inv: o.inv, armor: o.armor, cmd: o.cmd };
  },
  // rising anti-air (dragon punch style)
  upper: (o) => (c) => {
    const st = o.start || 4, rise = o.rise || 22, len = st + rise + 20;
    const keys = [[0, sk(c, {})], [st, sk(c, o.wind || { legs: [14, -16, 16], aB: 20, eB: 120, lean: 20 }), 'out'],
      [st + 4, c.R({ ...c.jumpP, ...(o.up || {}) })], [st + rise, c.R({ ...c.jumpP, ...(o.up || {}), rot: o.spin ? (o.spin) : 0 }), 'lin'], [len, c.R(c.fallP)]];
    const hits = [{ a: st, b: st + rise - 4, box: o.box || { at: 'haF', r: 16 }, dmg: o.dmg || 30, every: o.every || 5, stun: 22, bstun: 14, push: 1, launch: o.launch || 9, hs: 6, sfx: o.sfx || 'hitM', spark: 'big', chip: true, glow: o.glow, energy: o.energy }];
    return { name: o.name, keys, hits, vel: [[st, o.vx || 2.5, o.vy || -12.5]], grav: true, air: true, fromGround: true, inv: o.inv || [1, st + 6], len: 200, trail: o.trail, ev: o.ev || [], cmd: o.cmd, airOk: o.airOk };
  },
  // something bursts out of the ground (at the opponent or in front)
  erupt: (o) => (c) => {
    const at = o.castAt || 14, len = at + (o.rec || 26);
    const keys = [[0, sk(c, {})], [at - 5, sk(c, o.wind || {}), 'out'], [at, sk(c, o.cast || {})], [len - 6, sk(c, o.cast || {})], [len, sk(c, {})]];
    const ev = [[at, (f, G) => { if (o.sfx) G.sfx(o.sfx); G.erupt(f, o.e); }]];
    if (o.ev) ev.push(...o.ev);
    return { name: o.name, keys, ev, len, cmd: o.cmd, inv: o.inv };
  },
  teleport: (o) => (c) => {
    const len = o.len || 34;
    const keys = [[0, sk(c, {})], [8, sk(c, o.wind || { legs: [6, -6, 8], aF: 120, aB: 110 })], [16, sk(c, o.vanish || { legs: [6, -6, 0], aF: 160, aB: 150 })], [24, sk(c, o.appear || {})], [len, sk(c, {})]];
    const ev = [[12, (f, G) => G.teleport(f, o.to || 'behind', o.fx || 'smoke', o.color)]];
    return { name: o.name, keys, ev, len, inv: [10, 22], hidden: [12, 20], cmd: o.cmd };
  },
  // command grab: whiffs unless the opponent is in range and grounded
  grab: (o) => (c) => {
    const len = o.len || 60;
    const reach = sk(c, o.reach || { aF: 90, eF: 5, aB: 85, eB: 10, lean: c.S.lean + 18, hF: 'open', hB: 'open' });
    const keys = [[0, sk(c, {})], [6, reach], [14, reach], [24, sk(c, {})]];
    const hold = (o.hold || []).map(([f2, p]) => [f2, sk(c, p)]);
    return {
      name: o.name, keys, holdKeys: [[0, reach], ...hold, [len, sk(c, {})]], len: 24, holdLen: len, grabAt: [6, 12], range: o.range || 50,
      onGrab: o.onGrab, grabDmg: o.dmg || 140, grabHits: o.hits || 4, grabFx: o.fx || 'hit', toss: o.toss ?? 8, cmd: o.cmd,
    };
  },
  // tether that yanks the opponent in (web zip, lasso, chain, grapple)
  pull: (o) => (c) => {
    const at = o.fireAt || 10;
    const keys = [[0, sk(c, {})], [at - 4, sk(c, o.wind || {}), 'out'], [at, sk(c, o.fire || {})], [at + 22, sk(c, o.fire || {})], [at + 34, sk(c, {})]];
    const ev = [[at, (f, G) => { G.sfx(o.sfx || 'web'); G.spawnProj(f, { kind: 'tether', look: o.look || 'web', vx: 11, life: 24, w: 14, h: 10, dmg: o.dmg || 40, pull: true, stun: 40, from: 'haF', tether: true, hits: 1, color: o.color }); }]];
    return { name: o.name, keys, ev, len: at + 34, airOk: o.airOk, cmd: o.cmd };
  },
  // leap into the air and crash down with a shockwave
  slam: (o) => (c) => {
    const keys = [[0, sk(c, {})], [6, sk(c, { legs: [16, -16, 18], lean: 30, aF: 0, aB: 0 })], [10, c.R({ ...c.jumpP, aF: 170, aB: 165, eF: 10, eB: 10 })], [30, c.R({ ...c.jumpP, aF: 170, aB: 165, eF: 10, eB: 10, ...(o.top || {}) })], [44, c.R({ ...c.jumpP, aF: 60, aB: 55, eF: 0, eB: 0, lean: 30, ...(o.down || {}) })]];
    const hits = [{ a: 30, b: 200, box: o.box || { at: 'haF', r: 20 }, dmg: o.dmg || 90, stun: 24, bstun: 16, push: 4, lvl: 'high', kd: true, hs: 12, sfx: 'hitH', spark: 'big', chip: true }];
    return {
      name: o.name, keys, hits, vel: [[8, o.vx || 4.5, o.vy || -13]], grav: true, air: true, fromGround: true, len: 300, cmd: o.cmd,
      onLand: (f, G) => { G.sfx('boom'); G.shake(10); G.spawnProj(f, { kind: 'wave', look: o.wave || 'rock', vx: 7, w: 30, h: 22, dmg: o.waveDmg || 50, ground: true, life: 50, kd: true, both: o.both }); if (o.both) G.spawnProj(f, { kind: 'wave', look: o.wave || 'rock', vx: -7, w: 30, h: 22, dmg: o.waveDmg || 50, ground: true, life: 50, kd: true }); },
      landRec: 18,
    };
  },
  // hitbox around the body (sphere / dome) — anti-air
  burst: (o) => (c) => {
    const at = o.at || 8, dur = o.dur || 18, len = at + dur + (o.rec || 16);
    const keys = [[0, sk(c, {})], [at - 3, sk(c, o.wind || { legs: [10, -12, 10], aF: 30, aB: 20, eF: 100, eB: 100 })], [at, sk(c, o.pose || { aF: 150, eF: 10, aB: 140, eB: 10, hF: 'open', hB: 'open' })], [at + dur, sk(c, o.pose || {})], [len, sk(c, {})]];
    const hits = [{ a: at, b: at + dur, box: { x: 0, y: -60, r: o.r || 50 }, dmg: o.dmg || 20, every: 5, stun: 20, bstun: 12, push: 4, launch: o.launch || 8, hs: 4, sfx: o.sfx || 'zap', spark: 'small', chip: true, noRehitAir: false }];
    const ev = [[at, (f, G) => { G.sfx(o.sfx || 'zap'); G.aura(f, { kind: o.kind || 'sphere', color: o.color || '#fff', r: o.r || 50, dur, y: -60 }); }]];
    return { name: o.name, keys, hits, ev, len, inv: o.inv || [1, at + 4], airOk: o.airOk, cmd: o.cmd };
  },
  counter: (o) => (c) => {
    const len = 50;
    const p = sk(c, o.pose || { legs: [10, -14, 8], aF: 100, eF: 80, aB: 80, eB: 100, hF: 'open', hB: 'open', lean: -4 });
    return { name: o.name, keys: [[0, sk(c, {})], [4, p], [40, p], [len, sk(c, {})]], len, counter: [4, 32], counterMove: o.then, cmd: o.cmd };
  },
  buff: (o) => (c) => {
    const len = o.len || 60;
    const p = sk(c, o.pose || { legs: [12, -12, 10], lean: -10, aF: 20, eF: 120, aB: 20, eB: 120, face: 'shout' });
    const ev = [[10, (f, G) => { G.sfx(o.sfx || 'heal'); G.buff(f, o.b); }]];
    return { name: o.name, keys: [[0, sk(c, {})], [10, p], [len - 10, p], [len, sk(c, {})]], len, ev, armor: o.armor ? [1, len] : null, cmd: o.cmd, meter: o.meter };
  },
  // angled dash attack, works in the air too
  dive: (o) => (c) => {
    const st = o.start || 8, dur = o.dur || 22;
    const p = c.R({ ...c.jumpP, ...(o.pose || { lean: 40, aF: 90, eF: 0, aB: 70, eB: 10, lF: 10, kF: -20, lB: -20, kB: -30 }) });
    const keys = [[0, c.R({ ...c.jumpP, ...(o.wind || {}) })], [st, p, 'out'], [st + dur, p]];
    if (o.spin) keys.push([st + dur, { ...p, rot: o.spin }]);
    const hits = [{ a: st, b: st + dur, box: o.box || { at: 'haF', r: 15 }, dmg: o.dmg || 25, every: o.every || 6, stun: 20, bstun: 12, push: 3, hs: 5, sfx: o.sfx || 'hitM', spark: 'small', chip: true, kd: o.kd, launch: o.launch, glow: o.glow, energy: o.energy }];
    return {
      name: o.name, keys, hits, vel: [[0, 0, -2], [st, o.vx || 9, o.vy ?? 0], [st + dur, 1, 0]], grav: false, air: true, airOk: true, fromGround: true,
      len: st + dur + (o.rec || 16), trail: o.trail, ev: o.ev || [], cmd: o.cmd, endFall: true,
    };
  },
  // reflector shield
  shield: (o) => (c) => {
    const p = sk(c, o.pose || { aF: 92, eF: 10, aB: 80, eB: 40, hF: 'open', lean: -4 });
    const len = 40;
    return {
      name: o.name, keys: [[0, sk(c, {})], [5, p], [30, p], [len, sk(c, {})]], len, reflect: [5, 30], cmd: o.cmd,
      hits: [{ a: 6, b: 26, box: { at: 'haF', r: 24 }, dmg: 15, every: 6, stun: 16, bstun: 10, push: 7, hs: 3, sfx: 'magic', spark: 'small', chip: true }],
      ev: [[5, (f, G) => { G.sfx('magic'); G.aura(f, { kind: o.kind || 'mandala', color: o.color || '#ff9a1a', r: 26, dur: 25, at: 'haF' }); }]],
    };
  },

  // ---------------- hypers
  hyperBeam: (o) => (c) => T.beam({ start: 12, dur: 70, rec: 20, sfx: 'beam', ...o, b: { w: 46, len: 700, dmg: 22, every: 4, ...o.b, hyper: true } })(c),
  // dash; on contact play a cinematic flurry
  hyperRush: (o) => (c) => {
    const st = o.start || 6;
    const keys = [[0, sk(c, {})], [st, sk(c, o.go || { legs: [24, -26, 10], lean: 30, aF: 90, eF: 0, aB: -40, eB: 30 }), 'out'], [st + 30, sk(c, o.go || {})], [st + 44, sk(c, {})]];
    const frames = (o.frames || [{ aF: 90, eF: 0, lean: 20 }, { aB: 92, eB: 0, aF: 20, lean: 26 }, { lF: 95, kF: 0, lean: -15 }]).map((p) => sk(c, p));
    return {
      name: o.name, keys, len: st + 44, vel: [[st, o.speed || 10, 0], [st + 30, 0, 0]], inv: [1, st + 10],
      hits: [{ a: st, b: st + 30, box: o.box || { at: 'haF', r: 20 }, dmg: 30, stun: 60, bstun: 16, push: 1, hs: 8, sfx: 'hitH', spark: 'big', chip: true, cine: true }],
      cine: { frames, n: o.n || 12, gap: o.gap || 5, dmg: o.dmg || 26, fin: o.fin || 120, fx: o.fx || 'slash', color: o.color || '#fff', finPose: o.finPose ? sk(c, o.finPose) : frames[0], finFx: o.finFx, sfx: o.sfx || 'hitM', blink: o.blink },
      trail: true, cmd: o.cmd,
    };
  },
  // a sequence of strikes raining across the screen
  hyperRain: (o) => (c) => {
    const at = o.castAt || 14, len = at + (o.dur || 70) + 20;
    const keys = [[0, sk(c, {})], [at - 6, sk(c, o.wind || {}), 'out'], [at, sk(c, o.cast || { aF: 165, eF: 0, aB: 160, eB: 0, hF: 'open', hB: 'open', lean: -10 })], [len - 14, sk(c, o.cast || {})], [len, sk(c, {})]];
    const ev = [];
    const n = o.n || 10;
    for (let i = 0; i < n; i++) ev.push([at + Math.floor(i * (o.dur || 70) / n), (f, G) => G.erupt(f, { ...o.e, idx: i, n, hyper: true })]);
    ev.push([at, (f, G) => G.sfx(o.sfx || 'thunder')]);
    if (o.ev) ev.push(...o.ev);
    return { name: o.name, keys, ev, len, inv: [1, at + 4], cmd: o.cmd };
  },
  // something huge crosses the screen
  hyperVehicle: (o) => (c) => {
    const at = o.castAt || 16, len = at + (o.rec || 40);
    const keys = [[0, sk(c, {})], [at - 6, sk(c, o.wind || {}), 'out'], [at, sk(c, o.cast || { aF: 100, eF: 0, hF: 'point' })], [len - 10, sk(c, o.cast || {})], [len, sk(c, {})]];
    const ev = [[at, (f, G) => { G.sfx(o.sfx || 'boom'); G.spawnProj(f, { ...o.p, hyper: true, from: o.from || 'hip' }); }]];
    if (o.ev) ev.push(...o.ev);
    return { name: o.name, keys, ev, len, inv: [1, at + 8], hidden: o.ride ? [at, len - 6] : null, cmd: o.cmd };
  },
  hyperGiant: (o) => (c) => T.erupt({ castAt: 16, rec: 50, ...o, e: { ...o.e, hyper: true } })(c),
};

// map the four special slots to inputs
export const SPECIAL_INPUTS = [
  { motion: [2, 3, 6], btn: 'p', alt: 5, label: 'D,DF,F + P', simple: 'SP' },
  { motion: [2, 1, 4], btn: 'p', alt: 4, label: 'D,DB,B + P', simple: 'B + SP' },
  { motion: [6, 2, 3], btn: 'p', alt: 8, label: 'F,D,DF + P', simple: 'U + SP' },
  { motion: [2, 3, 6], btn: 'k', alt: 2, label: 'D,DF,F + K', simple: 'D + SP' },
];
export const HYPER_INPUTS = [
  { motion: [2, 3, 6], label: 'D,DF,F + LP+HP', simple: 'HYPER' },
  { motion: [2, 1, 4], label: 'D,DB,B + LP+HP', simple: 'B + HYPER' },
];

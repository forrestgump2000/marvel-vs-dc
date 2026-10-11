// CPU opponent: drives a virtual pad. Blocks, spaces, combos, anti-airs, zones, tags and calls assists.
import { rand, pick } from './util.js';

const LEVELS = [
  { react: 20, block: 0.25, aggro: 0.35, combo: 0.3, aa: 0.2 },
  { react: 11, block: 0.55, aggro: 0.55, combo: 0.6, aa: 0.5 },
  { react: 5, block: 0.82, aggro: 0.7, combo: 0.9, aa: 0.8 },
];

export class AI {
  constructor(G, team, level = 1, dummy = false) {
    this.G = G; this.team = team; this.L = LEVELS[level] || LEVELS[1]; this.dummy = dummy;
    this.plan = []; this.wait = 0; this.held = {};
    team.pad.cpu = this;
    this.blockHold = 0;
  }
  think() {
    const pad = this.team.pad;
    const G = this.G;
    const v = {};
    pad.virt = v;
    if (this.dummy || G.phase !== 'fight') return;
    const f = this.team.members[this.team.cur];
    const o = G.opp(f);
    if (!f || !o || !f.onField) return;
    const toward = o.x > f.x ? 'right' : 'left';
    const away = toward === 'right' ? 'left' : 'right';
    const dist = Math.abs(o.x - f.x);
    const L = this.L;

    // ---------- defense: hold block while threatened
    const threat = G.threatening(o, f) && (o.state === 'move' || G.projs.some((p) => p.team !== this.team.side && Math.abs(p.x - f.x) < 160) || G.beams.length);
    if (threat && (f.neutral || f.state === 'air' || f.state === 'blockstun' || f.state === 'cblockstun')) {
      if (this.blockHold > 0 || rand() < L.block) {
        this.blockHold = 12;
        v[away] = true;
        const low = o.move && (o.move.crouch || (o.move.hits[0] && o.move.hits[0].lvl === 'low'));
        if (low && !(o.move && o.move.air)) v.down = true;
        this.plan = [];
        return;
      }
    }
    if (this.blockHold > 0) { this.blockHold--; v[away] = true; return; }

    // ---------- execute queued plan
    if (this.plan.length) {
      const step = this.plan[0];
      if (step.dir) for (const d of step.dir.split('+')) v[d === 'fwd' ? toward : d === 'back' ? away : d] = true;
      if (step.btn && !step.done) { v[step.btn] = true; step.done = true; }
      if (--step.n <= 0) this.plan.shift();
      return;
    }
    if (this.wait > 0) { this.wait--; this.holdMove(v, toward, away, dist, f); return; }
    this.wait = L.react + Math.floor(rand(0, L.react));

    const zoner = f.def.ai === 'zone' || f.def.arch === 'caster';
    const meter = this.team.meter;
    const partner = this.team.members[1 - this.team.cur];
    const partnerOK = partner && partner.alive && !partner.onField;

    // ---------- connect hit? continue combo
    if (f.state === 'move' && f.connected) {
      if (meter >= 100 && rand() < L.combo * 0.5) { this.push({ btn: 'hy', n: 2 }); return; }
      if (rand() < L.combo) this.push({ btn: 'sp', n: 2 });
      return;
    }
    if (!f.neutral && f.state !== 'air') return;

    // ---------- air: attack on the way down
    if (f.state === 'air') {
      if (dist < 90 && rand() < L.aggro) this.push({ btn: pick(['hk', 'hp', 'lk']), n: 3 });
      return;
    }
    // ---------- anti-air
    if (o.airborne && dist < 120 && o.vy > -4 && rand() < L.aa) {
      if (f.B.specials[2] && rand() < 0.6) this.push({ dir: 'up', btn: 'sp', n: 2 });
      else this.push({ dir: 'down', btn: 'hp', n: 2 });
      return;
    }
    // ---------- tag out when hurt
    if (partnerOK && f.hp < f.maxHp * 0.3 && partner.hp > partner.maxHp * 0.5 && rand() < 0.08) { this.push({ btn: 'tg', n: 2 }); return; }
    // ---------- hyper when in range
    if (meter >= 100 && dist < 160 && rand() < 0.12 * L.aggro) {
      if (partnerOK && meter >= 200 && rand() < 0.3) this.push({ btn: 'hy', n: 2, dir: 'tg' });
      else this.push({ btn: 'hy', n: 2, dir: f.B.hypers[1] && rand() < 0.4 ? 'back' : '' });
      return;
    }
    // ---------- assists
    if (partnerOK && this.team.assistCD <= 0 && dist > 90 && rand() < 0.07) { this.push({ btn: 'as', n: 2 }); return; }

    // ---------- close range offense
    if (dist < 75 + f.pushW()) {
      const r = rand();
      if (r < 0.12) { this.push({ dir: 'fwd', btn: 'hp', n: 2 }); return; } // throw
      if (r < 0.12 + L.combo * 0.6) {
        // combo string: light > heavy > launcher or special
        const ender = rand() < 0.5 ? [{ dir: 'down', btn: 'hp', n: 10 }, { dir: 'up', n: 3 }, { n: 8 }, { btn: 'lk', n: 8 }, { btn: 'hp', n: 8 }, { btn: 'hk', n: 4 }] : [{ btn: 'sp', n: 3 }];
        this.push({ btn: rand() < 0.5 ? 'lp' : 'lk', n: 6, dir: rand() < 0.4 ? 'down' : '' }, { btn: 'hp', n: 9 }, ...ender);
        return;
      }
      if (r < 0.7) { this.push({ btn: pick(['lp', 'lk', 'hp', 'hk']), n: 6, dir: rand() < 0.35 ? 'down' : '' }); return; }
      if (r < 0.8) { this.push({ dir: 'back', n: 12 }); return; }
      this.push({ dir: 'up+fwd', n: 2 });
      return;
    }
    // ---------- mid/long range
    if (zoner) {
      if (dist < 180 && rand() < 0.4) { this.push({ dir: 'back', n: 14 }); return; }
      if (rand() < 0.55) { this.push({ btn: 'sp', n: 3 }); return; }
      if (rand() < 0.3) { this.push({ dir: 'down', btn: 'sp', n: 3 }); return; }
    } else {
      if (rand() < 0.25) { this.push({ btn: 'sp', n: 3, dir: rand() < 0.5 ? '' : 'down' }); return; }
      if (rand() < 0.25 * L.aggro) { this.push({ dir: 'up+fwd', n: 2 }); return; }
      if (rand() < 0.3) { this.push({ dir: 'fwd', n: 1 }, { n: 1 }, { dir: 'fwd', n: 1 }); return; } // dash in
    }
  }
  holdMove(v, toward, away, dist, f) {
    const zoner = f.def.ai === 'zone' || f.def.arch === 'caster';
    if (zoner) { if (dist < 200) v[away] = true; else if (dist > 320) v[toward] = true; }
    else if (dist > 70) v[toward] = true;
  }
  push(...steps) { this.plan.push(...steps.map((s) => ({ ...s }))); }
}

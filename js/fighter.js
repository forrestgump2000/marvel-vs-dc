// Fighter runtime: state machine, physics, move playback and pose blending.
import { clamp, lerp, sign } from './util.js';
import { sampleKeys, lerpPose, skeleton, SpriteBuffer, hipHeight } from './rig.js';

export const GRAV = 0.6;
const NEUTRAL = new Set(['idle', 'walkF', 'walkB', 'crouch', 'land', 'block', 'cblock']);

export class Fighter {
  constructor(def, built, team, slot) {
    this.def = def;
    this.B = built;
    this.team = team;
    this.slot = slot;
    this.sc = 1.2 * (def.scale || 1);
    this.maxHp = def.stats.hp || 1000;
    this.hp = this.maxHp;
    this.red = this.hp;
    this.buf = new SpriteBuffer();
    this.uid = Math.random();
    this.reset();
  }
  reset() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onField = false;
    this.state = 'idle'; this.t = 0;
    this.anim = 'idle'; this.animT = 0; this.animClock = 0;
    this.move = null; this.mt = 0;
    this.pose = this.B.anims.idle.keys[0][1];
    this.prevPose = null; this.blend = 0;
    this.stun = 0; this.juggle = 0; this.airJumps = 0; this.airActs = 0;
    this.hitLog = new Map();
    this.connected = false;
    this.capeSw = 0;
    this.flash = 0; this.flashColor = null;
    this.buffs = {};
    this.inv = 0;
    this.ko = this.hp <= 0;
    this.trail = [];
    this.afterimg = [];
    this.kdFlag = false;
    this.grabbed = null;
  }
  get alive() { return this.hp > 0; }
  get grounded() { return this.y >= 0; }
  get neutral() { return NEUTRAL.has(this.state) && !(this.state === 'land' && this.t < 3); }

  setAnim(name, keepT = false) {
    if (this.anim === name && keepT) return;
    if (this.anim !== name) { this.prevPose = this.pose; this.blend = 4; }
    this.anim = name;
    this.animT = 0;
  }
  setState(s, anim) {
    this.state = s;
    this.t = 0;
    if (anim) this.setAnim(anim);
  }
  startMove(m) {
    this.move = m;
    this.mt = -1;
    this.hitLog.clear();
    this.connected = false;
    this.prevPose = this.pose; this.blend = 2;
    this.state = 'move';
    this.t = 0;
    this.moveAir = !this.grounded || !!m.air;
    if (m.kind === 'normal' && m.air) this.airActs++;
  }

  // local -> world helpers
  wx(lx) { return this.x + lx * this.facing * this.sc; }
  wy(ly) { return this.y + ly * this.sc; }
  point(name) {
    const sk = this.sk || this.skel();
    const p = sk[name] || sk.hip;
    return [this.wx(p[0]), this.wy(p[1])];
  }
  skel() { this.sk = skeleton(this.pose, this.def.body); return this.sk; }

  hurtbox() {
    const sk = this.sk || this.skel();
    const b = this.def.body;
    const xs = [sk.hip[0], sk.neck[0], sk.head[0]];
    const x0 = Math.min(...xs) - b.wS, x1 = Math.max(...xs) + b.wS;
    const y0 = Math.min(sk.head[1], sk.neck[1], sk.hip[1]) - b.headR;
    const y1 = Math.max(sk.ftF[1], sk.ftB[1], sk.hip[1] + 6);
    const ax = this.wx(x0), bx = this.wx(x1);
    return { x: Math.min(ax, bx), y: this.wy(y0), w: Math.abs(bx - ax), h: (y1 - y0) * this.sc };
  }
  pushW() { return this.def.body.wS * 1.15 * this.sc; }

  // ---------------------------------------------------------------- animation
  updatePose() {
    let pose;
    if (this.state === 'move' && this.move) {
      const keys = this.grabbed && this.move.holdKeys ? this.move.holdKeys : this.cineKeys || this.move.keys;
      pose = sampleKeys(keys, this.grabbed ? this.grabT : this.mt);
    } else {
      const A = this.B.anims[this.anim] || this.B.anims.idle;
      let t = this.animT;
      if (A.loop) t = t % A.len;
      pose = sampleKeys(A.keys, t);
    }
    if (this.blend > 0 && this.prevPose) {
      pose = lerpPose(this.prevPose, pose, 1 - this.blend / 5);
      this.blend--;
    }
    this.pose = pose;
    this.skel();
  }

  physics(G) {
    const m = this.move;
    const usesGrav = !this.grounded || (this.state === 'move' && m && m.air && this.vy !== 0);
    if (this.state === 'move' && m && m.grav === false) {
      // move controls its own velocity
    } else if (usesGrav || this.vy < 0) {
      let g = GRAV;
      if (this.def.stats.float && this.state === 'air' && this.vy > 0 && this.ctrlHeld && this.ctrlHeld('up')) g *= 0.3;
      if (this.state === 'airhit' || this.state === 'kdfall') g *= 0.9;
      this.vy += g;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.y >= 0) {
      const wasAir = this.airborne;
      this.y = 0;
      if (this.vy > 0) this.vy = 0;
      this.airborne = false;
      if (wasAir) this.onLand(G);
    } else this.airborne = true;
    // friction on ground
    if (!this.airborne && !(this.state === 'move' && m && (m.vel || m.keepVel))) {
      if (['hit', 'block', 'cblock', 'chit', 'land', 'idle', 'crouch', 'kd', 'lie', 'getup', 'throwfx'].includes(this.state)) this.vx *= 0.82;
    }
    // cape / hair swing follows velocity
    const target = clamp(-this.vx * this.facing * 7 + (this.airborne ? (this.vy < 0 ? 18 : -10) : 0), -30, 75);
    this.capeSw = lerp(this.capeSw, target, 0.12);
    this.animClock++;
  }

  onLand(G) {
    const s = this.state;
    if (s === 'air' || s === 'jump') { this.setState('land', 'land'); this.vx = 0; G.sfx('land'); G.dust(this.x, 2); }
    else if (s === 'move' && this.move) {
      const m = this.move;
      if (m.fromGround && this.mt < 4) return;
      if (m.onLand) m.onLand(this, G);
      this.move = null;
      this.vx = 0;
      this.setState('land', 'land');
      this.t = -(m.landRec || 0);
      G.dust(this.x, 3);
    } else if (s === 'airhit' || s === 'kdfall' || s === 'thrown') {
      if (this.hp <= 0) { this.setState('ko', 'ko'); this.vx *= 0.3; G.shake(5); G.dust(this.x, 6); G.sfx('land'); return; }
      if (this.kdFlag || s !== 'airhit' || this.juggle > 0) {
        this.setState('kd', 'kd'); this.vx *= 0.4; G.dust(this.x, 5); G.sfx('land'); G.shake(3);
      } else { this.setState('land', 'land'); }
      this.kdFlag = false;
    } else if (s === 'tagin') {
      this.setState('land', 'land'); this.vx = 0; G.dust(this.x, 5); G.shake(4); G.sfx('land');
    } else if (s === 'ko') { this.vx *= 0.3; }
    else if (s === 'ablock') { this.setState('idle', 'idle'); }
  }
}

export function isAttacking(f) { return f.state === 'move' && f.move; }
export function activeHits(f) {
  if (f.state !== 'move' || !f.move) return [];
  const out = [];
  f.move.hits.forEach((h, i) => { if (f.mt >= h.a && f.mt < h.b) out.push([h, i]); });
  return out;
}
export function rehitOK(f, idx, target, h) {
  const key = idx + ':' + target.uid;
  const last = f.hitLog.get(key);
  if (last == null) return true;
  if (h.every && f.mt - last >= h.every) return true;
  return false;
}
export { hipHeight, sign };

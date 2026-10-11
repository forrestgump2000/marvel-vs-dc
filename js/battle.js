// The 2-vs-2 battle: input handling, hit resolution, projectiles, tags, assists, hypers,
// crossover combos, camera, HUD, and round flow.
import { W, H, GROUND, clamp, lerp, sign, rand, pick, text, DEG } from './util.js';
import { Fighter, GRAV, activeHits, rehitOK } from './fighter.js';
import { SPR_OX, SPR_OY } from './rig.js';
import { sfx as playSfx, say } from './audio.js';
import { FX, drawProj } from './fx.js';
import { AI } from './ai.js';

const STAGE_W = 1100;

export class Battle {
  constructor(opts) {
    // opts: { teams:[{defs:[d,d], built:[b,b], pad, cpu, level}], stage, training, onEnd, portraits }
    this.opts = opts;
    this.stage = opts.stage;
    this.training = !!opts.training;
    this.portraits = opts.portraits || {};
    this.fx = new FX();
    this.projs = [];
    this.beams = [];
    this.auras = [];
    this.hitstop = 0;
    this.superFreeze = 0; this.superUser = null; this.cutins = [];
    this.shakeAmt = 0;
    this.flashA = 0; this.flashC = '#fff';
    this.frame = 0;
    this.timer = 99 * 60;
    this.phase = 'intro'; this.phaseT = 0;
    this.camX = STAGE_W / 2; this.camY = 0;
    this.slow = 0;
    this.banner = null;
    this.teams = opts.teams.map((t, side) => {
      const team = { side, meter: this.training ? 300 : 0, combo: 0, comboT: 0, comboDmg: 0, assistCD: 0, pad: t.pad, cur: 0, members: [], name: side ? 'P2' : 'P1', cpu: t.cpu, popT: 0 };
      team.members = t.defs.map((d, i) => new Fighter(d, t.built[i], team, i));
      team.ai = t.cpu ? new AI(this, team, t.level ?? 1, this.training && side === 1) : null;
      return team;
    });
    // place actives
    this.teams.forEach((team, side) => {
      const f = team.members[0];
      f.onField = true;
      f.x = STAGE_W / 2 + (side ? 110 : -110);
      f.facing = side ? -1 : 1;
      f.setState('intro', 'intro');
      team.members.forEach((m) => { m.facing = side ? -1 : 1; });
    });
    this.teams.forEach((t) => t.members.forEach((m) => { m.updatePose(); }));
    playSfx('confirm');
  }

  // ---------------------------------------------------------------- helpers
  active(side) { const t = this.teams[side]; return t.members[t.cur]; }
  partner(team) { return team.members[1 - team.cur]; }
  oppTeam(f) { return this.teams[1 - f.team.side]; }
  opp(f) { return this.active(1 - f.team.side); }
  onField(side) { return this.teams[side].members.filter((m) => m.onField); }
  sfx(n) { playSfx(n); }
  shake(n) { this.shakeAmt = Math.max(this.shakeAmt, n); }
  flash(c, a = 0.6) { this.flashC = c; this.flashA = a; }
  dust(x, n) { this.fx.dust(x, 0, n); }

  get camL() { return this.camX - W / 2; }
  get camR() { return this.camX + W / 2; }

  // ---------------------------------------------------------------- main update
  update() {
    this.frame++;
    this.phaseT++;
    for (const team of this.teams) {
      if (team.ai) team.ai.think();
      team.pad.update();
    }
    if (this.slow > 0) { this.slow--; if (this.slow % 3) { this.fx.update(); return; } }
    if (this.superFreeze > 0) {
      this.superFreeze--;
      this.cutins.forEach((c) => c.t++);
      this.fx.update();
      if (this.superUser) { this.superUser.updatePose(); }
      return;
    }
    this.cutins = this.cutins.filter((c) => c.t < 80);
    this.cutins.forEach((c) => c.t++);
    if (this.hitstop > 0) { this.hitstop--; this.fx.update(); this.shakeAmt *= 0.85; return; }

    if (this.phase === 'intro') {
      if (this.phaseT === 40) { this.banner = { txt: 'READY?', t: 0 }; say('Ready?'); }
      if (this.phaseT === 110) { this.banner = { txt: 'FIGHT!', t: 0, big: true }; say('Fight!', { pitch: 0.4 }); this.sfx('hyper'); }
      if (this.phaseT === 130) { this.phase = 'fight'; this.teams.forEach((t) => { const f = t.members[t.cur]; f.setState('idle', 'idle'); }); }
    }

    if (this.phase === 'fight' && !this.training) {
      if (this.timer > 0) this.timer--;
      if (this.timer === 0) this.timeUp();
    }

    for (const team of this.teams) {
      if (team.assistCD > 0) team.assistCD--;
      if (team.comboT > 0 && --team.comboT === 0) { team.combo = 0; team.comboDmg = 0; }
      if (team.popT > 0) team.popT--;
      // off-field partners recover red health
      team.members.forEach((m) => {
        if (!m.onField && m.alive && m.hp < m.red) m.hp = Math.min(m.red, m.hp + 0.35);
        if (this.training && m.onField && m.state !== 'hit' && m.state !== 'airhit' && m.hp < m.maxHp && team.comboT === 0) m.hp = Math.min(m.maxHp, m.hp + 6);
      });
      if (this.training) team.meter = 300;
    }

    // controllers
    for (const team of this.teams) for (const f of team.members) if (f.onField) this.stepFighter(f);
    // physics + poses
    for (const team of this.teams) for (const f of team.members) if (f.onField) { f.physics(this); this.updateAnimCounters(f); f.updatePose(); }
    this.resolveHits();
    this.updateProjectiles();
    this.updateBeams();
    this.separate();
    this.updateCamera();
    this.auras = this.auras.filter((a) => ++a.t < a.dur);
    this.fx.update();
    if (this.banner) { this.banner.t++; if (this.banner.t > 70) this.banner = null; }
    this.shakeAmt *= 0.85;
    if (this.flashA > 0) this.flashA -= 0.05;
    this.checkFlow();
  }

  updateAnimCounters(f) {
    f.animT++;
    if (f.state === 'move') {
      if (!f.cine) f.mt++;
      if (f.grabbed) f.grabT++;
    }
    for (const k in f.buffs) { const b = f.buffs[k]; if (b.t > 0) { b.t--; if (b.regen && f.hp < f.maxHp) { f.hp = Math.min(f.maxHp, f.hp + b.regen); f.red = Math.max(f.red, f.hp); } } else delete f.buffs[k]; }
    if (f.flash > 0) f.flash--;
    if (f.inv > 0) f.inv--;
    if (f.frozen > 0) f.frozen--;
    if (f.webbed > 0) f.webbed--;
    if (f.burn > 0) { f.burn--; if (f.burn % 20 === 0 && f.hp > 1) { f.hp -= 6; this.fx.flame(f.x, f.y - 60, 4, f.burnColor || '#ff7a1a'); } }
    if (f.poison > 0) { f.poison--; if (f.poison % 20 === 0 && f.hp > 1) { f.hp -= 5; this.fx.puff(f.x, f.y - 60, '#9be23a'); } }
  }

  // ---------------------------------------------------------------- per-fighter control + state machine
  stepFighter(f) {
    const team = f.team, pad = team.pad;
    const opp = this.opp(f);
    f.t++;
    f.ctrlHeld = (b) => pad.held(b);
    const controlled = team.members[team.cur] === f && this.phase === 'fight';
    if (controlled) pad.record(f.facing);
    const faceOpp = () => { if (opp && Math.abs(opp.x - f.x) > 4) f.facing = sign(opp.x - f.x); };

    // dizzy-like statuses
    if (f.frozen > 0 && ['hit', 'airhit', 'chit'].includes(f.state)) { f.stun = Math.max(f.stun, 2); }

    switch (f.state) {
      case 'intro':
        if (f.anim !== 'intro') f.setAnim('intro');
        return;
      case 'idle': case 'walkF': case 'walkB': case 'crouch': case 'block': case 'cblock': case 'land': {
        if (f.state === 'land' && f.t < 4) { if (f.t === 3) f.setAnim('idle'); return; }
        if (!controlled) { if (f.state !== 'idle') f.setState('idle', 'idle'); f.vx = 0; faceOpp(); return; }
        faceOpp();
        if (this.tryActions(f, pad, opp)) return;
        const d = pad.dirNum(f.facing);
        const blocking = (d === 4 || d === 1) && opp && this.threatening(opp, f);
        if (d >= 7) { // jump
          f.superJump = pad.motion([2, 8], 10) || pad.motion([2, 7], 10) || pad.motion([2, 9], 10);
          f.jumpDir = d === 9 ? 1 : d === 7 ? -1 : 0;
          f.setState('jsquat', 'jsquat');
          return;
        }
        if (pad.motion([6, 5, 6], 10) && f.state !== 'crouch') { this.dash(f, 1); return; }
        if (pad.motion([4, 5, 4], 10) && f.state !== 'crouch') { this.dash(f, -1); return; }
        if (d <= 3) {
          if (blocking) { if (f.state !== 'cblock') f.setState('cblock', 'cblock'); }
          else if (f.state !== 'crouch') { f.setState('crouch', 'crouch'); }
          else if (f.t === 5) f.setAnim('cidle');
          f.vx = 0;
          return;
        }
        if (blocking) { if (f.state !== 'block') f.setState('block', 'block'); f.vx = 0; return; }
        if (d === 6) { if (f.state !== 'walkF') f.setState('walkF', 'walkF'); f.vx = f.facing * f.def.stats.walk * this.speedMul(f); }
        else if (d === 4) { if (f.state !== 'walkB') f.setState('walkB', 'walkB'); f.vx = -f.facing * (f.def.stats.back || f.def.stats.walk * 0.8) * this.speedMul(f); }
        else { if (f.state !== 'idle') f.setState('idle', 'idle'); f.vx = 0; }
        return;
      }
      case 'jsquat':
        if (f.t >= 4) {
          const st = f.def.stats;
          f.vy = -(st.jump || 11.5) * (f.superJump ? 1.3 : 1);
          f.vx = f.jumpDir * (st.jumpX || 3.4) * f.facing * (f.superJump ? 1.25 : 1);
          f.airborne = true; f.y = -1;
          f.airJumps = 0; f.airActs = 0;
          f.setState('air', f.jumpDir === 1 && st.flip !== false ? 'flip' : f.jumpDir === -1 && st.flip !== false ? 'flipB' : 'jump');
          this.sfx('jump');
        }
        return;
      case 'air': {
        if (!controlled) return;
        if (this.tryActions(f, pad, opp)) return;
        const d = pad.dirNum(f.facing);
        // double jump
        if (pad.pressed('up') && f.def.stats.double && f.airJumps < 1 && f.t > 6) {
          f.airJumps++; f.vy = -(f.def.stats.jump || 11.5) * 0.9; f.vx = (d === 9 ? 3 : d === 7 ? -3 : 0) * f.facing;
          f.setState('air', 'jump'); this.sfx('jump'); this.fx.ring(f.x, f.y, '#fff');
        }
        // air dash (flyers + some agile)
        if (f.def.stats.airdash && f.airJumps < 2 && (pad.motion([6, 5, 6], 10) || pad.motion([4, 5, 4], 10))) {
          const dirn = pad.motion([6, 5, 6], 10) ? 1 : -1;
          f.airJumps = 2; f.vx = dirn * f.facing * 8; f.vy = -1.5; f.setAnim('dashF'); pad.clearMotion(); this.sfx('whoosh');
        }
        // blocking in air
        const back = d === 4 || d === 7 || d === 1;
        if (back && opp && this.threatening(opp, f)) { if (f.anim !== 'ablock') f.setAnim('ablock'); }
        else if (f.anim === 'ablock') f.setAnim('fall');
        return;
      }
      case 'dash': {
        const dur = f.dashDir > 0 ? 16 : 14;
        if (f.dashDir > 0 && controlled && f.t > 6 && this.tryActions(f, pad, opp)) return;
        f.vx = f.dashDir * f.facing * (f.def.stats.dash || 6.5) * (1 - f.t / (dur + 4)) * this.speedMul(f);
        if (f.t >= dur) { f.setState('idle', 'idle'); f.vx = 0; }
        return;
      }
      case 'move': this.runMove(f, controlled, pad, opp); return;
      case 'hit': case 'chit':
        if (--f.stun <= 0) { f.setState(f.state === 'chit' ? 'crouch' : 'idle', f.state === 'chit' ? 'cidle' : 'idle'); }
        return;
      case 'blockstun': case 'cblockstun':
        if (--f.stun <= 0) f.setState('idle', 'idle');
        return;
      case 'airhit':
        f.stun--;
        if (f.t === 14 && f.anim === 'airhit' && f.vy < 0 && f.kdFlag) f.setAnim('tumble');
        return;
      case 'kd':
        if (f.t > 14) f.setState('lie', 'lie');
        return;
      case 'lie':
        if (f.t > 24) { f.setState('getup', 'getup'); f.inv = 30; f.juggle = 0; }
        return;
      case 'getup':
        f.inv = Math.max(f.inv, 2);
        if (f.t > 24) { f.setState('idle', 'idle'); f.inv = 6; }
        return;
      case 'thrown': case 'grabbed': case 'cine':
        return;
      case 'ko':
        if (f.anim !== 'ko' && !f.airborne) f.setAnim('ko');
        return;
      case 'tagout':
        f.inv = 5;
        if (f.t > 50 || (f.y < -200 && (f.x < this.camL - 60 || f.x > this.camR + 60))) { f.onField = false; f.setState('idle', 'idle'); f.vx = f.vy = 0; }
        return;
      case 'tagin':
        f.inv = 2;
        return;
      case 'assistIn':
        if (!f.airborne && f.t > 2) {
          const m = f.B.specials[f.def.assist || 0];
          faceOpp();
          f.startMove(m); f.isAssist = true;
        }
        return;
      case 'win':
        return;
      case 'taunt':
        if (f.t > 60) f.setState('idle', 'idle');
        return;
      default:
        return;
    }
  }

  speedMul(f) { return f.buffs.rage ? 1.35 : f.buffs.speed ? 1.5 : 1; }

  threatening(opp, f) {
    if (!opp) return false;
    const d = Math.abs(opp.x - f.x);
    if (opp.state === 'move' && d < 230) return true;
    return this.projs.some((p) => p.team !== f.team.side && !p.harmless && Math.abs(p.x - f.x) < 200) || this.beams.some((b) => b.team !== f.team.side);
  }

  dash(f, dir) {
    f.dashDir = dir;
    f.setState('dash', dir > 0 ? 'dashF' : 'dashB');
    if (dir < 0) f.inv = 6;
    this.sfx('whoosh');
    this.fx.dust(f.x - dir * f.facing * 10, 0, 3);
    f.team.pad.clearMotion();
  }

  // returns true if an action started
  tryActions(f, pad, opp, cancel = null) {
    const team = f.team;
    const P = (b) => pad.pressed(b);
    const d = pad.dirNum(f.facing);
    const ground = !f.airborne;
    const partner = this.partner(team);
    const partnerOK = partner && partner.alive && !partner.onField;

    // hyper / crossover
    const both = (P('lp') && pad.held('hp')) || (P('hp') && pad.held('lp'));
    const qcb = pad.motion([2, 1, 4]);
    if ((P('hy') || (both && (pad.motion([2, 3, 6]) || qcb))) && team.meter >= 100) {
      if (!cancel || cancel === 'special' || cancel === 'normal') {
        const idx = ((d === 4 || d === 1 || d === 7 || (both && qcb)) && f.B.hypers[1]) ? 1 : 0;
        const m = f.B.hypers[idx];
        if (m && (ground || m.airOk)) {
          if (pad.held('tg') && team.meter >= 200 && partnerOK && ground) this.crossover(f, partner, m);
          else this.doHyper(f, m);
          pad.clearMotion();
          return true;
        }
      }
    }
    if (cancel === 'hyper') return false;
    // specials
    let si = -1;
    if (P('sp')) si = (d === 4 || d === 7) ? 1 : (d === 8 || d === 9) ? 2 : (d <= 3) ? 3 : 0;
    else if (P('lp') || P('hp')) { if (pad.motion([6, 2, 3])) si = 2; else if (pad.motion([2, 3, 6])) si = 0; else if (qcb) si = 1; }
    else if (P('lk') || P('hk')) { if (pad.motion([2, 3, 6])) si = 3; else if (qcb) si = 1; else if (pad.motion([6, 2, 3])) si = 2; }
    if (si >= 0) {
      const m = f.B.specials[si];
      if (m && (ground ? true : m.airOk)) {
        if (!(cancel === 'special' && f.move && f.move.kind === 'special')) {
          pad.clearMotion();
          f.startMove(m);
          this.sfx('energy');
          return true;
        }
      }
    }
    if (cancel === 'special') return false;
    // throw
    if (!cancel && ground && P('hp') && (d === 6 || d === 4) && opp && Math.abs(opp.x - f.x) < 50 + opp.pushW() && !opp.airborne &&
      ['idle', 'walkF', 'walkB', 'crouch', 'block', 'land', 'dash'].includes(opp.state) && opp.inv <= 0) {
      if (d === 4) f.facing = -f.facing;
      f.startMove(f.B.normals.throw);
      this.grabTarget(f, opp, 'throw');
      return true;
    }
    // normals
    const order = ['hk', 'hp', 'lk', 'lp'];
    const btn = order.find((b) => P(b));
    if (btn) {
      const key = (ground ? (d <= 3 ? 'c' : '') : 'j') + btn;
      const m = f.B.normals[key];
      if (!m) return false;
      if (!ground && f.airActs >= 4) return false;
      if (cancel === 'normal') {
        const rank = { lp: 0, lk: 1, hp: 2, hk: 3 };
        const cur = f.move.id.replace(/^[cj]/, '');
        if (rank[btn] <= rank[cur] && !(f.move.id.startsWith('c') !== key.startsWith('c') && rank[btn] === rank[cur])) return false;
        if (key.startsWith('j') !== f.move.id.startsWith('j')) return false;
      }
      f.startMove(m);
      return true;
    }
    if (cancel) return false;
    if (!ground) return false;
    // tag / assist / taunt
    if (P('tg') && partnerOK && this.phase === 'fight') { this.tag(team); return true; }
    if (P('as') && partnerOK && team.assistCD <= 0 && this.phase === 'fight') { this.callAssist(team); return false; }
    if (P('ta')) { f.setState('taunt', 'taunt'); this.sfx('cursor'); if (f.def.quotes) this.fx.text(f.x, f.y - 160, pick(f.def.quotes.taunt || ['!']), '#fff'); team.meter = Math.min(300, team.meter + 10); return true; }
    return false;
  }

  doHyper(f, m) {
    f.team.meter -= m.meter || 100;
    f.vx = 0;
    f.startMove(m);
    this.superFreeze = 34;
    this.superUser = f;
    this.cutins.push({ f, t: 0, side: f.team.side, name: m.name });
    this.sfx('hyper');
    this.flash('#fff', 0.5);
    this.fx.superFlash(f.x, f.y - 70, f.def.color);
    if (f.def.quotes && f.def.quotes.hyper) say(pick(f.def.quotes.hyper), { pitch: 0.8, rate: 1.1 });
  }

  crossover(f, p, m) {
    f.team.meter -= 200;
    this.doHyper(f, m);
    f.team.meter += m.meter || 100; // doHyper took one bar; crossover costs two total
    f.team.meter -= 100;
    p.onField = true;
    p.facing = f.facing;
    p.x = clamp(f.x - f.facing * 70, this.camL + 30, this.camR - 30);
    p.y = 0; p.vx = p.vy = 0;
    p.startMove(p.B.hypers[0]);
    p.isAssist = true;
    this.cutins.push({ f: p, t: -10, side: f.team.side, name: p.B.hypers[0].name });
    this.banner = { txt: 'CROSSOVER!', t: 0 };
  }

  tag(team) {
    const out = team.members[team.cur];
    const inn = this.partner(team);
    out.setState('tagout', 'tagout');
    out.move = null;
    out.vy = -13; out.vx = -out.facing * 5; out.y = Math.min(out.y, -1);
    team.cur = 1 - team.cur;
    this.enterFighter(inn, out, true);
    this.sfx('tag');
    team.pad.clearMotion();
  }

  enterFighter(inn, ref, attack) {
    const opp = this.opp(inn) || ref;
    const side = ref.facing; // enter from behind the outgoing fighter
    inn.onField = true;
    inn.facing = side;
    inn.x = side > 0 ? this.camL - 20 : this.camR + 20;
    inn.y = -230;
    inn.vx = side * 7.5;
    inn.vy = 5;
    inn.setState('tagin', 'tagin');
    inn.move = null;
    if (attack) {
      inn.move = null;
      inn.tagHit = { a: 0, b: 999, box: { at: 'ftF', r: 16 }, dmg: 50, stun: 20, bstun: 12, push: 4, kd: true, lvl: 'high', hs: 8, sfx: 'hitM', spark: 'big' };
    } else inn.tagHit = null;
    void opp;
  }

  callAssist(team) {
    const a = this.partner(team);
    const f = team.members[team.cur];
    a.onField = true;
    a.facing = f.facing;
    a.x = clamp(f.x - f.facing * 60, this.camL + 20, this.camR - 20);
    a.y = -150; a.vx = f.facing * 1.5; a.vy = 4;
    a.setState('assistIn', 'fall');
    a.isAssist = true;
    team.assistCD = 300;
    this.sfx('tag');
    this.fx.text(a.x, a.y - 30, 'ASSIST!', '#ffe14a');
  }

  // ---------------------------------------------------------------- moves
  runMove(f, controlled, pad, opp) {
    const m = f.move;
    if (!m) { f.setState('idle', 'idle'); return; }
    if (f.cine) { this.runCine(f); return; }
    const t = f.mt;
    // grab (command grab / throw) hold sequence
    if (f.grabbed) { this.runGrab(f); return; }
    // events
    for (const [ef, fn] of m.ev) if (ef === t) fn(f, this);
    // velocity script
    if (m.vel) for (const [vf, vx, vy] of m.vel) if (vf === t) { f.vx = vx * f.facing * this.speedMul(f); if (vy !== 0 || m.grav === false) f.vy = vy; if (vy < 0) { f.airborne = true; f.y = Math.min(f.y, -1); } }
    if (m.vel && m.grav === false && t > 0) { /* keep */ }
    // whiff sound at first active frame
    if (m.hits.length && t === m.hits[0].a && m.whiff) this.sfx(m.whiff);
    // command grab window
    if (m.grabAt && t >= m.grabAt[0] && t <= m.grabAt[1] && opp && !f.grabbed) {
      const reach = m.range * f.sc * 0.9 + opp.pushW();
      if (Math.abs(opp.x - f.x) < reach && Math.sign(opp.x - f.x) === f.facing && !opp.airborne && opp.inv <= 0 && !['tagout', 'ko', 'lie', 'getup'].includes(opp.state)) {
        this.grabTarget(f, opp, 'special');
        return;
      }
    }
    if (m.throwAt && t === m.throwAt && !f.grabbed) { /* throw already resolved at start */ }
    // trails for flashy moves
    if (m.trail || (m.hits[0] && m.hits[0].glow)) {
      const hs = activeHits(f);
      if (hs.length) { const p = this.boxPoint(f, hs[0][0].box); f.trail.push([p[0], p[1], 10]); }
    }
    // cancels
    if (controlled && f.connected && !f.isAssist) {
      if (m.kind === 'normal') {
        if (m.id === 'chp' && (pad.held('up')) && t > m.hits[0].a) { // launcher jump-cancel
          f.move = null; f.superJump = true; f.jumpDir = 1;
          f.setState('jsquat', 'jsquat'); f.t = 3; return;
        }
        if (this.tryActions(f, pad, opp, 'normal') || this.tryActions(f, pad, opp, 'special')) return;
      } else if (m.kind === 'special') {
        if (this.tryActions(f, pad, opp, 'hyper')) return;
      }
    }
    // end
    if (t >= m.len || (m.endFall && t >= m.len)) {
      f.move = null;
      if (f.isAssist) { f.isAssist = false; this.exitAssist(f); return; }
      if (f.airborne) { f.setState('air', 'fall'); }
      else f.setState('idle', 'idle');
      f.vx = m.vel ? 0 : f.vx;
    }
  }

  exitAssist(f) {
    f.setState('tagout', 'tagout');
    f.vy = -12; f.vx = -f.facing * 5; f.y = Math.min(f.y, -1);
    f.isAssist = false;
  }

  grabTarget(f, opp, type) {
    f.grabbed = opp; f.grabT = 0; f.grabType = type;
    opp.setState(type === 'throw' ? 'thrown' : 'grabbed', 'thrown');
    opp.move = null; opp.vx = opp.vy = 0;
    opp.facing = -f.facing;
    this.sfx('throw');
  }
  runGrab(f) {
    const m = f.move, opp = f.grabbed, t = f.grabT;
    const hand = f.point('haF');
    opp.x = lerp(opp.x, hand[0] + f.facing * 6, 0.5);
    if (f.grabType === 'throw') {
      if (t < 14) { opp.y = 0; }
      if (t === 16) {
        opp.y = -10;
        this.landHitRaw(f, opp, { dmg: 90, kd: true, launchV: -8, pushV: 6 * f.facing, sfx: 'throw', spark: 'big' });
        f.grabbed = null; f.mt = 18; f.move = { ...m, keys: m.keys, hits: [], ev: [], len: 32 };
      }
      return;
    }
    // command grab sequence with hits spread over the hold
    const len = m.holdLen;
    const every = Math.floor((len - 14) / m.grabHits);
    if (t > 4 && t % every === 0 && t < len - 8) {
      const dmg = m.grabDmg / (m.grabHits + 1);
      this.landHitRaw(f, opp, { dmg, stun: 30, small: true, sfx: 'hitM', spark: m.grabFx });
      if (m.onGrab) m.onGrab(f, opp, this, t);
    }
    if (t >= len - 8) {
      this.landHitRaw(f, opp, { dmg: m.grabDmg / (m.grabHits + 1), kd: true, launchV: -7, pushV: m.toss * f.facing, sfx: 'hitH', spark: 'big' });
      f.grabbed = null; f.move = null;
      f.setState('idle', 'idle');
    }
  }

  // straightforward unblockable hit (throws, grabs, cinematic)
  landHitRaw(att, tgt, o) {
    const team = att.team;
    const scale = Math.max(0.35, 1 - team.combo * 0.06);
    const dmg = o.dmg * scale * (att.def.stats.power || 1) * (att.buffs.rage ? 1.25 : 1);
    this.damage(tgt, dmg);
    team.combo++; team.comboT = 60; team.comboDmg += dmg; team.popT = 10;
    team.meter = Math.min(300, team.meter + dmg * 0.5);
    tgt.team.meter = Math.min(300, tgt.team.meter + dmg * 0.25);
    tgt.flash = 4;
    const [px, py] = [tgt.x, tgt.y - 60 * tgt.sc];
    this.fx.spark(px, py, o.spark || 'big', att.def.color, att.facing);
    this.sfx(o.sfx || 'hitM');
    this.hitstop = o.small ? 3 : 10;
    if (!o.small) this.shake(7);
    if (o.kd) {
      tgt.setState('airhit', 'airhit'); tgt.kdFlag = true;
      tgt.vy = o.launchV ?? -7; tgt.vx = o.pushV ?? att.facing * 4;
      tgt.y = Math.min(tgt.y, -1); tgt.airborne = true; tgt.stun = 60;
    } else if (o.stun) {
      tgt.stun = o.stun;
    }
    if (tgt.hp <= 0) this.koFighter(tgt, att);
  }

  damage(tgt, dmg) {
    const before = tgt.hp;
    tgt.hp = Math.max(0, tgt.hp - dmg);
    tgt.red = Math.max(tgt.hp, Math.min(before, tgt.red) - dmg * 0.5);
    tgt.dmgFlash = 20;
    if (this.training && tgt.hp <= 0) tgt.hp = 1;
  }

  runCine(f) {
    const c = f.cine, sp = c.spec, tgt = c.tgt;
    c.t++;
    tgt.vx = tgt.vy = 0;
    if (c.t % sp.gap === 0 && c.i < sp.n) {
      c.i++;
      const side = sp.blink ? (c.i % 2 ? 1 : -1) : -1;
      if (sp.blink) {
        f.x = tgt.x - side * tgt.facing * 46;
        f.facing = sign(tgt.x - f.x) || f.facing;
        this.fx.afterimage(f);
      }
      f.cineKeys = [[0, sp.frames[c.i % sp.frames.length]]];
      f.prevPose = f.pose; f.blend = 2;
      const px = tgt.x + rand(-12, 12), py = tgt.y - 60 + rand(-25, 20);
      this.fx.spark(px, py, sp.fx, sp.color, f.facing);
      this.sfx(sp.sfx);
      this.damage(tgt, sp.dmg * (f.def.stats.power || 1));
      f.team.combo++; f.team.comboT = 60; f.team.popT = 10;
      tgt.flash = 3;
      this.hitstop = 2;
      this.shake(3);
      if (tgt.hp <= 0 && !this.training) { c.i = sp.n; }
    }
    if (c.i >= sp.n && c.t % sp.gap === sp.gap - 1) {
      // finisher
      f.cineKeys = [[0, sp.finPose]];
      f.prevPose = f.pose; f.blend = 2;
      f.cine = null;
      f.cineKeys = null;
      f.move = { ...f.move, hits: [], ev: [], vel: null, len: f.mt + 24, keys: [[0, sp.finPose], [24, f.B.stanceRes]] };
      f.mt = 0;
      tgt.state = 'hit';
      this.landHitRaw(f, tgt, { dmg: sp.fin, kd: true, launchV: -10, pushV: f.facing * 6, sfx: 'boom', spark: 'huge' });
      if (sp.finFx) this.fx.spark(tgt.x, tgt.y - 60, sp.finFx, sp.color, f.facing);
      this.flash(sp.color, 0.7);
      this.shake(14);
    }
  }

  // ---------------------------------------------------------------- hits
  boxPoint(f, box) {
    if (box.at) {
      const sk = f.sk;
      const p = sk[box.at] || sk.hip;
      return [f.wx(p[0] + (box.dx || 0)), f.wy(p[1] + (box.dy || 0))];
    }
    return [f.wx(box.x || 0), f.wy(box.y || -60)];
  }

  resolveHits() {
    const all = [];
    for (const team of this.teams) for (const f of team.members) if (f.onField) all.push(f);
    for (const att of all) {
      let hs = activeHits(att);
      if (att.state === 'tagin' && att.tagHit) hs = [[att.tagHit, 99]];
      if (!hs.length) continue;
      for (const tgt of all) {
        if (tgt.team === att.team || !this.hittable(tgt)) continue;
        const hb = tgt.hurtbox();
        for (const [h, idx] of hs) {
          if (!rehitOK(att, idx, tgt, h)) continue;
          const [px, py] = this.boxPoint(att, h.box);
          const r = (h.box.r || 12) * att.sc;
          const cx = clamp(px, hb.x, hb.x + hb.w), cy = clamp(py, hb.y, hb.y + hb.h);
          if ((px - cx) ** 2 + (py - cy) ** 2 > r * r) continue;
          att.hitLog.set(idx + ':' + tgt.uid, att.mt);
          this.applyHit(att, tgt, h, (px + cx) / 2, (py + cy) / 2, att);
          if (att.state === 'tagin') att.tagHit = null;
          break;
        }
      }
    }
  }

  hittable(t) {
    if (!t.onField || t.inv > 0) return false;
    if (['tagout', 'lie', 'getup', 'ko', 'intro', 'thrown', 'grabbed', 'win'].includes(t.state)) return false;
    if (t.state === 'cine') return false;
    if (t.state === 'move' && t.move) {
      const m = t.move;
      if (m.inv && t.mt >= m.inv[0] && t.mt <= m.inv[1]) return false;
      if (m.hidden && t.mt >= m.hidden[0] && t.mt <= m.hidden[1]) return false;
    }
    if (t.state === 'airhit' && t.juggle > 14) return false;
    return true;
  }

  canBlock(tgt, h, fromX) {
    if (h.unblockable) return false;
    const ok = ['idle', 'walkF', 'walkB', 'crouch', 'block', 'cblock', 'blockstun', 'cblockstun', 'land', 'air'].includes(tgt.state) ||
      (tgt.state === 'dash' && tgt.dashDir < 0);
    if (!ok) return false;
    if (tgt.state === 'land' && tgt.t < 2) return false;
    const pad = tgt.team.pad;
    const toward = sign(fromX - tgt.x) || tgt.facing;
    const d = pad.dirNum(toward);
    if (!(d === 4 || d === 1 || d === 7)) return false;
    if (tgt.airborne) return true;
    if (h.lvl === 'low' && d !== 1) return false;
    if (h.lvl === 'high' && d === 1) return false;
    return true;
  }

  applyHit(att, tgt, h, px, py, src, isProj = false) {
    // counters
    if (!isProj && tgt.state === 'move' && tgt.move && tgt.move.counter && tgt.mt >= tgt.move.counter[0] && tgt.mt <= tgt.move.counter[1]) {
      this.doCounter(tgt, att);
      return 'counter';
    }
    // super armor absorbs
    if (tgt.state === 'move' && tgt.move && tgt.move.armor && tgt.mt >= tgt.move.armor[0] && tgt.mt <= tgt.move.armor[1] && !h.cine) {
      this.damage(tgt, h.dmg * 0.5);
      tgt.flash = 6; tgt.armorFlash = 8;
      this.hitstop = 5;
      this.fx.spark(px, py, 'small', '#ff4040', att.facing);
      this.sfx('block');
      return 'armor';
    }
    if (tgt.buffs.armor) { h = { ...h, stun: 0 }; }
    const team = att.team;
    const fromX = src.x;
    const dirTo = sign(tgt.x - fromX) || att.facing;
    if (this.canBlock(tgt, h, fromX)) {
      const crouchB = tgt.team.pad.dirNum(sign(fromX - tgt.x) || 1) === 1 && !tgt.airborne;
      if (tgt.airborne) { tgt.setAnim('ablock'); tgt.state = 'air'; tgt.vx = dirTo * 2; }
      else { tgt.setState(crouchB ? 'cblockstun' : 'blockstun', crouchB ? 'cblock' : 'block'); tgt.stun = h.bstun || 10; tgt.vx = dirTo * (h.push || 3) * 0.9; }
      if (h.chip || isProj || (att.move && att.move.kind !== 'normal')) this.damage(tgt, h.dmg * 0.15);
      this.fx.spark(px, py, 'block', '#9fd8ff', -dirTo);
      this.sfx('block');
      this.hitstop = Math.max(this.hitstop, 4);
      team.meter = Math.min(300, team.meter + h.dmg * 0.15);
      tgt.team.meter = Math.min(300, tgt.team.meter + h.dmg * 0.15);
      if (!isProj) att.connected = true;
      // push attacker back if target is cornered
      if (!isProj && (tgt.x <= this.camL + 30 || tgt.x >= this.camR - 30)) att.vx = -dirTo * (h.push || 3) * 0.7;
      return 'block';
    }
    // hit
    const scale = Math.max(0.3, 1 - team.combo * 0.07);
    const mult = (att.def.stats.power || 1) * (att.buffs.rage ? 1.3 : 1);
    const dmg = h.dmg * scale * mult;
    this.damage(tgt, dmg);
    team.combo++; team.comboT = 50; team.comboDmg += dmg; team.popT = 10;
    team.meter = Math.min(300, team.meter + dmg * 0.55);
    tgt.team.meter = Math.min(300, tgt.team.meter + dmg * 0.3);
    if (!isProj) att.connected = true;
    tgt.move = null; tgt.grabbed = null; tgt.cine = null; tgt.cineKeys = null;
    if (tgt.isAssist) { tgt.isAssist = false; tgt.wasAssist = true; }
    tgt.flash = 3;
    const air = tgt.airborne || tgt.y < 0;
    const crouching = ['crouch', 'cblock', 'chit', 'cblockstun'].includes(tgt.state);
    if (h.cine && att.move && att.move.cine && !isProj) {
      att.cine = { t: 0, i: 0, tgt, spec: att.move.cine };
      tgt.setState('cine', 'hit2');
      tgt.vx = tgt.vy = 0;
      att.vx = 0; att.vy = 0;
      this.hitstop = 8;
      this.fx.spark(px, py, 'huge', att.move.cine.color, att.facing);
      this.sfx('hitH');
      this.shake(8);
      return 'hit';
    }
    if (air || h.launch || h.kd || h.spike || tgt.hp <= 0) {
      tgt.setState('airhit', h.launch ? 'airhit' : (h.kd ? 'tumble' : 'airhit'));
      tgt.airborne = true; tgt.y = Math.min(tgt.y, -1);
      if (h.spike && air) { tgt.vy = 10; tgt.kdFlag = true; }
      else if (h.launch) { tgt.vy = -h.launch; tgt.vx = dirTo * 1.2; }
      else if (h.kd) { tgt.vy = -7; tgt.vx = dirTo * (h.push || 4) * 0.9; tgt.kdFlag = true; }
      else { tgt.vy = air ? Math.min(tgt.vy, -4.2 + tgt.juggle * 0.12) : -6; tgt.vx = dirTo * Math.max(1.5, (h.push || 3) * 0.5); }
      if (h.keepVel && isProj) tgt.vx = dirTo * 1;
      tgt.stun = Math.max(8, (h.stun || 16) - tgt.juggle);
      if (air) tgt.juggle++;
    } else {
      tgt.setState(crouching ? 'chit' : 'hit', crouching ? 'chit' : (h.lvl === 'low' || rand() < 0.5 ? 'hit2' : 'hit'));
      tgt.stun = h.stun || 14;
      tgt.vx = dirTo * (h.push ?? 3);
      if (!isProj && (tgt.x <= this.camL + 30 || tgt.x >= this.camR - 30)) att.vx = -dirTo * (h.push ?? 3) * 0.8;
      tgt.juggle = 0;
    }
    if (h.pull && src) { tgt.x = src.ownerX != null ? src.ownerX + att.facing * 45 : tgt.x; tgt.vx = 0; }
    if (h.freeze) { tgt.frozen = h.freeze; tgt.stun = Math.max(tgt.stun, h.freeze); }
    if (h.web) { tgt.webbed = h.web; tgt.stun = Math.max(tgt.stun, h.web); }
    if (h.burn) { tgt.burn = h.burn; tgt.burnColor = h.burnColor; }
    if (h.poison) tgt.poison = h.poison;
    if (h.stunLock) tgt.stun = Math.max(tgt.stun, h.stunLock);
    this.hitstop = Math.max(this.hitstop, h.hs || 6);
    this.fx.spark(px, py, h.spark || 'small', h.sparkColor || att.def.color, sign(tgt.x - fromX) || att.facing, h.fxKind);
    this.sfx(h.sfx || 'hitL');
    if ((h.dmg || 0) >= 60 || h.launch) this.shake(h.launch ? 6 : 5);
    if (tgt.hp <= 0) this.koFighter(tgt, att);
    return 'hit';
  }

  doCounter(f, att) {
    this.sfx('slash');
    this.flash('#fff', 0.6);
    this.fx.text(f.x, f.y - 150, 'COUNTER!', '#ffe14a');
    f.x = att.x - att.facing * 40;
    f.facing = sign(att.x - f.x) || f.facing;
    this.fx.afterimage(f);
    f.move = null;
    f.setState('idle', 'idle');
    att.move = null;
    att.setState('hit', 'hit');
    this.landHitRaw(f, att, { dmg: 120, kd: true, launchV: -9, pushV: f.facing * 5, sfx: 'hitH', spark: 'huge' });
  }

  koFighter(tgt, att) {
    if (this.training) { tgt.hp = 1; return; }
    if (tgt.koed) return;
    tgt.koed = true;
    tgt.kdFlag = true;
    tgt.stun = 999;
    tgt.red = 0;
    this.slow = 50;
    this.sfx('ko');
    this.flash('#fff', 0.8);
    this.shake(12);
    const team = tgt.team;
    const left = team.members.filter((m) => m.alive);
    if (!left.length) { this.phase = 'ko'; this.phaseT = 0; this.banner = { txt: 'K.O.', t: 0, big: true }; say('K.O.!', { pitch: 0.3, rate: 0.8 }); this.winner = 1 - team.side; }
    else this.fx.text(tgt.x, tgt.y - 140, 'DOWN!', '#ff5050');
    void att;
  }

  // ---------------------------------------------------------------- projectiles
  spawnProj(f, s) {
    const from = s.from || 'haF';
    const [ox, oy] = from === 'hip' ? [f.x, f.y - 60] : from === 'ground' ? [f.x + f.facing * 30, f.y - 2] : f.point(from);
    const spread = s.n > 1 && s.spread ? (s.idx - (s.n - 1) / 2) * s.spread : 0;
    const p = {
      owner: f, team: f.team.side, facing: f.facing,
      x: ox + f.facing * (s.dx || 4), y: s.ground ? -((s.h || 20) / 2) : oy + (s.dy || 0),
      vx: (s.vx ?? 7) * f.facing, vy: (s.vy || 0) + spread,
      w: s.w || 20, h: s.h || 16, t: 0, life: s.life || 90, hits: s.hits || 1, every: s.every || 6, lastHit: new Map(),
      dmg: s.dmg ?? 40, ...s,
    };
    p.vx = (s.vx ?? 7) * f.facing;
    p.vy = (s.vy || 0) + spread;
    if (s.atOpp) { const o = this.opp(f); if (o) { p.x = o.x; } }
    if (s.tether) { p.ox = ox; p.oy = oy; }
    this.projs.push(p);
    return p;
  }

  erupt(f, e) {
    const o = this.opp(f);
    let x;
    if (e.at === 'front') x = f.x + f.facing * (e.dist || 90);
    else if (e.at === 'self') x = f.x;
    else if (e.at === 'sweep') x = f.x + f.facing * ((e.dist || 60) + (e.idx || 0) * (e.step || 50));
    else if (e.at === 'scatter') x = (o ? o.x : f.x) + (e.idx % 2 ? 1 : -1) * rand(0, e.spread || 120);
    else x = o ? o.x + (e.lead ? o.vx * 12 : 0) : f.x + f.facing * 100;
    if (e.at !== 'self' && e.at !== 'sweep') x = clamp(x, this.camL + 20, this.camR - 20);
    const p = this.spawnProj(f, {
      kind: 'erupt', look: e.kind, vx: 0, ground: !e.sky, delay: e.delay ?? 16, life: (e.delay ?? 16) + (e.dur || 24),
      w: e.w || 40, h: e.h || 90, dmg: e.dmg ?? 50, hits: e.hits || 1, every: e.every || 8, launch: e.launch, kd: e.kd, stun: e.stun || 24,
      color: e.color, hyper: e.hyper, freeze: e.freeze, stunLock: e.stunLock, burn: e.burn, poison: e.poison, sfx: e.sfx, sky: e.sky, big: e.big,
    });
    p.x = x;
    p.y = -(e.h || 90) / 2;
    return p;
  }

  startBeam(f, b) {
    this.beams.push({ owner: f, team: f.team.side, t: 0, dur: b.dur, from: b.from, len: b.len || 340, w: b.w || 14, dmg: b.dmg || 14, every: b.every || 5, color: b.color || '#ff3030', core: b.core || '#fff', look: b.look || 'beam', angle: b.angle || 0, lastHit: new Map(), freeze: b.freeze, hyper: b.hyper, kd: b.kd, launch: b.launch, poison: b.poison });
  }

  teleport(f, to, fxk, color) {
    const o = this.opp(f);
    this.fx.puffBig(f.x, f.y - 50, fxk, color);
    if (!o) return;
    if (to === 'behind') f.x = clamp(o.x + sign(o.x - f.x || 1) * 55, 30, STAGE_W - 30);
    else if (to === 'front') f.x = o.x - sign(o.x - f.x || 1) * 60;
    else if (to === 'away') f.x = clamp(f.x - f.facing * 180, this.camL + 30, this.camR - 30);
    else if (to === 'above') { f.x = o.x; f.y = -140; f.airborne = true; }
    f.x = clamp(f.x, this.camL + 25, this.camR - 25);
    f.facing = sign(o.x - f.x) || f.facing;
    this.fx.puffBig(f.x, f.y - 50, fxk, color);
    this.sfx('teleport');
  }

  aura(f, a) { this.auras.push({ f, t: 0, ...a }); }

  buff(f, b) {
    if (b.heal) { f.hp = Math.min(f.maxHp, f.hp + b.heal); f.red = Math.max(f.red, f.hp); }
    if (b.regen) f.buffs.regen = { t: b.t || 120, regen: b.regen };
    if (b.rage) f.buffs.rage = { t: b.t || 480 };
    if (b.speed) f.buffs.speed = { t: b.t || 360 };
    if (b.armor) f.buffs.armor = { t: b.t || 300 };
    this.aura(f, { kind: b.aura || 'flare', color: b.color || '#7dff8a', dur: b.auraT || 50, r: 50, y: -60 });
  }

  updateProjectiles() {
    const keep = [];
    for (const p of this.projs) {
      p.t++;
      const owner = p.owner;
      if (p.tether) {
        // stretch out from the hand, then retract
        const [hx, hy] = owner.onField ? owner.point('haF') : [p.ox, p.oy];
        p.ox = hx; p.oy = hy; p.ownerX = owner.x;
        const out = p.t < p.life / 2;
        if (!p.caught) { p.x += out ? p.vx : -p.vx; p.y = hy; }
        if (p.caught) {
          const tgt = p.caught;
          tgt.x = lerp(tgt.x, owner.x + owner.facing * 50, 0.25);
          tgt.y = lerp(tgt.y, 0, 0.3);
          p.x = tgt.x; p.y = tgt.y - 60;
          if (Math.abs(tgt.x - (owner.x + owner.facing * 50)) < 6 || p.t > p.life) { p.dead = true; tgt.stun = 22; }
        }
        if (owner.state !== 'move' && !p.caught) p.dead = true;
        if (p.t > p.life) p.dead = true;
      } else if (p.kind === 'erupt') {
        // stationary
      } else {
        if (p.grav) p.vy += p.grav;
        if (p.ret && p.t > p.ret) { // boomerang returns
          const dx = owner.x - p.x, dy = owner.y - 70 - p.y;
          const d = Math.hypot(dx, dy) || 1;
          p.vx = lerp(p.vx, dx / d * 9, 0.12); p.vy = lerp(p.vy, dy / d * 9, 0.12);
          if (d < 20) p.dead = true;
        }
        if (p.home) { const o = this.opp(owner); if (o) p.vy = lerp(p.vy, clamp((o.y - 60 - p.y) * 0.05, -3, 3), 0.1); }
        p.x += p.vx; p.y += p.vy;
        if (p.ground) p.y = -p.h / 2;
        if (p.y > -4 && !p.ground && p.grav) { p.dead = true; if (p.boom) this.explode(p); }
      }
      if (p.t > p.life || p.x < this.camL - 160 || p.x > this.camR + 160) p.dead = true;
      if (p.dead) { if (p.boom && !p.exploded) this.explode(p); continue; }
      if (p.delay && p.t < p.delay) { keep.push(p); continue; }
      if (p.harmless) { keep.push(p); continue; }
      // collide with fighters
      const tteam = this.teams[1 - p.team];
      for (const tgt of tteam.members) {
        if (!this.hittable(tgt)) continue;
        // reflectors
        if (tgt.state === 'move' && tgt.move && tgt.move.reflect && tgt.mt >= tgt.move.reflect[0] && tgt.mt <= tgt.move.reflect[1] && !p.hyper && p.kind !== 'erupt') {
          const hb0 = tgt.hurtbox();
          if (Math.abs(p.x - (hb0.x + hb0.w / 2)) < hb0.w / 2 + p.w / 2 + 20) {
            p.team = tgt.team.side; p.owner = tgt; p.vx = -p.vx * 1.2; p.t = 0; p.facing = -p.facing;
            this.fx.ring(p.x, p.y, '#ffb030'); this.sfx('magic');
            break;
          }
        }
        const hb = tgt.hurtbox();
        if (p.x + p.w / 2 < hb.x || p.x - p.w / 2 > hb.x + hb.w || p.y + p.h / 2 < hb.y || p.y - p.h / 2 > hb.y + hb.h) continue;
        const last = p.lastHit.get(tgt.uid);
        if (last != null && p.t - last < p.every) continue;
        p.lastHit.set(tgt.uid, p.t);
        const h = { dmg: p.dmg, stun: p.stun || 18, bstun: 12, push: p.push ?? 3, lvl: p.lvl || 'mid', launch: p.launch, kd: p.kd, hs: p.hyper ? 4 : 6, sfx: p.hitSfx || 'hitM', spark: p.spark || 'small', sparkColor: p.color, freeze: p.freeze, web: p.web, burn: p.burn, poison: p.poison, stunLock: p.stunLock, chip: true, keepVel: true };
        const res = this.applyHit(p.owner, tgt, h, p.x, p.y, p, true);
        if (p.tether && res === 'hit' && p.pull) { p.caught = tgt; tgt.setState('hit', 'hit'); tgt.stun = 60; p.t = Math.max(p.t, p.life / 2); }
        if (--p.hits <= 0 && !p.tether) { p.dead = true; if (p.boom) this.explode(p); else this.fx.burst(p.x, p.y, p.color || '#fff'); }
        break;
      }
      if (p.dead) continue;
      // projectile clash
      for (const q of this.projs) {
        if (q === p || q.team === p.team || q.dead || q.kind === 'erupt' || p.kind === 'erupt' || q.tether || p.tether || q.harmless) continue;
        if (Math.abs(q.x - p.x) < (q.w + p.w) / 2 && Math.abs(q.y - p.y) < (q.h + p.h) / 2) {
          if (!p.hyper) { p.hits--; if (p.hits <= 0) p.dead = true; }
          if (!q.hyper) { q.hits--; if (q.hits <= 0) q.dead = true; }
          this.fx.burst((p.x + q.x) / 2, (p.y + q.y) / 2, '#fff');
          this.sfx('blast');
        }
      }
      if (!p.dead) keep.push(p);
    }
    this.projs = keep;
  }

  explode(p) {
    p.exploded = true;
    this.fx.explosion(p.x, p.y, p.color || '#ffa020');
    this.sfx('boom');
    this.shake(5);
    // splash damage
    for (const tgt of this.teams[1 - p.team].members) {
      if (!this.hittable(tgt)) continue;
      const hb = tgt.hurtbox();
      if (Math.abs(hb.x + hb.w / 2 - p.x) < 50 && Math.abs(hb.y + hb.h / 2 - p.y) < 70) {
        this.applyHit(p.owner, tgt, { dmg: p.boomDmg || 50, stun: 20, bstun: 12, push: 5, kd: true, hs: 8, sfx: 'hitH', spark: 'big', chip: true }, p.x, p.y, p, true);
      }
    }
  }

  updateBeams() {
    const keep = [];
    for (const b of this.beams) {
      b.t++;
      const f = b.owner;
      if (b.t > b.dur || !f.onField || (f.state !== 'move' && f.state !== 'cine') || this.superFreeze) { if (b.t > b.dur || f.state !== 'move') continue; }
      const [sx, sy] = b.from === 'eyes' ? f.point('head') : b.from === 'chest' ? [f.x + f.facing * 8 * f.sc, f.y - (f.def.body.thigh + f.def.body.shin + f.def.body.torso * 0.7) * f.sc] : f.point(b.from);
      b.x = sx + (b.from === 'eyes' ? f.facing * 6 : 0); b.y = sy - (b.from === 'eyes' ? 2 : 0); b.dir = f.facing;
      const ang = b.angle * DEG;
      const ex = b.x + Math.cos(ang) * b.len * b.dir, ey = b.y + Math.sin(ang) * b.len;
      b.ex = ex; b.ey = ey;
      const grow = Math.min(1, b.t / 6);
      b.cur = grow;
      if (b.t % 3 === 0) this.fx.beamSpark(b.x, b.y, b.color);
      // collisions along the segment
      for (const tgt of this.teams[1 - b.team].members) {
        if (!this.hittable(tgt)) continue;
        const hb = tgt.hurtbox();
        const steps = 24;
        let hitP = null;
        for (let i = 0; i <= steps; i++) {
          const u = (i / steps) * grow;
          const x = lerp(b.x, ex, u), y = lerp(b.y, ey, u);
          if (x > hb.x - b.w / 2 && x < hb.x + hb.w + b.w / 2 && y > hb.y - b.w / 2 && y < hb.y + hb.h + b.w / 2) { hitP = [x, y]; break; }
        }
        if (!hitP) continue;
        const last = b.lastHit.get(tgt.uid);
        if (last != null && b.t - last < b.every) continue;
        b.lastHit.set(tgt.uid, b.t);
        const lastTick = b.t + b.every > b.dur;
        this.applyHit(f, tgt, { dmg: b.dmg, stun: 20, bstun: 10, push: 1.5, hs: 2, sfx: 'hitL', spark: 'small', sparkColor: b.color, chip: true, freeze: b.freeze, poison: b.poison, kd: lastTick && (b.kd || b.hyper), launch: lastTick ? b.launch : 0, keepVel: true }, hitP[0], hitP[1], { x: f.x }, true);
      }
      // beams beat projectiles
      for (const q of this.projs) if (q.team !== b.team && q.kind !== 'erupt' && !q.tether && Math.abs(q.y - b.y) < b.w && sign(q.x - b.x) === b.dir && Math.abs(q.x - b.x) < b.len) { q.dead = true; this.fx.burst(q.x, q.y, b.color); }
      keep.push(b);
    }
    this.beams = keep;
  }

  // ---------------------------------------------------------------- spacing / camera
  separate() {
    const a = this.active(0), b = this.active(1);
    for (const team of this.teams) for (const f of team.members) {
      if (!f.onField || ['tagout', 'tagin'].includes(f.state)) continue;
      const margin = 18;
      f.x = clamp(f.x, Math.max(25, this.camL + margin), Math.min(STAGE_W - 25, this.camR - margin));
    }
    if (!a || !b || !a.onField || !b.onField) return;
    if (['tagout', 'tagin', 'ko', 'lie', 'cine', 'thrown', 'grabbed'].includes(a.state) || ['tagout', 'tagin', 'ko', 'lie', 'cine', 'thrown', 'grabbed'].includes(b.state)) return;
    const hb = (f) => ({ top: f.y - 120 * f.sc, bot: f.y });
    const A = hb(a), B = hb(b);
    if (A.bot < B.top + 20 || B.bot < A.top + 20) return;
    const minD = a.pushW() + b.pushW();
    const d = b.x - a.x;
    if (Math.abs(d) < minD) {
      const push = (minD - Math.abs(d)) / 2;
      const s = d === 0 ? (a.facing > 0 ? 1 : -1) : sign(d);
      a.x -= push * s; b.x += push * s;
      // keep within screen; if one is pinned, push the other
      const lo = this.camL + 18, hi = this.camR - 18;
      if (a.x < lo) { b.x += lo - a.x; a.x = lo; } if (a.x > hi) { b.x -= a.x - hi; a.x = hi; }
      if (b.x < lo) { a.x += lo - b.x; b.x = lo; } if (b.x > hi) { a.x -= b.x - hi; b.x = hi; }
    }
  }

  updateCamera() {
    const a = this.active(0), b = this.active(1);
    const xs = [], ys = [];
    for (const f of [a, b]) if (f && f.onField && !['tagout', 'tagin'].includes(f.state)) { xs.push(f.x); ys.push(f.y); }
    if (!xs.length) return;
    let cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    cx = clamp(cx, W / 2, STAGE_W - W / 2);
    this.camX = lerp(this.camX, cx, 0.2);
    // don't let the two drift farther apart than the screen
    if (xs.length === 2 && Math.abs(xs[0] - xs[1]) > W - 50) { /* clamped by separate() */ }
    const top = Math.min(...ys);
    const ty = top < -110 ? (top + 110) * 0.65 : 0;
    this.camY = lerp(this.camY, ty, 0.12);
  }

  // ---------------------------------------------------------------- flow
  checkFlow() {
    // KO'd active gets replaced by partner
    for (const team of this.teams) {
      const f = team.members[team.cur];
      if (f.koed && f.state === 'ko' && !f.airborne && this.phase === 'fight') {
        f.koT = (f.koT || 0) + 1;
        const p = this.partner(team);
        if (f.koT > 60 && p && p.alive) {
          f.onField = false;
          team.cur = 1 - team.cur;
          this.enterFighter(p, f, false);
          p.facing = sign(this.opp(p).x - p.x) || 1;
          p.vx = p.facing * 7.5;
          p.x = p.facing > 0 ? this.camL - 20 : this.camR + 20;
        }
      }
      // assist/partner KO'd while on field
      team.members.forEach((m) => {
        if (m !== team.members[team.cur] && m.onField && m.koed && m.state === 'ko' && !m.airborne) { m.koT = (m.koT || 0) + 1; if (m.koT > 50) m.onField = false; }
        if (m !== team.members[team.cur] && m.onField && !m.koed && ['idle', 'land'].includes(m.state) && m.t > 4) this.exitAssist(m);
        if (m !== team.members[team.cur] && m.onField && m.wasAssist && ['idle', 'land'].includes(m.state)) { m.wasAssist = false; this.exitAssist(m); }
      });
    }
    if (this.phase === 'ko') {
      if (this.phaseT === 120) {
        const wt = this.teams[this.winner];
        const w = wt.members[wt.cur].alive ? wt.members[wt.cur] : wt.members.find((m) => m.alive);
        if (w) { w.onField = true; w.move = null; w.setState('win', 'win'); w.vx = 0; this.winnerF = w; if (w.def.quotes) this.winQuote = pick(w.def.quotes.win); }
        this.banner = { txt: (wt.cpu ? 'CPU' : wt.name) + ' WINS', t: 0 };
        say(w ? w.def.name.toLowerCase() + ' wins' : 'winner', { pitch: 0.5 });
      }
      if (this.phaseT === 330 && this.opts.onEnd) this.opts.onEnd({ winner: this.winner, battle: this });
    }
  }

  timeUp() {
    if (this.phase !== 'fight') return;
    const score = this.teams.map((t) => t.members.reduce((s, m) => s + m.hp / m.maxHp, 0));
    this.winner = score[0] >= score[1] ? 0 : 1;
    this.phase = 'ko'; this.phaseT = 0;
    this.banner = { txt: 'TIME OVER', t: 0, big: true };
    say('Time over');
  }

  // ---------------------------------------------------------------- drawing
  draw(ctx) {
    const shx = this.shakeAmt > 0.5 ? rand(-this.shakeAmt, this.shakeAmt) : 0;
    const shy = this.shakeAmt > 0.5 ? rand(-this.shakeAmt, this.shakeAmt) * 0.6 : 0;
    const camL = Math.round(this.camL + shx);
    const camY = Math.round(this.camY + shy);
    const toS = (x, y) => [Math.round(x - camL), Math.round(GROUND + y - camY)];
    this.toS = toS;
    this.stage.drawBack(ctx, camL, camY, this.frame);
    // shadows
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (const team of this.teams) for (const f of team.members) if (f.onField) {
      const [sx, sy] = toS(f.x, 0);
      const k = clamp(1 + f.y / 300, 0.3, 1);
      ctx.beginPath(); ctx.ellipse(sx, sy + 1, 26 * f.sc * k, 5 * k, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (this.superFreeze > 0 || this.cutins.some((c) => c.t < 40)) {
      ctx.fillStyle = 'rgba(0,0,20,0.55)'; ctx.fillRect(0, 0, W, H);
    }
    // auras behind
    for (const a of this.auras) this.fx.drawAura(ctx, a, toS, true);
    // erupt warnings & ground effects behind fighters
    for (const p of this.projs) if (p.kind === 'erupt' && p.back) drawProj(ctx, p, toS, this);
    // fighters: assists/partners first, then attacker on top
    const list = [];
    for (const team of this.teams) for (const f of team.members) if (f.onField) list.push(f);
    list.sort((p, q) => (p.state === 'move' ? 1 : 0) - (q.state === 'move' ? 1 : 0) || (p === this.active(p.team.side) ? 1 : 0) - (q === this.active(q.team.side) ? 1 : 0));
    for (const f of list) this.drawFighter(ctx, f, toS);
    // projectiles, beams, fx
    for (const p of this.projs) if (!p.back) drawProj(ctx, p, toS, this);
    for (const b of this.beams) this.fx.drawBeam(ctx, b, toS);
    for (const a of this.auras) this.fx.drawAura(ctx, a, toS, false);
    this.fx.draw(ctx, toS);
    this.stage.drawFront(ctx, camL, camY, this.frame);
    if (this.flashA > 0) { ctx.fillStyle = this.flashC; ctx.globalAlpha = clamp(this.flashA, 0, 1) * 0.6; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    this.drawCutins(ctx);
    this.drawHUD(ctx);
  }

  drawFighter(ctx, f, toS) {
    const look = f.def.look;
    let tint = null;
    if (f.flash > 0) tint = [255, 255, 255, 0.75];
    else if (f.armorFlash > 0) { tint = [255, 60, 60, 0.5]; f.armorFlash--; }
    else if (f.frozen > 0) tint = [150, 220, 255, 0.55];
    else if (f.webbed > 0) tint = [240, 240, 240, 0.4];
    else if (f.buffs.rage) tint = [255, 40, 20, 0.18 + 0.1 * Math.sin(this.frame * 0.3)];
    else if (f.burn > 0) tint = [255, 120, 20, 0.25];
    else if (f.poison > 0) tint = [140, 230, 60, 0.25];
    const hidden = f.state === 'move' && f.move && f.move.hidden && f.mt >= f.move.hidden[0] && f.mt <= f.move.hidden[1];
    if (hidden) return;
    const buf = f.buf;
    const [rx, ry, rw, rh] = buf.render(f.sk, f, look, f.facing, f.sc, tint);
    const [sx, sy] = toS(f.x, f.y);
    const dx = sx - SPR_OX + rx, dy = sy - SPR_OY + ry;
    // afterimages for fast moves / hypers
    const fast = (f.state === 'move' && f.move && (f.move.kind === 'hyper' || f.move.trail)) || f.state === 'dash' || f.cine || f.buffs.speed;
    if (fast) {
      f.afterimg.push([dx, dy]);
      if (f.afterimg.length > 5) f.afterimg.shift();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      f.afterimg.forEach(([ax, ay], i) => { ctx.globalAlpha = 0.08 + i * 0.05; ctx.drawImage(buf.cv, rx, ry, rw, rh, ax, ay, rw, rh); });
      ctx.restore();
    } else if (f.afterimg.length) f.afterimg.length = 0;
    if (f.inv > 0 && f.state === 'getup' && this.frame % 4 < 2) ctx.globalAlpha = 0.7;
    ctx.drawImage(buf.cv, rx, ry, rw, rh, dx, dy, rw, rh);
    ctx.globalAlpha = 1;
    // slash trails
    if (f.trail.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const col = f.def.trail || f.def.color;
      for (let i = 1; i < f.trail.length; i++) {
        const [x0, y0, l0] = f.trail[i - 1], [x1, y1] = f.trail[i];
        const [a0, b0] = toS(x0, y0), [a1, b1] = toS(x1, y1);
        ctx.strokeStyle = col; ctx.globalAlpha = l0 / 12; ctx.lineWidth = 2 + l0 * 0.5;
        ctx.beginPath(); ctx.moveTo(a0, b0); ctx.lineTo(a1, b1); ctx.stroke();
      }
      ctx.restore();
      f.trail.forEach((t) => t[2]--);
      f.trail = f.trail.filter((t) => t[2] > 0);
    }
    // glow overlays (fire skulls, energy hands, etc.)
    if (look.glow) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(f.facing * f.sc, f.sc);
      ctx.globalCompositeOperation = look.glowNormal ? 'source-over' : 'lighter';
      look.glow(ctx, f.sk, f, this.frame);
      ctx.restore();
    }
  }

  drawCutins(ctx) {
    for (const c of this.cutins) {
      if (c.t < 0 || c.t > 60) continue;
      const img = this.portraits[c.f.def.id];
      const k = c.t < 8 ? c.t / 8 : c.t > 48 ? 1 - (c.t - 48) / 12 : 1;
      const left = c.side === 0;
      const bandY = 90, bandH = 150;
      ctx.save();
      ctx.globalAlpha = k;
      const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
      g.addColorStop(0, c.f.def.color); g.addColorStop(0.5, '#000'); g.addColorStop(1, c.f.def.color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, bandY + 20); ctx.lineTo(W, bandY); ctx.lineTo(W, bandY + bandH - 20); ctx.lineTo(0, bandY + bandH); ctx.closePath();
      ctx.fill();
      // speed lines
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const y = bandY + 10 + ((i * 37 + c.t * 9) % (bandH - 20)); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y - 18); ctx.stroke(); }
      if (img) {
        const h = 200, w = img.width * h / img.height;
        const slide = (1 - Math.min(1, c.t / 10)) * 200;
        const x = left ? 30 - slide : W - 30 - w + slide;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(0, bandY + 20); ctx.lineTo(W, bandY); ctx.lineTo(W, bandY + bandH - 20); ctx.lineTo(0, bandY + bandH); ctx.closePath(); ctx.clip();
        ctx.imageSmoothingEnabled = false;
        if (!left) { ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, bandY - 25, w, h); }
        else ctx.drawImage(img, x, bandY - 25, w, h);
        ctx.restore();
      }
      text(ctx, c.name, left ? W - 24 : 24, bandY + bandH / 2 + 8, { size: 16, align: left ? 'right' : 'left', grad: ['#fff8c0', '#ffb000', '#ff4000'], stroke: '#000', strokeW: 4 });
      ctx.restore();
    }
  }

  drawHUD(ctx) {
    const t0 = this.teams[0], t1 = this.teams[1];
    this.drawTeamBars(ctx, t0, false);
    this.drawTeamBars(ctx, t1, true);
    // timer
    ctx.fillStyle = '#0b0b18'; ctx.fillRect(W / 2 - 20, 4, 40, 30);
    ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 20, 4, 40, 30);
    text(ctx, this.training ? '--' : String(Math.ceil(this.timer / 60)).padStart(2, '0'), W / 2, 28, { size: 16, align: 'center', grad: ['#fff', '#ffd34a'] });
    // meters
    this.drawMeter(ctx, t0, false);
    this.drawMeter(ctx, t1, true);
    // combos
    for (const team of this.teams) {
      if (team.combo >= 2) {
        const right = team.side === 1;
        const pop = team.popT > 0 ? 1 + team.popT * 0.03 : 1;
        ctx.save();
        ctx.translate(right ? W - 20 : 20, 120);
        ctx.scale(pop, pop);
        text(ctx, team.combo + ' HITS', 0, 0, { size: 16, align: right ? 'right' : 'left', grad: ['#fff6a0', '#ffae00', '#ff3000'], stroke: '#000', strokeW: 4 });
        text(ctx, Math.round(team.comboDmg) + ' DMG', 0, 16, { size: 8, align: right ? 'right' : 'left', color: '#fff', stroke: '#000' });
        ctx.restore();
      }
    }
    // banner
    if (this.banner) {
      const b = this.banner;
      const k = Math.min(1, b.t / 8);
      const s = b.big ? 40 : 28;
      ctx.save();
      ctx.translate(W / 2, H / 2 - 20);
      ctx.scale(2 - k, 2 - k);
      ctx.globalAlpha = b.t > 55 ? 1 - (b.t - 55) / 15 : 1;
      text(ctx, b.txt, 0, 0, { size: s, align: 'center', base: 'middle', grad: ['#ffffff', '#ffe060', '#ff7a00', '#c01000'], stroke: '#1a0500', strokeW: 6, shadowOff: 4 });
      ctx.restore();
    }
    if (this.winQuote && this.phase === 'ko' && this.phaseT > 140) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(40, H - 70, W - 80, 36);
      text(ctx, '"' + this.winQuote + '"', W / 2, H - 47, { size: 8, align: 'center', color: '#fff' });
    }
    if (this.training) text(ctx, 'TRAINING', W / 2, 46, { size: 8, align: 'center', color: '#7dffb0' });
  }

  drawTeamBars(ctx, team, right) {
    const f = team.members[team.cur];
    const p = team.members[1 - team.cur];
    const X = (x, w = 0) => (right ? W - x - w : x);
    // portrait box
    const img = this.portraits[f.def.id];
    ctx.fillStyle = '#0b0b18'; ctx.fillRect(X(6, 36), 5, 36, 36);
    if (img) {
      ctx.save(); ctx.beginPath(); ctx.rect(X(7, 34), 6, 34, 34); ctx.clip();
      const s = 34 / (img.width * 0.55);
      const w = img.width * s, h = img.height * s;
      ctx.imageSmoothingEnabled = false;
      const fx = f.def.face || [0.5, 0.12];
      if (right) { ctx.translate(X(7, 34) + 34, 0); ctx.scale(-1, 1); ctx.drawImage(img, 17 - w * fx[0], 23 - h * fx[1], w, h); }
      else ctx.drawImage(img, X(7, 34) + 17 - w * fx[0], 23 - h * fx[1], w, h);
      ctx.restore();
    }
    ctx.strokeStyle = f.def.side === 'marvel' ? '#e02424' : '#2a6cf0'; ctx.lineWidth = 2; ctx.strokeRect(X(6, 36), 5, 36, 36);
    // health bar
    const bx = 46, bw = 236, by = 9, bh = 12;
    ctx.fillStyle = '#0b0b18'; ctx.fillRect(X(bx - 2, bw + 4), by - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#3a0a0a'; ctx.fillRect(X(bx, bw), by, bw, bh);
    const redW = bw * clamp(f.red / f.maxHp, 0, 1), hpW = bw * clamp(f.hp / f.maxHp, 0, 1);
    ctx.fillStyle = '#d42020'; ctx.fillRect(right ? X(bx, redW) : X(bx), by, redW, bh);
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    const low = f.hp / f.maxHp < 0.25;
    g.addColorStop(0, low ? '#ffb0a0' : '#fff7a0'); g.addColorStop(0.5, low ? '#ff5030' : '#ffd21a'); g.addColorStop(1, low ? '#a01810' : '#c08000');
    ctx.fillStyle = g; ctx.fillRect(right ? X(bx, hpW) : X(bx), by, hpW, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(right ? X(bx, hpW) : X(bx), by + 1, hpW, 2);
    text(ctx, f.def.name, right ? W - bx : bx, by + bh + 11, { size: 8, align: right ? 'right' : 'left', color: '#fff' });
    // partner mini bar
    if (p) {
      const px = 46, pw = 110, py = by + bh + 16;
      ctx.fillStyle = '#0b0b18'; ctx.fillRect(X(px - 1, pw + 2), py - 1, pw + 2, 7);
      ctx.fillStyle = '#d42020'; const rw = pw * clamp(p.red / p.maxHp, 0, 1); ctx.fillRect(right ? X(px, rw) : X(px), py, rw, 5);
      ctx.fillStyle = p.alive ? '#5ad1ff' : '#444'; const hw = pw * clamp(p.hp / p.maxHp, 0, 1); ctx.fillRect(right ? X(px, hw) : X(px), py, hw, 5);
      text(ctx, p.alive ? p.def.name : 'K.O.', right ? W - px - pw - 4 : px + pw + 4, py + 6, { size: 6, align: right ? 'right' : 'left', color: p.alive ? '#9fe8ff' : '#ff6060' });
      // assist readiness
      if (p.alive) {
        const ready = team.assistCD <= 0;
        text(ctx, ready ? 'ASSIST OK' : 'ASSIST ' + Math.ceil(team.assistCD / 60), right ? W - px : px, py + 16, { size: 6, align: right ? 'right' : 'left', color: ready ? '#7dff8a' : '#888' });
      }
    }
  }

  drawMeter(ctx, team, right) {
    const lv = Math.floor(team.meter / 100);
    const frac = (team.meter % 100) / 100;
    const x = 34, w = 150, y = H - 18, h = 8;
    const X = (xx, ww = 0) => (right ? W - xx - ww : xx);
    ctx.fillStyle = '#0b0b18'; ctx.fillRect(X(x - 2, w + 4), y - 2, w + 4, h + 4);
    const cols = ['#2a6cf0', '#20d070', '#ffcc20', '#ff5020'];
    ctx.fillStyle = lv > 0 ? cols[lv - 1] : '#1a2340'; ctx.fillRect(X(x, w), y, w, h);
    if (lv < 3) {
      const fw = w * frac;
      ctx.fillStyle = cols[lv];
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(this.frame * 0.2);
      ctx.fillRect(right ? X(x, fw) : X(x), y, fw, h);
      ctx.globalAlpha = 1;
    } else if (this.frame % 20 < 10) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(X(x, w), y, w, h); }
    ctx.fillStyle = '#0b0b18'; ctx.fillRect(X(4, 26), H - 28, 26, 24);
    text(ctx, String(lv), X(4, 26) + 13, H - 9, { size: 16, align: 'center', grad: ['#fff', cols[Math.max(0, lv - 1)]] });
    text(ctx, 'HYPER', right ? W - x : x, y - 4, { size: 6, align: right ? 'right' : 'left', color: '#cfe0ff' });
  }
}
export { STAGE_W };

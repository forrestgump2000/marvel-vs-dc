// Menus and flow: title, mode select, character select, stage select, VS, fight, pause, results.
import { W, H, GROUND, text, clamp, lerp, rand, pick, makeCanvas, shade } from './util.js';
import { pads } from './input.js';
import { sfx, playMusic, settings, say, initAudio } from './audio.js';
import { Battle } from './battle.js';
import { Fighter } from './fighter.js';
import { STAGES, getStage } from './stages.js';
import { SPECIAL_INPUTS, HYPER_INPUTS } from './moves.js';

export const game = { scene: null, roster: [], built: {}, portraits: {}, pix: {}, frame: 0, difficulty: 1, last: null };
export function go(scene) { game.scene = scene; if (scene.enter) scene.enter(); }

const P1 = () => pads[0];
const P2 = () => pads[1];
const anyConfirm = () => P1().confirm() || P2().confirm();
const anyBack = () => P1().back() || P2().back();

function saveSettings() { try { localStorage.setItem('mvdc-settings', JSON.stringify({ ...settings, difficulty: game.difficulty })); } catch (e) { /* ignore */ } }
export function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem('mvdc-settings') || '{}'); Object.assign(settings, { music: s.music ?? true, sfx: s.sfx ?? true, voice: s.voice ?? true }); if (s.difficulty != null) game.difficulty = s.difficulty; } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------- shared backdrop
export function backdrop(ctx, t, tint = 0) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#5a0008'); g.addColorStop(0.49, '#c0101c'); g.addColorStop(0.51, '#0a2a8a'); g.addColorStop(1, '#020a3a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // diagonal split with energy crackle
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 18; i++) { const x = ((i * 53 + t * 2) % (W + 200)) - 100; ctx.fillStyle = i % 2 ? '#fff' : '#000'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x - 140, H); ctx.lineTo(x - 160, H); ctx.fill(); }
  ctx.restore();
  // halftone dots
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < W; x += 8) ctx.fillRect(x, y, 2, 2);
  if (tint) { ctx.fillStyle = `rgba(0,0,0,${tint})`; ctx.fillRect(0, 0, W, H); }
}

export function drawLogo(ctx, cx, cy, s = 1, t = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // MARVEL block
  ctx.save(); ctx.rotate(-0.04);
  ctx.fillStyle = '#000'; ctx.fillRect(-214, -36, 196, 62);
  ctx.fillStyle = '#e8202a'; ctx.fillRect(-210, -32, 188, 54);
  text(ctx, 'MARVEL', -116, 6, { size: 28, align: 'center', base: 'middle', color: '#fff', shadowOff: 3 });
  ctx.restore();
  // DC roundel
  ctx.save(); ctx.rotate(0.04);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(118, -2, 44, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a5ae8'; ctx.beginPath(); ctx.arc(118, -2, 40, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(118, -2, 34, 0, Math.PI * 2); ctx.stroke();
  text(ctx, 'DC', 118, 2, { size: 30, align: 'center', base: 'middle', color: '#fff', shadowOff: 3 });
  ctx.restore();
  // vs.
  const pulse = 1 + Math.sin(t * 0.15) * 0.06;
  ctx.save(); ctx.scale(pulse, pulse);
  text(ctx, 'vs.', 6, 6, { size: 26, align: 'center', base: 'middle', grad: ['#fffbd0', '#ffd000', '#ff6a00'], stroke: '#000', strokeW: 6, shadowOff: 3, italic: true });
  ctx.restore();
  ctx.restore();
}

function pixPortrait(ctx, id, x, y, h, flip = false, alpha = 1) {
  const img = game.pix[id];
  if (!img) return;
  const w = img.width * h / img.height;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); }
  else ctx.drawImage(img, x, y, w, h);
  ctx.restore();
  return w;
}

function menuList(ctx, items, sel, x, y, opt = {}) {
  items.forEach((it, i) => {
    const on = i === sel;
    const yy = y + i * (opt.gap || 26);
    if (on) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 130, yy - 16, 260, 22);
      ctx.fillStyle = '#ffd000'; ctx.fillRect(x - 130, yy - 16, 4, 22); ctx.fillRect(x + 126, yy - 16, 4, 22);
    }
    text(ctx, it, x, yy, { size: on ? 12 : 10, align: 'center', color: on ? '#fff36a' : '#d8d8e8', stroke: '#000', strokeW: 3 });
  });
}

// ---------------------------------------------------------------- preview fighters (select screen / title)
const dummyTeam = { side: 0, meter: 0, members: [], pad: pads[0] };
function makePreview(def) {
  const f = new Fighter(def, game.built[def.id], dummyTeam, 0);
  f.onField = true;
  return f;
}
function drawPreview(ctx, f, x, y, facing, scale = 1.2) {
  f.animT++; f.animClock++;
  f.updatePose();
  const [rx, ry, rw, rh] = f.buf.render(f.sk, f, f.def.look, facing, scale * (f.def.scale || 1));
  ctx.drawImage(f.buf.cv, rx, ry, rw, rh, Math.round(x - 210 + rx), Math.round(y - 300 + ry), rw, rh);
  if (f.def.look.glow) {
    ctx.save(); ctx.translate(x, y); ctx.scale(facing * scale, scale); ctx.globalCompositeOperation = f.def.look.glowNormal ? 'source-over' : 'lighter'; f.def.look.glow(ctx, f.sk, f, game.frame); ctx.restore();
  }
}

// ======================================================================= TITLE
export class TitleScene {
  enter() { this.t = 0; this.a = pick(game.roster.filter((d) => d.side === 'marvel')); this.b = pick(game.roster.filter((d) => d.side === 'dc')); this.fa = makePreview(this.a); this.fb = makePreview(this.b); this.fa.setAnim('idle'); this.fb.setAnim('idle'); }
  update() {
    this.t++;
    if (this.t % 300 === 0) this.enter2();
    if (anyConfirm()) { initAudio(); sfx('confirm'); playMusic('title'); say('Marvel versus D C', { pitch: 0.5, rate: 0.95 }); go(new MenuScene()); }
  }
  enter2() { const t = this.t; this.enter(); this.t = t; }
  draw(ctx) {
    backdrop(ctx, this.t);
    pixPortrait(ctx, this.a.id, 10, 50, 300, false, 0.9);
    const wb = game.pix[this.b.id] ? game.pix[this.b.id].width * 300 / game.pix[this.b.id].height : 150;
    pixPortrait(ctx, this.b.id, W - 10 - wb, 50, 300, true, 0.9);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 286, W, 74);
    drawPreview(ctx, this.fa, 210, 330, 1, 1.15);
    drawPreview(ctx, this.fb, 430, 330, -1, 1.15);
    const drop = Math.min(1, this.t / 30);
    drawLogo(ctx, W / 2, lerp(-60, 110, 1 - (1 - drop) ** 3), 1.15, this.t);
    text(ctx, 'ULTIMATE CROSSOVER', W / 2, 168, { size: 10, align: 'center', color: '#fff', stroke: '#000', strokeW: 4 });
    if (this.t % 60 < 40) text(ctx, 'PRESS START', W / 2, 220, { size: 16, align: 'center', grad: ['#fff', '#ffd000'], stroke: '#000', strokeW: 5 });
    text(ctx, 'ENTER / U / TAP TO BEGIN', W / 2, 240, { size: 6, align: 'center', color: '#ffffffaa' });
    text(ctx, '20 HEROES - 2 ON 2 TAG BATTLES', W / 2, 354, { size: 6, align: 'center', color: '#cfd8ff' });
  }
}

// ======================================================================= MAIN MENU
export class MenuScene {
  enter() { this.sel = 0; this.t = 0; this.items = ['ARCADE (VS CPU)', 'VERSUS (2 PLAYERS)', 'TRAINING', 'HOW TO PLAY', 'SETTINGS']; playMusic('title'); }
  update() {
    this.t++;
    const p = P1();
    if (p.pressed('up') || P2().pressed('up')) { this.sel = (this.sel + this.items.length - 1) % this.items.length; sfx('cursor'); }
    if (p.pressed('down') || P2().pressed('down')) { this.sel = (this.sel + 1) % this.items.length; sfx('cursor'); }
    if (anyBack()) { sfx('back'); go(new TitleScene()); return; }
    if (anyConfirm()) {
      sfx('confirm');
      const m = ['arcade', 'versus', 'training', 'help', 'settings'][this.sel];
      if (m === 'help') go(new HelpScene());
      else if (m === 'settings') go(new SettingsScene());
      else go(new SelectScene(m));
    }
  }
  draw(ctx) {
    backdrop(ctx, this.t, 0.35);
    drawLogo(ctx, W / 2, 66, 0.9, this.t);
    menuList(ctx, this.items, this.sel, W / 2, 160);
    const tips = ['Pick 2 heroes, pick the 2 you want to fight, and battle the CPU.', 'Two players on one keyboard or with gamepads.', 'Practice combos: infinite health and hyper meter.', 'Controls, combos, tags, assists and hypers.', 'Music, sound, announcer and CPU difficulty.'];
    text(ctx, tips[this.sel], W / 2, 330, { size: 6, align: 'center', color: '#fff' });
  }
}

// ======================================================================= HELP
export class HelpScene {
  enter() { this.t = 0; this.page = 0; }
  update() {
    this.t++;
    if (P1().pressed('right') || P1().pressed('left')) { this.page = 1 - this.page; sfx('cursor'); }
    if (anyBack() || anyConfirm()) { sfx('back'); go(new MenuScene()); }
  }
  draw(ctx) {
    backdrop(ctx, this.t, 0.65);
    text(ctx, this.page ? 'HOW TO FIGHT' : 'CONTROLS', W / 2, 30, { size: 16, align: 'center', grad: ['#fff', '#ffd000'], stroke: '#000', strokeW: 4 });
    const L = (s, x, y, c = '#fff', size = 7) => text(ctx, s, x, y, { size, color: c });
    if (!this.page) {
      L('PLAYER 1 (KEYBOARD)', 30, 62, '#ff6a6a', 8);
      [['MOVE', 'W A S D'], ['LIGHT / HEAVY PUNCH', 'U / I'], ['LIGHT / HEAVY KICK', 'J / K'], ['SPECIAL', 'O'], ['HYPER', 'L'], ['ASSIST', 'Y'], ['TAG', 'H'], ['TAUNT', 'T'], ['PAUSE', 'ENTER / ESC']].forEach(([a, b], i) => { L(a, 30, 82 + i * 15, '#ddd', 6); L(b, 200, 82 + i * 15, '#ffe06a', 6); });
      L('PLAYER 2 (KEYBOARD)', 340, 62, '#6aa8ff', 8);
      [['MOVE', 'ARROW KEYS'], ['PUNCH', ', .  or NUM 4 5'], ['KICK', 'M N  or NUM 1 2'], ['SPECIAL', '/  or NUM 6'], ['HYPER', ';  or NUM 3'], ['ASSIST', '[  or NUM 7'], ['TAG', ']  or NUM 8'], ['TAUNT', '\\  or NUM 9'], ['PAUSE', 'R-SHIFT / NUM ENTER']].forEach(([a, b], i) => { L(a, 340, 82 + i * 15, '#ddd', 6); L(b, 470, 82 + i * 15, '#ffe06a', 6); });
      L('GAMEPADS: X/Y PUNCH  A/B KICK  RB SPECIAL  RT HYPER  LB ASSIST  LT TAG', 30, 238, '#9fe8ff', 6);
      L('TOUCH: ON-SCREEN STICK AND BUTTONS APPEAR ON PHONES/TABLETS', 30, 254, '#9fe8ff', 6);
      L('MOTION INPUTS: QCF+P (D,DF,F)  QCB+P (D,DB,B)  DP+P (F,D,DF)  QCF+K', 30, 280, '#fff', 6);
      L('EASY MODE: SPECIAL + (NONE / BACK / UP / DOWN)   HYPER + (NONE / BACK)', 30, 296, '#fff', 6);
    } else {
      const lines = [
        ['2-ON-2 TAG', 'Each side fields two heroes. Knock out both to win.'],
        ['TAG (H)', 'Swap your partner in. The benched hero slowly heals red health.'],
        ['ASSIST (Y)', 'Partner jumps in for one special, then leaves. Has a cooldown.'],
        ['CHAINS', 'Light into Heavy. Any normal cancels into a special on hit.'],
        ['LAUNCHER', 'Crouch + Heavy Punch launches. Hold UP to chase into the air.'],
        ['AIR COMBO', 'Juggle with air normals; jump Heavy Kick spikes them down.'],
        ['HYPER (L)', 'Costs 1 bar (max 3). Specials cancel into hypers on hit.'],
        ['CROSSOVER', 'Hold TAG + press HYPER with 2 bars: both heroes go hyper.'],
        ['BLOCK', 'Hold back. Crouch-block lows, stand-block jump-ins.'],
        ['DASH', 'Double-tap forward / back. Super jump: down, then up.'],
        ['THROW', 'Forward or back + Heavy Punch up close.'],
      ];
      lines.forEach(([a, b], i) => { L(a, 30, 62 + i * 22, '#ffe06a', 7); L(b, 150, 62 + i * 22, '#fff', 6); });
    }
    text(ctx, 'LEFT/RIGHT: PAGE    ANY BUTTON: BACK', W / 2, 350, { size: 6, align: 'center', color: '#aaa' });
  }
}

// ======================================================================= SETTINGS
export class SettingsScene {
  enter() { this.sel = 0; this.t = 0; }
  items() { return [`MUSIC: ${settings.music ? 'ON' : 'OFF'}`, `SOUND FX: ${settings.sfx ? 'ON' : 'OFF'}`, `ANNOUNCER: ${settings.voice ? 'ON' : 'OFF'}`, `CPU: ${['EASY', 'NORMAL', 'HARD'][game.difficulty]}`, 'BACK']; }
  update() {
    this.t++;
    const p = P1(); const n = 5;
    if (p.pressed('up')) { this.sel = (this.sel + n - 1) % n; sfx('cursor'); }
    if (p.pressed('down')) { this.sel = (this.sel + 1) % n; sfx('cursor'); }
    const toggle = p.confirm() || p.pressed('left') || p.pressed('right');
    if (anyBack() || (toggle && this.sel === 4)) { saveSettings(); sfx('back'); go(new MenuScene()); return; }
    if (toggle) {
      if (this.sel === 0) { settings.music = !settings.music; if (!settings.music) { /* sequencer keeps time but silent */ } }
      if (this.sel === 1) settings.sfx = !settings.sfx;
      if (this.sel === 2) settings.voice = !settings.voice;
      if (this.sel === 3) game.difficulty = (game.difficulty + (p.pressed('left') ? 2 : 1)) % 3;
      sfx('confirm'); saveSettings();
    }
  }
  draw(ctx) {
    backdrop(ctx, this.t, 0.5);
    text(ctx, 'SETTINGS', W / 2, 60, { size: 16, align: 'center', grad: ['#fff', '#ffd000'], stroke: '#000', strokeW: 4 });
    menuList(ctx, this.items(), this.sel, W / 2, 120, { gap: 30 });
  }
}

// ======================================================================= CHARACTER SELECT
const CELL = 44, GAP = 4;
function cellPos(i) {
  const s = Math.floor(i / 10), r = Math.floor((i % 10) / 5), c = i % 5;
  const x0 = s ? 344 : 56;
  return [x0 + c * (CELL + GAP), 258 + r * (CELL + GAP)];
}
function moveCursor(i, dx, dy) {
  let s = Math.floor(i / 10), r = Math.floor((i % 10) / 5), c = i % 5;
  if (dy) r = 1 - r;
  if (dx) {
    c += dx;
    if (c > 4) { if (s === 0) { s = 1; c = 0; } else c = 4; }
    if (c < 0) { if (s === 1) { s = 0; c = 4; } else c = 0; }
  }
  return s * 10 + r * 5 + c;
}

export class SelectScene {
  constructor(mode) { this.mode = mode; }
  enter() {
    this.t = 0;
    playMusic('select');
    this.cur = [0, 15];
    this.teams = [[], []];
    // in arcade/training player 1 picks both teams
    this.phase = 0; // 0: P1 team, 1: P2/CPU team, 2: done
    this.preview = [null, null];
    this.previewId = [null, null];
    this.flashT = [0, 0];
  }
  pickerFor(slot) { return this.mode === 'versus' ? pads[slot] : pads[0]; }
  update() {
    this.t++;
    const versus = this.mode === 'versus';
    const slots = versus ? [0, 1] : [this.phase === 0 ? 0 : 1];
    if (this.phase >= 2) return;
    for (const slot of slots) {
      const pad = this.pickerFor(slot);
      if (this.teams[slot].length >= 2) {
        if (pad.back()) { this.teams[slot].pop(); sfx('back'); if (!versus) this.phase = slot; }
        continue;
      }
      if (pad.pressed('left')) { this.cur[slot] = moveCursor(this.cur[slot], -1, 0); sfx('cursor'); }
      if (pad.pressed('right')) { this.cur[slot] = moveCursor(this.cur[slot], 1, 0); sfx('cursor'); }
      if (pad.pressed('up') || pad.pressed('down')) { this.cur[slot] = moveCursor(this.cur[slot], 0, 1); sfx('cursor'); }
      if (pad.pressed('ta')) { this.cur[slot] = Math.floor(rand(0, 20)); sfx('cursor'); }
      if (pad.confirm()) {
        const d = game.roster[this.cur[slot]];
        if (this.teams[slot].includes(d)) { sfx('back'); continue; }
        this.teams[slot].push(d);
        this.flashT[slot] = 12;
        sfx('confirm');
        say(d.name.replace('DR.', 'Doctor').replace('MR.', 'Mister').toLowerCase(), { pitch: 0.6, rate: 1.1 });
        if (this.teams[slot].length === 2 && !versus) { this.phase = slot === 0 ? 1 : 2; if (this.phase === 1) this.cur[1] = this.cur[0] < 10 ? 15 : 5; }
      } else if (pad.back()) {
        if (this.teams[slot].length) { this.teams[slot].pop(); sfx('back'); }
        else if (!versus && slot === 1) { this.phase = 0; this.teams[0].pop(); sfx('back'); }
        else { sfx('back'); go(new MenuScene()); return; }
      }
    }
    if (versus && this.teams[0].length === 2 && this.teams[1].length === 2) this.phase = 2;
    if (this.phase === 2) { this.doneT = 0; setTimeout(() => go(new StageScene(this.mode, this.teams)), 500); }
    for (let s = 0; s < 2; s++) if (this.flashT[s] > 0) this.flashT[s]--;
  }
  draw(ctx) {
    backdrop(ctx, this.t, 0.45);
    const versus = this.mode === 'versus';
    const title = this.phase === 0 ? (versus ? 'CHOOSE YOUR TEAMS' : 'CHOOSE YOUR TEAM') : this.phase === 1 ? (this.mode === 'training' ? 'CHOOSE TRAINING DUMMIES' : 'CHOOSE YOUR OPPONENTS') : 'GET READY!';
    text(ctx, title, W / 2, 22, { size: 12, align: 'center', grad: ['#fff', '#ffd000'], stroke: '#000', strokeW: 4 });
    // big hovered portraits + live previews
    for (let s = 0; s < 2; s++) {
      const show = this.teams[s].length >= 2 ? this.teams[s][1] : game.roster[this.cur[s]];
      if (!versus && s === 1 && this.phase === 0) continue;
      const d = show;
      if (this.previewId[s] !== d.id) { this.preview[s] = makePreview(d); this.previewId[s] = d.id; this.preview[s].setAnim('idle'); }
      const img = game.pix[d.id];
      const h = 196;
      const w = img ? img.width * h / img.height : 100;
      const x = s ? W - 6 - Math.min(w, 220) : 6;
      ctx.save(); ctx.beginPath(); ctx.rect(s ? W - 226 : 0, 34, 226, 210); ctx.clip();
      pixPortrait(ctx, d.id, s ? W - 6 - w : 6, 40, h, s === 1, 0.95);
      ctx.restore();
      void x;
      const nx = s ? W - 12 : 12;
      text(ctx, d.name, nx, 228, { size: 12, align: s ? 'right' : 'left', color: '#fff', stroke: '#000', strokeW: 4 });
      text(ctx, d.side === 'marvel' ? 'MARVEL' : 'DC', nx, 242, { size: 7, align: s ? 'right' : 'left', color: d.side === 'marvel' ? '#ff5a5a' : '#6aa8ff', stroke: '#000' });
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(s ? 470 : 170, 240, 30, 5, 0, 0, Math.PI * 2); ctx.fill();
      drawPreview(ctx, this.preview[s], s ? 470 : 170, 240, s ? -1 : 1, 0.95);
    }
    // center: team slots + movelist of hovered
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(232, 34, 176, 210);
    const slotBox = (x, y, d, label, col) => {
      ctx.fillStyle = '#0b0b18'; ctx.fillRect(x, y, 34, 34); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x, y, 34, 34);
      if (d) { ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, 32, 32); ctx.clip(); const img = game.portraits[d.id]; const s2 = 32 / (img.width * 0.55); const fc = d.face || [0.5, 0.12]; ctx.drawImage(img, x + 17 - img.width * s2 * fc[0], y + 22 - img.height * s2 * fc[1], img.width * s2, img.height * s2); ctx.restore(); }
      else text(ctx, '?', x + 17, y + 22, { size: 12, align: 'center', color: '#555' });
      void label;
    };
    text(ctx, versus ? '1P' : 'YOU', 252, 50, { size: 7, align: 'center', color: '#ff6a6a' });
    slotBox(238, 54, this.teams[0][0], '', '#e02424'); slotBox(276, 54, this.teams[0][1], '', '#e02424');
    text(ctx, 'VS', 320, 76, { size: 10, align: 'center', grad: ['#fff', '#ffd000'], stroke: '#000' });
    text(ctx, versus ? '2P' : this.mode === 'training' ? 'DUMMY' : 'CPU', 388, 50, { size: 7, align: 'center', color: '#6aa8ff' });
    slotBox(330, 54, this.teams[1][0], '', '#2a6cf0'); slotBox(368, 54, this.teams[1][1], '', '#2a6cf0');
    const hov = game.roster[this.cur[this.phase === 1 && !versus ? 1 : 0]];
    text(ctx, hov.name, 320, 106, { size: 7, align: 'center', color: '#ffe06a' });
    const st = hov.stats;
    const bars = [['POWER', (st.power || 1) / 1.25], ['SPEED', st.walk / 4.2], ['HEALTH', st.hp / 1300]];
    bars.forEach(([n, v], i) => { text(ctx, n, 240, 120 + i * 11, { size: 6, color: '#ccc' }); ctx.fillStyle = '#222'; ctx.fillRect(290, 114 + i * 11, 110, 6); ctx.fillStyle = ['#ff5a3a', '#ffd000', '#5aff7a'][i]; ctx.fillRect(290, 114 + i * 11, 110 * clamp(v, 0.1, 1), 6); });
    const B = game.built[hov.id];
    let yy = 160;
    B.specials.forEach((m, i) => { text(ctx, m.name, 240, yy, { size: 5, color: '#fff' }); text(ctx, SPECIAL_INPUTS[i].label, 402, yy, { size: 5, align: 'right', color: '#9fe8ff' }); yy += 10; });
    B.hypers.forEach((m, i) => { text(ctx, m.name, 240, yy, { size: 5, color: '#ffd000' }); text(ctx, HYPER_INPUTS[i].simple, 402, yy, { size: 5, align: 'right', color: '#ffb060' }); yy += 10; });
    text(ctx, 'T: RANDOM', 320, 240, { size: 5, align: 'center', color: '#888' });
    // grid
    text(ctx, 'MARVEL', 56 + 118, 252, { size: 8, align: 'center', color: '#ff4a4a', stroke: '#000', strokeW: 3 });
    text(ctx, 'DC', 344 + 118, 252, { size: 8, align: 'center', color: '#5a9aff', stroke: '#000', strokeW: 3 });
    game.roster.forEach((d, i) => {
      const [x, y] = cellPos(i);
      ctx.fillStyle = d.side === 'marvel' ? '#3a0408' : '#04103a'; ctx.fillRect(x, y, CELL, CELL);
      const img = game.portraits[d.id];
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, CELL - 2, CELL - 2); ctx.clip();
      const s2 = (CELL - 2) / (img.width * 0.55); const fc = d.face || [0.5, 0.12];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(game.pix[d.id], x + CELL / 2 - img.width * s2 * fc[0], y + CELL * 0.62 - img.height * s2 * fc[1], img.width * s2, img.height * s2);
      ctx.restore();
      const picked = this.teams[0].includes(d) || this.teams[1].includes(d);
      if (picked) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, CELL, CELL); }
      ctx.strokeStyle = d.side === 'marvel' ? '#a01018' : '#1a3aa0'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
    });
    // cursors
    for (let s = 0; s < 2; s++) {
      const active = versus ? this.teams[s].length < 2 : this.phase === s;
      if (!active) continue;
      const [x, y] = cellPos(this.cur[s]);
      const col = s ? '#3a8aff' : '#ff3a3a';
      const blink = this.t % 20 < 14;
      ctx.strokeStyle = blink ? col : '#fff'; ctx.lineWidth = 3; ctx.strokeRect(x - 1.5, y - 1.5, CELL + 3, CELL + 3);
      text(ctx, versus ? (s ? '2P' : '1P') : (s ? (this.mode === 'training' ? 'DUMMY' : 'CPU') : '1P'), x + (s ? CELL - 2 : 2), y + 8, { size: 6, align: s ? 'right' : 'left', color: '#fff', stroke: col, strokeW: 3 });
    }
  }
}

// ======================================================================= STAGE SELECT
export class StageScene {
  constructor(mode, teams) { this.mode = mode; this.teams = teams; }
  enter() { this.t = 0; this.sel = 0; this.opts = [...STAGES.map((s) => s.id), 'random']; }
  update() {
    this.t++;
    const p = P1(), q = P2();
    const n = this.opts.length;
    if (p.pressed('left') || q.pressed('left')) { this.sel = (this.sel + n - 1) % n; sfx('cursor'); }
    if (p.pressed('right') || q.pressed('right')) { this.sel = (this.sel + 1) % n; sfx('cursor'); }
    if (anyBack()) { sfx('back'); go(new SelectScene(this.mode)); return; }
    if (anyConfirm()) {
      sfx('confirm');
      let id = this.opts[this.sel];
      if (id === 'random') id = pick(STAGES).id;
      go(new VsScene(this.mode, this.teams, id));
    }
  }
  draw(ctx) {
    const id = this.opts[this.sel];
    if (id !== 'random') ctx.drawImage(getStage(id).thumb, 0, 0); else backdrop(ctx, this.t, 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'SELECT STAGE', W / 2, 40, { size: 16, align: 'center', grad: ['#fff', '#ffd000'], stroke: '#000', strokeW: 4 });
    const label = id === 'random' ? 'RANDOM' : STAGES.find((s) => s.id === id).label;
    text(ctx, '<  ' + label + '  >', W / 2, H / 2, { size: 14, align: 'center', color: '#fff', stroke: '#000', strokeW: 5 });
    this.opts.forEach((o, i) => { ctx.fillStyle = i === this.sel ? '#ffd000' : '#666'; ctx.fillRect(W / 2 - this.opts.length * 8 + i * 16, H / 2 + 20, 10, 4); });
    text(ctx, 'CONFIRM TO FIGHT', W / 2, H - 30, { size: 8, align: 'center', color: '#fff', stroke: '#000' });
  }
}

// ======================================================================= VS SCREEN
export class VsScene {
  constructor(mode, teams, stageId) { this.mode = mode; this.teams = teams; this.stageId = stageId; }
  enter() { this.t = 0; sfx('hyper'); say(this.teams[0].map((d) => d.name).join(' and ') + ' versus ' + this.teams[1].map((d) => d.name).join(' and '), { pitch: 0.5, rate: 1.15 }); getStage(this.stageId); }
  update() {
    this.t++;
    if (this.t > 150 || (this.t > 30 && anyConfirm())) go(new FightScene(this.mode, this.teams, this.stageId));
  }
  draw(ctx) {
    backdrop(ctx, this.t * 3, 0.2);
    const k = Math.min(1, this.t / 18);
    const e = 1 - (1 - k) ** 3;
    this.teams.forEach((team, s) => {
      team.forEach((d, i) => {
        const img = game.pix[d.id];
        const h = i === 0 ? 250 : 180;
        const w = img.width * h / img.height;
        const base = s ? W - w - 10 - i * 110 : 10 + i * 110;
        const x = lerp(s ? W + 50 : -w - 50, base, e);
        pixPortrait(ctx, d.id, x, H - h - 20 + i * 10, h, s === 1, i ? 0.8 : 1);
      });
      const names = team.map((d) => d.name).join(' & ');
      text(ctx, names, s ? W - 14 : 14, s ? H - 8 : 24, { size: 9, align: s ? 'right' : 'left', color: '#fff', stroke: s ? '#1a3aa0' : '#a01018', strokeW: 4 });
    });
    const p = 1 + Math.max(0, 1 - this.t / 10) * 2;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(p, p);
    text(ctx, 'VS', 0, 0, { size: 48, align: 'center', base: 'middle', grad: ['#fffbd0', '#ffd000', '#ff3000'], stroke: '#000', strokeW: 8, shadowOff: 5, italic: true });
    ctx.restore();
    text(ctx, STAGES.find((s) => s.id === this.stageId).label, W / 2, H / 2 + 46, { size: 7, align: 'center', color: '#fff', stroke: '#000' });
  }
}

// ======================================================================= FIGHT
export class FightScene {
  constructor(mode, teams, stageId) { this.mode = mode; this.teams = teams; this.stageId = stageId; }
  enter() {
    game.last = { mode: this.mode, teams: this.teams, stageId: this.stageId };
    const stage = getStage(this.stageId);
    playMusic(stage.music);
    pads[1].cpu = null;
    const cpu = this.mode !== 'versus';
    this.paused = false; this.psel = 0; this.showMoves = false;
    this.battle = new Battle({
      stage, training: this.mode === 'training', portraits: game.pix,
      teams: [
        { defs: this.teams[0], built: this.teams[0].map((d) => game.built[d.id]), pad: pads[0] },
        { defs: this.teams[1], built: this.teams[1].map((d) => game.built[d.id]), pad: pads[1], cpu, level: game.difficulty },
      ],
      onEnd: (r) => go(new ResultScene(this.mode, this.teams, this.stageId, r)),
    });
  }
  update() {
    const p1 = P1(), p2 = P2();
    if (this.paused) {
      p1.update(); p2.update();
      if (this.showMoves) { if (p1.confirm() || p1.back() || p1.pressed('st') || p2.confirm()) { this.showMoves = false; sfx('back'); } return; }
      const items = 4;
      if (p1.pressed('up')) { this.psel = (this.psel + items - 1) % items; sfx('cursor'); }
      if (p1.pressed('down')) { this.psel = (this.psel + 1) % items; sfx('cursor'); }
      if (p1.pressed('st') || p1.pressed('bk')) { this.paused = false; sfx('back'); return; }
      if (p1.confirm()) {
        sfx('confirm');
        if (this.psel === 0) this.paused = false;
        else if (this.psel === 1) this.showMoves = true;
        else if (this.psel === 2) { pads[1].cpu = null; go(new SelectScene(this.mode)); }
        else { pads[1].cpu = null; go(new MenuScene()); }
      }
      return;
    }
    // pause check happens on the human pads' edge state (battle updates pads itself)
    const pauseHit = (p1.held('st') && !p1.prev.st) || (p1.held('bk') && !p1.prev.bk) || (!this.battle.teams[1].cpu && p2.held('st') && !p2.prev.st);
    this.battle.update();
    if (pauseHit && this.battle.phase === 'fight') { this.paused = true; this.psel = 0; sfx('confirm'); }
  }
  draw(ctx) {
    this.battle.draw(ctx);
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,10,0.7)'; ctx.fillRect(0, 0, W, H);
      if (this.showMoves) { this.drawMoves(ctx); return; }
      text(ctx, 'PAUSED', W / 2, 90, { size: 20, align: 'center', grad: ['#fff', '#ffd000'], stroke: '#000', strokeW: 5 });
      menuList(ctx, ['RESUME', 'MOVE LIST', 'CHARACTER SELECT', 'MAIN MENU'], this.psel, W / 2, 140);
    }
  }
  drawMoves(ctx) {
    const b = this.battle;
    b.teams.forEach((team, s) => {
      const x0 = s ? 330 : 14;
      let y = 24;
      team.members.forEach((f) => {
        text(ctx, f.def.name, x0, y, { size: 8, color: s ? '#6aa8ff' : '#ff6a6a' }); y += 14;
        f.B.specials.forEach((m, i) => { text(ctx, m.name, x0, y, { size: 5, color: '#fff' }); text(ctx, SPECIAL_INPUTS[i].label + '  (' + SPECIAL_INPUTS[i].simple + ')', x0 + 296, y, { size: 5, align: 'right', color: '#9fe8ff' }); y += 10; });
        f.B.hypers.forEach((m, i) => { text(ctx, m.name, x0, y, { size: 5, color: '#ffd000' }); text(ctx, HYPER_INPUTS[i].label + '  (' + HYPER_INPUTS[i].simple + ')', x0 + 296, y, { size: 5, align: 'right', color: '#ffb060' }); y += 10; });
        y += 8;
      });
    });
    text(ctx, 'CROUCH+HP: LAUNCHER   FWD/BACK+HP CLOSE: THROW   TAG+HYPER (2 BARS): CROSSOVER', W / 2, H - 30, { size: 5, align: 'center', color: '#ccc' });
    text(ctx, 'PRESS ANY BUTTON', W / 2, H - 14, { size: 6, align: 'center', color: '#888' });
  }
}

// ======================================================================= RESULTS
export class ResultScene {
  constructor(mode, teams, stageId, r) { this.mode = mode; this.teams = teams; this.stageId = stageId; this.r = r; }
  enter() { this.t = 0; this.sel = 0; playMusic('victory'); pads[1].cpu = null; this.winTeam = this.teams[this.r.winner]; this.prev = this.winTeam.map((d) => { const f = makePreview(d); f.setAnim('win'); return f; }); }
  update() {
    this.t++;
    const p = P1();
    if (p.pressed('up')) { this.sel = (this.sel + 2) % 3; sfx('cursor'); }
    if (p.pressed('down')) { this.sel = (this.sel + 1) % 3; sfx('cursor'); }
    if (this.t > 30 && anyConfirm()) {
      sfx('confirm');
      if (this.sel === 0) go(new VsScene(this.mode, this.teams, this.stageId));
      else if (this.sel === 1) go(new SelectScene(this.mode));
      else go(new MenuScene());
    }
  }
  draw(ctx) {
    backdrop(ctx, this.t, 0.4);
    const w = this.r.winner;
    const who = this.mode === 'versus' ? (w ? 'PLAYER 2' : 'PLAYER 1') : (w ? 'CPU' : 'YOU');
    text(ctx, who + ' WIN' + (who === 'YOU' || who === 'CPU' ? (who === 'YOU' ? '!' : 'S') : 'S!'), W / 2, 40, { size: 20, align: 'center', grad: ['#fff', '#ffd000', '#ff5000'], stroke: '#000', strokeW: 5 });
    this.winTeam.forEach((d, i) => {
      pixPortrait(ctx, d.id, i ? W - 230 : 20, 60, 230, i === 1, 0.9);
    });
    this.prev.forEach((f, i) => drawPreview(ctx, f, i ? 400 : 240, 300, i ? -1 : 1, 1.1));
    const q = this.r.battle.winQuote;
    if (q) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(110, 70, 420, 26); text(ctx, '"' + q + '"', W / 2, 87, { size: 6, align: 'center', color: '#fff' }); }
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(W / 2 - 140, 300, 280, 56);
    menuList(ctx, ['REMATCH', 'CHARACTER SELECT', 'MAIN MENU'], this.sel, W / 2, 318, { gap: 16 });
  }
}
void GROUND; void shade; void makeCanvas;

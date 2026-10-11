// Keyboard + gamepad + touch input, with motion (quarter-circle etc.) detection.
const BUTTONS = ['up', 'down', 'left', 'right', 'lp', 'hp', 'lk', 'hk', 'sp', 'hy', 'as', 'tg', 'ta', 'st', 'bk'];

export const KEYMAP = [
  { // Player 1
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    KeyU: 'lp', KeyI: 'hp', KeyJ: 'lk', KeyK: 'hk', KeyO: 'sp', KeyL: 'hy',
    KeyY: 'as', KeyH: 'tg', KeyT: 'ta', Enter: 'st', Escape: 'bk', Space: 'st',
  },
  { // Player 2
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    Numpad4: 'lp', Numpad5: 'hp', Numpad1: 'lk', Numpad2: 'hk', Numpad6: 'sp', Numpad3: 'hy',
    Numpad7: 'as', Numpad8: 'tg', Numpad9: 'ta', NumpadEnter: 'st', Numpad0: 'bk',
    // laptop fallback cluster for player 2
    Comma: 'lp', Period: 'hp', KeyM: 'lk', KeyN: 'hk', Slash: 'sp', Semicolon: 'hy',
    BracketLeft: 'as', BracketRight: 'tg', Backslash: 'ta', ShiftRight: 'st', Backspace: 'bk',
  },
];

const keysDown = new Set();
const touchDown = new Set();
const touchTapped = new Set();
let touchActive = false;
let padActivityCb = null;
export function onPadActivity(cb) { padActivityCb = cb; }
function padActivity() { if (padActivityCb) { const cb = padActivityCb; padActivityCb = null; cb(); } }
let anyKeyCb = null;

window.addEventListener('keydown', (e) => {
  if (KEYMAP[0][e.code] || KEYMAP[1][e.code]) e.preventDefault();
  keysDown.add(e.code);
  // latch taps so a press shorter than one frame still registers
  pads.forEach((p) => p.tap.add(e.code));
  if (anyKeyCb) anyKeyCb(e);
});
window.addEventListener('keyup', (e) => keysDown.delete(e.code));
window.addEventListener('blur', () => keysDown.clear());

export function onAnyKey(cb) { anyKeyCb = cb; }

// Standard gamepad layout (PS5 DualSense / PS4 / Xbox all report this mapping in browsers):
// 0 Cross  1 Circle  2 Square  3 Triangle  4 L1  5 R1  6 L2  7 R2  8 Create  9 Options  12-15 D-pad  17 Touchpad
const PADMAP = { 2: 'lp', 3: 'hp', 0: 'lk', 1: 'hk', 5: 'sp', 7: 'hy', 4: 'as', 6: 'tg', 8: 'ta', 9: 'st', 17: 'st', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

// connected controllers in connection order: first one drives player 1, second player 2
export function connectedPads() {
  const gps = navigator.getGamepads ? [...navigator.getGamepads()] : [];
  return gps.filter((g) => g && g.connected);
}
export function padKind(gp) {
  const id = (gp && gp.id || '').toLowerCase();
  if (id.includes('dualsense') || id.includes('0ce6') || id.includes('0df2')) return 'PS5';
  if (id.includes('054c') || id.includes('dualshock') || id.includes('wireless controller')) return 'PlayStation';
  if (id.includes('xbox') || id.includes('045e')) return 'Xbox';
  return 'Gamepad';
}
const listeners = [];
export function onPadEvent(cb) { listeners.push(cb); }
window.addEventListener('gamepadconnected', (e) => listeners.forEach((cb) => cb('connect', e.gamepad)));
window.addEventListener('gamepaddisconnected', (e) => listeners.forEach((cb) => cb('disconnect', e.gamepad)));

export class Pad {
  constructor(id) {
    this.id = id;
    this.cur = {};
    this.prev = {};
    this.hist = []; // recent numpad directions relative to facing
    this.cpu = null; // AI-controlled virtual pad
    this.virt = {};
    this.tap = new Set();
    this.gp = null;
  }
  update() {
    this.prev = this.cur;
    const c = {};
    if (this.cpu) {
      Object.assign(c, this.virt);
    } else {
      const map = KEYMAP[this.id];
      for (const code of keysDown) if (map[code]) c[map[code]] = true;
      for (const code of this.tap) if (map[code]) c[map[code]] = true;
      if (this.id === 0) { for (const b of touchDown) c[b] = true; for (const b of touchTapped) c[b] = true; touchTapped.clear(); }
      const gp = connectedPads()[this.id] || null;
      this.gp = gp;
      if (gp) {
        gp.buttons.forEach((b, i) => { if ((b.pressed || b.value > 0.4) && PADMAP[i]) c[PADMAP[i]] = true; });
        const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        // 8-way stick with a generous diagonal zone so quarter-circles are easy
        const mag = Math.hypot(ax, ay);
        if (mag > 0.42) {
          const ang = Math.atan2(ay, ax);
          const oct = Math.round(ang / (Math.PI / 4));
          const dirs = { 0: ['right'], 1: ['right', 'down'], 2: ['down'], 3: ['left', 'down'], 4: ['left'], '-4': ['left'], '-3': ['left', 'up'], '-2': ['up'], '-1': ['right', 'up'] };
          (dirs[oct] || []).forEach((d) => { c[d] = true; });
        }
        if (gp.buttons.some((b) => b.pressed)) padActivity();
      }
    }
    this.tap.clear();
    this.cur = c;
  }
  // controller rumble (DualSense / Xbox in Chromium) or phone vibration for touch players
  rumble(ms = 80, strong = 0.6, weak = 0.4) {
    if (this.cpu) return;
    const gp = this.gp;
    try {
      if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
        gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
      } else if (this.id === 0 && touchActive && navigator.vibrate) navigator.vibrate(Math.min(ms, 60));
    } catch (e) { /* unsupported */ }
  }
  held(b) { return !!this.cur[b]; }
  pressed(b) { return !!this.cur[b] && !this.prev[b]; }
  released(b) { return !this.cur[b] && !!this.prev[b]; }
  anyPressed(...bs) { return bs.some((b) => this.pressed(b)); }
  confirm() { return this.anyPressed('lp', 'lk', 'st'); }
  back() { return this.anyPressed('bk', 'hk'); }
  // numpad notation relative to facing (6 = toward opponent)
  dirNum(facing) {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    const y = (this.held('up') ? 1 : 0) - (this.held('down') ? 1 : 0);
    x *= facing;
    return 5 + x + y * 3;
  }
  record(facing) {
    this.hist.push(this.dirNum(facing));
    if (this.hist.length > 30) this.hist.shift();
  }
  // does the recent history contain the sequence (each step allowed within `win` frames)?
  motion(seq, win = 14) {
    const h = this.hist;
    let i = h.length - 1;
    const lastAllowed = h.length - 10;
    // last step must be recent
    let k = seq.length - 1;
    let found = -1;
    for (; i >= 0 && i >= lastAllowed; i--) if (h[i] === seq[k]) { found = i; break; }
    if (found < 0) return false;
    k--;
    i = found - 1;
    let budget = win;
    while (k >= 0 && i >= 0 && budget > 0) {
      if (h[i] === seq[k]) { k--; budget = win; }
      i--;
      budget--;
    }
    return k < 0;
  }
  clearMotion() { this.hist.length = 0; }
}

export const pads = [new Pad(0), new Pad(1)];
export function updatePads() { pads.forEach((p) => p.update()); }

// on-screen touch controls for phones/tablets: floating stick on the left half,
// arcade button cluster on the right. Thumbs can slide across buttons (rolling inputs).
let emptyTapCb = null;
export function onEmptyTap(cb) { emptyTapCb = cb; }
export function setupTouch() {
  const root = document.getElementById('touch');
  if (!root) return;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;
  touchActive = true;
  root.classList.add('on');
  document.body.classList.add('touch');
  const stickZone = root.querySelector('.stickzone');
  const base = root.querySelector('.stick');
  const knob = root.querySelector('.knob');
  const btnEls = [...root.querySelectorAll('[data-b]')];
  const owners = new Map(); // touch id -> 'stick' | button element
  let stickId = null, ox = 0, oy = 0;
  const DIRS = ['up', 'down', 'left', 'right'];

  const setStick = (x, y) => {
    const dx = x - ox, dy = y - oy;
    const R = base.offsetWidth / 2;
    DIRS.forEach((d) => touchDown.delete(d));
    const mag = Math.hypot(dx, dy);
    if (mag > R * 0.28) {
      const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
      const map = { 0: ['right'], 1: ['right', 'down'], 2: ['down'], 3: ['left', 'down'], 4: ['left'], '-4': ['left'], '-3': ['left', 'up'], '-2': ['up'], '-1': ['right', 'up'] };
      (map[oct] || []).forEach((d) => touchDown.add(d));
    }
    const k = Math.min(1, mag / R);
    const a = Math.atan2(dy, dx);
    knob.style.transform = `translate(${Math.cos(a) * k * R * 0.6}px, ${Math.sin(a) * k * R * 0.6}px)`;
  };
  const btnAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest('[data-b]') : null;
  };
  const press = (el) => { if (!el) return; el.dataset.b.split(' ').forEach((b) => { touchDown.add(b); touchTapped.add(b); }); el.classList.add('down'); if (navigator.vibrate) navigator.vibrate(8); };
  const release = (el) => {
    if (!el) return;
    // only release if no other finger is on the same button
    for (const [, o] of owners) if (o === el) return;
    el.dataset.b.split(' ').forEach((b) => touchDown.delete(b)); el.classList.remove('down');
  };
  const goFull = () => {
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI: 'hide' }).then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
  };

  const down = (t) => {
    const zone = t.target.closest ? t.target.closest('.stickzone') : null;
    if (zone && stickId === null) {
      stickId = t.pointerId; owners.set(t.pointerId, 'stick');
      const r = stickZone.getBoundingClientRect();
      ox = t.clientX; oy = t.clientY;
      base.style.left = (ox - r.left) + 'px'; base.style.top = (oy - r.top) + 'px';
      base.classList.add('live');
      setStick(t.clientX, t.clientY);
    } else {
      const el = btnAt(t.clientX, t.clientY);
      owners.set(t.pointerId, el);
      if (el) press(el); else if (emptyTapCb) emptyTapCb();
    }
  };
  root.addEventListener('pointerdown', (e) => { e.preventDefault(); goFull(); down(e); }, { passive: false });
  root.addEventListener('pointermove', (e) => {
    if (!owners.has(e.pointerId)) return;
    e.preventDefault();
    const o = owners.get(e.pointerId);
    if (o === 'stick') { setStick(e.clientX, e.clientY); return; }
    const el = btnAt(e.clientX, e.clientY);
    if (el !== o) { owners.set(e.pointerId, el); release(o); press(el); }
  }, { passive: false });
  const end = (e) => {
    if (!owners.has(e.pointerId)) return;
    const o = owners.get(e.pointerId);
    owners.delete(e.pointerId);
    if (o === 'stick') { stickId = null; DIRS.forEach((d) => touchDown.delete(d)); knob.style.transform = ''; base.classList.remove('live'); }
    else release(o);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('contextmenu', (e) => e.preventDefault());
  void btnEls;
}
export { BUTTONS };

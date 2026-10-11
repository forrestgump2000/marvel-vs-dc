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

// standard gamepad layout
const PADMAP = { 2: 'lp', 3: 'hp', 0: 'lk', 1: 'hk', 5: 'sp', 7: 'hy', 4: 'as', 6: 'tg', 8: 'ta', 9: 'st', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export class Pad {
  constructor(id) {
    this.id = id;
    this.cur = {};
    this.prev = {};
    this.hist = []; // recent numpad directions relative to facing
    this.cpu = null; // AI-controlled virtual pad
    this.virt = {};
    this.tap = new Set();
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
      if (this.id === 0) for (const b of touchDown) c[b] = true;
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gps && gps[this.id];
      if (gp) {
        gp.buttons.forEach((b, i) => { if (b.pressed && PADMAP[i]) c[PADMAP[i]] = true; });
        const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        if (ax < -0.45) c.left = true;
        if (ax > 0.45) c.right = true;
        if (ay < -0.5) c.up = true;
        if (ay > 0.5) c.down = true;
      }
    }
    this.tap.clear();
    this.cur = c;
  }
  held(b) { return !!this.cur[b]; }
  pressed(b) { return !!this.cur[b] && !this.prev[b]; }
  released(b) { return !this.cur[b] && !!this.prev[b]; }
  anyPressed(...bs) { return bs.some((b) => this.pressed(b)); }
  confirm() { return this.anyPressed('lp', 'lk', 'st'); }
  back() { return this.anyPressed('bk', 'hp'); }
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

// on-screen touch controls for phones/tablets
export function setupTouch() {
  const root = document.getElementById('touch');
  if (!root) return;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;
  root.classList.add('on');
  root.querySelectorAll('[data-b]').forEach((el) => {
    const bs = el.dataset.b.split(' ');
    const down = (e) => { e.preventDefault(); bs.forEach((b) => touchDown.add(b)); el.classList.add('down'); };
    const up = (e) => { e.preventDefault(); bs.forEach((b) => touchDown.delete(b)); el.classList.remove('down'); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
  });
  // analog-ish stick
  const stick = root.querySelector('.stick');
  if (stick) {
    const knob = stick.querySelector('.knob');
    const set = (t) => {
      const r = stick.getBoundingClientRect();
      const dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
      ['up', 'down', 'left', 'right'].forEach((b) => touchDown.delete(b));
      const dead = r.width * 0.18;
      if (dx < -dead) touchDown.add('left');
      if (dx > dead) touchDown.add('right');
      if (dy < -dead) touchDown.add('up');
      if (dy > dead) touchDown.add('down');
      const m = Math.min(1, Math.hypot(dx, dy) / (r.width / 2));
      const a = Math.atan2(dy, dx);
      knob.style.transform = `translate(${Math.cos(a) * m * 30}px, ${Math.sin(a) * m * 30}px)`;
    };
    stick.addEventListener('touchstart', (e) => { e.preventDefault(); set(e.targetTouches[0]); }, { passive: false });
    stick.addEventListener('touchmove', (e) => { e.preventDefault(); set(e.targetTouches[0]); }, { passive: false });
    const end = (e) => { e.preventDefault(); ['up', 'down', 'left', 'right'].forEach((b) => touchDown.delete(b)); knob.style.transform = ''; };
    stick.addEventListener('touchend', end, { passive: false });
    stick.addEventListener('touchcancel', end, { passive: false });
  }
}
export { BUTTONS };

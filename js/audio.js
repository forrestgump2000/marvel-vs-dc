// Synthesized arcade sound effects and a tiny chiptune-rock music sequencer (no audio files needed).
let ac = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
export const settings = { music: true, sfx: true, voice: true };

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
  comp.connect(master);
  sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(comp);
  musBus = ac.createGain(); musBus.gain.value = 0.32; musBus.connect(comp);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function env(g, t, a, peak, dcy, end = 0.0001) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(end, t + a + dcy);
}
function osc(type, f0, f1, dur, vol, t0 = 0, bus = sfxBus) {
  const t = ac.currentTime + t0;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, 0.005, vol, dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, fType, f0, f1, t0 = 0, q = 1, bus = sfxBus) {
  const t = ac.currentTime + t0;
  const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = fType; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  const g = ac.createGain(); env(g, t, 0.004, vol, dur);
  s.connect(f); f.connect(g); g.connect(bus);
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
}

const SFX = {
  cursor: () => osc('square', 880, 880, 0.05, 0.12),
  confirm: () => { osc('square', 660, 660, 0.06, 0.15); osc('square', 990, 990, 0.12, 0.15, 0.06); },
  back: () => osc('square', 440, 220, 0.12, 0.12),
  whoosh: () => noise(0.14, 0.25, 'bandpass', 600, 2400, 0, 1.5),
  whooshH: () => noise(0.22, 0.35, 'bandpass', 300, 1800, 0, 1.2),
  hitL: () => { noise(0.08, 0.6, 'lowpass', 3000, 400); osc('square', 220, 70, 0.08, 0.35); },
  hitM: () => { noise(0.12, 0.8, 'lowpass', 2500, 300); osc('sawtooth', 160, 45, 0.12, 0.4); },
  hitH: () => { noise(0.2, 1.0, 'lowpass', 2000, 120); osc('sine', 120, 35, 0.25, 0.8); osc('square', 90, 40, 0.15, 0.3); },
  slash: () => { noise(0.12, 0.6, 'highpass', 6000, 2500); osc('sawtooth', 1400, 500, 0.08, 0.15); },
  block: () => { osc('square', 1200, 900, 0.04, 0.25); noise(0.05, 0.4, 'highpass', 4000, 3000); },
  jump: () => osc('square', 200, 500, 0.08, 0.1),
  land: () => noise(0.06, 0.25, 'lowpass', 600, 100),
  energy: () => { osc('sawtooth', 300, 900, 0.25, 0.22); osc('square', 600, 1800, 0.2, 0.1); },
  blast: () => { noise(0.3, 0.6, 'bandpass', 2000, 300, 0, 0.8); osc('sawtooth', 500, 80, 0.3, 0.3); },
  beam: () => { osc('sawtooth', 110, 110, 0.6, 0.25); osc('square', 220, 230, 0.6, 0.12); noise(0.6, 0.25, 'bandpass', 1500, 1500, 0, 2); },
  boom: () => { noise(0.7, 1.1, 'lowpass', 1200, 50); osc('sine', 90, 25, 0.7, 0.9); },
  fire: () => { noise(0.45, 0.6, 'bandpass', 900, 300, 0, 0.6); },
  zap: () => { for (let i = 0; i < 4; i++) osc('square', 1800 - i * 300, 200, 0.06, 0.18, i * 0.04); noise(0.25, 0.5, 'highpass', 5000, 1500); },
  thunder: () => { noise(1.2, 1.2, 'lowpass', 3000, 60); osc('sine', 60, 30, 1, 0.8); },
  magic: () => { [0, 4, 7, 12].forEach((s, i) => osc('triangle', 523 * 2 ** (s / 12), 523 * 2 ** (s / 12), 0.2, 0.15, i * 0.05)); },
  web: () => { noise(0.12, 0.4, 'highpass', 3000, 6000); osc('sine', 1600, 400, 0.1, 0.12); },
  roar: () => { osc('sawtooth', 120, 60, 0.6, 0.4); noise(0.6, 0.5, 'bandpass', 400, 200, 0, 0.7); },
  laser: () => osc('square', 1800, 300, 0.12, 0.18),
  plant: () => { noise(0.3, 0.5, 'lowpass', 800, 200); osc('triangle', 150, 300, 0.2, 0.2); },
  splat: () => { noise(0.2, 0.7, 'lowpass', 900, 100); osc('sine', 200, 60, 0.15, 0.4); },
  hyper: () => { osc('sawtooth', 200, 1600, 0.5, 0.3); noise(0.5, 0.5, 'highpass', 1000, 8000); osc('square', 100, 800, 0.5, 0.15); },
  ko: () => { osc('sawtooth', 400, 50, 1.2, 0.5); noise(1.2, 0.8, 'lowpass', 2000, 60); },
  tag: () => { osc('square', 520, 1040, 0.12, 0.2); },
  throw: () => { noise(0.18, 0.6, 'lowpass', 1500, 200); osc('sine', 150, 50, 0.2, 0.5); },
  heal: () => { [0, 7, 12, 19].forEach((s, i) => osc('sine', 440 * 2 ** (s / 12), 440 * 2 ** (s / 12), 0.18, 0.12, i * 0.06)); },
  teleport: () => { osc('sine', 300, 2400, 0.25, 0.2); osc('sine', 2400, 300, 0.25, 0.15, 0.1); },
};

export function sfx(name) {
  if (!ac || !settings.sfx) return;
  const f = SFX[name];
  if (f) try { f(); } catch (e) { /* ignore */ }
}

// ---------------- Announcer (speech synthesis) ----------------
export function say(textStr, opts = {}) {
  if (!settings.voice || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(textStr);
    u.rate = opts.rate || 1.05; u.pitch = opts.pitch ?? 0.6; u.volume = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

// ---------------- Music ----------------
const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);
// tracks: root midi note, chord offsets per bar, lead pattern (scale degrees), tempo
export const TRACKS = {
  title: { bpm: 132, root: 45, prog: [0, -4, -2, -7], lead: [0, 3, 7, 10, 12, 10, 7, 3], drive: 0.7 },
  select: { bpm: 140, root: 50, prog: [0, 5, 3, -2], lead: [0, 7, 12, 7, 3, 7, 10, 7], drive: 0.5 },
  gotham: { bpm: 150, root: 40, prog: [0, 1, -2, -4], lead: [0, 3, 6, 3, 12, 11, 7, 3], drive: 1 },
  nyc: { bpm: 158, root: 45, prog: [0, -2, -4, -5], lead: [0, 7, 3, 7, 10, 7, 12, 14], drive: 1 },
  metropolis: { bpm: 146, root: 48, prog: [0, 5, -3, -5], lead: [0, 4, 7, 12, 11, 7, 4, 2], drive: 0.9, major: true },
  sanctum: { bpm: 138, root: 43, prog: [0, 1, 0, -1], lead: [0, 1, 4, 7, 8, 7, 4, 1], drive: 0.8 },
  swamp: { bpm: 128, root: 38, prog: [0, -2, -5, -7], lead: [0, 3, 5, 7, 10, 7, 5, 3], drive: 0.8 },
  oa: { bpm: 154, root: 47, prog: [0, -4, -9, -5], lead: [0, 7, 12, 15, 12, 7, 3, 7], drive: 1 },
  victory: { bpm: 120, root: 48, prog: [0, 5, 7, 0], lead: [0, 4, 7, 12, 7, 12, 16, 19], drive: 0.4, major: true },
};

let music = null;
export function playMusic(name) {
  if (!ac) return;
  if (music && music.name === name) return;
  stopMusic();
  const tr = TRACKS[name];
  if (!tr) return;
  music = { name, tr, step: 0, next: ac.currentTime + 0.1, timer: null };
  const m = music;
  const sixteenth = 60 / tr.bpm / 4;
  const tick = () => {
    if (music !== m) return;
    while (m.next < ac.currentTime + 0.25) {
      if (settings.music) scheduleStep(tr, m.step, m.next, sixteenth);
      m.next += sixteenth;
      m.step++;
    }
    m.timer = setTimeout(tick, 50);
  };
  tick();
}
export function stopMusic() {
  if (music && music.timer) clearTimeout(music.timer);
  music = null;
}

function tone(type, freq, t, dur, vol, cutoff) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  let node = o;
  if (cutoff) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); node = f; }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  node.connect(g); g.connect(musBus);
  o.start(t); o.stop(t + dur + 0.02);
}
function drum(kind, t) {
  if (kind === 'k') {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(musBus); o.start(t); o.stop(t + 0.2);
  } else {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = kind === 's' ? 'bandpass' : 'highpass';
    f.frequency.value = kind === 's' ? 1800 : 7000;
    const g = ac.createGain(); const v = kind === 's' ? 0.5 : 0.14; const d = kind === 's' ? 0.14 : 0.04;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(f); f.connect(g); g.connect(musBus); s.start(t, Math.random()); s.stop(t + d + 0.02);
  }
}
function scheduleStep(tr, step, t, six) {
  const bar = Math.floor(step / 16) % tr.prog.length;
  const s = step % 16;
  const root = tr.root + tr.prog[bar];
  // drums
  if (s % 8 === 0 || (tr.drive > 0.8 && s === 10)) drum('k', t);
  if (s % 8 === 4) drum('s', t);
  if (s % 2 === 0) drum('h', t);
  // bass: driving eighths with octave pops
  if (s % 2 === 0) tone('sawtooth', NOTE(root + (s % 8 === 6 ? 12 : 0)), t, six * 1.8, 0.22 * tr.drive + 0.08, 900);
  // power-chord stabs
  if (s === 0 || s === 6 || s === 12) {
    tone('square', NOTE(root + 12), t, six * 2.5, 0.05, 2200);
    tone('square', NOTE(root + 19), t, six * 2.5, 0.04, 2200);
  }
  // lead arpeggio on top
  const third = tr.major ? 4 : 3;
  const li = tr.lead[(s >> 1) % tr.lead.length];
  const deg = li === 3 ? third : li === 15 ? 12 + third : li;
  if (s % 2 === 1 || (step >> 6) % 2 === 1) tone('square', NOTE(root + 24 + deg), t, six * 0.9, 0.045);
}

// Boot: load portraits + font, build every character's animation set, run the 60fps loop.
import { W, H, makeCanvas, text } from './util.js';
import { updatePads, setupTouch, pads, onPadEvent, onPadActivity, onEmptyTap, padKind, connectedPads } from './input.js';
import { initAudio } from './audio.js';
import { buildCharacter } from './moves.js';
import { MARVEL } from './chars/marvel.js';
import { DC } from './chars/dc.js';
import { game, go, TitleScene, FightScene, loadSettings } from './scenes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
ctx.imageSmoothingEnabled = false;

function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  const k = s >= 1 ? Math.floor(s * 4) / 4 : s;
  canvas.style.width = Math.floor(W * k) + 'px';
  canvas.style.height = Math.floor(H * k) + 'px';
}
window.addEventListener('resize', fit);
fit();

let toastT = null;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
}

function loadImage(src) {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

// downsample so portraits read as chunky arcade pixel art when drawn large
function pixelate(img, h = 120) {
  const w = Math.round(img.width * h / img.height);
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    p[i + 3] = p[i + 3] > 110 ? 255 : 0;
    for (let k = 0; k < 3; k++) p[i + k] = Math.min(255, Math.round(p[i + k] / 20) * 20);
  }
  x.putImageData(d, 0, 0);
  return c;
}

function loadingScreen(msg, pct) {
  ctx.fillStyle = '#05050c'; ctx.fillRect(0, 0, W, H);
  text(ctx, 'MARVEL vs. DC', W / 2, H / 2 - 20, { size: 16, align: 'center', grad: ['#ff4a4a', '#ffd000', '#4a8aff'] });
  ctx.fillStyle = '#222'; ctx.fillRect(W / 2 - 120, H / 2, 240, 8);
  ctx.fillStyle = '#ffd000'; ctx.fillRect(W / 2 - 120, H / 2, 240 * pct, 8);
  text(ctx, msg, W / 2, H / 2 + 26, { size: 6, align: 'center', color: '#aaa' });
}

async function boot() {
  loadSettings();
  loadingScreen('LOADING FONT', 0.05);
  try { await Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* fallback font */ }
  game.roster = [...MARVEL, ...DC];
  let done = 0;
  await Promise.all(game.roster.map(async (d) => {
    const img = await loadImage(`assets/portraits/${d.id}.png`);
    if (img) { game.portraits[d.id] = img; game.pix[d.id] = pixelate(img); }
    else { const c = makeCanvas(80, 120); game.portraits[d.id] = c; game.pix[d.id] = c; }
    done++;
    loadingScreen('LOADING HEROES', 0.05 + 0.5 * done / game.roster.length);
  }));
  for (let i = 0; i < game.roster.length; i++) {
    const d = game.roster[i];
    game.built[d.id] = buildCharacter(d);
    loadingScreen('BUILDING ' + d.name, 0.55 + 0.45 * (i + 1) / game.roster.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  setupTouch();
  onEmptyTap(() => { const n = game.scene && game.scene.constructor.name; if (n === 'TitleScene' || n === 'ResultScene') pads[0].tap.add('Enter'); });
  onPadEvent((type, gp) => {
    const idx = connectedPads().indexOf(gp);
    if (type === 'connect') { toast(`${padKind(gp)} CONTROLLER CONNECTED - PLAYER ${Math.max(0, idx) + 1}`); try { gp.vibrationActuator && gp.vibrationActuator.playEffect('dual-rumble', { duration: 180, strongMagnitude: 0.5, weakMagnitude: 0.5 }); } catch (e) { /* no rumble */ } }
    else toast(`${padKind(gp)} CONTROLLER DISCONNECTED`);
  });
  const armPadAudio = () => onPadActivity(() => { initAudio(); setTimeout(armPadAudio, 1000); });
  armPadAudio();
  const startAudio = () => { initAudio(); };
  window.addEventListener('pointerdown', startAudio, { once: true });
  window.addEventListener('keydown', startAudio, { once: true });
  // deep link for quick testing: ?fight=spiderman,wolverine:batman,superman&stage=gotham&mode=training
  const q = new URLSearchParams(location.search);
  const fight = q.get('fight');
  if (fight) {
    const byId = (id) => game.roster.find((d) => d.id === id) || game.roster[0];
    const teams = fight.split(':').map((t) => t.split(',').map(byId));
    go(new FightScene(q.get('mode') || 'arcade', teams, q.get('stage') || 'gotham'));
  } else go(new TitleScene());
  window.__game = game;
  requestAnimationFrame(loop);
}

let last = performance.now(), acc = 0;
const STEP = 1000 / 60;
function loop(now) {
  acc += Math.min(100, now - last);
  last = now;
  let steps = 0;
  requestAnimationFrame(loop);
  try {
    while (acc >= STEP && steps < 4) {
      const sc = game.scene;
      if (!(sc && sc.battle && !sc.paused)) updatePads();
      sc.update();
      game.frame++;
      acc -= STEP;
      steps++;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    game.scene.draw(ctx);
  } catch (e) {
    // never let one bad frame freeze the game
    acc = 0;
    console.error(e);
  }
}

// tap anywhere on the title to start (touch devices)
canvas.addEventListener('pointerdown', () => {
  if (game.scene && game.scene.constructor.name === 'TitleScene') {
    const ev = new KeyboardEvent('keydown', { code: 'Enter' });
    window.dispatchEvent(ev);
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' })), 80);
  }
});

boot();

/* Boot, integer scaling, input (tap + swipe + hold), main loop. */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function fit() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  canvas.style.width = (W * s) + 'px';
  canvas.style.height = (H * s) + 'px';
}
addEventListener('resize', fit);
fit();

/* ---------- input ---------- */
const input = { taps: [], swipes: [], down: false, x: 0, y: 0 };
let pStart = null, pMoved = 0, pTime = 0;
function toGame(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  AUDIO.unlock();   // pointerdown is the most reliable iOS gesture; unlock is idempotent
  const p = toGame(e);
  input.down = true; input.x = p.x; input.y = p.y;
  pStart = p; pMoved = 0; pTime = performance.now();
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!input.down) return;
  const p = toGame(e);
  const dx = p.x - input.x, dy = p.y - input.y;
  input.x = p.x; input.y = p.y;
  pMoved += Math.hypot(dx, dy);
  // emit swipe segments while dragging (mopping, swatting pings)
  if (Math.hypot(p.x - pStart.x, p.y - pStart.y) > 14) {
    input.swipes.push({ x: p.x, y: p.y, dx: p.x - pStart.x, dy: p.y - pStart.y });
    pStart = p;
  }
});
canvas.addEventListener('pointerup', e => {
  e.preventDefault();
  const p = toGame(e);
  input.down = false;
  const dt = performance.now() - pTime;
  if (pMoved < 10 && dt < 600) {
    input.taps.push(p);
    dispatchTap(p);
  }
});
function dispatchTap(p) {
  if (!scene) return;
  // the HUD strip (mute + BOOK) is live during story scenes
  if (p.y < HUD_H && !(scene instanceof TitleScene) && !(scene instanceof BookingScene) &&
      !(scene instanceof JudgeScene) && !(scene instanceof EndingScene) && !(scene instanceof GalleryScene)) {
    if (hudTap(p)) return;
  }
  if (scene.tap) scene.tap(p);
}

/* ---------- loop ---------- */
document.addEventListener('visibilitychange', () => { if (!document.hidden) AUDIO.kick(); });
buildGfx();
scene = new TitleScene();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (bookedFlash > 0) bookedFlash -= dt;
  if (priceFlash > 0) priceFlash -= dt;
  if (scene) {
    scene.update(dt, input);
    if (scene) scene.draw(ctx);
  }
  input.taps.length = 0;
  input.swipes.length = 0;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

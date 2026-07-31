/* v2 engine. Six trackables, meter-gated choices, daily systems, the prologue.
   Internal resolution 180x320, portrait, fixed. Never change it (spec 2.2).
   A meter that only feeds the ending is not a mechanic, it is a scoreboard. */

const W = 180, H = 320;
/* v3: dialogue NEVER auto-advances. Every box waits for a tap, including "Mm."
   and "...", including skip mode. A joke on a timer is not a joke. */
const TEXT = { cps: 90, tapBeat: 0.5, skipMode: 0.35 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sanPips = () => Math.floor(S.sanity);

/* ---------- state ---------- */
let S;
function resetState() {
  S = {
    day: 1, money: 650, job: 5, love: 5, friends: 3, sanity: 10, kinu: 3,
    friendsBase: 3, friendsDecay: 0, contactToday: false,   // v3.8: friendship decays without contact
    temp: 26, windowOpen: false, windowEverOpened: false, windowOpens: 0,
    fanTaps: 0, fanMain: null, booked: false, bookedPrice: null,
    guilt: 0, overtime: 0, sold: [], mattSessions: 0,
    smell: 0, stains: [], mattBond: 0, juliusTrust: null,
    fanKinu: false, promised: false,
    sagaHeard: 0, tarotCount: 0, unread: 0, reviewWords: [],
    borrowed: {},
    f: {
      temuSecret: false, packageArrives: false, caseCracks: false,
      confessed: false, lied: false, rasmusKnows: false,
      holidayApproved: true,
      sausage: false, soldCrock: false, airportEnding: false, juliusGone: false,
    },
  };
}
resetState();
const CAPS = { job: 5, love: 5, friends: 5, sanity: 10, kinu: 3 };
function bump(k, n) {
  if (k === 'sanity' && n > 0 && S.f.cracked) n = Math.ceil(n / 2);   // the crack stays
  const before = S[k];
  if (k === 'friends') {   // friends is derived: base minus decay (v3.8)
    S.friendsBase = clamp(S.friendsBase + n, 0, 5 + 4);
    S.friends = clamp(S.friendsBase - S.friendsDecay, 0, 5);
  } else {
    S[k] = clamp(S[k] + n, 0, CAPS[k] ?? 1e9);
  }
  if (k === 'sanity' && S[k] <= 0) S.f.cracked = true;
  if (S[k] < before) AUDIO.sfx(k === 'sanity' ? 'S_SANITY_CRACK' : 'S_PIP_LOSS', { pitch: 1 - ((CAPS[k] || 5) - S[k]) * 0.06 });
  if (k === 'sanity' && S[k] > before) AUDIO.sfx('S_SANITY_UP');
  if (k === 'sanity' && Math.floor(S[k]) < 4) AUDIO.sanityLow(true);
  if (k === 'love' || k === 'kinu') GFX.envCache = {};   // the room follows the meters
}
const flightPrice = day => 920 + 38 * (Math.min(7, day) - 1);
function book() {
  const p = flightPrice(S.day);
  if (S.money < p || S.booked) return false;
  S.money -= p; S.booked = true; S.bookedPrice = p;
  AUDIO.sfx('S_BOOK_FLIGHT');
  return true;
}
function endingKey() {
  return [S.booked ? 1 : 0, S.job >= 1 ? 1 : 0, S.kinu >= 1 ? 1 : 0, S.love >= 1 ? 1 : 0, S.sanity >= 1 ? 1 : 0].join('');
}
function shortfall() { return S.booked ? 0 : Math.max(0, flightPrice(7) - S.money); }

/* ---------- save ---------- */
const SAVE_KEY = 'zheng.save';
let SAVE = { found: [], runs: 0, bestMoney: 0, muted: false, seenIntro: false };
try { const s = localStorage.getItem(SAVE_KEY); if (s) SAVE = Object.assign(SAVE, JSON.parse(s)); } catch (e) {}
function saveSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
AUDIO.muted = !!SAVE.muted;

/* ---------- scene plumbing ---------- */
let scene = null;
let skipMode = false;

/* ---------- HUD: € + price on row one, five icons on row two ---------- */
const HUD_H = 36;
const bookBtn = { x: 116, y: 0, w: 64, h: 10 };
const muteBtn = { x: 166, y: 11, w: 14, h: 12 };
let bookedFlash = 0;
function drawHUD(ctx) {
  ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = PAL20.D; ctx.fillRect(0, HUD_H - 2, W, 1);
  // row 1: money, the day, the flight price
  ctx.drawImage(GFX.icons.money, 2, 0, 10, 10);
  drawText(ctx, '€' + S.money, 14, 1, S.money < 0 ? PAL20.R : PAL20.C);
  const dayName = S.inPrologue ? 'SUN' : ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][Math.min(7, S.day)];
  drawTextCenter(ctx, dayName, 82, 1, PAL20.T);
  const drift = sanPips() < 4 && Math.random() < 0.02;
  const cur = drift ? '$' : '€';
  const hudPrice = S.tabPriceOverride || (S.inPrologue ? 882 : flightPrice(S.day));
  if (S.booked) {
    drawTextRight(ctx, '✓ ' + cur + S.bookedPrice, 178, 1, PAL20.G);
  } else {
    const can = !S.inPrologue && !S.tabPriceOverride && S.money >= flightPrice(S.day);
    // the up-arrow animates when the price rises. it is the most important thing happening.
    const arrow = priceFlash > 0 ? (Math.floor(priceFlash * 5) % 2 ? '▲' : ' ') : '▲';
    if (can) {
      ctx.fillStyle = PAL20.A;
      ctx.fillRect(bookBtn.x, bookBtn.y, bookBtn.w, bookBtn.h);
      drawTextRight(ctx, 'BOOK €' + hudPrice, 178, 1, PAL20.K);
    } else {
      drawTextRight(ctx, cur + hudPrice + ' ' + arrow, 178, 1, PAL20.A);
    }
  }
  // row 2: the five icons (sanity is a float, displays as rounded-down pips)
  const groups = [
    ['job', S.job, 5, PAL20.P], ['love', S.love, 5, PAL20.R],
    ['friends', S.friends, 5, PAL20.M], ['sane', Math.floor(S.sanity), 10, PAL20.Z],
    ['kinu', S.kinu, 3, PAL20.O],
  ];
  let x = 2;
  groups.forEach(([icon, n, max, col]) => {
    ctx.drawImage(GFX.icons[icon], x, 12, 12, 12);
    for (let i = 0; i < max; i++) {
      ctx.fillStyle = i < n ? col : PAL20.D;
      ctx.fillRect(x + 13 + (i % 5) * 4, 14 + Math.floor(i / 5) * 5, 3, 4);
    }
    x += 13 + Math.min(5, max) * 4 + 3;
  });
  if (bookedFlash > 0) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(20, 120, 140, 40);
    ctx.strokeStyle = PAL20.A; ctx.strokeRect(20.5, 120.5, 139, 39);
    drawTextCenter(ctx, 'BOOKED.', 90, 130, PAL20.A);
    drawTextCenter(ctx, '€' + S.bookedPrice, 90, 143, PAL20.C);
  }
}
function hudTap(p) {
  if (inRect(p, muteBtn)) { AUDIO.setMuted(!AUDIO.muted); SAVE.muted = AUDIO.muted; saveSave(); return true; }
  if (!S.booked && inRect(p, bookBtn) && S.money >= flightPrice(S.day)) {
    if (book()) { bookedFlash = 3; AUDIO.music('M_TITLE'); }
    return true;
  }
  return false;
}

/* ---------- speakers ---------- */
const WHO = {
  ZHENG: { color: PAL20.P, face: 'tired', pref: 'ZHENG.' },
  JULIUS: { color: PAL20.G, face: 'warm', pref: 'JULIUS.' },
  SANDAL: { color: PAL20.T, face: 'fake', pref: 'SANDAL.' },
  SUSAN: { color: PAL20.M, face: 'inviting', pref: 'SUSAN.' },
  JOY: { color: PAL20.A, face: 'delighted', pref: 'JOY.' },
  ANNA: { color: PAL20.P, face: 'neutral', pref: 'ANNA.' },
  MATT: { color: PAL20.X, face: 'delighted', pref: 'MATT.' },
  VET: { color: PAL20.N, face: 'neutral', pref: 'ALEKSI, VET.' },
  AAPO: { color: PAL20.G, face: 'talk', pref: 'AAPO.' },
  SUN: { color: PAL20.G, face: 'assess', pref: 'SUN.' },
  RASMUS: { color: PAL20.G, face: 'waiting', pref: 'RASMUS.' },
  MIRO: { color: PAL20.G, face: 'aloft', pref: 'MIRO.' },
  AINO: { color: PAL20.G, face: 'warm', pref: 'AINO.' },
  NARRATOR: { color: PAL20.T },
};
const faceOverride = {};

const DRIFT_WORDS = [['while', 'a year'], ['minutes', 'months'], ['fine', 'warm'], ['euros', 'hours'],
  ['window', 'door'], ['Monday', 'Monday again'], ['cat', 'idea'], ['table', 'ceiling']];
function sanityDrift(text) {
  if (sanPips() >= 4) return text;
  for (const [a, b] of DRIFT_WORDS) {
    if (text.includes(a) && Math.random() < 0.3) return text.replace(a, b);
  }
  return text;
}

/* ---------- beat runner ---------- */
const runner = { frames: [], onDone: null };
function runBeats(beats, onDone) { runner.frames = [{ beats, i: 0 }]; runner.onDone = onDone || null; stepRunner(); }
function pushBeats(beats) { if (beats && beats.length) runner.frames.push({ beats: beats.slice(), i: 0 }); }
function stepRunner() {
  while (true) {
    if (!runner.frames.length) { const cb = runner.onDone; runner.onDone = null; if (cb) cb(); return; }
    const fr = runner.frames[runner.frames.length - 1];
    if (fr.i >= fr.beats.length) { runner.frames.pop(); continue; }
    const b = fr.beats[fr.i++];
    if (execBeat(b)) return;
  }
}
let currentArt = 'apartment_hot', artDecal = 0, tempShow = null;
function execBeat(b) {
  switch (b.t) {
    case 'card': scene = new CardScene(b); return true;
    case 'art': {
      let img = b.img;
      if (img === 'office' && S.job <= 0) img = 'apartment_hot';   // restructured. the office is gone.
      // 3.12: the window state drives the whole look of the game
      if (img.startsWith('apartment')) img = S.windowOpen ? 'apartment_cool' : 'apartment_hot';
      if (img === 'window' || img === 'window_cool') img = S.windowOpen ? 'window_cool' : 'window';
      currentArt = img; artDecal = 0;
      if (b.temp != null) S.temp = b.temp;
      if (b.music !== undefined) AUDIO.music(b.music, { tempo: b.music === 'M_HOME_HOT' ? 0.85 + (S.temp - 21) / 40 : 1 });
      else if (AUDIO._music && AUDIO._music.id === 'M_HOME_HOT') AUDIO.setTempo(0.85 + (S.temp - 21) / 40);
      return false;
    }
    case 'say': scene = new TalkScene(b); return true;
    case 'sfx': AUDIO.sfx(b.id, b.pitch ? { pitch: b.pitch } : undefined); return false;
    case 'music': AUDIO.music(b.id); return false;
    case 'pause': scene = new WaitScene(b.s, true); return true;
    case 'hold': scene = new WaitScene(b.s, false); return true;
    case 'choice': S.coldOpen = false; artDecal = 0; scene = null; startChoice(b.id); return true;
    case 'game': S.coldOpen = false; scene = new GameScene(b.id); if (b.id === 'CLEAN_UP') artDecal = 0; return true;
    case 'money': {
      const d = typeof b.delta === 'function' ? b.delta(S) : b.delta;
      S.money += d;
      AUDIO.sfx(d >= 0 ? 'S_COIN' : 'S_MONEY_LOSS');
      scene = new ToastScene((b.label || (d > 0 ? '+€' + d : '-€' + (-d))) + (b.label && b.label.indexOf('€') < 0 ? ': €' + Math.abs(d) : ''), d);
      return true;
    }
    case 'do': b.fn(S); return false;
    case 'if': { const br = b.cond(S) ? b.then : b.else; if (br) pushBeats(br); return false; }
    case 'decal': artDecal = b.size || 3; return false;
    case 'face': faceOverride[b.who] = b.face; return false;
    case 'msgflood': scene = new FloodScene(); return true;
    case 'tempshow': tempShow = b.v; return false;
    case 'terms': scene = new TermsScene(); return true;
    case 'tarotcard': scene = new TarotScene(); return true;
    case 'ledger': scene = new LedgerScene(b); return true;
    case 'booking': scene = new BookingScene(); return true;
    case 'judge': scene = new JudgeScene(); return true;
  }
  return false;
}

/* ---------- shared background ---------- */
function drawStage(ctx) {
  ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
  const art = envCard(currentArt);
  ctx.drawImage(art, 0, HUD_H, W, 110);
  if (artDecal) {
    ctx.drawImage(GFX.decals[artDecal], 74, HUD_H + 60, 32, 32);
    if (S.kinu >= 1) ctx.drawImage(GFX.kinu.idle, 104, HUD_H + 48, 24, 24);
  }
  if (currentArt === 'listings') {
    const rows = [['PS5', 180], ['the old iPhone', 90], ['espresso machine', 120], ["Julius's crock", 60]];
    rows.forEach(([label, price], i) => {
      const ry = HUD_H + 20 + i * 23;
      ctx.fillStyle = PAL20.K; ctx.fillRect(28, ry, 148, 10);
      drawText(ctx, label, 30, ry + 1, PAL20.P);
      drawTextRight(ctx, '+€' + price, 176, ry + 1, PAL20.A);
    });
  }
  const home = currentArt.startsWith('apartment') || currentArt === 'window' || currentArt === 'kitchen';
  if (home || tempShow != null) {
    let t = tempShow != null ? tempShow : S.temp;
    if (sanPips() < 4) t += Math.random() < 0.5 ? (Math.random() < 0.5 ? 1 : -1) : 0;
    ctx.fillStyle = PAL20.K; ctx.fillRect(148, HUD_H + 3, 30, 10);   // covers the art's baked chip
    drawText(ctx, t + '°C', 150, HUD_H + 4, t >= 30 ? PAL20.E : PAL20.Z);
  }
  if (currentArt.startsWith('apartment')) {
    // 2x: Julius is baked into the card at roughly 56px tall, so Zheng draws at
    // the same human scale (integer 2x, still native pixels)
    ctx.drawImage(GFX.sprites['zheng' + [0, 0, 1, 2, 1, 2, 3, 4][Math.min(7, S.day)]] || GFX.sprites.zheng0, 8, HUD_H + 42, 48, 64);
    if (S.kinu >= 1) {
      // 3 pips: on the desk. 2 pips: she stopped sleeping on the desk. no line about it.
      const pos = S.kinu >= 3 ? [38, HUD_H + 40] : [150, HUD_H + 86];
      ctx.drawImage(GFX.kinu[S.windowOpen ? 'crouch' : 'loaf'], pos[0], pos[1], 24, 24);
      if (sanPips() < 4 && Math.random() < 0.008) ctx.drawImage(GFX.kinu.loaf, pos[0] - 2, pos[1], 24, 24);
    }
  }
  drawHUD(ctx);
  ctx.drawImage(AUDIO.muted ? GFX.icons.muteOn : GFX.icons.muteOff, muteBtn.x, muteBtn.y, 14, 12);
}

/* ---------- scenes ---------- */
class CardScene {
  constructor(b) { this.b = b; this.t = 0; AUDIO.sfx('S_DAY_CARD'); }
  update(dt) { this.t += dt; if (this.t > (skipMode ? 1.1 : 2.4)) this.end(); }
  tap() { if (this.t > 0.7) this.end(); }
  end() { if (this.dead) return; this.dead = true; scene = null; stepRunner(); }
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    drawHUD(ctx);
    ctx.fillStyle = PAL20.D; ctx.fillRect(0, 130, W, 60);
    ctx.fillStyle = PAL20.A; ctx.fillRect(0, 130, W, 2); ctx.fillRect(0, 188, W, 2);
    drawTextCenter(ctx, this.b.title, 90, 146, PAL20.W);
    drawTextCenter(ctx, typeof this.b.sub === 'function' ? this.b.sub(S) : this.b.sub, 90, 165, PAL20.A);
  }
}

class WaitScene {
  constructor(s, skippable) { this.left = s; this.skippable = skippable; }
  update(dt) { this.left -= dt; if (this.left <= 0) this.end(); }
  tap() { if (this.skippable) this.end(); }
  end() { if (this.dead) return; this.dead = true; scene = null; stepRunner(); }
  draw(ctx) { drawStage(ctx); }
}

class ToastScene {
  constructor(label, delta) { this.label = label; this.delta = delta; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 1.4) this.end(); }
  tap() { if (this.t > 0.4) this.end(); }
  end() { if (this.dead) return; this.dead = true; scene = null; stepRunner(); }
  draw(ctx) {
    drawStage(ctx);
    ctx.fillStyle = PAL20.K; ctx.fillRect(10, 160, 160, 26);
    ctx.strokeStyle = this.delta >= 0 ? PAL20.G : PAL20.R; ctx.strokeRect(10.5, 160.5, 159, 25);
    drawTextCenter(ctx, this.label, 90, 170, this.delta >= 0 ? PAL20.G : PAL20.R);
  }
}

class TalkScene {
  constructor(b) {
    this.who = b.who;
    const raw = b.dyn ? b.dyn(S) : b.text;
    this.text = this.who === 'NARRATOR' ? sanityDrift(raw) : raw;
    if (b.face) faceOverride[b.who] = b.face;
    this.lines = wrapText(this.text, 28);
    this.pages = [];
    for (let i = 0; i < this.lines.length; i += 4) this.pages.push(this.lines.slice(i, i + 4));
    // never strand a single short line on its own page ("else.")
    const last = this.pages[this.pages.length - 1];
    if (this.pages.length > 1 && last.length === 1 && last[0].length < 16) {
      const prev = this.pages[this.pages.length - 2];
      last.unshift(prev.pop());
    }
    this.page = 0; this.chars = 0; this.doneT = 0;
    this.total = fontClean(this.text).length;
  }
  pageLen() { return this.pages[this.page].reduce((a, l) => a + l.length, 0); }
  typeFast() { return skipMode && !(S.day <= 2 && S.coldOpen); }   // cold opens play in full on days 1-2, every run
  update(dt) {
    const len = this.pageLen();
    if (this.chars < len) {
      const prev = this.chars;
      this.chars = Math.min(len, this.chars + dt * (this.typeFast() ? 900 : TEXT.cps));
      const who = this.who;
      if (who !== 'NARRATOR' && ((this.chars | 0) >> 1) > (prev | 0) >> 1) {
        const near = len - this.chars < 5;
        const id = who === 'JULIUS' && near ? 'JULIUS_UP' : who;
        if (who === 'JOY') setTimeout(() => AUDIO.blip('JOY'), 12);
        else AUDIO.blip(id);
        AUDIO.duck(0.35, 60);
      }
    } else {
      AUDIO.duck(0.8, 200);
      this.doneT += dt;
      // v3: nothing in this game ever advances on its own. every box waits for a tap.
    }
  }
  tap() {
    const len = this.pageLen();
    if (this.chars < len) { this.chars = len; return; }
    if (this.doneT < (this.typeFast() ? TEXT.skipMode : TEXT.tapBeat)) return;   // stops double-taps eating two boxes
    this.advance();
  }
  advance() {
    if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; this.doneT = 0; return; }
    if (this.dead) return; this.dead = true;
    // appendix E item 6: Sandal's blips continue one syllable past his box closing
    if (this.who === 'SANDAL' && sanPips() < 4) setTimeout(() => AUDIO.blip('SANDAL'), 90);
    scene = null; stepRunner();
  }
  draw(ctx) {
    drawStage(ctx);
    const who = this.who, w = WHO[who] || WHO.NARRATOR;
    if (w.pref) {
      const face = faceOverride[who] || w.face;
      const img = GFX.portraits[w.pref + face] || GFX.portraits[w.pref + w.face];
      if (img) {
        ctx.fillStyle = PAL20.K; ctx.fillRect(4, 202, 52, 52);
        ctx.strokeStyle = PAL20.D; ctx.strokeRect(4.5, 202.5, 51, 51);
        ctx.drawImage(img, 6, 204, 48, 48);
      }
    }
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 256, W, 64);
    ctx.fillStyle = PAL20.D; ctx.fillRect(2, 258, W - 4, 60);
    ctx.fillStyle = PAL20.K; ctx.fillRect(4, 260, W - 8, 56);
    let y = 264;
    if (who !== 'NARRATOR') {
      ctx.fillStyle = PAL20.D; ctx.fillRect(4, 260, W - 8, 10);
      if (who === 'SANDAL') {
        // the name stays legible. only the title does the shrinking gag.
        drawText(ctx, 'SANDAL', 7, 261, w.color);
        drawTextFit(ctx, '· ' + SANDAL_TITLES[Math.min(7, Math.max(1, S.day))], 46, 261, W - 52, PAL20.S);
      } else {
        drawTextFit(ctx, who, 7, 261, W - 14, w.color);
      }
      y += 8;
    } else y += 2;
    let remaining = Math.floor(this.chars);
    const lines = this.pages[this.page];
    lines.forEach((l, i) => {
      if (remaining <= 0) return;
      const show = l.slice(0, remaining);
      remaining -= l.length;
      if (who === 'NARRATOR') drawTextCenter(ctx, show, 90, y + i * 10, w.color);
      else drawText(ctx, show, 6, y + i * 10, PAL20.W);
    });
    if (this.chars >= this.pageLen() && Math.floor(this.doneT * 3) % 2 === 0) {
      drawText(ctx, '▼', 168, 310, PAL20.A);
    }
  }
}

class FloodScene {
  constructor() {
    this.words = 'you have changed and i think you know it and thats okay but i want you to know that i noticed and joy noticed too okay okay okay okay anyway love you okay see you soon okay okay okay okay okay'.split(' ');
    this.t = 0; this.shown = 0;
  }
  update(dt) {
    this.t += dt;
    const target = Math.min(this.words.length, Math.floor(this.t / 0.055));
    while (this.shown < target) { this.shown++; if (this.shown % 3 === 1) AUDIO.sfx('S_MSG_FLOOD'); }
    if (this.shown >= this.words.length && this.t > this.words.length * 0.055 + 1.2) {
      if (!this.dead) { this.dead = true; scene = null; stepRunner(); }
    }
  }
  tap() {} // no. all 41.
  draw(ctx) {
    drawStage(ctx);
    ctx.fillStyle = PAL20.K; ctx.fillRect(8, 50, 164, 250);
    ctx.strokeStyle = PAL20.M; ctx.strokeRect(8.5, 50.5, 163, 249);
    drawText(ctx, 'SUSAN', 14, 56, PAL20.M);
    const start = Math.max(0, this.shown - 24);
    for (let i = start; i < this.shown; i++) {
      const row = i - start;
      ctx.fillStyle = PAL20.D;
      ctx.fillRect(14, 68 + row * 9, this.words[i].length * 6 + 8, 8);
      drawText(ctx, this.words[i], 18, 68 + row * 9, PAL20.W);
    }
  }
}

/* D0.5: the terms. meter icons assemble one at a time. */
class TermsScene {
  constructor() { this.t = 0; this.revealed = 0; }
  update(dt) {
    this.t += dt;
    const n = Math.min(5, Math.floor(Math.max(0, this.t - 1.6) / 0.6));
    while (this.revealed < n) { AUDIO.sfx('S_FLAG_REVEAL', { pitch: 1 + this.revealed * 0.14 }); this.revealed++; }
    if (this.t > 5.6 && !this.dead) { this.dead = true; scene = null; stepRunner(); }
  }
  tap() {}
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    drawTextCenter(ctx, 'ONE WEEK.', 90, 100, PAL20.W);
    drawTextCenter(ctx, 'BOOK THE TICKETS.', 90, 118, PAL20.W);
    const icons = ['job', 'love', 'friends', 'sane', 'kinu'];
    icons.slice(0, this.revealed).forEach((ic, i) => ctx.drawImage(GFX.icons[ic], 30 + i * 26, 170, 16, 16));
    if (this.revealed >= 5) drawTextCenter(ctx, '€650', 90, 200, PAL20.C);
  }
}

/* Anna pulls one card. Never wrong, never useful. */
class TarotScene {
  constructor() {
    this.t = 0;
    this.data = S._tarotPick || TAROT_DAYS[Math.min(7, Math.max(1, S.day))];
  }
  update(dt) { this.t += dt; }
  tap() {
    if (this.t < 0.8 || this.dead) return;
    this.dead = true; scene = null; stepRunner();
  }
  draw(ctx) {
    drawStage(ctx);
    ctx.fillStyle = 'rgba(26,20,32,0.75)'; ctx.fillRect(0, HUD_H, W, H - HUD_H);
    const flip = this.t > 0.7;
    const img = (flip && GFX.tarot[this.data[0]]) || GFX.tarot.back;
    if (flip && !GFX.tarot[this.data[0]]) { /* art pending from the design file: name the card on the back */ }
    ctx.drawImage(img, 54, 90, 72, 120);
    if (flip) drawTextCenter(ctx, this.data[1], 90, 222, PAL20.C);
    if (this.t > 1.2 && Math.floor(this.t * 2) % 2 === 0) drawTextCenter(ctx, 'tap', 90, 240, PAL20.T);
  }
}

class LedgerScene {
  constructor(b) { this.b = b; this.t = 0; AUDIO.sfx('S_METER_TICK'); }
  update(dt) { this.t += dt; }
  tap() {
    if (this.t < 0.5 || this.dead) return;
    this.dead = true; AUDIO.sfx('S_PRICE_UP');
    scene = null; stepRunner();
  }
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    drawHUD(ctx);
    drawTextCenter(ctx, this.b.title, 90, 110, PAL20.W);
    ctx.fillStyle = PAL20.D; ctx.fillRect(20, 126, 140, 1);
    const lines = this.b.lines(S);
    lines.forEach((l, i) => drawTextCenter(ctx, l, 90, 140 + i * 14, PAL20.P));
    if (Math.floor(this.t * 2) % 2 === 0) drawTextCenter(ctx, 'tap', 90, 290, PAL20.T);
  }
}

/* ---------- choices: gates, vanishing options, the passenger seat ---------- */
let choicePanel = null;
function visibleOptions(c) {
  return c.options.filter(o => {
    if (o.hide && o.hide(S)) return false;
    if (o.require && !o.require(S)) return false;   // not greyed out. not rendered at all.
    return true;
  });
}
function startChoice(id) {
  const c = CHOICES[id];
  const showOptions = () => {
    const opts = visibleOptions(c);
    if (!opts.length) { stepRunner(); return; }
    choicePanel = { id, c, opts };
    scene = new ChoiceScene();
  };
  if (c.prompt && c.prompt.length) {
    runner.frames.push({ beats: [...c.prompt, { t: '_options', show: showOptions }], i: 0 });
    stepRunner();
  } else showOptions();
}
const _origExec = execBeat;
execBeat = function (b) {
  if (b.t === '_options') { b.show(); return true; }
  return _origExec(b);
};
class ChoiceScene {
  constructor() { this.t = 0; }
  update(dt) { this.t += dt; }
  tap(p) {
    if (this.t < 0.25) return;
    const { opts } = choicePanel;
    opts.forEach((o, i) => {
      const b = this.optRect(i, opts.length);
      if (inRect(p, b) && !this.dead) {
        this.dead = true;
        AUDIO.sfx('S_CHOICE_CONFIRM');
        choicePanel = null; scene = null;
        o.apply(S);
        pushBeats(o.after || []);
        stepRunner();
      }
    });
  }
  optRect(i, n) {
    const h = 26, gap = 4;
    const y0 = 316 - n * (h + gap);
    return { x: 4, y: y0 + i * (h + gap), w: 172, h };
  }
  draw(ctx) {
    drawStage(ctx);
    const { opts } = choicePanel;
    drawTextCenter(ctx, '· CHOOSE ·', 90, 316 - opts.length * 30 - 12, PAL20.A);
    opts.forEach((o, i) => {
      const b = this.optRect(i, opts.length);
      ctx.fillStyle = PAL20.K; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = PAL20.D; ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      ctx.fillStyle = PAL20.T; ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 2);
      const lines = wrapText(o.label, 27);
      lines.slice(0, 2).forEach((l, li) =>
        drawTextCenter(ctx, l, 90, b.y + (lines.length > 1 ? 5 : 9) + li * 9, PAL20.W));
    });
  }
}

/* ---------- minigame host ---------- */
class GameScene {
  constructor(id) {
    this.id = id; this.mg = MINIGAMES[id];
    this.mg.init({ day: S.day, state: S, bg: currentArt });
    this.intro = 1.2;
  }
  update(dt, input) {
    if (this.intro > 0) { this.intro -= dt; return; }
    this.mg.update(dt, input);
    if (this.mg.done && !this.dead) {
      this.dead = true;
      const res = this.mg.result();
      const after = MG_AFTER[this.id] ? MG_AFTER[this.id](res, S) : [];
      scene = null;
      pushBeats(after);
      stepRunner();
    }
  }
  tap() {}
  draw(ctx) {
    drawStage(ctx);
    this.mg.draw(ctx);
    drawHUD(ctx);
    if (this.intro > 0) {
      ctx.fillStyle = 'rgba(26,20,32,0.7)'; ctx.fillRect(0, 120, W, 50);
      drawTextCenter(ctx, this.id.replace(/_/g, ' '), 90, 134, PAL20.A);
      drawTextCenter(ctx, 'ready...', 90, 148, PAL20.P);
    }
  }
}

/* ---------- booking screen (D7.5): the button keeps the promise ---------- */
class BookingScene {
  constructor() {
    this.t = 0; this.phase = 'offer'; AUDIO.music(null);
    this.bBook = { x: 20, y: 210, w: 140, h: 32 };
    this.bNo = { x: 20, y: 250, w: 140, h: 24 };
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'booked' && this.t > 3) this.finish();   // three full seconds. let it play out.
    if (this.phase === 'short' && this.t > 3.5) this.finish();
  }
  finish() { if (this.dead) return; this.dead = true; scene = null; stepRunner(); }
  tap(p) {
    if (this.phase !== 'offer') return;
    const can = !S.booked && S.money >= flightPrice(7);
    if (inRect(p, this.bBook)) {
      if (S.booked) { this.finish(); return; }
      if (can) { book(); AUDIO.music('M_TITLE'); this.phase = 'booked'; this.t = 0; }
      else { this.phase = 'short'; this.t = 0; }
    }
    if (inRect(p, this.bNo)) this.finish();
  }
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'YOUR FUND', 16, 60, PAL20.T);
    drawText(ctx, '€' + S.money, 16, 74, PAL20.C);
    drawTextRight(ctx, 'TASHKENT', 164, 110, PAL20.T);
    drawTextRight(ctx, '€1,148', 164, 124, PAL20.A);
    ctx.fillStyle = PAL20.D; ctx.fillRect(16, 150, 148, 1);
    if (this.phase === 'offer') {
      const can = S.booked || S.money >= flightPrice(7);
      ctx.fillStyle = S.booked ? PAL20.G : can ? PAL20.A : PAL20.D;
      ctx.fillRect(this.bBook.x, this.bBook.y, this.bBook.w, this.bBook.h);
      const label = S.booked ? 'ALREADY BOOKED ✓' : (S.promised ? 'KEEP THE PROMISE' : 'BOOK');
      drawTextCenter(ctx, label, 90, this.bBook.y + 12, can ? PAL20.K : PAL20.S);
      if (!S.booked) {
        ctx.strokeStyle = PAL20.S; ctx.strokeRect(this.bNo.x + 0.5, this.bNo.y + 0.5, this.bNo.w - 1, this.bNo.h - 1);
        drawTextCenter(ctx, 'close the tab', 90, this.bNo.y + 8, PAL20.T);
      }
    }
    if (this.phase === 'booked') drawTextCenter(ctx, 'Booked.', 90, 200, PAL20.W);
    if (this.phase === 'short') {
      drawTextCenter(ctx, 'You are €' + shortfall() + ' short.', 90, 190, PAL20.R);
      if (this.t > 1.8) drawTextCenter(ctx, 'Monday exists.', 90, 210, PAL20.T);
    }
  }
}

/* ---------- the judgement (D7.6) ---------- */
class JudgeScene {
  constructor() {
    AUDIO.music(null);
    // the night before the 06:00 flight: nobody sleeps well next to a packed week
    const nightDrain = 0.5 + 0.35 * S.stains.length + (S.f.cracked ? 1 : 0);
    S.sanity = clamp(S.sanity - nightDrain, 0, 10);
    this.t = 0; this.revealed = 0;
    this.flags = [
      ['money', S.booked], ['job', S.job >= 1], ['kinu', S.kinu >= 1],
      ['love', S.love >= 1], ['sane', S.sanity >= 1],
    ];
  }
  update(dt) {
    this.t += dt;
    const n = Math.min(5, Math.floor(this.t / 1));
    while (this.revealed < n) {
      AUDIO.sfx('S_FLAG_REVEAL', { pitch: 1 + this.revealed * 0.14 });
      this.revealed++;
    }
    if (this.t > 6.4 && !this.dead) {
      this.dead = true; scene = null;
      startEnding();
    }
  }
  tap() {}
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    this.flags.slice(0, this.revealed).forEach(([icon, ok], i) => {
      const x = 20 + i * 30;
      ctx.drawImage(GFX.icons[icon], x, 150, 16, 16);
      drawText(ctx, ok ? '✓' : 'x', x + 4, 172, ok ? PAL20.G : PAL20.R);
    });
  }
}

/* ---------- endings ---------- */
function startEnding() {
  Object.keys(faceOverride).forEach(k => delete faceOverride[k]);
  const key = endingKey();
  const seq = S.booked ? arrivalBeats(S) : codaBeats(S);
  runBeats(seq, () => { scene = new EndingScene(key); });
}
class EndingScene {
  constructor(key) {
    this.key = key;
    this.e = ENDINGS[key];
    this.isNew = !SAVE.found.includes(key);
    if (this.isNew) { SAVE.found.push(key); }
    SAVE.runs++; SAVE.bestMoney = Math.max(SAVE.bestMoney, S.money + (S.bookedPrice || 0));
    saveSave();
    if (this.e.usesShortfall) { SAVE.shortfalls = SAVE.shortfalls || {}; SAVE.shortfalls[key] = shortfall(); }
    const sf = shortfall();
    this.title = this.e.title.replace('{SHORTFALL}', sf);
    this.text = this.e.text.map(t => sf === 0
      ? t.replace('and €{SHORTFALL} short.', 'and the money was there. He just never pressed it.')
         .replace('€{SHORTFALL} short', 'zero euros short, which is a different illness')
      : t.replace('{SHORTFALL}', sf)).join('\n');
    this.card = endingCard(key);
    this.t = 0; this.chars = 0;
    this.breezeHold = this.e.breeze ? 8 : 0;
    AUDIO.music(null);
    if (this.e.breeze) AUDIO.sfx('S_BREEZE'); else playSting(this.e.tone);
    if (this.isNew) setTimeout(() => AUDIO.sfx('S_ENDING_UNLOCK'), 1400);
    this.lines = wrapText(this.text, 28);
    this.bRetry = { x: 8, y: 296, w: 78, h: 20 };
    this.bGallery = { x: 94, y: 296, w: 78, h: 20 };
    if (key === '10000') playSting('GOLD');   // it does not stop when you tap
  }
  update(dt) {
    this.t += dt;
    if (this.breezeHold > 0) { this.breezeHold -= dt; return; }
    this.chars = Math.min(this.lines.join('').length + this.lines.length, this.chars + dt * 60);
  }
  tap(p) {
    if (this.breezeHold > 0) return;
    if (inRect(p, this.bRetry)) { AUDIO.sfx('S_CHOICE_CONFIRM'); startRun(true); return; }
    if (inRect(p, this.bGallery)) { AUDIO.sfx('S_CHOICE_CONFIRM'); scene = new GalleryScene(this); return; }
    this.chars = this.lines.join('').length + this.lines.length;
  }
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    drawTextCenter(ctx, 'ENDING ' + SAVE.found.length + ' / 32', 90, 4, PAL20.T);
    ctx.drawImage(this.card, 0, 14, 180, 110);
    const tone = { GOLD: PAL20.A, GOOD: PAL20.G, WEIRD: PAL20.M, BLEAK: PAL20.T, CALM: PAL20.Z }[this.e.tone];
    wrapText(this.title, 28).forEach((l, i) => drawTextCenter(ctx, l, 90, 130 + i * 10, tone));
    if (this.breezeHold <= 0) {
      let rem = Math.floor(this.chars), y = 158;
      for (const l of this.lines) {
        if (rem <= 0) break;
        drawTextCenter(ctx, l.slice(0, rem), 90, y, PAL20.P);
        rem -= l.length + 1; y += 9;
        if (y > 266) break;
      }
      const flags = [['money', this.key[0] === '1'], ['job', this.key[1] === '1'], ['kinu', this.key[2] === '1'], ['love', this.key[3] === '1'], ['sane', this.key[4] === '1']];
      flags.forEach(([icon, ok], i) => {
        const x = 22 + i * 28;
        ctx.drawImage(GFX.icons[icon], x, 274, 10, 10);
        drawText(ctx, ok ? '✓' : 'x', x + 12, 276, ok ? PAL20.G : PAL20.R);
      });
      mgBtn(ctx, Object.assign({ label: 'RETRY' }, this.bRetry), false);
      mgBtn(ctx, Object.assign({ label: 'GALLERY' }, this.bGallery), false);
    } else {
      drawTextCenter(ctx, '...', 90, 200, PAL20.S);
    }
    if (this.key === '10000' || this.e.tone === 'GOLD') {
      for (let i = 0; i < 24; i++) {
        const cx2 = (i * 37 + this.t * 20 * (1 + i % 3)) % 180;
        const cy2 = (i * 53 + this.t * 30) % 320;
        ctx.fillStyle = [PAL20.A, PAL20.M, PAL20.Z, PAL20.G][i % 4];
        ctx.fillRect(cx2, cy2, 2, 2);
      }
    }
  }
}

/* ---------- gallery ---------- */
class GalleryScene {
  constructor(from) {
    this.from = from;
    this.keys = Object.keys(ENDINGS);
    this.sel = null;
    this.bBack = { x: 8, y: 296, w: 78, h: 20 };
    this.bRetry = { x: 94, y: 296, w: 78, h: 20 };
  }
  update() {}
  tap(p) {
    if (inRect(p, this.bBack) && this.from) { scene = this.from; return; }
    if (inRect(p, this.bRetry)) { startRun(true); return; }
    this.keys.forEach((k, i) => {
      const r = this.slotRect(i);
      if (inRect(p, r)) this.sel = SAVE.found.includes(k) ? k : null;
    });
  }
  slotRect(i) {
    const col = i % 4, row = (i / 4) | 0;
    return { x: 8 + col * 42, y: 26 + row * 28, w: 40, h: 26 };
  }
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    drawTextCenter(ctx, 'ENDINGS · ' + SAVE.found.length + ' / 32', 90, 4, PAL20.A);
    if (SAVE.bestMoney > 0) drawTextCenter(ctx, 'BEST: €' + SAVE.bestMoney, 90, 14, PAL20.T);
    this.keys.forEach((k, i) => {
      const r = this.slotRect(i);
      const found = SAVE.found.includes(k);
      if (found) {
        ctx.drawImage(endingCard(k), r.x, r.y, r.w, r.h - 4);
        ctx.strokeStyle = { GOLD: PAL20.A, GOOD: PAL20.G, WEIRD: PAL20.M, BLEAK: PAL20.S, CALM: PAL20.Z }[ENDINGS[k].tone];
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 5);
      } else {
        ctx.drawImage(GFX.icons.lockedCell, r.x, r.y, r.w, r.h - 4);
      }
    });
    if (this.sel) {
      const e = ENDINGS[this.sel];
      ctx.fillStyle = PAL20.K; ctx.fillRect(4, 250, 172, 42);
      ctx.strokeStyle = PAL20.A; ctx.strokeRect(4.5, 250.5, 171, 41);
      wrapText(e.title.replace('{SHORTFALL}', '?'), 27).forEach((l, i) => drawTextCenter(ctx, l, 90, 256 + i * 10, PAL20.W));
    }
    mgBtn(ctx, Object.assign({ label: this.from ? 'BACK' : '·' }, this.bBack), false);
    mgBtn(ctx, Object.assign({ label: 'RETRY' }, this.bRetry), false);
  }
}

/* ---------- title ---------- */
class TitleScene {
  constructor() { this.t = 0; }
  update(dt) { this.t += dt; }
  tap(p) {
    AUDIO.unlock();   // THE unlock. inside the first tap handler. (spec 7.1)
    if (this.galleryBtn && inRect(p, this.galleryBtn)) { scene = new GalleryScene(this); return; }
    startRun(SAVE.runs > 0);
  }
  draw(ctx) {
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, 0, W, H);
    drawTextCenter(ctx, 'ZHENG', 90, 56, PAL20.W);
    drawTextCenter(ctx, 'THE UZBEKISTAN FUND', 90, 72, PAL20.A);
    ctx.drawImage(GFX.kinu.loaf, 66, 104, 48, 48);
    drawTextCenter(ctx, 'a man. a job. a cat.', 90, 170, PAL20.T);
    drawTextCenter(ctx, 'a promise. €1,148.', 90, 182, PAL20.C);
    if (Math.floor(this.t * 1.5) % 2 === 0) drawTextCenter(ctx, 'TAP TO START', 90, 226, PAL20.W);
    if (SAVE.found.length) {
      this.galleryBtn = { x: 50, y: 256, w: 80, h: 20 };
      mgBtn(ctx, Object.assign({ label: SAVE.found.length + '/32' }, this.galleryBtn), false);
    }
    if (AUDIO.ctx && AUDIO.ctx.state === 'suspended') drawTextCenter(ctx, 'no sound? check the mute switch', 90, 300, PAL20.T);
  }
}

/* ---------- daily systems (2.13 gates + 3.2 drain + 3.8 decay) ---------- */
function applyDailyDrain(d) {
  // temperature model, evaluated at the start of each day (3.2)
  if (d > 1) {
    S.temp += S.windowOpen ? -6 : 2.5;
    if (S.fanRanDay === d - 1 && S.fanMain === 'zheng') S.temp -= 4;
    S.temp = clamp(Math.round(S.temp * 10) / 10, 21, 38);
  }
  // drain, before any choices. no warning text, ever.
  let drain = 0.5;
  drain += Math.max(0, (S.temp - 26) / 5);
  drain += (S.kinu <= 2) ? 0.5 : 0;
  drain += S.sold.includes('espresso') ? 1.0 : 0;
  drain += (S.job <= 2) ? 1.0 : 0;
  drain += 0.35 * S.stains.length;   // living with the stains wears on him, quietly
  // (applied below; if the float touches zero the crack stays — see bump)
  drain -= S.windowOpen ? 0.5 : 0;
  if (d > 1) S.sanity = clamp(S.sanity - Math.max(0, drain), 0, 10);
  if (S.sanity <= 0) S.f.cracked = true;
  if (S.sanity < 4) AUDIO.sanityLow(true);
}
function endOfDayDecay() {
  // friendship decays without contact (3.8). the pip just goes.
  if (!S.contactToday) S.friendsDecay = Math.min(4, S.friendsDecay + 1);
  S.contactToday = false;
  S.friends = clamp(S.friendsBase - S.friendsDecay, 0, 5);
}
function dailySystemBeats(d) {
  const out = [];
  // lunch money (3.9 #5): at love 0 there are no leftovers whatsoever
  out.push({ t: 'do', fn: s => { if (s.love === 0) s.money -= 12; else if (s.love <= 3) s.money -= 8; } });
  // the espresso machine is in Espoo. Monday still exists. (drain handles the sanity)
  // love = 0, once: not a breakup. a break. scheduled for after the weekend.
  out.push({ t: 'if', cond: s => s.love === 0 && !s.f.breakAnnounced, then: [
    { t: 'do', fn: s => { s.f.breakAnnounced = true; } },
    { t: 'sfx', id: 'S_JULIUS_APPEAR' },
    { t: 'say', who: 'JULIUS', face: 'hurt', dyn: s => s.day <= 5
      ? "I think I should go to my mum's for a while? After the weekend. After the dinner. I'm not going to cancel the dinner."
      : "I think I should go to my mum's for a while? After the weekend. Monday morning, probably. Early." },
    { t: 'say', who: 'ZHENG', text: '...' },
    { t: 'say', who: 'JULIUS', face: 'hurt', text: "It's not a breaking-up thing. It's a break thing. Those are different?" },
    { t: 'say', who: 'ZHENG', text: 'Okay.' },
    { t: 'say', who: 'JULIUS', face: 'hurt', text: "They're different." },
    { t: 'say', who: 'NARRATOR', dyn: s => s.f.soldCrock
      ? 'He starts packing now. Slowly. One gentle thing a day. There is less to pack than there was.'
      : 'He starts packing now. Slowly. One gentle thing a day. The crock first.' },
    { t: 'say', who: 'NARRATOR', text: 'He leaves the hair gels in the bathroom. Leaving the hair gels means it is not decided. Probably it means it is not decided.' },
    { t: 'choice', id: 'JULIUS_BREAK' },
  ] });
  // job <= 3: Sandal calls twice a day now, and each call is a decision (3.15 + playtest)
  if (d >= 2 && d <= 6) out.push({ t: 'if', cond: s => s.job <= 3 && s.job >= 1, then: [
    { t: 'choice', id: 'WORK_CALL' },
  ] });
  // the meeting rename runs all seven days. never acknowledged. (3.15)
  if (d >= 3 && d < 7) out.push({ t: 'sfx', id: 'S_TITLE_STAMP' });
  if (d >= 3 && d < 7) out.push({ t: 'say', who: 'NARRATOR', text: '"' + MEETING_NAMES[d] + '"' });
  // below €80, the lenders appear
  out.push({ t: 'if', cond: s => s.money < 80, then: [{ t: 'choice', id: 'BORROW' }] });
  // Saturday: if the fund is visibly short, the people who would help notice (3.9)
  if (d === 6) out.push({ t: 'if', cond: s => !s.booked && s.money < flightPrice(7) && flightPrice(7) - s.money <= 400 && Object.keys(s.borrowed).length === 0, then: [
    { t: 'say', who: 'NARRATOR', dyn: s => 'He is €' + Math.max(0, flightPrice(7) - s.money) + ' short, and the number is known to more people than he told.' },
    { t: 'choice', id: 'BORROW' },
  ] });
  // Joy's saga, Wednesday and Thursday: texts arrive, and answering is a choice (3.15 + playtest)
  if (d === 3) out.push({ t: 'if', cond: s => s.friends >= 1, then: [{ t: 'choice', id: 'JOY_WED' }] });
  if (d === 4) out.push({ t: 'if', cond: s => s.friends >= 1, then: [{ t: 'choice', id: 'JOY_THU' }] });
  // sagaHeard payout: Sunday morning, before the companion check (3.8)
  if (d === 7) out.push({ t: 'if', cond: s => s.sagaHeard >= 5 && !s.f.sagaPaid, then: [
    { t: 'do', fn: s => { s.f.sagaPaid = true; bump('friends', 2); } },
  ] });
  return out;
}

/* ---------- run control ---------- */
function startRun(skip) {
  resetState();
  Object.keys(faceOverride).forEach(k => delete faceOverride[k]);
  GFX.envCache = {};
  skipMode = !!skip;
  // every run starts with the Sunday before: the reel, the bar, the promise (Anna's ruling)
  startDay(0);
}
let priceFlash = 0;   // the ticker's up-arrow animates once per day (3.13)
function startDay(d) {
  if (d === 0) {
    S.day = 1; S.inPrologue = true;
    runBeats(DAYS[0], () => { SAVE.seenIntro = true; saveSave(); S.inPrologue = false; startDay(1); });
    return;
  }
  if (d > 1) endOfDayDecay();
  S.day = d;
  S.coldOpen = true;   // cleared at the day's first choice or minigame
  S.callsToday = 0;
  Object.keys(faceOverride).forEach(k => delete faceOverride[k]);   // yesterday's face stays in yesterday
  applyDailyDrain(d);
  if (d > 1) { AUDIO.sfx('S_PRICE_UP'); priceFlash = 2.5; }
  artDecal = 0;
  const beats = [...DAYS[d]];
  beats.splice(2, 0, ...dailySystemBeats(d));   // after the day card AND the day's art
  if (d >= 2 && d <= 6) beats.splice(Math.max(4, Math.floor(beats.length * 0.6)), 0,
    { t: 'if', cond: s => s.job <= 3 && s.job >= 1, then: [
      { t: 'choice', id: 'WORK_CALL' },
    ] });
  runBeats(beats, () => { if (d < 7) startDay(d + 1); });
}

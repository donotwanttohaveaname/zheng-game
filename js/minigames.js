/* The nine minigames (spec 2.16). Every one has a win exit and a lose exit
   that go to different scenes. Losing is never just a stat penalty.
   Sometimes losing is better. Minimum touch target 24x24. Never skippable. */

const MG_TOP = 44;

function mgFrame(ctx, title, t, dur) {
  ctx.fillStyle = PAL20.K; ctx.fillRect(0, MG_TOP, 180, 320 - MG_TOP);
  ctx.fillStyle = PAL20.D; ctx.fillRect(0, MG_TOP, 180, 12);
  drawTextCenter(ctx, title, 90, MG_TOP + 3, PAL20.A);
  const w = Math.max(0, 1 - t / dur) * 180;
  ctx.fillStyle = PAL20.M; ctx.fillRect(0, MG_TOP + 12, Math.round(w), 2);
}
function mgBtn(ctx, b, active) {
  ctx.fillStyle = active ? PAL20.S : PAL20.D;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = PAL20.T; ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  const lines = wrapText(b.label, Math.floor((b.w - 8) / 6));
  lines.slice(0, 2).forEach((l, i) => drawTextCenter(ctx, l, b.x + b.w / 2, b.y + Math.round((b.h - lines.length * 9) / 2) + 1 + i * 9, PAL20.W));
}
const inRect = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

const MINIGAMES = {};

/* ---- 1. THE CLEAN-UP: slow, manual, every single day. deliberately tedious. ---- */
MINIGAMES.CLEAN_UP = {
  init(cfg) {
    this.day = cfg.day; this.dur = 15; this.t = 0; this.done = false;
    // Kinu's week (appendix C): a different place every single day
    const SPOT = [null,
      ['laptop_puke', 'the keyboard'], ['apartment', 'the left shoe'],
      ['kitchen', 'the tote bag. on the leek.'], ['apartment', 'the wifi router'],
      ['dinner', 'the exact centre of the table'], ['apartment', 'the good jacket'],
      ['ceiling', 'the ceiling. somehow.']][Math.min(7, cfg.day)];
    this.bg = SPOT[0]; this.caption = SPOT[1];
    const n = 1 + (cfg.day >= 4 ? 1 : 0) + (cfg.day >= 7 ? 1 : 0);
    this.dur = 9 + 7 * n;   // enough time for every puddle. it is tedious, not unfair.
    this.puddles = [];
    for (let i = 0; i < n; i++) this.puddles.push({
      x: 30 + ((cfg.day * 37 + i * 61) % 122), y: MG_TOP + 40 + ((cfg.day * 53 + i * 47) % 74),
      stage: 4, routed: false,
    });
    this.pi = 0;               // current puddle
    this.phase = 'towel';      // towel → wipe → route
    this.towel = { x: 8, y: 178, w: 34, h: 34, label: '' };
    this.leaveBtn = { x: 122, y: 292, w: 54, h: 24, label: 'LEAVE IT' };
    this.pickT = 0; this.left = false; this.wiped = 0; this.wrongBin = false;
    this.binToast = null; this.binToastT = 0; this.doneAfterToast = false;
    this.bins = ['BIO', 'MIXED', 'PAPER', '?'].map((label, i) => ({
      label, x: 6 + i * 43, y: 246, w: 41, h: 32,
      color: ['G', 'S', 'P', 'M'][i],
    }));
  },
  cur() { return this.puddles[this.pi]; },
  update(dt, input) {
    this.t += dt;
    if (this.pickT > 0) { this.pickT -= dt; return; }   // the animation. it is not fast.
    const p = this.cur();
    input.taps.forEach(tp => {
      if (this.done) return;
      if (inRect(tp, this.leaveBtn)) { this.left = true; this.done = true; AUDIO.sfx('S_PIP_LOSS'); return; }
      if (this.phase === 'towel' && inRect(tp, this.towel)) { this.phase = 'wipe'; this.pickT = 0.9; AUDIO.sfx('S_SWIPE_AWAY'); }
      if (this.phase === 'route') {
        this.bins.forEach(b => {
          if (!inRect(tp, b)) return;
          if (b.label === 'MIXED') { AUDIO.sfx('S_BIN_RIGHT'); this.binToast = 'MIXED. correct.'; }
          else { AUDIO.sfx('S_BIN_WRONG'); this.wrongBin = true; this.binToast = 'JULIUS, from the other room: hm?'; }
          this.binToastT = 1.1; this.pickT = 1.1;   // let the reaction land before the next puddle
          p.routed = true;
          if (this.pi < this.puddles.length - 1) { this.pi++; this.phase = 'towel'; }
          else this.done = true;
        });
      }
    });
    if (this.phase === 'wipe') {
      input.swipes.forEach(sw => {
        if (p.stage > 0 && Math.hypot(sw.x - p.x, sw.y - p.y) < 30) {
          p.stage--; AUDIO.sfx('S_SWIPE_AWAY', { pitch: 1 + (4 - p.stage) * 0.08 });
          if (p.stage <= 0) this.phase = 'route';
        }
      });
    }
    if (this.t >= this.dur && !this.done && !this.doneAfterToast) { this.left = true; this.done = true; }
    if (this.done && this.binToastT > 0) this.done = false, this.doneAfterToast = true;
    if (this.doneAfterToast && this.binToastT <= 0) this.done = true;
  },
  draw(ctx) {
    mgFrame(ctx, 'THE CLEAN-UP · ' + Math.min(this.pi + 1, this.puddles.length) + '/' + this.puddles.length, this.t, this.dur);
    // the scene of the crime, per Kinu's week
    const bg = this.bg === 'apartment' ? (S.windowOpen ? 'apartment_cool' : 'apartment_hot') : this.bg;
    ctx.drawImage(envCard(bg), 0, MG_TOP + 16, 180, 110);
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, MG_TOP + 114, 180, 12);
    drawTextCenter(ctx, this.caption, 90, MG_TOP + 116, PAL20.C);
    // the one you are cleaning right now
    const cur = this.cur();
    if (cur && !cur.routed && Math.floor(this.t * 3) % 2 === 0) {
      drawTextCenter(ctx, '▼', cur.x, cur.y - 24, PAL20.A);
    }
    // towel roll
    ctx.fillStyle = PAL20.W; ctx.fillRect(this.towel.x + 6, this.towel.y + 4, 18, 22);
    ctx.fillStyle = PAL20.P; ctx.fillRect(this.towel.x + 6, this.towel.y + 4, 18, 4);
    ctx.fillStyle = PAL20.K; ctx.fillRect(this.towel.x + 12, this.towel.y + 1, 6, 3);
    this.puddles.forEach((p, i) => {
      if (p.routed) return;
      if (i === this.pi && p.stage <= 0) {
        ctx.fillStyle = PAL20.V; ctx.fillRect(p.x - 5, p.y - 3, 10, 6);   // the residue
      } else if (p.stage > 0) {
        ctx.drawImage(GFX.decals[Math.min(5, p.stage + 1)], p.x - 16, p.y - 16, 32, 32);
      }
    });
    this.bins.forEach(b => {
      if (this.phase !== 'route') return;
      ctx.fillStyle = PAL20[b.color]; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = PAL20.K; ctx.fillRect(b.x, b.y, b.w, 5);
      drawTextCenter(ctx, b.label, b.x + b.w / 2, b.y + 12, PAL20.K);
    });
    mgBtn(ctx, this.leaveBtn, false);
    if (this.binToastT > 0) {
      this.binToastT -= 1 / 60;
      ctx.fillStyle = PAL20.K; ctx.fillRect(8, 196, 164, 16);
      ctx.strokeStyle = this.binToast.includes('correct') ? PAL20.G : PAL20.C;
      ctx.strokeRect(8.5, 196.5, 163, 15);
      drawTextCenter(ctx, this.binToast, 90, 200, PAL20.W);
    }
    const hint = this.phase === 'towel' ? 'tap the paper towel' : this.phase === 'wipe' ? 'wipe. four strokes.' : 'the residue goes in a bin';
    drawTextCenter(ctx, hint, 90, 284, PAL20.T);
  },
  result() { return { win: !this.left, left: this.left, wrongBin: !!this.wrongBin }; },
};

/* ---- 2. SORTING HELL v2: three waves, legible labels, a strip of four bins ---- */
MINIGAMES.SORTING_HELL = {
  init(cfg) {
    this.dur = 34; this.t = 0; this.done = false;
    this.speed = 0.85 + cfg.day * 0.1;
    this.allBins = [
      ['PAPER', 'P'], ['CARD', 'B'], ['GLASS', 'Z'], ['METAL', 'T'],
      ['PLASTIC', 'A'], ['BIO', 'G'], ['MIXED', 'S'], ['?', 'M'],
    ];
    this.waves = [
      [['banana peel', 'BIO'], ['newspaper', 'PAPER'], ['wine bottle', 'GLASS']],
      [['a thermal receipt', '?'], ['a tea bag', '?'], ['a "compostable" fork', '?']],
      [['yoghurt lid', 'PLASTIC'], ['envelope, plastic window', 'PAPER'], ['one Kinu hairball', '?'], ['a battery', 'MIXED']],
    ];
    this.wave = 0; this.idx = 0; this.itemY = MG_TOP + 20;
    this.wrong = 0; this.toast = null; this.toastT = 0; this.hintT = 0; this.hinted = {};
  },
  binRect(i) { return { x: 2 + (i % 4) * 44, y: 240 + Math.floor(i / 4) * 34, w: 43, h: 30 }; },
  item() { const w = this.waves[this.wave]; return w && w[this.idx]; },
  advance() {
    this.idx++;
    if (this.idx >= this.waves[this.wave].length) { this.wave++; this.idx = 0; }
    this.itemY = MG_TOP + 20;
    if (this.wave >= this.waves.length) this.done = true;
  },
  julius(n) {
    return [null,
      'JULIUS: hm?',
      "JULIUS: That one's tricky, actually. Genuinely tricky.",
      'JULIUS: Do you want me to just... do it?',
      "JULIUS: It's fine. Honestly. It's completely fine.",
      '(He sorts the rest of the bag himself.)',
      '(He takes the bag out at 23:00.)'][Math.min(6, n)];
  },
  update(dt, input) {
    this.t += dt;
    if (this.toastT > 0) { this.toastT -= dt; return; }
    if (this.done) return;
    const it = this.item();
    if (!it) { this.done = true; return; }
    if (this.hintT > 0) this.hintT -= dt;
    else this.itemY += (9 + this.wave * 5) * this.speed * dt;
    let handled = false;
    input.taps.forEach(tp => {
      if (handled || this.done) return;
      // tap the falling item: pause it, show the hint card. once per item.
      const hkey = this.wave * 10 + this.idx;
      if (Math.abs(tp.x - 90) < 44 && Math.abs(tp.y - this.itemY) < 14 && this.hintT <= 0 && !this.hinted[hkey]) {
        this.hinted[hkey] = true;
        this.hintT = 2; handled = true; AUDIO.sfx('S_CHOICE_HOVER'); return;
      }
      for (let i = 0; i < 8; i++) {
        const b = this.binRect(i);
        if (!inRect(tp, b)) continue;
        handled = true;
        const [label] = this.allBins[i];
        if (label === it[1]) AUDIO.sfx('S_BIN_RIGHT');
        else {
          this.wrong++; AUDIO.sfx('S_BIN_WRONG');
          this.toast = this.julius(this.wrong); this.toastT = 1.5;
        }
        this.advance();
      }
    });
    if (this.itemY > 232) {
      this.wrong++; AUDIO.sfx('S_BIN_WRONG');
      this.toast = this.julius(this.wrong); this.toastT = 1.5;
      this.advance();
    }
    if (this.t >= this.dur && !this.done) {
      while (this.item()) { this.wrong++; this.advance(); }   // the unsorted bag is a wrong bag
      this.done = true;
    }
  },
  draw(ctx) {
    mgFrame(ctx, 'SORTING HELL · WAVE ' + Math.min(3, this.wave + 1) + '/3', this.t, this.dur);
    for (let i = 0; i < 8; i++) {
      const [label, col] = this.allBins[i];
      const b = this.binRect(i);
      ctx.fillStyle = PAL20[col]; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = PAL20.K; ctx.fillRect(b.x, b.y, b.w, 4);
      drawTextCenter(ctx, label, b.x + b.w / 2, b.y + 13, PAL20.K);
    }
    const it = this.item();
    if (it && !this.done) {
      drawTextCenter(ctx, it[0], 90, Math.round(this.itemY), PAL20.W);
      ctx.fillStyle = PAL20.C; ctx.fillRect(86, Math.round(this.itemY) + 10, 8, 8);
      if (this.hintT > 0) {
        ctx.fillStyle = PAL20.D; ctx.fillRect(30, 130, 120, 34);
        ctx.strokeStyle = PAL20.A; ctx.strokeRect(30.5, 130.5, 119, 33);
        drawTextCenter(ctx, 'think about', 90, 138, PAL20.P);
        drawTextCenter(ctx, 'what it is MADE of', 90, 148, PAL20.P);
      }
    }
    drawText(ctx, 'wrong: ' + this.wrong, 6, 228, PAL20.T);
    if (this.toastT > 0 && this.toast) {
      ctx.fillStyle = PAL20.K; ctx.fillRect(8, 150, 164, 24);
      ctx.strokeStyle = PAL20.G; ctx.strokeRect(8.5, 150.5, 163, 23);
      wrapText(this.toast, 26).slice(0, 2).forEach((l, i) => drawTextCenter(ctx, l, 90, 155 + i * 9, PAL20.C));
    }
    drawTextCenter(ctx, 'tap item = hint · arrows = more bins', 90, 306, PAL20.T);
  },
  result() { return { win: this.wrong === 0, wrong: this.wrong }; },
};

/* ---- 3. THE DINNER: you can add meat. the tension is entirely honest. ---- */
MINIGAMES.THE_DINNER = {
  init(cfg) {
    this.dur = 40; this.t = 0; this.done = false;
    this.state = cfg.state;
    this.taste = 0;
    this.meat = 0; this.adds = 0;
    // v3.2 playtest: ingredients drift past on two lanes, full names written out
    const NAMES = { rice: 'rice', aubergine: 'aubergine', chickpeas: 'chickpeas', tofu: 'tofu', oat: 'oat cream', herbs: 'herbs', garlic: 'garlic', bacon: 'bacon', sausage: 'sausage', lard: 'lard', stock: 'chicken stock', fish: 'fish sauce' };
    this.shelf = [
      ['rice', 0], ['bacon', 1], ['aubergine', 0], ['sausage', 1], ['chickpeas', 0], ['lard', 1],
      ['tofu', 0], ['stock', 1], ['oat', 0], ['fish', 1], ['herbs', 0], ['garlic', 0],
    ].map(([k, m], i) => ({
      k, m, used: false, name: NAMES[k],
      cx: (Math.floor(i / 2)) * 92, lane: i % 2,
    }));
    this.zhengLine = null; this.lineT = 0; this.flash = 0;
    this.doneBtn = { x: 50, y: 288, w: 80, h: 26, label: 'SERVE IT' };
    this.meatLines = ["Nobody's going to know.", "That's for flavour. That's a flavour thing.", '...', "I'm not sorry."];
    AUDIO.sfx('S_SIZZLE');
  },
  update(dt, input) {
    this.t += dt;
    if (this.lineT > 0) this.lineT -= dt;
    if (this.flash > 0) this.flash -= dt;
    this.shelf.forEach(it => {
      if (it.used) return;
      it.cx -= 26 * dt;
      if (it.cx < -70) it.cx += 552;   // six per lane, spaced 92
    });
    input.taps.forEach(tp => {
      if (this.done) return;
      if (inRect(tp, this.doneBtn) && this.adds >= 3) { this.done = true; AUDIO.sfx('S_CHOICE_CONFIRM'); return; }
      this.shelf.forEach(s => {
        const box = { x: s.cx - 6, y: MG_TOP + 36 + s.lane * 52, w: 40, h: 44 };
        if (s.used || !inRect(tp, box)) return;
        if (s.k === 'fish' && !s.warned) {
          // first tap: full klaxon, red flash, and it does NOT go in. his conscience, out loud.
          s.warned = true; this.flash = 0.9;
          AUDIO.sfx('S_FISH_KLAXON');
          return;
        }
        s.used = true; this.adds++;
        if (s.m) {
          this.meat++; this.taste = Math.min(10, this.taste + 2);
          bump('sanity', 1);   // Zheng is not a vegetarian and has not eaten properly in six days
          this.zhengLine = this.meatLines[Math.min(3, this.meat - 1)]; this.lineT = 1.8;
          AUDIO.sfx('S_TEMU_BUY');
        } else {
          this.taste = Math.min(10, this.taste + 1);
          AUDIO.sfx('S_BIN_RIGHT');
        }
      });
    });
    if (this.t >= this.dur) this.done = true;
  },
  draw(ctx) {
    mgFrame(ctx, 'THE DINNER', this.t, this.dur);
    // meters: honest, visible, no trick
    const meter = (label, val, y, col) => {
      drawText(ctx, label, 8, y, PAL20[col]);
      ctx.fillStyle = PAL20.K; ctx.fillRect(48, y, 124, 7);
      ctx.fillStyle = PAL20.D; ctx.fillRect(49, y + 1, 122, 5);
      ctx.fillStyle = PAL20[col];
      ctx.fillRect(49, y + 1, Math.round(Math.max(0, Math.min(10, val)) / 10 * 122), 5);
    };
    meter('TASTE', this.taste, MG_TOP + 15 - 12 + 12, 'G');
    meter('MEAT', this.meat * 2, MG_TOP + 15 + 12 - 2, 'R');
    this.shelf.forEach(s => {
      if (s.used) return;
      if (s.cx < -40 || s.cx > 180) return;
      const y = MG_TOP + 40 + s.lane * 52;
      ctx.fillStyle = PAL20.D; ctx.fillRect(s.cx - 2, y - 2, 28, 28);
      ctx.strokeStyle = s.m ? PAL20.R : PAL20.G; ctx.strokeRect(s.cx - 1.5, y - 1.5, 27, 27);
      const img = gridToCanvas(ingredient(s.k));
      ctx.drawImage(img, s.cx + 4, y + 4, 16, 16);
      drawTextCenter(ctx, s.name, s.cx + 12, y + 28, s.m ? PAL20.C : PAL20.W);
    });
    if (this.adds >= 3) mgBtn(ctx, this.doneBtn, false);
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(201,49,60,' + Math.min(0.8, this.flash) + ')';
      ctx.fillRect(0, MG_TOP, 180, 320 - MG_TOP);
      drawTextCenter(ctx, 'STOP. STOP.', 90, 150, PAL20.W);
      drawTextCenter(ctx, 'THAT ONE HAS FISH IN IT.', 90, 162, PAL20.W);
    }
    if (this.lineT > 0 && this.zhengLine) {
      ctx.fillStyle = PAL20.K; ctx.fillRect(10, 200, 160, 16);
      drawTextCenter(ctx, 'ZHENG: ' + this.zhengLine, 90, 204, PAL20.P);
    }
    drawTextCenter(ctx, 'tap food as it drifts past.', 90, 262, PAL20.T);
    drawTextCenter(ctx, 'green: TASTE. red: TASTE and MEAT.', 90, 272, PAL20.T);
  },
  result() { return { win: true, meat: this.meat, taste: this.taste, adds: this.adds }; },
};

/* ---- 4. THE FAN: one fan, three targets, no AC. there was never an AC. ---- */
MINIGAMES.THE_FAN = {
  init(cfg) {
    this.dur = 14; this.t = 0; this.done = false;
    this.work = 0; this.aim = 'zheng'; this.kinuTime = 0; this.risk = 0;
    this.targets = [
      { id: 'zheng', label: 'ZHENG', x: 8, y: 240, w: 52, h: 38 },
      { id: 'kinu', label: 'KINU', x: 64, y: 240, w: 52, h: 38 },
      { id: 'laptop', label: 'LAPTOP', x: 120, y: 240, w: 52, h: 38 },
    ];
    this.situation = 'zheng'; this.sitT = 0;
    this.mattMsgs = ['yo', 'tonight?', 'the hat misses you', 'ok ok. focus. sorry.'];
    this.mi = 0; this.msg = null; this.msgT = 3.2;
  },
  update(dt, input) {
    this.t += dt; this.sitT += dt;
    this.msgT -= dt;
    if (this.msgT <= 0 && this.mi < this.mattMsgs.length) {
      this.msg = this.mattMsgs[this.mi++]; this.msgT = 3;
      AUDIO.sfx('S_SLACK_PING');
    }
    if (this.sitT > 3.2) {   // the situation changes and you re-aim
      this.sitT = 0;
      this.situation = ['zheng', 'kinu', 'laptop'][(Math.random() * 3) | 0];
    }
    input.taps.forEach(tp => this.targets.forEach(b => {
      if (inRect(tp, b) && this.aim !== b.id) { this.aim = b.id; AUDIO.sfx('S_FAN'); }
    }));
    // one rule: the fan helps whatever the room is complaining about
    this.work += (this.aim === this.situation ? 14 : 4) * dt;
    if (this.aim === 'kinu') this.kinuTime += dt;
    if (this.situation === 'kinu' && this.aim !== 'kinu') this.risk += dt;
    if (Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2)) AUDIO.sfx('S_METER_TICK');
    if (this.work >= 100 || this.t >= this.dur) this.done = true;
  },
  draw(ctx) {
    mgFrame(ctx, 'THE FAN', this.t, this.dur);
    ctx.fillStyle = PAL20.D; ctx.fillRect(20, MG_TOP + 24, 140, 10);
    ctx.fillStyle = PAL20.Z; ctx.fillRect(21, MG_TOP + 25, Math.round(this.work / 100 * 138), 8);
    drawText(ctx, 'WORK', 20, MG_TOP + 16, PAL20.Z);
    drawTextRight(ctx, '€' + (Math.ceil(this.t / 5) * 12), 170, MG_TOP + 16, PAL20.R);
    // the room
    const sit = { zheng: 'ZHENG IS DISSOLVING', kinu: 'KINU IS EYEING THE WINDOW', laptop: 'THE LAPTOP IS THROTTLING' }[this.situation];
    drawTextCenter(ctx, sit, 90, 132, PAL20.C);
    const TX = { zheng: 32, kinu: 90, laptop: 145 };
    ctx.drawImage(GFX.sprites['zheng2'], 20, 158, 24, 32);
    ctx.drawImage(GFX.kinu[this.situation === 'kinu' && this.aim !== 'kinu' ? 'crouch' : 'loaf'], 78, 166, 24, 24);
    ctx.fillStyle = PAL20.P; ctx.fillRect(132, 164, 26, 18);
    ctx.fillStyle = PAL20.K; ctx.fillRect(134, 166, 22, 12);
    // THE FAN, visibly a fan, visibly pointed at something
    const fx = 90, fy = 210;
    ctx.fillStyle = PAL20.K; ctx.fillRect(fx - 2, fy, 4, 16); ctx.fillRect(fx - 8, fy + 14, 16, 3);
    ctx.fillStyle = PAL20.P;
    ctx.beginPath(); ctx.arc(fx, fy - 6, 8, 0, 7); ctx.fill();
    ctx.fillStyle = PAL20.S;
    ctx.beginPath(); ctx.arc(fx, fy - 6, 3, 0, 7); ctx.fill();
    // breeze lines from the fan to the aimed target
    const ax = TX[this.aim];
    ctx.strokeStyle = PAL20.W;
    for (let i = 0; i < 3; i++) {
      const t0 = (this.t * 2 + i * 0.33) % 1;
      const bx = fx + (ax - fx) * t0, by = (fy - 8) + (186 - (fy - 8)) * t0;
      ctx.strokeRect(bx - 3, by, 6, 1);
    }
    // an arrow over whatever is complaining
    if (Math.floor(this.t * 3) % 2 === 0) drawTextCenter(ctx, '▼', TX[this.situation], 146, PAL20.A);
    this.targets.forEach(b => mgBtn(ctx, b, this.aim === b.id));
    if (this.msg) {
      ctx.fillStyle = PAL20.K; ctx.fillRect(36, MG_TOP + 40, 108, 14);
      ctx.strokeStyle = '#2a5f9e'; ctx.strokeRect(36.5, MG_TOP + 40.5, 107, 13);
      drawTextCenter(ctx, 'MATT: ' + this.msg, 90, MG_TOP + 43, PAL20.W);
    }
    drawTextCenter(ctx, 'point it at the loudest problem', 90, 296, PAL20.T);
    drawTextCenter(ctx, 'running cost: €12 per 5 seconds', 90, 306, PAL20.T);
  },
  result() {
    return { win: this.work >= 100, fanMinutes: Math.ceil(this.t / 5), kinuCalmed: this.kinuTime >= 4, risk: this.risk,
      mainTarget: this.kinuTime >= this.t / 2 ? 'kinu' : (this.aim === 'laptop' ? 'laptop' : 'zheng') };
  },
};

/* ---- 5. THE CO-OP SESSION: quitting is correct and you will not want to ---- */
MINIGAMES.CO_OP = {
  init(cfg) {
    this.t = 0; this.dur = 999; this.done = false;
    this.workBar = 100; this.quit = false;
    this.py = 0; this.vy = 0; this.grounded = true;
    this.obstacles = []; this.nextOb = 1.2; this.shots = []; this.score = 0; this.hits = 0;
    this.frame = 0;
    this.msgs = ['one more', 'ok one more', 'bro', 'BRO', 'you are actually good at this', 'ONE more'];
    this.mi = 0; this.msgT = 2.5; this.msg = null;
    this.bJump = { x: 8, y: 272, w: 44, h: 44, label: 'JUMP' };
    this.bShoot = { x: 128, y: 272, w: 44, h: 44, label: 'SHOOT' };
    this.bQuit = { x: 62, y: 284, w: 56, h: 22, label: 'QUIT' };
    this.groundY = 236;
  },
  update(dt, input) {
    this.t += dt;
    this.workBar -= 4 * dt;                    // draining in real time, at the top, in view
    this.frame += dt * 8;
    this.msgT -= dt;
    if (this.msgT <= 0 && this.mi < this.msgs.length) {
      this.msg = this.msgs[this.mi++]; this.msgT = 2.8;
      AUDIO.sfx('S_SLACK_PING');
    }
    input.taps.forEach(tp => {
      if (inRect(tp, this.bQuit)) { this.quit = true; this.done = true; AUDIO.sfx('S_CHOICE_CONFIRM'); return; }
      if (inRect(tp, this.bJump) && this.grounded) { this.vy = -95; this.grounded = false; AUDIO.sfx('S_SWIPE_AWAY'); }
      if (inRect(tp, this.bShoot)) { this.shots.push({ x: 40, y: this.groundY - 8 + this.py }); AUDIO.sfx('S_METER_TICK'); }
    });
    if (!this.grounded) {
      this.vy += 260 * dt; this.py += this.vy * dt;
      if (this.py >= 0) { this.py = 0; this.vy = 0; this.grounded = true; }
    }
    this.nextOb -= dt;
    if (this.nextOb <= 0) {
      this.nextOb = 1.1 + (Math.sin(this.t * 7.3) + 1) * 0.5;
      const kinds = ['blob', 'spike', 'flyer'];
      const kind = kinds[(Math.random() * 3) | 0];
      this.obstacles.push({ kind, x: 190, y: kind === 'flyer' ? this.groundY - 26 : this.groundY - 14 });
    }
    const speed = 60 + Math.min(40, this.t * 2);
    this.obstacles.forEach(o => o.x -= speed * dt);
    this.shots.forEach(s => s.x += 140 * dt);
    this.obstacles = this.obstacles.filter(o => {
      if (o.x < -20) { this.score++; return false; }
      const hitShot = this.shots.find(s => Math.abs(s.x - o.x) < 8 && Math.abs(s.y - (o.y + 6)) < 14 && o.kind !== 'spike');
      if (hitShot) { this.score += 2; AUDIO.sfx('S_COIN'); return false; }
      const px2 = 34, pyv = this.groundY - 14 + this.py;
      if (Math.abs(o.x - px2) < 10 && Math.abs(o.y - pyv) < 12) { this.hits++; AUDIO.sfx('S_WRONG_TAP'); return false; }
      return true;
    });
    this.shots = this.shots.filter(s => s.x < 190);
    if (this.workBar <= 0) { this.workBar = 0; this.done = true; }
  },
  draw(ctx) {
    mgFrame(ctx, 'CO-OP · MATT', this.t, 30);
    // work bar, top third, clashing with everything on purpose
    ctx.fillStyle = PAL20.K; ctx.fillRect(0, MG_TOP + 14, 180, 22);
    ctx.fillStyle = PAL20.D; ctx.fillRect(2, MG_TOP + 16, 176, 18);
    ctx.fillStyle = this.workBar < 30 ? PAL20.R : PAL20.V;
    ctx.fillRect(2, MG_TOP + 16, Math.round(this.workBar / 100 * 176), 18);
    drawText(ctx, 'WORK', 6, MG_TOP + 21, PAL20.K);
    // the game inside the game
    ctx.drawImage(gridToCanvas(mgBack()), 0, MG_TOP + 38, 180, 60);
    for (let x = 0; x < 180; x += 16) ctx.drawImage(gridToCanvas(mgGround()), x - (this.t * 60 % 16), this.groundY + 2, 16, 16);
    const run = MG.run[Math.floor(this.frame) % 4];
    const sprite2 = this.grounded ? fromRows(run, 16, 16, { K: 'A' }) : fromRows(MG.jump, 16, 16, { K: 'A' });
    ctx.drawImage(gridToCanvas(sprite2), 26, this.groundY - 16 + this.py, 16, 16);
    this.obstacles.forEach(o => ctx.drawImage(gridToCanvas(mgEnemy(o.kind, Math.floor(this.frame) % 2)), o.x - 8, o.y - 8, 16, 16));
    ctx.fillStyle = PAL20.W;
    this.shots.forEach(s => ctx.fillRect(s.x, s.y, 4, 2));
    drawText(ctx, 'score ' + this.score, 6, this.groundY + 20, PAL20.P);
    if (this.msg) {
      ctx.fillStyle = PAL20.K; ctx.fillRect(40, MG_TOP + 40, 100, 14);
      ctx.strokeStyle = '#2a5f9e'; ctx.strokeRect(40.5, MG_TOP + 40.5, 99, 13);
      drawTextCenter(ctx, 'MATT: ' + this.msg, 90, MG_TOP + 43, PAL20.W);
    }
    mgBtn(ctx, this.bJump, false); mgBtn(ctx, this.bShoot, false); mgBtn(ctx, this.bQuit, false);
  },
  result() {
    return { win: this.quit && this.workBar > 0, seconds: this.t, workLeft: this.workBar, score: this.score };
  },
};

/* ---- 6. SLACK STORM: swiped-away pings come back. they always come back. ---- */
MINIGAMES.SLACK_STORM = {
  init(cfg) {
    this.hrGone = false;
    this.dur = 10; this.t = 0; this.done = false;
    // the noise is varied noise. the one that matters states its stakes.
    const NOISE = [
      ['Jira', '47 updates'], ['IT', 'the printer again'], ['all-hands', 'moved to 8:15'],
      ['Marketing', 'cake, kitchen 3'], ['Tuomas', '?'], ['Maria (OOO)', 'auto-reply'],
    ];
    this.pings = [];
    let ni = 0;
    for (let i = 0; i < 8; i++) {
      const kind = i === 4 ? 'HR' : (i % 3 === 0 ? 'SANDAL' : 'NOISE');
      const noise = NOISE[ni++ % NOISE.length];
      this.pings.push({
        x: 190 + i * 46, y: MG_TOP + 30 + ((i * 67) % 200),
        vx: -(34 + (i % 3) * 10), w: 68, h: 24,
        kind, alive: true,
        name: kind === 'HR' ? 'PEOPLE OPS' : kind === 'SANDAL' ? 'Sandal' : noise[0],
        line: kind === 'HR' ? 'HOLIDAY APPROVAL' : kind === 'SANDAL' ? 'ownership...' : noise[1],
      });
    }
    // never explain this one
    if (cfg.state && cfg.state.sanity < 4) { const z = this.pings[6]; z.kind = 'ZHENG'; z.name = 'Zheng'; z.line = 'in 11 minutes'; }
    this.hrTapped = false; this.sandalTapped = false; this.wall = 0; this.swiped = 0;
  },
  update(dt, input) {
    this.t += dt;
    if (this.wall > 0) { this.wall -= dt; return; }
    this.pings.forEach(p => { if (p.alive) p.x += (p.x > 106 ? -75 : -15) * dt; });
    input.taps.forEach(tp => this.pings.forEach(p => {
      if (p.alive && inRect(tp, p)) {
        if (p.kind === 'HR') { this.hrTapped = true; p.alive = false; AUDIO.sfx('S_CHOICE_CONFIRM'); }
        else if (p.kind === 'SANDAL') { this.sandalTapped = true; this.wall = 1.4; p.alive = false; AUDIO.sfx('S_WRONG_TAP'); }
      }
    }));
    input.swipes.forEach(sw => this.pings.forEach(p => {
      if (p.alive && inRect(sw, p)) {
        p.alive = false; this.swiped++; AUDIO.sfx('S_SWIPE_AWAY');
        if (p.kind === 'HR') this.hrGone = true;
      }
    }));
    if (this.t >= this.dur || this.pings.every(p => !p.alive || p.x < -70)) this.done = true;
  },
  draw(ctx) {
    mgFrame(ctx, 'SLACK STORM', this.t, this.dur);
    this.pings.forEach(p => {
      if (!p.alive || p.x < -70) return;
      const hr = p.kind === 'HR';
      ctx.fillStyle = hr ? PAL20.A : PAL20.D;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // the important one pulses. the noise does not get to pulse.
      ctx.strokeStyle = hr ? (Math.floor(this.t * 4) % 2 ? PAL20.W : PAL20.R) : PAL20.S;
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
      if (hr) { ctx.strokeStyle = PAL20.K; ctx.strokeRect(p.x + 1.5, p.y + 1.5, p.w - 3, p.h - 3); }
      drawText(ctx, p.name, p.x + 4, p.y + 3, hr ? PAL20.K : PAL20.P);
      drawText(ctx, p.line, p.x + 4, p.y + 13, hr ? PAL20.K : PAL20.T);
    });
    if (this.wall > 0) {
      ctx.fillStyle = PAL20.D; ctx.fillRect(10, 100, 160, 120);
      wrapText('Four hundred words on ownership. The word "ownership" appears nine times. It is not defined once.', 25)
        .forEach((l, i) => drawText(ctx, l, 16, 108 + i * 9, PAL20.P));
    }
    drawTextCenter(ctx, 'swipe the noise away. it queues.', 90, 300, PAL20.T);
    drawTextCenter(ctx, 'TAP the one that matters.', 90, 310, PAL20.C);
  },
  result() { return { win: this.hrTapped, sandalTapped: this.sandalTapped, swiped: this.swiped }; },
};

/* ---- 7. PERFORMANCE REVIEW: the words come back on Sunday, verbatim ---- */
MINIGAMES.PERFORMANCE_REVIEW = {
  init() {
    this.dur = 12; this.t = 0; this.done = false;
    const words = ['synergy', 'obviously', 'hydrated', 'sorry', 'upskilling', 'ownership', 'fine', 'no'];
    this.words = words.map((w, i) => ({
      w, x: 10 + (i % 2) * 85, y: MG_TOP + 30 + i * 28,
      vx: (i % 2 ? -1 : 1) * (8 + (i % 3) * 5), picked: false,
    }));
    this.picked = [];
  },
  update(dt, input) {
    this.t += dt;
    this.words.forEach(w => {
      if (w.picked) return;
      w.x += w.vx * dt;
      if (w.x < 4 || w.x > 176 - w.w.length * 6) w.vx *= -1;
    });
    input.taps.forEach(tp => this.words.forEach(w => {
      if (!w.picked && this.picked.length < 4 &&
        tp.x >= w.x - 6 && tp.x <= w.x + w.w.length * 6 + 6 && tp.y >= w.y - 9 && tp.y <= w.y + 16) {
        w.picked = true; this.picked.push(w.w); AUDIO.sfx('S_CHOICE_CONFIRM');
      }
    }));
    if (this.picked.length >= 4 || this.t >= this.dur) this.done = true;
  },
  draw(ctx) {
    mgFrame(ctx, 'PERFORMANCE REVIEW', this.t, this.dur);
    this.words.forEach(w => {
      if (w.picked) return;
      const fade = 0.5 + 0.5 * Math.sin(this.t * 2 + w.y);
      drawText(ctx, w.w, Math.round(w.x), Math.round(w.y), fade > 0.5 ? PAL20.P : PAL20.T);
    });
    drawText(ctx, 'YOUR SELF-ASSESSMENT:', 8, 262, PAL20.T);
    drawText(ctx, this.picked.join(' ') || '...', 8, 274, PAL20.A);
    drawTextCenter(ctx, 'grab four words. for the form.', 90, 306, PAL20.T);
  },
  result() { return { win: true, picked: this.picked }; },
};

/* ---- 8. DRINK DODGE: Susan handles the money. Joy handles the boys. ---- */
MINIGAMES.DRINK_DODGE = {
  init(cfg) {
    this.dur = 36; this.t = 0; this.done = false;
    this.state = cfg.state;
    this.rounds = [
      ['SUSAN', "okay but this one's on me.  (it is not on her.)", null],
      ['JOY', "ville said i'm intense. am i intense. don't answer. one more first.", 'saga'],
      ['SUSAN', "zheng. zheng. it's eighteen euros. it's eighteen euros.", null],
      ['JOY', 'okay so aleksi is OVER. ville is now. keep up. shots?', 'saga'],
      ['JOY', "do you think we're the same people we were", 'saga'],
      ['SUSAN', "we're getting a table", null],
    ];
    this.ri = 0; this.accepted = 0; this.roundT = 0;
    this.btnA = { x: 10, y: 240, w: 76, h: 34, label: 'ACCEPT -€18' };
    this.btnD = { x: 94, y: 240, w: 76, h: 34, label: 'DECLINE' };
    AUDIO.music('M_NIGHT', { tempo: 1 });
  },
  update(dt, input) {
    this.t += dt; this.roundT += dt;
    if (this.ri >= this.rounds.length) { this.done = true; return; }
    let pick = null;
    input.taps.forEach(tp => {
      if (inRect(tp, this.btnA)) pick = 'a';
      if (inRect(tp, this.btnD)) pick = 'd';
    });
    if (this.roundT > 6) pick = 'a';   // hesitation is acceptance. it always was.
    if (pick) {
      const s = this.state;
      if (pick === 'a') {
        s.money -= 18; bump('sanity', 1); bump('friends', 1); this.accepted++;
        if (this.rounds[this.ri][2] === 'saga') s.sagaHeard++;
        AUDIO.sfx('S_CLINK');
      }
      else { bump('sanity', -1); s.guilt++; AUDIO.sfx('S_PIP_LOSS'); }
      this.ri++; this.roundT = 0;
      AUDIO.music('M_NIGHT', { tempo: 1 + this.ri * 0.06 });
    }
  },
  draw(ctx) {
    mgFrame(ctx, 'DRINK DODGE · R' + Math.min(6, this.ri + 1) + '/6', this.t, this.dur);
    if (this.ri < this.rounds.length) {
      const [who, line] = this.rounds[this.ri];
      const port = GFX.portraits[who === 'JOY' ? (this.ri >= 4 ? 'JOY.emotional' : 'JOY.delighted') : 'SUSAN.inviting'];
      if (port) ctx.drawImage(port, 66, MG_TOP + 20, 48, 48);
      drawTextCenter(ctx, who, 90, MG_TOP + 72, PAL20.M);
      wrapText(line, 27).forEach((l, i) => drawTextCenter(ctx, l, 90, MG_TOP + 86 + i * 9, PAL20.P));
      mgBtn(ctx, this.btnA, false);
      mgBtn(ctx, this.btnD, false);
      drawText(ctx, 'guilt:', 10, 290, PAL20.T);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i < this.state.guilt ? PAL20.M : PAL20.D;
        ctx.fillRect(48 + i * 10, 290, 7, 7);
      }
    }
  },
  result() { return { win: true, accepted: this.accepted }; },
};

/* ---- 9. DEFENESTRATION DEFENSE ---- */
MINIGAMES.DEFENESTRATION = {
  init(cfg) {
    this.launched = false;
    this.dur = 12; this.t = 0; this.done = false;
    this.events = [
      { at: 1.5, real: false }, { at: 3.6, real: false }, { at: 5.4, real: false },
      { at: 7.2 + (cfg.day % 2) * 0.8, real: true },
    ];
    this.caught = false; this.missed = false;
    this.kinuPos = { x: 78, y: 120 };
  },
  phase() {
    let cur = null;
    this.events.forEach(e => { if (this.t >= e.at && this.t < e.at + (e.real ? 0.55 : 0.4)) cur = e; });
    return cur;
  },
  update(dt, input) {
    this.t += dt;
    const cur = this.phase();
    if (cur && cur.real && !this.launched) { this.launched = true; AUDIO.sfx('S_LAUNCH'); }
    input.taps.forEach(tp => {
      if (this.done) return;
      const ddx = cur && cur.real ? (this.t - cur.at) * 60 : 0;
      const near = Math.abs(tp.x - (this.kinuPos.x + ddx + 12)) < 32 && Math.abs(tp.y - (this.kinuPos.y + 12)) < 32;
      if (!near) return;
      if (cur && cur.real) { this.caught = true; this.done = true; AUDIO.sfx('S_CAUGHT'); }
      else AUDIO.sfx('S_WRONG_TAP');
    });
    const real = this.events.find(e => e.real);
    if (this.t > real.at + 0.55 && !this.caught) { this.missed = true; this.done = true; }
    if (this.t >= this.dur) this.done = true;
  },
  draw(ctx) {
    mgFrame(ctx, 'DEFENESTRATION DEFENSE', this.t, this.dur);
    ctx.drawImage(envCard('window'), 0, 60, 180, 110);
    const cur = this.phase();
    let img = GFX.kinu.idle, dx = 0;
    if (cur && !cur.real) { img = GFX.kinu.crouch; dx = Math.sin(this.t * 40) * 1.5; }
    if (cur && cur.real) { img = GFX.kinu.launch; dx = (this.t - cur.at) * 60; }
    ctx.drawImage(img, Math.round(this.kinuPos.x + dx - 12), this.kinuPos.y, 48, 48);
    drawTextCenter(ctx, 'tap her ONLY on the real jump', 90, 288, PAL20.T);
    drawTextCenter(ctx, 'the crouch is the tell', 90, 298, PAL20.T);
  },
  result() { return { win: this.caught }; },
};

/* ---------- post-game consequence beats: two exits, different places ---------- */
const MG_AFTER = {
  CLEAN_UP(res, s) {
    if (res.wrongBin) bump('love', -1);
    if (res.win) return [];   // the stain is gone. nothing else happens. that is the reward.
    s.smell++; s.stains.push({ day: s.day });
    GFX.envCache = {};        // the apartment redraws with the stain, permanently
    const out = [N('The stain sets. It has joined the apartment now.')];
    if (s.smell === 2) {
      out.push(SAY('JULIUS', "Does it smell in here? It doesn't. Does it?", 'curious'));
      out.push({ t: 'do', fn: () => bump('love', -1) });
    }
    // she notices what he leaves. no line about it.
    if (s.smell === 2 || s.smell === 4) out.push({ t: 'do', fn: () => bump('kinu', -1) });
    out.push(KINU_GONE_CHECK());
    return out;
  },
  SORTING_HELL(res, s) {
    const out = [];
    if (res.wrong === 0) {
      s.juliusTrust = 'HIGH'; bump('love', 3);
      out.push(SAY('JULIUS', "You're getting so good at this. I'm not being sarcastic, you're actually getting good at this.", 'warm'));
    } else if (res.wrong >= 4) {
      s.juliusTrust = 'LOW'; bump('love', -3);
      out.push(N('He takes the bag out at 23:00. He comes back at midnight. He does not say where he went.'));
    } else {
      s.juliusTrust = 'MID'; bump('love', -Math.min(2, res.wrong));
      out.push(N('He re-sorts the wrong ones in front of Zheng, slowly, and then goes back to what he was doing.'));
    }
    return out;
  },
  THE_DINNER(res, s) {
    const out = [];
    out.push({ t: 'art', img: 'dinner' });
    if (res.meat === 0 && (res.adds || 0) < 4) {
      bump('love', 1); bump('sanity', -1);
      out.push(N('The food is fine. There is not very much of it.'));
      out.push(SAY('AINO', "It's lovely. It's a lovely amount.", 'warm'));
      out.push(N('Everyone has seconds of the bread. There is a lot of bread, suddenly.'));
    } else if (res.meat === 0) {
      bump('love', 3); bump('sanity', -2);   // +1 is Aino's, on top of the normal outcome
      out.push(N('The guests are delighted. Rasmus takes a photo of his plate. Of the food, this time. Julius glows.'));
      out.push(SAY('AINO', "This is so good. Is the cream oat? It's oat, isn't it. It's so good.", 'warm'));
      out.push(N('She has three helpings and asks for the recipe and means it.'));
      out.push(Z('...', 'polite'));
      out.push(N('Zheng eats three mouthfuls of something with the texture of a cushion.'));
    } else if (res.meat <= 2) {
      out.push(N('The dish is genuinely excellent and everyone says so. Then Aino stops mid-sentence. Not accusatory. Just puzzled.'));
      out.push(SAY('AINO', "Sorry, what's the stock?", 'puzzled'));
      out.push(N('Julius knows exactly what the stock is. He can taste it. He eats meat every week.'));
      out.push(N('So this is not about whether he notices. It is about whether he covers.'));
      if (s.juliusTrust === 'HIGH') {
        bump('sanity', 2);
        out.push(N("Julius answers before Zheng's mouth is open. Smooth, total, unhesitating."));
        out.push(SAY('JULIUS', "It's the artisanal oat cream? It's very rich. It's practically criminal.", 'warm'));
        out.push(SAY('AINO', 'Oh, lovely.', 'warm'));
        out.push(N('He lies smoothly to five of his own friends and never mentions it afterwards.'));
        out.push(N('That is the most loving thing anybody does in this game and it was triggered by a bin.'));
      } else {
        // MID: he covers, but there is a beat first. Aino clocks the beat, not the meat.
        bump('love', -1); bump('sanity', 1);
        out.push(N('Julius answers. But there is a beat first. Half a second.'));
        out.push(SAY('JULIUS', "It's... the oat cream? The fancy one.", 'curious'));
        out.push(SAY('AINO', 'Oh, lovely.', 'puzzled'));
        out.push(N('She does not eat any more of it. Nobody says anything about it, then or ever.'));
      }
    } else {
      bump('love', -6); bump('friends', -1); bump('sanity', 4);   // -2 is Aino's, on top
      out.push(N('Aapo spits it into a napkin.'));
      out.push(SAY('SUN', "I'm going to head off."));
      out.push(N('She heads off.'));
      out.push(N('Aino works it out somewhere around the third bite. She puts her fork down.'));
      out.push(SAY('AINO', "It's okay. Honestly. It's completely okay.", 'kind'));
      out.push(N('She says it three separate times over the next twenty minutes, to three different people, none of whom asked.'));
      out.push(N('Julius says nothing for the rest of the evening, and finishes his entire plate, because he is not offended on his own behalf. He is mortified on theirs, in his own home.'));
      out.push(SAY('MIRO', "I'm not vegetarian, I just don't buy it. Someone else bought this, so it's fine."));
      out.push(N('Nobody has ever asked him.'));
      out.push({ t: 'do', fn: () => bump('sanity', 2) });
    }
    if (s.f.rasmusKnows) {
      out.push(SAY('RASMUS', "Where's the oat cream from?"));
      out.push(N('He waits. He does not stop waiting.'));
      out.push(SAY('RASMUS', 'Ah.'));
      out.push(N('That is the entire consequence. It is worse than a consequence.'));
    }
    return out;
  },
  THE_FAN(res, s) {
    s.fanTaps = res.fanMinutes;             // €12 per 5 seconds of runtime, billed Friday
    s.fanKinu = res.kinuCalmed;
    s.fanRanDay = s.day; s.fanMain = res.mainTarget;   // feeds the 3.2 temperature model
    if (res.risk > 3) {
      bump('kinu', -1);
      bump('job', res.win ? 1 : -1);
      return [
        N('Kinu watched the fan point at everything except her. She has filed it away.'),
        KINU_GONE_CHECK(),
        ...(res.win
          ? [Z("Done. It's done. It's not good but it's done.")]
          : [N('He sends it at 02:10 with the wrong file attached. The right file is called "final_v2_ACTUAL".')]),
      ];
    }
    if (res.win) { bump('job', 1); return [Z("Done. It's done. It's not good but it's done.")]; }
    bump('job', -1);
    return [
      N('He sends it at 02:10 with the wrong file attached. The right file is called "final_v2_ACTUAL".'),
      N('On Friday, Sandal forwards the wrong file to eleven people with the word "thoughts?" and nothing else.'),
    ];
  },
  CO_OP(res, s) {
    const chunks = Math.floor(res.seconds / 5);
    bump('sanity', chunks); bump('job', -chunks);
    s.mattBond += chunks;
    if (res.win) {
      return [
        SAY('MATT', 'yeah no all good. work stuff.'),
        N('He stops asking by Friday, and that is quietly worse.'),
      ];
    }
    bump('job', -2);
    return [
      SAY('MATT', 'BRO. okay. same time tomorrow.', 'delighted'),
      N('The work bar is empty. Matt is now genuinely his friend. Both of these things are true at once.'),
    ];
  },
  SLACK_STORM(res, s) {
    s.unread += res.swiped;
    const out = [];
    if (res.sandalTapped) out.push(N('Four hundred words on ownership. The word "ownership" appears nine times. It is not defined once.'));
    if (res.win) out.push(Z("August. Right. That's the one. That's the whole thing."));
    else {
      s.f.holidayApproved = false; bump('job', -1);
      out.push(N('The request expires quietly on Friday. Nobody tells him. That is how it works, and it works very well.'));
    }
    return out;
  },
  PERFORMANCE_REVIEW(res, s) {
    s.reviewWords = res.picked;
    const out = [];
    if (res.picked.includes('no')) {
      bump('job', -2); bump('sanity', 3);
      out.push(SAY('SANDAL', '...'));
      out.push(SAY('SANDAL', 'I\'ll put "developing".'));
    }
    if (res.picked.includes('hydrated')) {
      bump('sanity', 1);
      out.push(N('Sandal writes it down. Sandal writes it down without asking.'));
    }
    if (res.picked.includes('sorry')) {
      bump('job', 1); bump('sanity', -2);
      out.push(N('It goes in the form. The form goes in the file. There is a file.'));
    }
    if (!out.length) out.push(N('The form accepts the words. The form accepts anything.'));
    return out;
  },
  DRINK_DODGE(res, s) { return []; },
  DEFENESTRATION(res, s) {
    if (res.win) return [
      { t: 'art', img: 'window_caught' },
      Z('No. No. No.', 'alarm'),
      N('Kinu, scruffed, dangling, entirely unbothered.'),
      N('She is not sorry. She has never been sorry. Sorry is not available to her.'),
    ];
    s.kinu = 0;
    return [
      SFXB('S_KINU_GONE'),
      { t: 'hold', s: 1.5 },
      SFXB('S_SEAGULL'),
      N('Three floors down, a woman in black opens her door before Kinu has finished knocking.'),
      N('Kinu has made a decision.'),
    ];
  },
};

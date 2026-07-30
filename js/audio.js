/* All sound is procedural: ZzFX-style synth for SFX and blips, a tiny WebAudio
   sequencer for the six music loops. One AudioContext, created inside the first
   tap handler (spec 7.1 — get this wrong and iPhones are silent). */

const AUDIO = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  muted: false,
  _music: null,        // { id, timer, tempo }
  _sanityLow: null,

  unlock() {
    if (this.ctx) { this.kick(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    // iOS creates the context suspended even inside a gesture. resume immediately,
    // inside the gesture, and play a silent warm-up buffer to claim the channel.
    if (this.ctx.state !== 'running') this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.8;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.master);
    const warm = this.ctx.createBuffer(1, 1, 22050);
    const src = this.ctx.createBufferSource();
    src.buffer = warm; src.connect(this.master); src.start(0);
    this.setMuted(this.muted);
  },
  kick() {
    // iOS suspends the context on app-switch, lock, or ringer events.
    // resume on any gesture, and restart the current track cleanly.
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') {
      const m = this._music;
      this.ctx.resume().then(() => {
        if (m && m.id) { this._music = null; this.music(m.id, { tempo: m.tempo }); }
      });
    }
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
    try { localStorage.setItem('zheng.muted', m ? '1' : '0'); } catch (e) {}
  },

  /* ---- ZzFX-style generator (adapted from ZzFX, MIT, Frank Force) ---- */
  _gen(volume = 1, randomness = .05, frequency = 220, attack = 0, sustain = 0, release = .1,
    shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0, pitchJump = 0, pitchJumpTime = 0,
    repeatTime = 0, noise = 0, modulation = 0, bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0) {
    const PI2 = Math.PI * 2, SR = 44100, sign = v => v > 0 ? 1 : -1;
    frequency *= (1 + randomness * 2 * Math.random() - randomness) * PI2 / SR;
    let startSlide = slide *= 500 * PI2 / SR / SR, startFrequency = frequency;
    deltaSlide *= 500 * PI2 / SR / SR / SR; modulation *= PI2 / SR;
    pitchJump *= PI2 / SR; pitchJumpTime *= SR; repeatTime = repeatTime * SR | 0;
    attack = attack * SR | 0; decay = decay * SR | 0; sustain = sustain * SR | 0;
    release = release * SR | 0; delay = delay * SR | 0;
    const length = attack + decay + sustain + release + delay | 0;
    const b = new Float32Array(length);
    let t = 0, tm = 0, j = 1, r = 0, c = 0, s = 0, f;
    for (let i = 0; i < length; b[i++] = s) {
      if (!(++c % ((bitCrush * 100 | 0) || 1))) {
        s = shape ? shape > 1 ? shape > 2 ? shape > 3 ? Math.sin((t % PI2) ** 3)
          : Math.max(Math.min(Math.tan(t), 1), -1)
          : 1 - (2 * t / PI2 % 2 + 2) % 2
          : 1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2)
          : Math.sin(t);
        s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) *
          sign(s) * Math.abs(s) ** shapeCurve * volume * 0.3 *
          (i < attack ? i / attack :
            i < attack + decay ? 1 - ((i - attack) / decay) * (1 - sustainVolume) :
              i < attack + decay + sustain ? sustainVolume :
                i < length - delay ? (length - i - delay) / release * sustainVolume : 0);
        s = delay ? s / 2 + (delay > i ? 0 : (i < length - delay ? 1 : (length - i) / delay) * b[i - delay | 0] / 2) : s;
      }
      f = (frequency += slide += deltaSlide) * Math.cos(modulation * tm++);
      t += f - f * noise * (1 - (Math.sin(i) + 1) * 1e9 % 2);
      if (j && ++j > pitchJumpTime) { frequency += pitchJump; startFrequency += pitchJump; j = 0; }
      if (repeatTime && !(++r % repeatTime)) { frequency = startFrequency; slide = startSlide; j = j || 1; }
    }
    return b;
  },
  _play(samples, when, dest) {
    if (!this.ctx || !samples.length) return;
    const buf = this.ctx.createBuffer(1, samples.length, 44100);
    buf.getChannelData(0).set(samples);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(dest || this.sfxGain);
    src.start(when || 0);
    return src;
  },
  sfx(id, opts) {
    if (!this.ctx || this.muted) return;
    const p = SFX[id];
    if (!p) return;
    const arr = p.slice();
    if (opts && opts.pitch) arr[2] = (arr[2] || 220) * opts.pitch;
    this._play(this._gen(...arr));
  },
  blip(who) {
    if (!this.ctx || this.muted) return;
    const b = BLIPS[who];
    if (!b) return;
    const arr = b.slice();
    arr[2] *= 1 + (Math.random() * 0.04 - 0.02);
    this._play(this._gen(...arr));
  },
  duck(amount, ms) {
    if (!this.musicGain) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.linearRampToValueAtTime(amount, t + (ms || 80) / 1000);
  },

  /* ---- music sequencer ---- */
  music(id, opts) {
    opts = opts || {};
    if (this._music && this._music.id === id) { this._music.tempo = opts.tempo || 1; return; }
    this.stopMusic();
    if (!id || !MUSIC[id] || !this.ctx) { this._music = id ? { id, tempo: opts.tempo || 1, fake: true } : null; return; }
    const m = { id, tempo: opts.tempo || 1, nodes: [], timer: null };
    this._music = m;
    const loop = () => {
      if (this._music !== m || !this.ctx) return;
      const tr = MUSIC[id];
      const spb = 60 / (tr.bpm * m.tempo);          // seconds per step
      const t0 = this.ctx.currentTime + 0.05;
      let loopLen = 0;
      tr.voices.forEach(v => {
        let t = 0;
        v.notes.forEach(n => {
          const [midi, beats] = n;
          if (midi != null) this._note(v, midi, t0 + t * spb, beats * spb * (v.stac || 0.85));
          t += beats;
        });
        loopLen = Math.max(loopLen, t);
      });
      m.timer = setTimeout(loop, loopLen * spb * 1000 - 30);
    };
    loop();
  },
  _note(v, midi, when, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(this.musicGain);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(v.vol || 0.16, when + 0.008);
    g.gain.setValueAtTime(v.vol || 0.16, when + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, when + dur);
    if (v.wave === 'noise') {
      const len = Math.max(1, (dur * 44100) | 0);
      const buf = ctx.createBuffer(1, len, 44100);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(g); src.start(when); src.stop(when + dur);
    } else {
      const o = ctx.createOscillator();
      o.type = v.wave || 'square';
      o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      if (v.detune) o.detune.value = v.detune;
      o.connect(g);
      o.start(when); o.stop(when + dur + 0.02);
    }
  },
  stopMusic() {
    if (this._music && this._music.timer) clearTimeout(this._music.timer);
    this._music = null;
  },
  setTempo(t) { if (this._music) this._music.tempo = t; },

  sanityLow(on) {
    if (!this.ctx) return;
    if (on && !this._sanityLow) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = 7040;
      g.gain.value = 0;
      o.connect(g); g.connect(this.master);
      o.start();
      g.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 6);
      this._sanityLow = { o, g };
    }
    // spec: it never fades out. no else branch on purpose.
  },
};

/* ---- SFX table (zzfx parameter arrays) ---- */
const SFX = {
  S_VOMIT:        [1.4, .1, 90, .02, .15, .3, 3, .6, -8, 0, 0, 0, .09, .8, 0, 0, .05, .7, .05],
  S_VOMIT_WARN:   [.8, .1, 70, .01, .08, .12, 3, .8, -4, 0, 0, 0, .06, .7],
  S_MEOW_A:       [.9, .1, 500, .02, .12, .2, 0, 1.6, 8, -6, 0, 0, 0, 0, 8],
  S_MEOW_B:       [.9, .1, 440, .02, .1, .24, 0, 1.8, 12, -9, 0, 0, 0, 0, 6],
  S_MEOW_C:       [.8, .1, 560, .02, .08, .18, 0, 1.5, -6, 8, 0, 0, 0, 0, 10],
  S_PURR:         [.5, 0, 45, .05, .6, .3, 2, .5, 0, 0, 0, 0, .04, .3, 4],
  S_LAUNCH:       [.9, .05, 300, .01, .1, .18, 0, 1, 22, 4, 0, 0, 0, .1],
  S_CAUGHT:       [.9, .1, 150, .01, .06, .15, 3, .8, -4, 0, 0, 0, 0, .5],
  S_KINU_GONE:    [.8, .05, 300, .01, .12, .5, 0, 1, 18, 2],
  S_SEAGULL:      [.5, .1, 900, .02, .08, .2, 0, 1.6, 6, -12, 0, 0, 0, 0, 14],
  S_WINDOW_OPEN:  [.8, .05, 200, .03, .12, .3, 3, .6, 6, 0, 0, 0, 0, .9],
  S_WINDOW_SHUT:  [.9, .05, 150, .01, .08, .22, 3, .7, -6, 0, 0, 0, 0, .8],
  S_HEAT_TICK:    [.4, .05, 800, .01, .02, .05, 0, 1, 14],
  S_FAN:          [.5, .2, 250, .01, .03, .08, 3, .5, 0, 0, 0, 0, 0, .9],
  S_METER_TICK:   [.4, .02, 1100, .001, .02, .03, 1, 1],
  S_SANDAL_STING: [.9, 0, 130.8, .01, .22, .18, 2, 1, 0, 0, -30, .24, 0, 0, 0, 0, 0, .8, .05],
  S_SLACK_PING:   [.7, .01, 987, .01, .07, .12, 0, 1, 0, 0, 493, .05],
  S_SWIPE_AWAY:   [.5, .1, 400, .005, .02, .06, 3, .4, 20, 0, 0, 0, 0, .6],
  S_WRONG_TAP:    [.7, 0, 110, .01, .08, .1, 2, 1.5],
  S_TITLE_STAMP:  [.7, .05, 250, .001, .02, .05, 2, 2, 0, 0, 0, 0, 0, .4],
  S_COIN:         [.8, .02, 523, .01, .05, .12, 0, 1, 0, 0, 262, .05],
  S_COIN_BIG:     [1, .02, 523, .01, .3, .5, 0, 1, 0, 0, 130.8, .07, .07],
  S_MONEY_LOSS:   [.8, .02, 440, .01, .08, .2, 0, 1, -6, 0, -220, .08],
  S_BILL_STAMP:   [1.2, .02, 80, .005, .08, .25, 2, 2.5, 0, 0, 0, 0, 0, .3, 0, 0, .04],
  S_PRICE_UP:     [.35, .01, 660, .01, .04, .1, 0, 1, 0, 0, -110, .06],
  S_BOOK_FLIGHT:  [1, .02, 523, .02, .5, .6, 0, 1, 0, 0, 174, .09, .1, 0, 0, 0, .08],
  S_BIN_RIGHT:    [.8, .02, 700, .002, .03, .07, 2, 1.4, 0, 0, 350, .03],
  S_BIN_WRONG:    [.6, .01, 350, .02, .09, .14, 1, 1, 0, 0, -70, .1],
  S_JULIUS_APPEAR:[.4, .05, 300, .05, .1, .3, 3, .3, 0, 0, 0, 0, 0, .95],
  S_TEMU_BUY:     [.7, .02, 880, .005, .04, .1, 0, 1, 0, 0, 440, .05, 0, 0, 0, 0, .12],
  S_PACKAGE:      [.8, .05, 587, .01, .12, .2, 0, 1, 0, 0, 147, .08],
  S_FISH_KLAXON:  [1.3, .01, 200, .01, .2, .12, 2, 1.8, 0, 0, 0, 0, .16, 0, 3],
  S_SIZZLE:       [.5, .2, 500, .02, .3, .3, 3, .4, 0, 0, 0, 0, 0, .95],
  S_JAR_OPEN:     [.7, .1, 150, .005, .04, .3, 3, .8, 8, 0, 0, 0, 0, .85],
  S_CLINK:        [.7, .05, 1400, .002, .04, .1, 0, 1.6, 0, 0, 700, .03],
  S_MSG_FLOOD:    [.5, .05, 700, .005, .02, .05, 1, 1, 0, 0, 100, .02, .03],
  S_DOORBELL:     [.8, .01, 659, .01, .25, .3, 0, 1, 0, 0, -165, .12],
  S_SANITY_CRACK: [.8, .02, 900, .002, .05, .18, 0, 2, -12, -4],
  S_SANITY_UP:    [.7, .02, 523, .02, .1, .25, 0, 1, 0, 0, 131, .09],
  S_PIP_LOSS:     [.6, .02, 300, .005, .04, .1, 1, 1, -8],
  S_CHOICE_HOVER: [.35, .01, 600, .002, .01, .04, 1, 1],
  S_CHOICE_CONFIRM:[.7, .01, 440, .005, .04, .08, 1, 1, 0, 0, 220, .04],
  S_DAY_CARD:     [.8, .01, 220, .02, .3, .5, 2, .6, 0, 0, 0, 0, 0, 0, .6],
  S_FLAG_REVEAL:  [.8, .01, 392, .01, .1, .2, 0, 1, 0, 0, 196, .06],
  S_ENDING_UNLOCK:[.9, .01, 784, .01, .12, .3, 0, 1, 0, 0, 196, .06],
  S_SEND:         [.7, .02, 500, .01, .06, .15, 0, 1, 10],
  S_CAMERA:       [.6, .02, 1200, .001, .02, .05, 2, 2, 0, 0, 0, 0, .015],
  S_BREEZE:       [.35, .1, 300, .5, 2, 3, 3, .2, 0, 0, 0, 0, 0, .98],
  S_FLUORESCENT:  [.4, .01, 2100, .002, .02, .04, 1, 1],
};

/* ---- per-character text blips (spec 7.4) ---- */
const BLIPS = {
  ZHENG:   [.4, 0, 207, .002, .03, .03, 1, 1],           // square, mid, 15 cents flat: tired
  JULIUS:  [.35, 0, 330, .004, .04, .05, 0, 1],           // soft sine, rises handled in engine
  JULIUS_UP:[.35, 0, 415, .004, .04, .05, 0, 1],
  SANDAL:  [.4, 0, 130, .002, .025, .02, 2, 1.4],         // low nasal saw, cuts off early
  SUSAN:   [.35, 0, 520, .002, .02, .03, 1, 1],           // fast high triangle
  JOY:     [.35, 0, 490, .002, .02, .03, 1, 1],           // one semitone off, 12ms late (engine delays)
  ANNA:    [.32, 0, 230, .005, .045, .06, 0, 1],       // low, level, unhurried
  MATT:    [.4, 0, 350, .002, .025, .03, 1, 1],        // bouncy triangle, up for it
  VET:     [.35, 0, 290, .003, .03, .04, 0, 1],
  GUEST:   [.3, 0, 260, .004, .035, .05, 0, 1],
  MIRO:    [.3, 0, 240, .004, .035, .05, 0, 1],
  SUN:     [.3, 0, 280, .004, .035, .05, 0, 1],
  AAPO:    [.3, 0, 250, .004, .035, .05, 0, 1],
  RASMUS:  [.3, 0, 270, .004, .035, .05, 0, 1],
};

/* ---- the six loops (spec 7.2), composed as step patterns ---- */
const MUSIC = {
  // hopeful; pseudo-Central-Asian mode (raised 4th, flat 2nd on C: C Db E F# G A)
  M_TITLE: { bpm: 300, voices: [
    { wave: 'triangle', vol: .14, notes: [[36,2],[43,2],[36,2],[43,2],[41,2],[43,2],[36,2],[43,2],[36,2],[43,2],[36,2],[43,2],[41,2],[43,2],[44,2],[43,2]] },
    { wave: 'square', vol: .09, notes: [[60,2],[61,1],[64,1],[66,2],[67,2],[69,2],[67,2],[66,1],[64,1],[61,2],[60,4],[null,2],[67,2],[66,2],[64,2],[66,1],[64,1],[61,2],[60,4],[null,2]] },
  ]},
  // sluggish, thick, two voices beating against each other; tempo follows temperature
  M_HOME_HOT: { bpm: 170, voices: [
    { wave: 'square', vol: .07, notes: [[48,3],[48,1],[51,2],[50,2],[48,3],[48,1],[46,2],[48,2]] },
    { wave: 'square', vol: .06, detune: 14, notes: [[48,3],[48,1],[51,2],[50,2],[48,3],[48,1],[46,2],[48,2]] },
    { wave: 'triangle', vol: .12, notes: [[36,4],[null,4],[34,4],[null,4]] },
  ]},
  // corporate hold-music, loops far too often on purpose; noise tick = the fluorescent light
  M_OFFICE: { bpm: 240, voices: [
    { wave: 'square', vol: .07, notes: [[60,1],[64,1],[67,1],[64,1],[60,1],[64,1],[67,1],[64,1],[59,1],[62,1],[67,1],[62,1],[59,1],[62,1],[67,1],[62,1]] },
    { wave: 'triangle', vol: .12, notes: [[36,4],[null,4],[31,4],[null,4]] },
    { wave: 'noise', vol: .05, notes: [[null,7],[60,1],[null,7],[60,1]], stac: .2 },
  ]},
  // soft triangle arpeggios, wholesome, faintly smug
  M_JULIUS: { bpm: 220, voices: [
    { wave: 'triangle', vol: .11, notes: [[60,1],[64,1],[67,1],[71,1],[67,1],[64,1],[60,1],[64,1],[57,1],[60,1],[64,1],[69,1],[64,1],[60,1],[57,1],[60,1]] },
    { wave: 'sine', vol: .1, notes: [[48,8],[45,8]] },
  ]},
  // magenta neon banger; tempo +6% per drink round
  M_NIGHT: { bpm: 380, voices: [
    { wave: 'square', vol: .12, notes: [[38,1],[38,1],[45,1],[38,1],[38,1],[41,1],[38,1],[43,1]] },
    { wave: 'noise', vol: .09, notes: [[null,2],[60,1],[null,1],[null,2],[60,1],[null,1]], stac: .3 },
    { wave: 'square', vol: .06, notes: [[62,1],[null,1],[62,1],[65,1],[null,1],[62,1],[null,1],[65,1]] },
  ]},
  // not music. a held low tone, a slow tick.
  M_DREAD: { bpm: 60, voices: [
    { wave: 'sine', vol: .16, notes: [[31,4]] },
    { wave: 'noise', vol: .04, notes: [[60,1],[null,1],[null,1],[null,1]], stac: .06 },
  ]},
};

/* ending stings by tone tag (spec 7.2) */
function playSting(tone) {
  if (!AUDIO.ctx || AUDIO.muted) return;
  const seq = {
    GOLD:  [[60,0],[64,.12],[66,.24],[67,.36],[72,.5],[67,.72],[72,.84]],
    GOOD:  [[60,0],[64,.15],[67,.3],[72,.5]],
    WEIRD: [[60,0],[61,.18],[66,.36],[64.5,.6],[68,.9]],
    BLEAK: [[36,0],[31,.7]],
    CALM:  null,
  }[tone];
  if (!seq) { AUDIO.sfx('S_BREEZE'); return; }
  seq.forEach(([m, t]) => {
    setTimeout(() => {
      if (!AUDIO.ctx) return;
      AUDIO._play(AUDIO._gen(.8, .01, 440 * Math.pow(2, (m - 69) / 12), .01, .18, .3, tone === 'WEIRD' ? 2 : 0, 1), 0, AUDIO.sfxGain);
    }, t * 1000);
  });
}

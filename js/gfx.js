/* Assembly layer: turns art.js generators into game-ready canvases.
   The apartment is composed live (heat, bins, stains, fan, Julius present or
   pointedly not) because v2 makes the room itself a meter. */

const GFX = { portraits: {}, sprites: {}, kinu: {}, decals: [], icons: {}, tarot: {}, envCache: {} };

function buildGfx() {
  const P2 = GFX.portraits;
  const mkP = (key, cf, ex, opt) => P2[key] = gridToCanvas(portrait(cf, ex, opt));
  Object.keys(EX).forEach(k => mkP('ZHENG.' + k, ZHENG_CF, EX[k]));
  mkP('JULIUS.warm', JULIUS_CF, { brow: 'up', eye: 'arc', mouth: 'smile' });
  mkP('JULIUS.disappointed', JULIUS_CF, { brow: 'sad', eye: 'open', mouth: 'small' });
  mkP('JULIUS.explaining', JULIUS_CF, { brow: 'up', eye: 'wide', mouth: 'talk' });
  mkP('JULIUS.hurt', JULIUS_CF, { brow: 'sad', eye: 'down', mouth: 'frown', tear: 1 });
  mkP('JULIUS.curious', JULIUS_CF, { brow: 'up', eye: 'open', mouth: 'line' });
  mkP('JULIUS.smug', JULIUS_CF, { brow: 'flat', eye: 'closed', mouth: 'smile' });
  const so = { cy: 24, rx: 15, ry: 17 };
  mkP('SANDAL.neutral', SANDAL_CF, { brow: 'flat', eye: 'open', mouth: 'flat' }, so);
  mkP('SANDAL.fake', SANDAL_CF, { brow: 'up', eye: 'open', mouth: 'grin' }, so);
  mkP('SANDAL.disappointed', SANDAL_CF, { brow: 'down', eye: 'down', mouth: 'frown' }, so);
  mkP('SUSAN.inviting', SUSAN_CF, { brow: 'up', eye: 'open', mouth: 'grin' });
  mkP('SUSAN.wounded', SUSAN_CF, { brow: 'sad', eye: 'wide', mouth: 'frown' });
  mkP('SUSAN.ordering', SUSAN_CF, { brow: 'flat', eye: 'closed', mouth: 'talk' });
  mkP('SUSAN.caring', SUSAN_CF, { brow: 'sad', eye: 'open', mouth: 'smile' });
  mkP('JOY.delighted', JOY_CF, { brow: 'up', eye: 'arc', mouth: 'grin' });
  mkP('JOY.pouring', JOY_CF, { brow: 'flat', eye: 'down', mouth: 'small' });
  mkP('JOY.emotional', JOY_CF, { brow: 'sad', eye: 'down', mouth: 'frown', tear: 1 });
  mkP('JOY.asleep', JOY_CF, { brow: 'flat', eye: 'closed', mouth: 'open' });
  mkP('AAPO.talk', { skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'bucket', hat: 'G', glasses: 0, shirt: 'T', beard: 1, beardColor: 'B' }, { brow: 'up', eye: 'open', mouth: 'talk' });
  mkP('SUN.assess', { skin: ['C', 'N', 'B'], hair: 'H', hairStyle: 'bald', glasses: 0, shirt: 'W' }, { brow: 'down', eye: 'down', mouth: 'small' });
  mkP('RASMUS.waiting', { skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'blond', glasses: 1, shirt: 'W', stripes: 1 }, { brow: 'flat', eye: 'open', mouth: 'line' });
  mkP('MIRO.aloft', { skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'long', glasses: 0, shirt: 'G' }, { brow: 'up', eye: 'arc', mouth: 'grin' });
  mkP('VET.neutral', { skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'bob', glasses: 1, shirt: 'Z' }, { brow: 'flat', eye: 'open', mouth: 'line' });
  // v2: Anna and Matt
  mkP('ANNA.neutral', ANNA_CF, { brow: 'flat', eye: 'open', mouth: 'line' });
  mkP('ANNA.reading', ANNA_CF, { brow: 'flat', eye: 'down', mouth: 'small' });
  mkP('ANNA.amused', ANNA_CF, { brow: 'up', eye: 'open', mouth: 'smile' });
  mkP('ANNA.warm', ANNA_CF, { brow: 'up', eye: 'arc', mouth: 'grin' });
  const mo = { rx: 13, ry: 14 };
  mkP('MATT.delighted', MATT_CF, { brow: 'up', eye: 'arc', mouth: 'grin' }, mo);
  mkP('MATT.focused', MATT_CF, { brow: 'down', eye: 'wide', mouth: 'line' }, mo);
  mkP('MATT.outraged', MATT_CF, { brow: 'up', eye: 'wide', mouth: 'open' }, mo);
  mkP('MATT.disappointed', MATT_CF, { brow: 'sad', eye: 'down', mouth: 'small' }, mo);
  // Aino: the only guest who is not a joke
  mkP('AINO.warm', AINO_CF, { brow: 'up', eye: 'arc', mouth: 'smile' });
  mkP('AINO.puzzled', AINO_CF, { brow: 'up', eye: 'open', mouth: 'small' });
  mkP('AINO.kind', AINO_CF, { brow: 'sad', eye: 'open', mouth: 'smile' });
  ['innocent', 'about', 'mid', 'smug', 'salmon'].forEach(k => P2['KINU.' + k] = gridToCanvas(kinuPortrait(k)));

  OUTFITS.forEach((o, i) => { const g = sprite(ZHENG_HEAD, o[1] || o); sweat(g, (o[1] || o).bare ? 2 : 1); GFX.sprites['zheng' + i] = gridToCanvas(g); });
  const annaOutfit = { map: { '1': 'K', '2': 'D', '3': 'K', '4': 'K', '5': 'K' } };
  const annaG = sprite(ANNA_HEAD, annaOutfit);
  rect(annaG, 5, 2, 2, 18, 'B'); rect(annaG, 15, 2, 2, 18, 'B');
  GFX.sprites.anna = gridToCanvas(annaG);
  const mattOutfit = { map: { '1': 'M', '2': 'D', '3': 'A', '4': 'N', '5': 'W' } };
  const mattG = sprite(MATT_HEAD, mattOutfit);
  rect(mattG, 8, 13, 8, 5, 'W');
  GFX.sprites.matt = gridToCanvas(mattG);

  Object.keys(KINU).forEach(k => GFX.kinu[k] = gridToCanvas(fromRows(KINU[k], 24, 24)));
  for (let n = 1; n <= 5; n++) GFX.decals[n] = gridToCanvas(vomit(n));

  // HUD meter icons (design UI kit, 12x12) + coin
  ['case', 'heart', 'pair', 'brain', 'cat'].forEach(k => GFX.icons[k] = gridToCanvas(meterIcon(k)));
  GFX.icons.money = GFX.icons.job = GFX.icons.case_ = GFX.icons['case'];
  GFX.icons.love = GFX.icons.heart;
  GFX.icons.friends = GFX.icons.pair;
  GFX.icons.sane = GFX.icons.brain;
  GFX.icons.kinu = GFX.icons.cat;
  const coin = G(12, 12);
  ell(coin, 6, 6, 5, 5, 'K'); ell(coin, 6, 6, 4, 4, 'A'); rect(coin, 5, 3, 2, 6, 'C');
  GFX.icons.money = gridToCanvas(coin);
  GFX.icons.lockedCell = gridToCanvas(galleryCell(false));
  GFX.icons.muteOn = gridToCanvas(mute(true));
  GFX.icons.muteOff = gridToCanvas(mute(false));

  ['tower', 'cups', 'hierophant', 'pentacles', 'devil', 'wheel', 'fool', 'back',
   'moon', 'star', 'hermit', 'lovers', 'swords', 'temperance', 'sun', 'hanged', 'death',
   'magician', 'priestess', 'empress', 'justice', 'strength', 'chariot', 'world', 'ace'].forEach(k => GFX.tarot[k] = gridToCanvas(tarot(k)));
}

/* ---------- environment cards ---------- */
/* apartment composes live from state; other cards are static and cached */
function envCard(name) {
  if (name === 'apartment_hot' || name === 'apartment_cool') {
    const hot = name === 'apartment_hot';
    const s = typeof S !== 'undefined' ? S : { day: 1, stains: [], love: 5, fanAim: null };
    const bins = s.day >= 3;
    const stains = Math.min(6, (s.stains || []).length);
    // 3.9 #2: at love 1 he is physically absent while still technically in the relationship. that gap is the point.
    const jul = s.love >= 2 && !(s.f && s.f.juliusGone);
    const fan = s.fanMain ? ({ zheng: 'left', laptop: 'right', kinu: 'window' })[s.fanMain] : null;
    const key = 'apt.' + [hot, bins, stains, jul, fan].join('.');
    if (!GFX.envCache[key]) {
      let g = apartment(hot);
      if (bins) g = withOv(g, ovBins());
      if (stains) {
        const ov = ovStains();     // draw only the earned stains: mask the rest
        const spots = [[34, 92, 3], [96, 98, 4], [140, 90, 2], [40, 60, 2], [128, 88, 3], [70, 104, 5]];
        const keep = G(180, 110);
        spots.slice(0, stains).forEach(([x, y, r]) => { for (let dy = -r - 2; dy <= r + 2; dy++) for (let dx = -r - 4; dx <= r + 4; dx++) { const i = (y + dy) * 180 + (x + dx); if (i >= 0 && i < ov.d.length && ov.d[i] !== '.') keep.d[i] = ov.d[i]; } });
        g = withOv(g, keep);
      }
      g = withOv(g, ovJulius(jul));
      if (fan) g = withOv(g, ovFan(fan));
      GFX.envCache[key] = gridToCanvas(g);
    }
    return GFX.envCache[key];
  }
  if (name === 'tab') {   // the browser tab shows the live price. cached per day.
    const price = typeof S !== 'undefined' ? (920 + 38 * (Math.min(7, S.day) - 1)) : 920;
    const key = 'tab.' + price;
    if (!GFX.envCache[key]) GFX.envCache[key] = gridToCanvas(browserTab(String(price)));
    return GFX.envCache[key];
  }
  if (GFX.envCache[name]) return GFX.envCache[name];
  let g = null;
  switch (name) {
    case 'window': g = windowCard(true); break;
    case 'window_cool': g = windowCard(false); break;
    case 'office': g = office(); break;
    case 'kitchen': g = kitchen(); break;
    case 'bar': g = bar(); break;
    case 'anna': g = annaFlat(); break;
    case 'vet': g = vet(); break;
    case 'booking_on': g = booking(true); break;
    case 'booking_off': g = booking(false); break;
    case 'uzbek': g = uzbek('a'); break;
    case 'uzbek_solo': g = uzbek('c'); break;
    case 'uzbek_empty': g = uzbek('b'); break;
    case 'registan': g = registan(); break;
    case 'gate': g = airport(); break;
    // the v3 design update delivered every cutaway
    case 'laptop': g = standupLaptop(false); break;
    case 'laptop_puke': g = standupLaptop(true); break;
    case 'calendar': g = calendar(); break;
    case 'stairwell': g = stairwell(); break;
    case 'boots': g = boots(false); break;
    case 'boots_ruined': g = boots(true); break;
    case 'window_caught': { g = windowCard(false, true); fgScruffed(g, 92, 26); break; }
    case 'phone': g = phoneCase('tape'); break;
    case 'listings': g = toriListings(); break;
    case 'dark': g = bathroom(); break;
    case 'ceiling': g = ceiling(true); break;
    case 'plane': g = planeDescent(); break;
    case 'dinner': g = dinnerTable(); break;
    case 'guesthouse': g = guesthouseNight(); break;
    case 'taxi': {
      g = G(180, 110);
      rect(g, 0, 0, 180, 64, 'A'); rect(g, 0, 0, 180, 14, 'C');
      ell(g, 148, 22, 11, 11, 'C');
      for (let i = 0; i < 5; i++) { const x = 8 + i * 36; rect(g, x, 26, 26, 38, 'Z'); rect(g, x + 4, 32, 6, 6, 'C'); rect(g, x + 14, 32, 6, 6, 'C'); rect(g, x + 4, 44, 6, 6, 'C'); }
      rect(g, 0, 64, 180, 46, 'B'); rect(g, 0, 64, 180, 3, 'K');
      for (let x2 = 8; x2 < 180; x2 += 24) rect(g, x2, 86, 12, 2, 'C');
      rect(g, 40, 66, 100, 26, 'K'); rect(g, 42, 68, 96, 22, 'W');
      rect(g, 56, 70, 66, 10, 'K'); rect(g, 58, 72, 28, 7, 'Z'); rect(g, 90, 72, 28, 7, 'Z');
      rect(g, 42, 82, 96, 3, 'N');   // the cracked dashboard, in spirit
      ell(g, 60, 94, 8, 8, 'K'); ell(g, 60, 94, 4, 4, 'S');
      ell(g, 120, 94, 8, 8, 'K'); ell(g, 120, 94, 4, 4, 'S');
      break;
    }
  }
  if (!g) {   // missing-card fallback: full font, so it at least names itself
    const c = document.createElement('canvas'); c.width = 180; c.height = 110;
    const x = c.getContext('2d');
    x.fillStyle = PAL20.Z; x.fillRect(0, 0, 180, 110);
    drawTextCenter(x, name.toUpperCase(), 90, 52, PAL20.W);
    GFX.envCache[name] = c;
    return c;
  }
  GFX.envCache[name] = gridToCanvas(g);
  return GFX.envCache[name];
}

/* ---------- ending illustrations, spec 3.6: nine bases, stated foregrounds ----------
   Reuse is expected and correct. Stop guessing. */
const fgLying = (g, x, y, shirt) => { rect(g, x, y, 30, 10, shirt); rect(g, x, y, 30, 2, 'K'); ell(g, x + 34, y + 4, 6, 6, 'K'); ell(g, x + 34, y + 4, 5, 5, 'C'); };
const fgPhone = (g, x, y, up, screen) => { rect(g, x, y, 8, 12, 'K'); if (up) { rect(g, x + 1, y + 1, 6, 10, screen || 'P'); } };
const ENDING_ART = {
  '11111': () => { const g = uzbek('a'); fgConfetti(g, 50); return g; },
  '11110': () => { const g = uzbek('a'); rect(g, 100, 70, 5, 10, 'Z'); rect(g, 101, 68, 3, 3, 'S'); return g; },   // the minibar bottle
  '11101': () => { const g = uzbek(); fgPhone(g, 104, 72, true, 'Z'); return g; },
  '11100': () => { const g = uzbek(); rect(g, 136, 66, 6, 20, 'R'); rect(g, 138, 70, 6, 16, 'A'); return g; },     // the scarf
  '11011': () => { const g = uzbek(); rect(g, 148, 60, 5, 26, 'M'); rect(g, 149, 61, 3, 24, 'A'); return g; },     // the rolled carpet
  '11010': () => guesthouseNight(),
  '11001': () => { const g = uzbek(); rect(g, 106, 60, 2, 22, 'S'); rect(g, 102, 82, 10, 2, 'S'); fgPhone(g, 103, 52, true, 'W'); return g; },  // the tripod
  '11000': () => uzbek('b'),
  '10111': () => { const g = uzbek(); fgPhone(g, 104, 74, false); return g; },
  '10110': () => { const g = uzbek(); catProfile(g, 156, 40, 'O', 'L'); return g; },
  '10101': () => { const g = uzbek(); fgPhone(g, 104, 72, true, 'W'); rect(g, 105, 74, 5, 1, 'S'); rect(g, 105, 77, 4, 1, 'S'); return g; },
  '10100': () => { const g = uzbek(); rect(g, 96, 88, 20, 12, 'K'); rect(g, 97, 89, 18, 10, 'B'); rect(g, 100, 92, 4, 4, 'O'); return g; },     // the carrier
  '10011': () => { const g = airport(); rect(g, 96, 74, 10, 6, 'W'); rect(g, 97, 75, 8, 2, 'A'); return g; },      // the boarding pass
  '10010': () => { const g = airport(); clear(g, 86, 70, 7, 9); rect(g, 88, 70, 5, 9, 'Z'); return g; },           // the reusable cup, untouched
  '10001': () => { const g = airport(); clear(g, 120, 46, 18, 34); rect(g, 118, 62, 24, 16, 'S'); rect(g, 140, 66, 12, 14, 'B'); rect(g, 142, 62, 8, 4, 'B'); return g; },  // one man, one bag
  '10000': () => { const g = uzbek('c'); return g; },
  '01111': () => booking(false),
  '01110': () => shiftBand(booking(false), 60, 70, 1),
  '01101': () => { const g = apartment(false); const cat = catSide(0, 'sit'); for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const ch = cat.d[y * 24 + x]; if (ch !== '.') px(g, 28 + x, 38 + y, ch); } return g; },
  '01100': () => { const g = apartment(true); rect(g, 150, 4, 26, 12, 'K'); text(g, 153, 7, '0400', 'R'); return g; },
  '01011': () => { const g = apartment(true); rect(g, 24, 56, 16, 10, 'W'); rect(g, 26, 58, 12, 1, 'S'); rect(g, 26, 61, 10, 1, 'S'); rect(g, 26, 64, 8, 1, 'R'); return g; },  // the invoice
  '01010': () => { const g = apartment(true); rect(g, 30, 50, 22, 16, 'A'); rect(g, 30, 48, 10, 3, 'A'); rect(g, 33, 54, 16, 1, 'K'); rect(g, 33, 58, 16, 1, 'K'); return g; }, // the folder
  '01001': () => { const g = office(); rect(g, 8, 44, 40, 30, 'K'); rect(g, 8, 52, 36, 4, 'A'); rect(g, 10, 56, 2, 8, 'A'); return g; },
  '01000': () => office(),
  '00111': () => { const g = withOv(apartment(false), ovJulius(true)); fgLoaf(g, 108, 66); return g; },
  '00110': () => { const g = withOv(apartment(true), ovJulius(true)); rect(g, 130, 84, 14, 18, 'K'); rect(g, 131, 85, 12, 16, 'V'); rect(g, 150, 92, 8, 10, 'W'); rect(g, 160, 94, 8, 8, 'W'); return g; },
  '00101': () => { const g = apartment(false); fgLying(g, 60, 92, 'W'); fgLoaf(g, 66, 80); return g; },
  '00100': () => { const g = apartment(true); fgLying(g, 30, 94, 'T'); fgLoaf(g, 120, 94); return g; },
  '00011': () => { const g = apartment(false); rect(g, 40, 82, 70, 22, 'K'); rect(g, 42, 84, 66, 18, 'S'); rect(g, 42, 84, 66, 6, 'T'); ell(g, 100, 88, 5, 4, 'C'); return g; },  // the grey duvet
  '00010': () => { const g = annaFlat(); [20, 48, 76, 140].forEach((x, i) => fgPerson(g, x, 60, ['G', 'W', 'T', 'M'][i], ['B', 'H', 'Y', 'B'][i])); rect(g, 110, 84, 8, 10, 'K'); rect(g, 111, 85, 6, 8, 'V'); return g; },
  '00001': () => { const g = apartment(true); rect(g, 60, 76, 26, 26, 'K'); rect(g, 62, 78, 22, 22, 'B'); fgPerson(g, 64, 62, 'W', 'H'); return g; },  // the good chair
  '00000': () => { const g = windowCard(false); clear(g, 96, 56, 36, 24); rect(g, 96, 56, 36, 24, 'S'); rect(g, 2, 80, 176, 12, 'K'); rect(g, 4, 81, 172, 8, 'P'); rect(g, 4, 81, 172, 2, 'W'); rect(g, 150, 2, 26, 12, 'K'); text(g, 153, 5, '21C', 'Z'); return g; },
};
const endingArtCache = {};
function endingCard(key) {
  // the booking-screen endings interpolate the live shortfall; don't cache those
  if (key === '01111' || key === '01110') {
    const sf = (typeof SAVE !== 'undefined' && SAVE.shortfalls && SAVE.shortfalls[key] != null)
      ? SAVE.shortfalls[key]
      : (typeof shortfall === 'function' ? shortfall() : 0);
    const ck = key + '.' + sf;
    if (endingArtCache[ck]) return endingArtCache[ck];
    let g = booking(false);
    clear(g, 10, 64, 160, 28);
    num7(g, 10, 64, 16, 26, String(sf), 'R', 3, 6);
    text(g, 120, 74, 'SHORT', 'T');
    if (key === '01110') g = shiftBand(g, 64, 90, 1);   // the digits drift
    endingArtCache[ck] = gridToCanvas(g);
    return endingArtCache[ck];
  }
  if (endingArtCache[key]) return endingArtCache[key];
  const fn = ENDING_ART[key];
  let c;
  if (fn) c = gridToCanvas(fn());
  else { c = document.createElement('canvas'); c.width = 180; c.height = 110; c.getContext('2d').fillStyle = '#2f7d80'; }
  endingArtCache[key] = c;
  return c;
}

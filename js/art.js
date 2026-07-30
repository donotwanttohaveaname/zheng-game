/* ZHENG v3 — complete procedural art library.
   Ported verbatim from the Claude Design project "Zheng Character & World Sheets"
   (v3 update, 2026-07-30): all cutaway cards, idle animation helpers, Aino.
   21 colours. Everything the game draws comes from here; gfx.js assembles. */


const PAL = [
  ['K','INK','#1a1420'],['D','DEEP','#2f2440'],['S','SLATE','#4a4a63'],['T','STEEL','#6e7a94'],
  ['P','PALE','#b8c4d4'],['W','WHITE','#f4f0e6'],['R','HOT_RED','#c9313c'],['E','EMBER','#e0632f'],
  ['A','AMBER','#f2a33c'],['C','CREAM','#f7d9a0'],['N','TAN','#d19a63'],['B','BROWN','#8a5a3a'],
  ['O','CAT_ORANGE','#c9743c'],['L','CAT_LIGHT','#e6a86e'],['Y','BLOND','#e8cd7a'],['H','HAIR_BLACK','#241c2e'],
  ['G','LEAF','#4e9a5a'],['Z','TEAL','#2f7d80'],['V','BILE','#9db83e'],['M','MAGENTA','#b8478c'],
  ['X','MATT_BLUE','#2a5f9e']
];
const HEX = {}; PAL.forEach(p => HEX[p[0]] = p[2]);

/* ---------- raster helpers ---------- */
const G = (w, h) => ({ w, h, d: new Array(w * h).fill('.') });
const px = (g, x, y, c) => { if (c && c !== '.' && x >= 0 && y >= 0 && x < g.w && y < g.h) g.d[(y | 0) * g.w + (x | 0)] = c; };
const rect = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c); };
const ell = (g, cx, cy, rx, ry, c) => {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
    if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.02) px(g, cx + x, cy + y, c);
};
const clear = (g, x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < g.w && yy < g.h) g.d[yy * g.w + xx] = '.'; } };
const ellC = (g, cx, cy, rx, ry, c, maxY) => {
  for (let y = -ry; y <= ry; y++) { if (cy + y > maxY) break; for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.02) px(g, cx + x, cy + y, c); }
};
const stamp = (g, x, y, rows, map) => rows.forEach((r, j) => {
  for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch !== '.') px(g, x + i, y + j, map && map[ch] ? map[ch] : ch); }
});
const fromRows = (rows, w, h, map) => {
  const g = G(w, h);
  rows.forEach((r, j) => { const s = (r + '..........................').slice(0, w); stamp(g, 0, j, [s], map); });
  return g;
};
const toRaw = g => { const out = []; for (let y = 0; y < g.h; y++) out.push(g.d.slice(y * g.w, y * g.w + g.w).join('')); return out.join('\n'); };
const toURL = g => {
  const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
  const x = c.getContext('2d');
  for (let y = 0; y < g.h; y++) for (let i = 0; i < g.w; i++) {
    const ch = g.d[y * g.w + i];
    if (ch !== '.') { x.fillStyle = HEX[ch] || '#ff00ff'; x.fillRect(i, y, 1, 1); }
  }
  return c.toDataURL();
};

/* ---------- 24x32 body chassis ---------- */
const BODY = [
  '......K1111111111K......','.....K111111111111K.....','.....K111111111111K.....',
  '.....K111111111111K.....','.....K111111111111K.....','....KNN1111111111NNK....',
  '....KNN1111111111NNK....','.....K122222222221K.....','......K3333333333K......',
  '......K3333333333K......','......K3333333333K......','......K3333333333K......',
  '......K3333KK3333K......','.......4444..4444.......','.......4444..4444.......',
  '.......4444..4444.......','.......4444..4444.......','.......5555..5555.......',
  '......KKKKK..KKKKK......'
];
const ZHENG_HEAD = [
  '........HH..............','........HHHHHHHH........','.......HHHHHHHHHH.......',
  '.......HHHHHHHHHH.......','.......HCCCCCCCCH.......','.......HKKKKKKKKH.......',
  '.......HKWKKKKWKH.......','.......HCCCCCCCCH.......','.......HCCCNNCCCH.......',
  '.......HCCCBBCCCH.......','........NCCCCCCN........','.........NCCCCN.........',
  '..........NCCN..........'
];

function sprite(head, outfit) {
  const g = G(24, 32);
  head.forEach((r, j) => stamp(g, 0, j, [r]));
  BODY.forEach((r, j) => stamp(g, 0, 13 + j, [r], outfit.map));
  if (outfit.bare) { for (let i = 0; i < g.w; i++) { if (g.d[31 * 24 + i] === 'K') g.d[31 * 24 + i] = 'N'; } }
  if (outfit.lanyard) { for (let y = 13; y <= 18; y++) { px(g, 9 + (y - 13 > 2 ? 1 : 0), y, outfit.lanyard); px(g, 14 - (y - 13 > 2 ? 1 : 0), y, outfit.lanyard); } rect(g, 10, 19, 4, 3, 'W'); rect(g, 11, 20, 2, 1, 'S'); }
  if (outfit.untuck) { rect(g, 15, 20, 3, 2, outfit.map['1']); px(g, 17, 22, outfit.map['1']); px(g, 16, 22, outfit.map['1']); }
  if (outfit.damp) { rect(g, 10, 13, 4, 1, 'T'); px(g, 9, 14, 'T'); px(g, 14, 14, 'T'); rect(g, 11, 17, 2, 2, 'T'); }
  if (outfit.lapel) { for (let y = 14; y <= 19; y++) { px(g, 10 - (y - 14 > 3 ? 1 : 0), y, 'K'); px(g, 13 + (y - 14 > 3 ? 1 : 0), y, 'K'); } rect(g, 11, 14, 2, 2, 'W'); }
  return g;
}
function sweat(g, n) { const spots = [[8, 4], [15, 4], [10, 4], [13, 4]]; for (let i = 0; i < n && i < 4; i++) { px(g, spots[i][0], spots[i][1], 'W'); px(g, spots[i][0], spots[i][1] + 3, 'P'); } }

const OUTFITS = [
  ['Mon · WFH shirt + boxers', { map: { '1': 'W', '2': 'P', '3': 'P', '4': 'C', '5': 'C' }, bare: 1 }],
  ['Tue/Thu · office + lanyard', { map: { '1': 'P', '2': 'T', '3': 'S', '4': 'S', '5': 'S' }, lanyard: 'M', untuck: 1 }],
  ['Wed/Fri · damp t-shirt', { map: { '1': 'W', '2': 'T', '3': 'S', '4': 'C', '5': 'C' }, bare: 1, damp: 1 }],
  ['Sat · the good jacket', { map: { '1': 'D', '2': 'K', '3': 'K', '4': 'K', '5': 'S' }, lapel: 1 }],
  ['Sun · barefoot, phone', { map: { '1': 'T', '2': 'S', '3': 'S', '4': 'C', '5': 'C' }, bare: 1 }]
];

/* ---------- 48x48 portrait engine ---------- */
function head(g, cf, ex, cx, cy, rx, ry, noShoulder) {
  const sk = cf.skin, hr = cf.hair;
  rect(g, cx - 4, cy + ry - 3, 8, 8, sk[1]);
  px(g, cx - 5, cy + ry - 1, 'K'); px(g, cx + 4, cy + ry - 1, 'K');
  const sy = cy + ry + 4;
  if (!noShoulder) { rect(g, cx - rx - 5, sy, (rx + 5) * 2, 48 - sy, cf.shirt); rect(g, cx - rx - 5, sy, (rx + 5) * 2, 1, 'K'); }
  ell(g, cx, cy, rx + 1, ry + 1, 'K');
  ell(g, cx, cy, rx, ry, sk[1]);
  ell(g, cx - 1, cy - 1, rx - 1, ry - 1, sk[0]);
  rect(g, cx - rx - 1, cy + 1, 2, 4, sk[1]); rect(g, cx + rx, cy + 1, 2, 4, sk[1]);

  const eyeY = cy + Math.round(ry * 0.16), eDX = Math.round(rx * 0.46);
  const browY = eyeY - Math.round(ry * 0.26), mY = cy + Math.round(ry * 0.62);
  const hairB = browY - 2;
  if (cf.hairStyle !== 'bald') {
    ellC(g, cx, cy - Math.round(ry * 0.22), rx + 1, ry, hr, hairB);
    ellC(g, cx, cy, rx, ry, hr, hairB);
    rect(g, cx - rx - 1, cy - ry + 5, 2, Math.round(ry * 0.7), hr);
    rect(g, cx + rx, cy - ry + 5, 2, Math.round(ry * 0.7), hr);
  }
  if (cf.hairStyle === 'cowlick') { rect(g, cx - rx + 1, cy - ry - 4, 3, 5, hr); px(g, cx - rx + 4, cy - ry - 3, hr); }
  if (cf.hairStyle === 'comb') { rect(g, cx - rx, cy - ry + 1, rx * 2, 3, hr); rect(g, cx - 6, cy - ry + 4, 12, 2, cf.skin[1]); }
  if (cf.hairStyle === 'pony') { rect(g, cx + rx + 1, cy - 6, 4, 12, hr); rect(g, cx + rx + 3, cy - 1, 3, 9, hr); rect(g, cx - rx - 1, cy - ry, rx * 2 + 2, 4, hr); }
  if (cf.hairStyle === 'bob') { rect(g, cx - rx - 2, cy - 4, 3, ry + 5, hr); rect(g, cx + rx, cy - 4, 3, ry + 5, hr); rect(g, cx - rx, cy - ry + 1, rx * 2, Math.round(ry * 0.55), hr); }
  if (cf.hairStyle === 'long') { rect(g, cx - rx - 2, cy - 6, 3, ry + 8, hr); rect(g, cx + rx, cy - 6, 3, ry + 8, hr); rect(g, cx + rx + 1, cy + ry, 3, 6, hr); }
  if (cf.hairStyle === 'bucket') { rect(g, cx - rx - 4, cy - ry + 3, (rx + 4) * 2, 3, cf.hat || 'G'); rect(g, cx - rx, cy - ry - 3, rx * 2, 6, cf.hat || 'G'); }

  if (cf.hairMix) { for (let y = cy - ry - 6; y < cy + ry + 6; y++) for (let x = cx - rx - 4; x < cx + rx + 5; x++) if (x >= 0 && y >= 0 && x < g.w && y < g.h && g.d[y * g.w + x] === hr && (x + y) % 3 === 0) px(g, x, y, cf.hairMix); }
  if (cf.hoops) { ell(g, cx - rx - 3, cy + 3, 3, 3, 'A'); ell(g, cx - rx - 3, cy + 3, 1, 1, '.'); ell(g, cx + rx + 3, cy + 3, 3, 3, 'A'); ell(g, cx + rx + 3, cy + 3, 1, 1, '.'); }
  const e = ex.eye, glint = ex.glint !== false;

  if (cf.glasses) {
    const lw = Math.max(6, Math.round(rx * 0.62)), lh = Math.max(5, Math.round(ry * 0.42));
    const lx = cx - eDX - Math.round(lw / 2), rx2 = cx + eDX - Math.round(lw / 2), ly = eyeY - Math.round(lh / 2);
    rect(g, lx, ly, lw, lh, 'K'); rect(g, lx + 1, ly + 1, lw - 2, lh - 2, cf.skin[0]);
    rect(g, rx2, ly, lw, lh, 'K'); rect(g, rx2 + 1, ly + 1, lw - 2, lh - 2, cf.skin[0]);
    rect(g, lx + lw, eyeY, rx2 - lx - lw, 1, 'K');
    rect(g, lx - 3, eyeY - 1, 3, 1, 'K'); rect(g, rx2 + lw, eyeY - 1, 3, 1, 'K');
    if (glint) { px(g, lx + 1, ly + 1, 'W'); px(g, lx + 2, ly + 1, 'W'); px(g, rx2 + 1, ly + 1, 'W'); }
  }
  [cx - eDX, cx + eDX].forEach((ecx, side) => {
    if (e === 'closed') { rect(g, ecx - 2, eyeY, 5, 1, 'K'); px(g, ecx - 3, eyeY - 1, 'K'); px(g, ecx + 3, eyeY - 1, 'K'); return; }
    if (e === 'arc') { rect(g, ecx - 2, eyeY + 1, 5, 1, 'K'); px(g, ecx - 3, eyeY, 'K'); px(g, ecx + 3, eyeY, 'K'); return; }
    if (e === 'wide') { rect(g, ecx - 2, eyeY - 2, 5, 5, 'W'); rect(g, ecx - 1, eyeY - 1, 2, 2, 'K'); return; }
    if (e === 'dead') { rect(g, ecx - 2, eyeY - 1, 5, 3, 'W'); rect(g, ecx - 1, eyeY, 2, 1, 'S'); return; }
    if (e === 'down') { rect(g, ecx - 2, eyeY, 5, 2, 'W'); rect(g, ecx - 1, eyeY + 1, 2, 1, 'K'); return; }
    rect(g, ecx - 2, eyeY - 1, 5, 3, 'W'); rect(g, ecx - 1 + (ex.look ? 2 : 0), eyeY, 2, 2, 'K');
    if (glint && !cf.glasses) px(g, ecx + 1, eyeY - 1, 'W');
  });
  const b = ex.brow;
  [-1, 1].forEach(s => {
    const bx = cx + s * eDX;
    if (b === 'up') { rect(g, bx - 3, browY - 1, 6, 1, 'K'); px(g, bx + s * 3, browY - 2, 'K'); }
    else if (b === 'down') { rect(g, bx - 3, browY, 6, 1, 'K'); px(g, bx - s * 3, browY - 1, 'K'); }
    else if (b === 'sad') { rect(g, bx - 3, browY, 6, 1, 'K'); px(g, bx + s * 3, browY - 1, 'K'); }
    else rect(g, bx - 3, browY, 6, 1, 'K');
  });
  const m = ex.mouth;
  if (cf.beard) { ell(g, cx, mY + 6, 10, 7, cf.beardColor || 'B'); rect(g, cx - 4, mY - 1, 9, 2, cf.beardColor || 'B'); }
  const MC = cf.mouth || 'B';
  if (m === 'line') rect(g, cx - 3, mY, 6, 1, MC);
  if (m === 'flat') rect(g, cx - 4, mY, 8, 1, MC);
  if (m === 'small') { rect(g, cx - 2, mY, 4, 1, MC); px(g, cx - 3, mY - 1, MC); px(g, cx + 2, mY - 1, MC); }
  if (m === 'smile') { rect(g, cx - 3, mY + 1, 7, 1, MC); px(g, cx - 4, mY, MC); px(g, cx + 4, mY, MC); }
  if (m === 'grin') { rect(g, cx - 4, mY, 9, 2, 'K'); rect(g, cx - 3, mY, 7, 1, 'W'); px(g, cx - 5, mY - 1, MC); px(g, cx + 5, mY - 1, MC); }
  if (m === 'frown') { rect(g, cx - 3, mY, 7, 1, MC); px(g, cx - 4, mY + 1, MC); px(g, cx + 4, mY + 1, MC); }
  if (m === 'open') { rect(g, cx - 2, mY - 1, 5, 4, 'K'); rect(g, cx - 1, mY, 3, 2, MC); }
  if (m === 'talk') { rect(g, cx - 3, mY - 1, 6, 3, 'K'); rect(g, cx - 2, mY, 4, 1, 'W'); }
  if (cf.stubble) { for (let i = -6; i <= 6; i += 2) { px(g, cx + i, mY + 4, sk[2]); px(g, cx + i + 1, mY + 5, sk[2]); } }
  if (cf.sunburn) { rect(g, cx - 3, mY - 5, 7, 1, 'E'); }
  if (cf.necklace) { rect(g, cx - 3, cy + ry + 4, 7, 1, 'A'); px(g, cx, cy + ry + 5, 'A'); }
  if (cf.stripes) { for (let y = cy + ry + 5; y < 48; y += 3) rect(g, cx - rx - 5, y, (rx + 5) * 2, 1, 'P'); }
  if (ex.sweat) { const pts = [[cx - rx + 1, browY + 1], [cx + rx - 1, browY], [cx - rx + 1, browY + 5], [cx + rx - 1, browY + 4]]; for (let i = 0; i < ex.sweat && i < 4; i++) { px(g, pts[i][0], pts[i][1], 'W'); px(g, pts[i][0], pts[i][1] + 1, 'P'); } }
  if (ex.tear) { px(g, cx - eDX - 1, eyeY + 3, 'P'); px(g, cx - eDX - 1, eyeY + 4, 'P'); px(g, cx + eDX + 1, eyeY + 3, 'P'); }
  return g;
}
function portrait(cf, ex, opt) {
  const g = G(48, 48); const o = opt || {};
  head(g, cf, ex, o.cx || 24, o.cy || 22, o.rx || 12, o.ry || 14);
  return g;
}

const EX = {
  neutral: { brow: 'flat', eye: 'open', mouth: 'line' },
  tired: { brow: 'sad', eye: 'down', mouth: 'small', sweat: 2 },
  polite: { brow: 'sad', eye: 'down', mouth: 'smile', sweat: 1 },
  alarm: { brow: 'up', eye: 'wide', mouth: 'open', glint: false, sweat: 3 },
  joy: { brow: 'up', eye: 'closed', mouth: 'small' },
  defeated: { brow: 'down', eye: 'down', mouth: 'flat', sweat: 4 },
  dead: { brow: 'flat', eye: 'dead', mouth: 'flat', glint: false },
  happy: { brow: 'up', eye: 'arc', mouth: 'grin' }
};
const ZHENG_CF = { skin: ['C', 'N', 'B'], hair: 'H', hairStyle: 'cowlick', glasses: 1, shirt: 'W' };
const JULIUS_CF = { skin: ['C', 'N', 'B'], hair: 'Y', hairStyle: 'blond', glasses: 1, shirt: 'W', stubble: 1, sunburn: 1 };
const SANDAL_CF = { skin: ['P', 'T', 'S'], hair: 'S', hairStyle: 'comb', glasses: 0, shirt: 'P', mouth: 'S' };
const SUSAN_CF = { skin: ['C', 'N', 'B'], hair: 'H', hairStyle: 'pony', glasses: 0, shirt: 'M', hoops: 1 };
const JOY_CF = { skin: ['C', 'N', 'B'], hair: 'H', hairStyle: 'bob', glasses: 0, shirt: 'A', necklace: 1 };

/* ---------- Kinu ---------- */
const KINU = {
  idle: ['...KK..........KK.......','...KOK........KOK.......','...KOOK......KOOK.......','...KOLOK....KOLOK.......',
    '...KOLOOKKKKOOLOK.......','...KOOOOOOOOOOOOK.......','...KOAAOOOOOOAAOK.......','...KOAKOOLLOOKAOK.......',
    '...KOOOOLLLLOOOOK.......','....KOOOLNNLOOOK........','....KOOOOLLOOOOK........','.....KOOOOOOOOK.........',
    '.....KOOOOOOOOK.........','....KOOOOOOOOOOK........','....KOLLLLLLLLOK........','....KOLLLLLLLLOK........',
    '....KOLLLLLLLLOK........','....KOOLLLLLLOOK........','....KOOOOOOOOOOK...KK...','....KOOOOOOOOOOK..KOOK..',
    '....KOKKOOOOKKOK..KOOK..','....KOOKKOOKKOOK...KOK..','....KKKKKKKKKKKK...KK...','........................'],
  loaf: ['...KK..........KK.......','...KOK........KOK.......','...KOOK......KOOK.......','...KOLOK....KOLOK.......',
    '...KOLOOKKKKOOLOK.......','...KOOOOOOOOOOOOK.......','...KOAAOOOOOOAAOK.......','...KOAKOOLLOOKAOK.......',
    '...KOOOOLLLLOOOOK.......','....KOOOLNNLOOOK........','....KOOOOLLOOOOK........','...KOOOOOOOOOOOOK.......',
    '..KOOOOOOOOOOOOOOK......','.KOOOOOOOOOOOOOOOOK.....','KOOOOOOOOOOOOOOOOOOK....','KOLLLLLLLLLLLLLLLLOK....',
    'KOLLLLLLLLLLLLLLLLOK....','KOOOOOOOOOOOOOOOOOOK....','KKOOOOOOOOOOOOOOOOKK....','.KKKKKKKKKKKKKKKKKK.....',
    '........................','........................','........................','........................'],
  crouch: ['..KK..........KK........','..KOK........KOK........','..KOOK......KOOK........','..KOLOK....KOLOK........',
    '..KOLOOKKKKOOLOK........','..KOOOOOOOOOOOOK........','..KOAKOOOOOOKAOK........','..KOOOOOLLOOOOOK........',
    '...KOOOLNNLOOOK.........','...KOOOOLLOOOOK.........','..KOOOOOOOOOOOOKK.......','..KOOOOOOOOOOOOOOKK.....',
    '..KOOOOOOOOOOOOOOOOK....','..KOLLLLLLLLLLLLLLOK....','..KOOOOOOOOOOOOOOOOK..K.','..KOOOOOOOOOOOOOOOOK.KOK',
    '..KOKKOOOOOOOOKKOOOK.KOK','..KKKKKKKKKKKKKKKOOK.KOK','.................KOOKKOK','.................KOOOOOK',
    '..................KKKKK.','........................','........................','........................'],
  launch: ['..KK....................','..KOK...................','..KOOK..................','..KOLOK.................',
    '..KOLOOKK...............','..KOOOOOOKKKKKKKK.......','..KOAKOOOOOOOOOOKK......','..KOOOOLLOOOOOOOOOKK....',
    '...KOOLNNLOOOOOOOOOOK...','...KOOOLLOOOOOOOOOOOK.KK','...KOOOOOOOOOOOOOOOOK.KO','...KOLLLLLLLLLLLLLLOKKO.',
    '..KOOOOOOOOOOOOOOOOOKO..','.KOOKKKKKKKKKKKKKOOOK...','KOOK.............KOOK...','KOK...............KOOK..',
    'KK.................KOK..','....................KK..','........................','........................',
    '........................','........................','........................','........................'],
  caught: ['.......NNNNNN...........','.......NKKKKN...........','..KK...NNNNNN...KK......','..KOK...........KOK.....',
    '..KOOK.........KOOK.....','..KOLOKKKKKKKKKOLOK.....','..KOOOOOOOOOOOOOOOK.....','..KOAKOOOOOOOOOKAOK.....',
    '...KOOOOLLLLLLOOOK......','...KOOOLNNLOOOOOK.......','....KOOOLLOOOOOK........','.....KOOOOOOOOK.........',
    '.....KOLLLLLLOK.........','.....KOLLLLLLOK.........','.....KOLLLLLLOK.........','.....KOOOOOOOOK.........',
    '.....KOOKOOKOOK.........','.....KOK.KK.KOK.........','.....KK......KK.........','.......KK...............',
    '......KOOK..............','.......KOK..............','.......KK...............','........................'],
  smug: ['...KK..........KK.......','...KOK........KOK.......','...KOOK......KOOK.......','...KOLOK....KOLOK.......',
    '...KOLOOKKKKOOLOK.......','...KOOOOOOOOOOOOK.......','...KOKKOOOOOOKKOK.......','...KOOOOOOLLOOOOK.......',
    '...KOOOOLLLLOOOOK.......','....KOOOLNNLOOOK........','....KOOOOKKOOOOK........','.....KOOOOOOOOK.........',
    '.....KOOOOOOOOK.........','....KOOOOOOOOOOK........','....KOLLLLLLLLOK........','....KOLLLLLLLLOK........',
    '....KOLLLLLLLLOK........','....KOOLLLLLLOOK........','....KOOOOOOOOOOKKKKKKKK.','....KOOOOOOOOOOOOOOOOOOK',
    '....KOKKOOOOKKOK........','....KKKKKKKKKKKK........','PPPPPPPPPPPPPPPPPPPPPPPP','KKKKKKKKKKKKKKKKKKKKKKKK']
};
function kinuPortrait(kind) {
  const g = G(48, 48);
  rect(g, 9, 3, 8, 16, 'K'); rect(g, 10, 5, 6, 14, 'O'); rect(g, 11, 8, 4, 11, 'L');
  rect(g, 31, 3, 8, 16, 'K'); rect(g, 32, 5, 6, 14, 'O'); rect(g, 33, 8, 4, 11, 'L');
  ell(g, 24, 26, 16, 15, 'K'); ell(g, 24, 26, 15, 14, 'O'); ell(g, 24, 30, 11, 9, 'L');
  const eyeY = 24;
  if (kind === 'mid') { ell(g, 16, eyeY, 4, 3, 'K'); ell(g, 32, eyeY, 4, 3, 'K'); rect(g, 20, 34, 9, 8, 'K'); rect(g, 21, 35, 7, 7, 'V'); rect(g, 23, 41, 3, 6, 'V'); px(g, 25, 44, 'R'); }
  else if (kind === 'smug') { rect(g, 12, eyeY, 8, 1, 'K'); px(g, 12, eyeY - 1, 'K'); px(g, 19, eyeY - 1, 'K'); rect(g, 28, eyeY, 8, 1, 'K'); px(g, 28, eyeY - 1, 'K'); px(g, 35, eyeY - 1, 'K'); rect(g, 20, 33, 8, 1, 'K'); px(g, 19, 32, 'K'); px(g, 28, 32, 'K'); }
  else if (kind === 'about') { ell(g, 16, eyeY, 5, 4, 'A'); rect(g, 15, eyeY - 4, 3, 9, 'K'); ell(g, 32, eyeY, 5, 4, 'A'); rect(g, 31, eyeY - 4, 3, 9, 'K'); rect(g, 22, 33, 4, 1, 'K'); }
  else if (kind === 'salmon') {
    ell(g, 16, eyeY, 5, 4, 'A'); rect(g, 14, eyeY - 1, 2, 3, 'K'); ell(g, 32, eyeY, 5, 4, 'A'); rect(g, 32, eyeY - 1, 2, 3, 'K');
    rect(g, 14, 40, 20, 3, 'W'); rect(g, 17, 38, 14, 2, 'E'); rect(g, 19, 37, 9, 1, 'C'); rect(g, 20, 33, 8, 2, 'R');
  } else { ell(g, 16, eyeY, 5, 4, 'A'); ell(g, 16, eyeY, 1, 3, 'K'); ell(g, 32, eyeY, 5, 4, 'A'); ell(g, 32, eyeY, 1, 3, 'K'); rect(g, 22, 33, 4, 1, 'K'); px(g, 21, 32, 'K'); px(g, 26, 32, 'K'); }
  rect(g, 21, 28, 6, 3, 'N'); rect(g, 22, 29, 4, 1, 'B');
  for (let i = 0; i < 3; i++) { rect(g, 0 + i, 28 + i * 3, 8, 1, 'W'); rect(g, 40 - i, 28 + i * 3, 8, 1, 'W'); }
  return g;
}
function vomit(n) {
  const g = G(16, 16);
  const rx = 1 + n, ry = 1 + Math.round(n * 0.6);
  ell(g, 8, 9, rx, ry, 'V');
  for (let x = 8 - rx; x <= 8 + rx; x++) if (g.d[9 * 16 + x] === 'V' || g.d[(9 + ry) * 16 + x] === 'V') px(g, x, 9 + ry, 'K');
  px(g, 8 + Math.min(1, n - 1), 8, 'R');
  if (n > 2) { px(g, 8 - rx - 1, 10, 'V'); px(g, 8 + rx + 1, 8, 'V'); }
  if (n > 3) { rect(g, 2, 5, 2, 1, 'V'); px(g, 3, 6, 'K'); rect(g, 13, 12, 2, 1, 'V'); px(g, 13, 13, 'K'); }
  return g;
}

/* ---------- 16x16 props ---------- */
const P16 = {
  phone: ['................','....KKKKKKKK....','....KWWWWWWK....','....KWWWWWWK....','....KWWWWWWK....','....KWWWWWWK....',
    '....KWWWWWWK....','....KWWWWWWK....','....KWWWWWWK....','....KWWWWWWK....','....KWWWWWWK....','....KWWWWWWK....',
    '....KWWWWWWK....','....KKKKKKKK....','................','................'],
  tote: ['................','.....K....K.....','....K.K..K.K....','....K.K..K.K....','...KKKKKKKKKK...','...KGGGGGGGGK...',
    '...KGGWWWWGGK...','...KGGWWWWGGK...','...KGGGGGGGGK...','...KGGGGGGGGK...','...KGGGGGGGGK...','...KKKKKKKKKK...',
    '................','................','................','................'],
  crock: ['................','....KKKKKKKK....','....KBBBBBBK....','...KKKKKKKKKK...','...KBBBBBBBBK...','...KBBBBBBBBK...',
    '...KBWWWWWWBK...','...KBWWWWWWBK...','...KBWWWWWWBK...','...KBBBBBBBBK...','...KBBBBBBBBK...','....KKKKKKKK....',
    '................','................','................','................'],
  bin: ['................','...KKKKKKKKKK...','...K11111111K...','...KKKKKKKKKK...','....K111111K....','....K1WWWW1K....',
    '....K1WWWW1K....','....K111111K....','....K111111K....','....K111111K....','....K111111K....','....K111111K....',
    '....KKKKKKKK....','................','................','................'],
  shampoo: ['................','................','....KKKKKKKK....','...KCCCCCCCCK...','...KCWWWWWWCK...','...KCWCCCCWCK...',
    '...KCWCCCCWCK...','...KCWWWWWWCK...','...KCCCCCCCCK...','....KKKKKKKK....','................','................',
    '................','................','................','................'],
  tp: ['................','.....KKKKKK.....','....KSSSSSSK....','...KSSSSSSSSK...','...KSPPPPPPSK...','...KSPKKKKPSK...',
    '...KSPKKKKPSK...','...KSPPPPPPSK...','...KSSSSSSSSK...','...KSSSSSSSSK...','....KSSSSSSK....','.....KKKKKK.....',
    '................','................','................','................'],
  jar: ['................','.....KKKKKK.....','.....KBBBBK.....','....KKKKKKKK....','....KWVVVVWK....','....KWVVVVWK....',
    '....KWVVVVWK....','....KWVVVVWK....','....KWVVVVWK....','....KWVVVVWK....','....KWVVVVWK....','.....KKKKKK.....',
    '................','................','................','................'],
  spoon: ['................','......KKK.......','.....KBBBK......','.....KBBBK......','.....KBBBK......','......KBK.......',
    '......KBK.......','......KBK.......','......KBK.......','......KBK.......','......KBK.......','......KBK.......',
    '......KBK.......','.......K........','................','................'],
  shot: ['................','................','....KKKKKKKK....','....KWWWWWWK....','....KWAAAAWK....','....KWAAAAWK....',
    '.....KWAAWK.....','.....KWAAWK.....','.....KWWWWK.....','......KKKK......','................','................',
    '................','................','................','................'],
  bill: ['................','................','..KKKKKKKKKKKK..','..KSSSSSSSSSSK..','..KSWWWWWWWWSK..','..KSWKKKKKKWSK..',
    '..KSWKKKKKKWSK..','..KSWWWWWWWWSK..','..KSSSSSSSSSSK..','..KKKKKKKKKKKK..','................','................',
    '................','................','................','................'],
  taxi: ['................','................','......KKKK......','.....KAAAAK.....','..KKKKAAAAKKKK..','..KAAAPPPPAAAK..',
    '..KAAAPPPPAAAK..','..KAAAAAAAAAAK..','..KKKKKKKKKKKK..','...KKK....KKK...','..KSSSK..KSSSK..','..KSKSK..KSKSK..',
    '...KKK....KKK...','................','................','................']
};
function phoneVariant(kind) {
  const g = fromRows(P16.phone, 16, 16);
  if (kind === 'tape') { rect(g, 3, 5, 10, 2, 'P'); rect(g, 3, 10, 10, 2, 'P'); rect(g, 5, 7, 4, 1, 'Z'); }
  if (kind === 'temu') { rect(g, 3, 5, 10, 2, 'P'); rect(g, 3, 10, 10, 2, 'P'); rect(g, 5, 3, 6, 8, 'A'); px(g, 5, 3, 'K'); px(g, 10, 3, 'K'); rect(g, 6, 6, 1, 1, 'K'); rect(g, 9, 6, 1, 1, 'K'); rect(g, 7, 8, 2, 1, 'M'); }
  if (kind === 'crack') { rect(g, 3, 5, 10, 2, 'P'); rect(g, 3, 10, 10, 2, 'P'); for (let i = 0; i < 8; i++) px(g, 5 + (i % 3), 3 + i, 'K'); px(g, 8, 6, 'K'); px(g, 9, 9, 'K'); px(g, 6, 11, 'K'); }
  return g;
}

/* ---------- text + numerals ---------- */
const F35 = {
  '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '###', '..#', '###'], '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'], '7': ['###', '..#', '..#', '..#', '..#'], '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'], 'A': ['###', '#.#', '###', '#.#', '#.#'], 'C': ['###', '#..', '#..', '#..', '###'],
  'E': ['###', '#..', '###', '#..', '###'], 'H': ['#.#', '#.#', '###', '#.#', '#.#'], 'J': ['..#', '..#', '..#', '#.#', '###'],
  'M': ['#.#', '###', '###', '#.#', '#.#'], 'O': ['###', '#.#', '#.#', '#.#', '###'], 'P': ['###', '#.#', '###', '#..', '#..'],
  'S': ['###', '#..', '###', '..#', '###'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'], 'U': ['#.#', '#.#', '#.#', '#.#', '###'],
  ' ': ['...', '...', '...', '...', '...']
};
function text(g, x, y, s, c) {
  let cx = x;
  for (const ch of String(s).toUpperCase()) { const gl = F35[ch]; if (gl) gl.forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === '#') px(g, cx + i, y + j, c); }); cx += 4; }
}
const SEG = [[1, 1, 1, 0, 1, 1, 1], [0, 0, 1, 0, 0, 1, 0], [1, 0, 1, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1, 0], [1, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 1], [1, 0, 1, 0, 0, 1, 0], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1]];
function seg7(g, x, y, w, h, d, c, t) {
  t = t || 3; const s = SEG[d], hh = (h >> 1);
  if (s[0]) rect(g, x + t, y, w - 2 * t, t, c);
  if (s[1]) rect(g, x, y + t, t, hh - t, c);
  if (s[2]) rect(g, x + w - t, y + t, t, hh - t, c);
  if (s[3]) rect(g, x + t, y + hh - (t >> 1), w - 2 * t, t, c);
  if (s[4]) rect(g, x, y + hh + (t >> 1), t, hh - t, c);
  if (s[5]) rect(g, x + w - t, y + hh + (t >> 1), t, hh - t, c);
  if (s[6]) rect(g, x + t, y + h - t, w - 2 * t, t, c);
}
function num7(g, x, y, w, h, str, c, t, gap) {
  gap = gap == null ? 4 : gap; let cx = x;
  for (const ch of String(str)) { if (ch >= '0' && ch <= '9') { seg7(g, cx, y, w, h, +ch, c, t); cx += w + gap; } else { rect(g, cx + 1, y + h - 3, 2, 2, c); cx += 6; } }
}
const rnd = s => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
function shimmer(g, x, y, w, h, c, n, seed) { for (let i = 0; i < n; i++) px(g, x + Math.floor(rnd(seed + i) * w), y + Math.floor(rnd(seed + i + 99) * h), c); }

/* ---------- environments ---------- */
const MOOD = h => h
  ? { wall: 'B', hi: 'E', lo: 'K', floor: 'B', fl: 'K', glow: 'A', sky: 'A', acc: 'R' }
  : { wall: 'T', hi: 'P', lo: 'S', floor: 'S', fl: 'D', glow: 'P', sky: 'P', acc: 'Z' };

function catProfile(g, x, y, body, light) {
  rect(g, x + 3, y, 2, 5, 'K'); rect(g, x + 4, y + 1, 2, 4, body);
  rect(g, x + 8, y, 2, 5, 'K'); rect(g, x + 8, y + 1, 2, 4, body);
  rect(g, x + 2, y + 4, 9, 7, 'K'); rect(g, x + 3, y + 5, 8, 6, body);
  rect(g, x + 2, y + 7, 2, 2, 'A'); px(g, x + 3, y + 8, 'K');
  rect(g, x + 4, y + 10, 10, 10, 'K'); rect(g, x + 5, y + 11, 9, 9, body);
  rect(g, x + 5, y + 15, 7, 5, light);
  rect(g, x + 13, y + 12, 6, 2, 'K'); rect(g, x + 17, y + 6, 2, 8, 'K'); rect(g, x + 17, y + 6, 2, 7, body);
  rect(g, x + 4, y + 19, 10, 2, 'K');
}

function apartment(hot) {
  const g = G(180, 110), m = MOOD(hot);
  rect(g, 0, 0, 180, 80, m.wall); rect(g, 0, 0, 180, 5, m.lo);
  for (let x = 6; x < 180; x += 14) rect(g, x, 5, 1, 75, m.lo);
  rect(g, 0, 80, 180, 30, m.floor); rect(g, 0, 79, 180, 1, 'K');
  for (let y = 84; y < 110; y += 5) rect(g, 0, y, 180, 1, m.fl);
  rect(g, 100, 8, 62, 54, 'K'); rect(g, 103, 11, 56, 48, m.sky);
  rect(g, 103, 38, 56, 21, hot ? 'E' : 'Z');
  for (let i = 0; i < 5; i++) rect(g, 108 + i * 11, 42, 5, 6, hot ? 'A' : 'S');
  rect(g, 129, 11, 3, 48, 'K'); rect(g, 103, 33, 56, 3, 'K');
  if (hot) { rect(g, 100, 8, 62, 54, 'K'); rect(g, 103, 11, 56, 48, 'A'); rect(g, 103, 38, 56, 21, 'E'); for (let i = 0; i < 5; i++) rect(g, 108 + i * 11, 42, 5, 6, 'A'); rect(g, 129, 11, 3, 48, 'K'); rect(g, 103, 33, 56, 3, 'K'); rect(g, 104, 12, 54, 4, 'W'); }
  else { rect(g, 96, 10, 10, 50, 'W'); rect(g, 88, 14, 9, 26, 'W'); rect(g, 88, 14, 9, 2, 'P'); }
  for (let i = 0; i < 22; i++) rect(g, 104 - i * 2, 80 + i, 54 + i * 4, 1, m.glow);
  rect(g, 106, 64, 50, 13, 'K'); for (let i = 0; i < 9; i++) rect(g, 108 + i * 5, 65, 3, 11, hot ? 'E' : 'P');
  rect(g, 10, 62, 60, 4, 'K'); rect(g, 11, 63, 58, 2, m.hi);
  rect(g, 13, 66, 3, 14, 'K'); rect(g, 64, 66, 3, 14, 'K');
  rect(g, 26, 46, 30, 17, 'K'); rect(g, 28, 48, 26, 13, hot ? 'A' : 'P');
  rect(g, 24, 61, 34, 3, 'S'); rect(g, 24, 61, 34, 1, 'P');
  rect(g, 76, 68, 12, 12, 'B'); rect(g, 76, 68, 12, 2, 'K');
  rect(g, 81, 58, 2, 10, 'G'); rect(g, 78, 60, 3, 2, 'G'); rect(g, 83, 63, 4, 2, 'B'); px(g, 88, 66, 'B');
  rect(g, 16, 84, 148, 24, 'K'); rect(g, 18, 86, 144, 20, hot ? 'B' : 'S');
  rect(g, 18, 86, 144, 5, hot ? 'E' : 'T'); rect(g, 60, 86, 3, 20, 'K'); rect(g, 118, 86, 3, 20, 'K');
  if (hot) {
    shimmer(g, 26, 36, 30, 10, 'A', 14, 3); shimmer(g, 106, 54, 50, 10, 'E', 12, 8);
    rect(g, 150, 4, 26, 12, 'K'); text(g, 153, 7, '34C', 'R');
  } else {
    rect(g, 150, 4, 26, 12, 'K'); text(g, 153, 7, '22C', 'P');
  }
  return g;
}
function ovFan(dir) {
  const g = G(180, 110);
  const x = 84, y = 56;
  rect(g, x + 6, y + 16, 4, 26, 'K'); rect(g, x + 7, y + 17, 2, 25, 'S');
  rect(g, x, y + 42, 16, 4, 'K'); rect(g, x + 1, y + 43, 14, 2, 'S');
  const off = dir === 'left' ? -6 : dir === 'right' ? 6 : 0;
  const ty = dir === 'window' ? y - 4 : y;
  ell(g, x + 8 + off, ty + 8, 9, 9, 'K'); ell(g, x + 8 + off, ty + 8, 7, 7, 'P');
  ell(g, x + 8 + off, ty + 8, 3, 3, 'S');
  for (let i = -6; i <= 6; i += 3) rect(g, x + 8 + off + i, ty + 2, 1, 13, 'S');
  return g;
}
function ovBins() {
  const g = G(180, 110);
  ['G', 'Z', 'A', 'P', 'S', 'B', 'M', 'T'].forEach((c, i) => {
    const x = 6 + i * 13, y = 58;
    rect(g, x, y, 11, 22, 'K'); rect(g, x + 1, y + 1, 9, 20, c);
    rect(g, x - 1, y - 2, 13, 3, 'K'); rect(g, x, y - 1, 11, 1, c);
    if (i < 7) { rect(g, x + 2, y + 6, 7, 4, 'W'); rect(g, x + 3, y + 7, 5, 1, 'K'); rect(g, x + 3, y + 9, 4, 1, 'K'); }
    else { rect(g, x + 2, y + 6, 7, 4, 'W'); for (let k = 0; k < 6; k++) px(g, x + 3 + (k % 5), y + 7 + (k % 3), 'S'); }
  });
  return g;
}
function ovStains() {
  const g = G(180, 110);
  [[34, 92, 3], [96, 98, 4], [140, 90, 2], [40, 60, 2], [128, 88, 3], [70, 104, 5]].forEach(([x, y, r], i) => {
    ell(g, x, y, r + 2, r, 'V'); rect(g, x - r - 1, y + r, (r + 1) * 2, 1, 'K'); px(g, x + 1, y - 1, 'R');
  });
  return g;
}
function ovJulius(present) {
  const g = G(180, 110);
  if (!present) { rect(g, 62, 88, 56, 14, 'D'); return g; }
  rect(g, 74, 62, 24, 26, 'W'); rect(g, 74, 62, 24, 2, 'K');
  ell(g, 86, 56, 9, 10, 'K'); ell(g, 86, 56, 8, 9, 'C'); ellC(g, 86, 55, 8, 9, 'Y', 52);
  rect(g, 81, 57, 4, 3, 'K'); rect(g, 88, 57, 4, 3, 'K'); rect(g, 85, 58, 3, 1, 'K');
  rect(g, 70, 88, 34, 16, 'W'); rect(g, 66, 100, 12, 6, 'P');
  rect(g, 98, 74, 10, 12, 'K'); rect(g, 99, 75, 8, 10, 'V'); rect(g, 99, 73, 8, 2, 'B');
  return g;
}
function windowCard(hot) {
  const g = G(180, 110), m = MOOD(hot);
  rect(g, 0, 0, 180, 110, m.wall);
  for (let x = 4; x < 180; x += 16) rect(g, x, 0, 1, 110, m.lo);
  rect(g, 0, 92, 180, 18, m.lo); rect(g, 0, 91, 180, 1, 'K');

  rect(g, 6, 2, 168, 90, 'K');
  rect(g, 12, 8, 156, 74, hot ? 'A' : 'P');
  rect(g, 12, 8, 156, 10, hot ? 'C' : 'W');
  rect(g, 12, 26, 156, 8, hot ? 'A' : 'Z');

  rect(g, 12, 44, 156, 38, hot ? 'B' : 'S');
  rect(g, 12, 42, 156, 3, 'K');
  for (let i = 0; i < 8; i++) {
    const x = 16 + i * 19;
    rect(g, x, 38, 15, 5, hot ? 'B' : 'S');
    rect(g, x, 50, 11, 9, 'K'); rect(g, x + 1, 51, 9, 7, (i === 2 || i === 6) ? 'A' : (hot ? 'E' : 'D'));
    rect(g, x, 66, 11, 9, 'K'); rect(g, x + 1, 67, 9, 7, (i === 4) ? 'A' : (hot ? 'E' : 'D'));
  }
  rect(g, 34, 28, 8, 15, 'K'); rect(g, 35, 29, 6, 13, hot ? 'B' : 'S'); rect(g, 33, 26, 10, 3, 'K');
  rect(g, 128, 30, 1, 13, 'K'); rect(g, 124, 32, 9, 1, 'K'); rect(g, 126, 36, 5, 1, 'K');

  rect(g, 86, 8, 6, 74, 'K'); rect(g, 87, 8, 2, 74, m.hi);
  if (hot) {
    rect(g, 12, 36, 156, 5, 'K'); rect(g, 13, 37, 154, 3, 'E');
    for (let y = 12; y < 34; y += 5) rect(g, 16 + (y % 10), y, 60, 1, 'W');
    for (let y = 46; y < 78; y += 6) rect(g, 96 + (y % 8), y, 50, 1, 'W');
    rect(g, 96, 62, 8, 7, 'K'); rect(g, 97, 63, 6, 5, 'L'); px(g, 98, 64, 'N'); px(g, 101, 64, 'N');
  } else {
    rect(g, 12, 22, 156, 5, 'K'); rect(g, 13, 23, 154, 3, 'P');
    rect(g, 12, 76, 156, 3, 'D');
    for (let y = 8; y < 82; y++) {
      const w = 22 + Math.round(9 * Math.sin(y / 8)) + (y > 60 ? Math.round((y - 60) * 0.7) : 0);
      rect(g, 12, y, w, 1, 'W');
      px(g, 12 + w - 1, y, 'P');
      if ((y + Math.round(4 * Math.sin(y / 8))) % 7 === 0) rect(g, 14, y, w - 4, 1, 'P');
    }
    for (let i = 0; i < 5; i++) px(g, 46 + i * 3, 30 + i * 4, 'W');
  }

  rect(g, 2, 80, 176, 12, 'K'); rect(g, 4, 81, 172, 8, m.hi); rect(g, 4, 81, 172, 2, hot ? 'C' : 'W');
  catProfile(g, 104, 59, 'O', 'L');
  rect(g, 116, 76, 9, 3, 'K'); rect(g, 117, 76, 8, 2, 'O'); rect(g, 123, 74, 2, 3, 'K');
  return g;
}
function office() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 74, 'T'); rect(g, 0, 74, 180, 36, 'S');
  rect(g, 0, 73, 180, 1, 'K');
  for (let i = 0; i < 4; i++) { rect(g, 12 + i * 44, 4, 30, 5, 'K'); rect(g, 13 + i * 44, 5, 28, 3, i === 2 ? 'S' : 'P'); }
  rect(g, 10, 22, 44, 26, 'K'); rect(g, 12, 24, 40, 22, 'P'); rect(g, 16, 28, 26, 2, 'S'); rect(g, 16, 33, 20, 2, 'S'); rect(g, 16, 38, 14, 2, 'D');
  rect(g, 30, 38, 8, 2, 'P');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const x = 8 + c * 44, y = 52 + r * 18;
    rect(g, x, y, 36, 4, 'K'); rect(g, x + 1, y + 1, 34, 2, 'P');
    rect(g, x + 2, y + 4, 2, 8, 'S'); rect(g, x + 32, y + 4, 2, 8, 'S');
    rect(g, x + 12, y - 8, 14, 9, 'K'); rect(g, x + 13, y - 7, 12, 7, 'D');
  }
  rect(g, 150, 44, 12, 6, 'S'); rect(g, 152, 32, 8, 12, 'G'); rect(g, 148, 34, 6, 3, 'G'); rect(g, 158, 36, 6, 3, 'G');
  rect(g, 152, 50, 8, 3, 'K');
  return g;
}
function kitchen() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 72, 'B'); rect(g, 0, 72, 180, 38, 'K');
  for (let x = 0; x < 180; x += 10) for (let y = 0; y < 72; y += 10) { rect(g, x, y, 9, 9, (x / 10 + y / 10) % 2 ? 'B' : 'E'); }
  rect(g, 84, 0, 4, 14, 'K'); ell(g, 86, 18, 7, 7, 'A'); ell(g, 86, 18, 5, 5, 'W');
  for (let i = 0; i < 30; i++) { const a = i / 30 * 6.28; px(g, 86 + Math.round(Math.cos(a) * 12), 18 + Math.round(Math.sin(a) * 12), 'A'); }
  rect(g, 0, 66, 180, 8, 'K'); rect(g, 0, 68, 180, 5, 'N');
  rect(g, 0, 74, 180, 36, 'B'); rect(g, 0, 74, 180, 2, 'K');
  rect(g, 20, 58, 44, 10, 'K'); rect(g, 22, 60, 40, 6, 'S');
  ell(g, 42, 58, 18, 6, 'K'); ell(g, 42, 57, 16, 5, 'S'); ell(g, 42, 56, 13, 4, 'E');
  rect(g, 58, 54, 14, 3, 'K');
  for (let i = 0; i < 5; i++) { rect(g, 30 + i * 6, 40 - i * 2, 2, 12 + i, 'W'); }
  for (let i = 0; i < 6; i++) { const x = 96 + i * 13; rect(g, x, 48, 10, 18, 'K'); rect(g, x + 1, 49, 8, 16, [ 'V', 'A', 'G', 'N', 'W', 'E' ][i]); rect(g, x, 46, 10, 3, 'B'); }
  for (let i = 0; i < 7; i++) { rect(g, 10 + i * 9, 78 + (i % 3) * 6, 5, 3, i % 2 ? 'G' : 'A'); px(g, 12 + i * 9, 77 + (i % 3) * 6, 'K'); }
  rect(g, 148, 76, 7, 22, 'K'); rect(g, 149, 77, 5, 20, 'B'); rect(g, 149, 84, 5, 6, 'R'); rect(g, 150, 72, 3, 5, 'K');
  shimmer(g, 24, 34, 40, 16, 'A', 12, 21);
  return g;
}
function bar() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'K');
  rect(g, 0, 0, 180, 56, 'D');
  rect(g, 12, 10, 60, 4, 'M'); rect(g, 12, 15, 60, 1, 'D');
  rect(g, 108, 20, 46, 4, 'M'); rect(g, 116, 26, 30, 3, 'M');
  for (let i = 0; i < 40; i++) px(g, Math.floor(rnd(i) * 180), Math.floor(rnd(i + 40) * 50), 'M');
  rect(g, 0, 54, 180, 4, 'K');
  rect(g, 0, 58, 180, 52, 'D');
  rect(g, 14, 40, 22, 30, 'K'); rect(g, 16, 42, 18, 4, 'S'); rect(g, 18, 46, 3, 24, 'S'); rect(g, 30, 46, 3, 24, 'S');
  rect(g, 142, 42, 22, 30, 'K'); rect(g, 144, 44, 18, 4, 'S'); rect(g, 146, 48, 3, 22, 'S'); rect(g, 158, 48, 3, 22, 'S');
  rect(g, 18, 74, 146, 30, 'K'); rect(g, 20, 76, 142, 26, 'B'); rect(g, 20, 76, 142, 3, 'N');
  for (let i = 0; i < 9; i++) {
    const x = 26 + i * 15, y = 60 + (i % 3) * 4;
    rect(g, x, y, 9, 14, 'K'); rect(g, x + 1, y + 1, 7, 12, 'P'); rect(g, x + 1, y + 1, 7, 3, 'M');
  }
  rect(g, 112, 84, 30, 14, 'W'); rect(g, 112, 84, 30, 1, 'P'); rect(g, 116, 88, 22, 1, 'P'); rect(g, 116, 92, 16, 1, 'P');
  return g;
}
function annaFlat() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 78, 'D'); rect(g, 0, 78, 180, 32, 'K');
  rect(g, 0, 77, 180, 1, 'S');
  rect(g, 96, 6, 74, 62, 'K'); rect(g, 100, 10, 66, 54, 'Z'); rect(g, 100, 34, 66, 30, 'S');
  rect(g, 92, 2, 22, 74, 'K'); rect(g, 94, 4, 18, 70, 'D'); rect(g, 152, 2, 24, 74, 'K'); rect(g, 154, 4, 20, 70, 'D');
  for (let i = 0; i < 5; i++) { rect(g, 96 + i * 4, 4, 1, 70, 'S'); rect(g, 156 + i * 4, 4, 1, 70, 'S'); }
  rect(g, 10, 74, 76, 6, 'K'); rect(g, 12, 76, 72, 3, 'D');
  rect(g, 12, 80, 4, 20, 'K'); rect(g, 80, 80, 4, 20, 'K');
  [0, 1, 2].forEach(i => { const x = 22 + i * 20; rect(g, x, 66, 13, 9, 'K'); rect(g, x + 1, 67, 11, 7, 'W'); rect(g, x + 4, 69, 5, 4, 'D'); });
  [92, 100].forEach((x, i) => { rect(g, x - 76, 58 + i * 2, 4, 10, 'W'); rect(g, x - 75, 56 + i * 2, 2, 2, 'K'); });
  rect(g, 116, 68, 30, 22, 'K'); rect(g, 118, 70, 26, 4, 'S'); rect(g, 118, 74, 4, 16, 'S'); rect(g, 140, 74, 4, 16, 'S');
  rect(g, 112, 62, 40, 16, 'K'); rect(g, 114, 64, 36, 12, 'D');
  catProfile(g, 122, 50, 'O', 'L');
  [[8, 40], [166, 46]].forEach(([x, y], i) => { rect(g, x, y + 12, 10, 12, 'B'); rect(g, x + 3, y, 4, 12, 'G'); rect(g, x - 1, y + 4, 5, 3, 'G'); rect(g, x + 7, y + 6, 5, 3, 'G'); });
  rect(g, 60, 84, 12, 14, 'B'); rect(g, 62, 80, 8, 6, 'G'); rect(g, 58, 82, 6, 3, 'G');
  rect(g, 158, 84, 10, 12, 'B'); rect(g, 160, 78, 6, 8, 'G');
  rect(g, 30, 56, 3, 8, 'W'); px(g, 31, 55, 'A'); rect(g, 60, 58, 3, 6, 'W'); px(g, 61, 57, 'A');
  return g;
}
function tarot(kind) {
  const g = G(24, 40);
  rect(g, 0, 0, 24, 40, 'K'); rect(g, 1, 1, 22, 38, 'W'); rect(g, 2, 2, 20, 36, 'W');
  rect(g, 2, 2, 20, 1, 'K'); rect(g, 2, 37, 20, 1, 'K'); rect(g, 2, 2, 1, 36, 'K'); rect(g, 21, 2, 1, 36, 'K');
  const I = 'K';
  if (kind === 'tower') { rect(g, 8, 12, 8, 22, I); rect(g, 6, 8, 12, 4, I); rect(g, 10, 16, 4, 6, 'W'); rect(g, 16, 6, 3, 8, I); rect(g, 5, 10, 2, 5, I); }
  if (kind === 'cups') { [[6, 14], [16, 14], [11, 24]].forEach(([x, y]) => { rect(g, x - 3, y, 7, 6, I); rect(g, x - 1, y + 6, 3, 3, I); rect(g, x - 3, y + 9, 7, 2, I); }); }
  if (kind === 'hierophant') { rect(g, 9, 6, 6, 8, I); rect(g, 7, 14, 10, 4, I); rect(g, 6, 18, 12, 16, I); rect(g, 11, 22, 2, 8, 'W'); rect(g, 9, 25, 6, 2, 'W'); }
  if (kind === 'pentacles') { for (let i = 0; i < 8; i++) { const x = 6 + (i % 2) * 11, y = 8 + Math.floor(i / 2) * 8; ell(g, x, y, 3, 3, I); ell(g, x, y, 1, 1, 'W'); } }
  if (kind === 'devil') { rect(g, 7, 12, 10, 12, I); rect(g, 4, 6, 3, 7, I); rect(g, 17, 6, 3, 7, I); rect(g, 9, 15, 2, 2, 'W'); rect(g, 13, 15, 2, 2, 'W'); rect(g, 8, 26, 8, 8, I); }
  if (kind === 'wheel') { ell(g, 12, 20, 9, 9, I); ell(g, 12, 20, 6, 6, 'W'); ell(g, 12, 20, 2, 2, I); for (let a = 0; a < 8; a++) { const r = a / 8 * 6.28; px(g, 12 + Math.round(Math.cos(r) * 7), 20 + Math.round(Math.sin(r) * 7), I); } }
  if (kind === 'fool') { rect(g, 10, 8, 5, 6, I); rect(g, 8, 14, 9, 12, I); rect(g, 6, 26, 4, 8, I); rect(g, 14, 26, 4, 8, I); rect(g, 16, 12, 4, 3, I); rect(g, 4, 28, 4, 4, I); }
  if (kind === 'back') { for (let y = 4; y < 36; y += 4) for (let x = 4; x < 20; x += 4) rect(g, x, y, 2, 2, I); rect(g, 3, 3, 18, 1, I); rect(g, 3, 36, 18, 1, I); }
  return g;
}
function vet() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 76, 'N'); rect(g, 0, 76, 180, 34, 'C');
  rect(g, 0, 75, 180, 2, 'B');
  rect(g, 0, 0, 180, 4, 'W');
  for (let i = 0; i < 4; i++) {
    const x = 14 + i * 40;
    rect(g, x, 48, 30, 4, 'K'); rect(g, x + 1, 49, 28, 2, 'P');
    rect(g, x, 30, 30, 18, 'K'); rect(g, x + 1, 31, 28, 17, 'S');
    rect(g, x + 2, 52, 3, 22, 'K'); rect(g, x + 25, 52, 3, 22, 'K');
  }
  rect(g, 62, 8, 34, 20, 'K'); rect(g, 64, 10, 30, 16, 'W');
  ell(g, 74, 18, 5, 5, 'N'); rect(g, 70, 13, 3, 4, 'B'); rect(g, 77, 13, 3, 4, 'B'); rect(g, 72, 17, 2, 2, 'K'); rect(g, 76, 17, 2, 2, 'K'); rect(g, 73, 21, 4, 1, 'K');
  rect(g, 82, 20, 8, 4, 'B');
  rect(g, 116, 82, 40, 26, 'K'); rect(g, 118, 84, 36, 22, 'P');
  for (let i = 0; i < 5; i++) rect(g, 122 + i * 7, 86, 3, 18, 'S');
  rect(g, 126, 90, 20, 14, 'K'); rect(g, 128, 92, 16, 11, 'B');
  rect(g, 130, 95, 3, 3, 'A'); rect(g, 139, 95, 3, 3, 'A'); px(g, 131, 96, 'K'); px(g, 140, 96, 'K');
  rect(g, 127, 88, 3, 4, 'B'); rect(g, 142, 88, 3, 4, 'B');
  return g;
}
function booking(active) {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'K'); rect(g, 4, 4, 172, 102, 'D');
  rect(g, 4, 4, 172, 8, 'S');
  text(g, 10, 16, 'MONEY', 'T');
  num7(g, 10, 24, 16, 26, '482', 'W', 3, 6);
  text(g, 10, 56, 'PRICE', 'T');
  num7(g, 10, 64, 16, 26, '511', active ? 'A' : 'S', 3, 6);
  rect(g, 10, 94, 160, 12, active ? 'A' : 'S');
  rect(g, 10, 94, 160, 1, active ? 'C' : 'T');
  text(g, 62, 98, 'JUMP', active ? 'K' : 'D');
  return g;
}
function uzbek(variant) {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 60, 'A'); rect(g, 0, 0, 180, 18, 'C');
  ell(g, 150, 34, 14, 14, 'C'); ell(g, 150, 34, 11, 11, 'A');
  ellC(g, 62, 46, 27, 27, 'C', 46); ellC(g, 62, 46, 25, 25, 'Z', 46);
  for (let y = 20; y <= 46; y++) for (let x = 36; x <= 88; x++) if (g.d[y * 180 + x] === 'Z' && (x - 62) % 6 === 0) px(g, x, y, 'A');
  rect(g, 60, 12, 4, 9, 'A'); px(g, 61, 10, 'C');
  rect(g, 36, 46, 52, 22, 'Z'); rect(g, 36, 46, 52, 2, 'C');
  for (let x = 40; x < 86; x += 8) rect(g, x, 50, 4, 4, 'C');
  ell(g, 62, 60, 13, 16, 'K'); ell(g, 62, 61, 11, 15, 'D');
  rect(g, 0, 60, 180, 8, 'N'); rect(g, 0, 66, 180, 44, 'B');
  rect(g, 0, 66, 180, 2, 'K');
  for (let y = 72; y < 110; y += 6) rect(g, 0, y, 180, 1, 'N');
  rect(g, 14, 44, 20, 24, 'Z'); rect(g, 146, 44, 20, 24, 'Z');
  rect(g, 30, 82, 120, 6, 'K'); rect(g, 32, 83, 116, 3, 'W');
  rect(g, 38, 88, 5, 20, 'W'); rect(g, 138, 88, 5, 20, 'W');
  const plate = (x) => {
    ell(g, x, 79, 17, 5, 'K'); ell(g, x, 78, 15, 4, 'P');
    ell(g, x, 77, 12, 3, 'C'); rect(g, x - 6, 74, 12, 3, 'N'); rect(g, x - 3, 73, 6, 2, 'B');
    ell(g, x + 8, 76, 3, 2, 'W'); ell(g, x - 9, 76, 3, 2, 'W'); px(g, x - 9, 76, 'C');
  };
  const chair = (x, occupied) => {
    rect(g, x, 68, 22, 18, 'K'); rect(g, x + 1, 69, 20, 16, 'W');
    rect(g, x + 5, 71, 2, 12, 'P'); rect(g, x + 10, 71, 2, 12, 'P'); rect(g, x + 15, 71, 2, 12, 'P');
    rect(g, x - 1, 86, 24, 4, 'K'); rect(g, x, 87, 22, 2, 'W');
    rect(g, x + 2, 90, 3, 16, 'W'); rect(g, x + 17, 90, 3, 16, 'W');
    if (occupied) { rect(g, x - 2, 64, 26, 24, 'D'); rect(g, x - 2, 64, 26, 2, 'K'); ell(g, x + 11, 58, 8, 8, 'K'); ell(g, x + 11, 58, 7, 7, 'N'); ellC(g, x + 11, 57, 7, 7, 'H', 55); rect(g, x - 4, 74, 4, 12, 'D'); rect(g, x + 22, 74, 4, 12, 'D'); }
  };
  if (variant === 'a') { chair(20, true); chair(138, true); plate(58); plate(112); }
  else if (variant === 'b') { chair(20, false); chair(138, false); plate(58); plate(112); }
  else if (variant === 'c') { chair(78, false); plate(88); for (let i = 0; i < 40; i++) rect(g, Math.floor(rnd(i) * 178), Math.floor(rnd(i + 7) * 100), 2, 3, ['M', 'A', 'Z', 'W', 'R'][i % 5]); }
  else { chair(20, false); chair(138, false); plate(88); }
  for (let i = 0; i < 30; i++) px(g, Math.floor(rnd(i + 3) * 180), 20 + Math.floor(rnd(i + 60) * 70), 'C');
  return g;
}
function airport() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'S');
  rect(g, 8, 10, 164, 52, 'K'); rect(g, 10, 12, 160, 48, 'P');
  rect(g, 10, 44, 160, 16, 'T');
  rect(g, 60, 12, 4, 48, 'K'); rect(g, 116, 12, 4, 48, 'K');
  rect(g, 74, 30, 70, 10, 'W'); rect(g, 100, 26, 16, 8, 'W'); rect(g, 70, 38, 40, 4, 'W');
  rect(g, 84, 24, 6, 4, 'P'); rect(g, 118, 34, 22, 3, 'W');
  rect(g, 20, 2, 62, 12, 'K'); rect(g, 22, 4, 58, 8, 'D');
  for (let i = 0; i < 6; i++) rect(g, 25 + i * 9, 6, 6, 2, 'A');
  for (let i = 0; i < 4; i++) rect(g, 25 + i * 9, 9, 4, 1, 'P');
  rect(g, 0, 62, 180, 4, 'D');
  for (let i = 0; i < 5; i++) {
    const x = 6 + i * 35;
    rect(g, x, 78, 32, 5, 'K'); rect(g, x + 1, 79, 30, 3, 'T');
    rect(g, x, 62, 32, 16, 'K'); rect(g, x + 1, 63, 30, 15, 'S');
    rect(g, x + 2, 83, 3, 18, 'K'); rect(g, x + 27, 83, 3, 18, 'K');
  }
  const person = (x) => { rect(g, x, 58, 16, 22, 'D'); ell(g, x + 8, 52, 7, 7, 'K'); ell(g, x + 8, 52, 6, 6, 'N'); ellC(g, x + 8, 51, 6, 6, 'H', 49); };
  person(20); person(120);
  rect(g, 76, 70, 7, 9, 'K'); rect(g, 77, 71, 5, 7, 'W'); rect(g, 77, 71, 5, 2, 'B');
  rect(g, 86, 70, 7, 9, 'K'); rect(g, 87, 71, 5, 7, 'W'); rect(g, 87, 71, 5, 2, 'B');
  return g;
}

/* ---------- kitchen minigame ---------- */
function panTop() {
  const g = G(80, 60);
  ell(g, 34, 30, 30, 26, 'K'); ell(g, 34, 30, 28, 24, 'S'); ell(g, 34, 30, 25, 21, 'D');
  rect(g, 62, 27, 18, 6, 'K'); rect(g, 63, 28, 16, 4, 'B');
  return g;
}
const ING = {
  rice: g => { ell(g, 8, 10, 6, 4, 'W'); ell(g, 8, 8, 4, 3, 'C'); rect(g, 2, 12, 12, 1, 'G'); },
  aubergine: g => { ell(g, 8, 10, 4, 5, 'D'); ell(g, 7, 9, 3, 4, 'M'); rect(g, 7, 2, 2, 4, 'G'); rect(g, 5, 3, 6, 2, 'G'); rect(g, 2, 14, 12, 1, 'G'); },
  chickpeas: g => { [[5, 8], [10, 7], [7, 12]].forEach(([x, y]) => { ell(g, x, y, 3, 3, 'N'); ell(g, x, y, 1, 1, 'C'); }); rect(g, 2, 15, 12, 1, 'G'); },
  tofu: g => { rect(g, 4, 5, 9, 8, 'W'); rect(g, 4, 5, 9, 1, 'C'); rect(g, 4, 5, 1, 8, 'C'); rect(g, 2, 15, 12, 1, 'G'); },
  oat: g => { rect(g, 5, 3, 7, 11, 'P'); rect(g, 5, 3, 7, 2, 'W'); rect(g, 6, 7, 5, 3, 'C'); rect(g, 2, 15, 12, 1, 'G'); },
  herbs: g => { rect(g, 8, 4, 1, 10, 'G'); for (let i = 0; i < 4; i++) { px(g, 6 - (i % 2), 6 + i * 2, 'G'); px(g, 11 + (i % 2), 5 + i * 2, 'G'); } rect(g, 2, 15, 12, 1, 'G'); },
  garlic: g => { ell(g, 8, 10, 5, 4, 'W'); ell(g, 6, 10, 2, 4, 'C'); ell(g, 10, 10, 2, 4, 'C'); rect(g, 7, 3, 2, 4, 'C'); rect(g, 2, 15, 12, 1, 'G'); },
  bacon: g => { rect(g, 2, 5, 12, 3, 'R'); rect(g, 2, 8, 12, 2, 'C'); rect(g, 2, 10, 12, 3, 'R'); rect(g, 2, 15, 12, 1, 'R'); rect(g, 2, 5, 1, 8, 'K'); rect(g, 13, 5, 1, 8, 'K'); },
  sausage: g => { rect(g, 3, 7, 10, 5, 'B'); rect(g, 2, 8, 1, 3, 'K'); rect(g, 13, 8, 1, 3, 'K'); rect(g, 4, 8, 8, 1, 'N'); rect(g, 2, 15, 12, 1, 'R'); },
  lard: g => { rect(g, 3, 6, 10, 7, 'W'); rect(g, 3, 6, 10, 1, 'K'); rect(g, 3, 6, 1, 7, 'K'); rect(g, 12, 6, 1, 7, 'K'); rect(g, 5, 9, 6, 1, 'C'); rect(g, 2, 15, 12, 1, 'R'); },
  stock: g => { rect(g, 4, 5, 9, 9, 'A'); rect(g, 4, 5, 9, 1, 'C'); rect(g, 4, 5, 1, 9, 'C'); rect(g, 6, 8, 5, 1, 'B'); rect(g, 6, 10, 3, 1, 'B'); rect(g, 2, 15, 12, 1, 'R'); },
  fish: g => { rect(g, 6, 4, 4, 3, 'K'); rect(g, 5, 6, 6, 8, 'B'); rect(g, 5, 8, 6, 3, 'R'); rect(g, 6, 9, 4, 1, 'W'); rect(g, 2, 15, 12, 1, 'R'); }
};
function ingredient(k) { const g = G(16, 16); ING[k](g); return g; }
function meterBar(label, full) {
  const g = G(60, 14);
  const key = label === 'TASTE' ? 'G' : 'R';
  text(g, 1, 1, label, key);
  rect(g, 0, 8, 60, 6, 'K'); rect(g, 1, 9, 58, 4, 'D');
  rect(g, 1, 9, 3, 4, key);
  if (full) rect(g, 1, 9, 58, 4, key);
  return g;
}

/* ---------- co-op minigame (crude on purpose) ---------- */
const MG = {
  run: [
    ['....KKKK........', '....KWWK........', '....KKKK........', '...KKKKKK.......', '..KK.KK.KK......', '..K..KK..K......', '.....KK.........', '....KKKK........', '....K..K........', '...KK..KK.......', '..KK....KK......', '.KK......KK.....', '................', '................', '................', '................'],
    ['....KKKK........', '....KWWK........', '....KKKK........', '...KKKKKK.......', '...K.KK.K.......', '.....KK.........', '.....KK.........', '....KKKK........', '....K..K........', '....K..K........', '...KK..KK.......', '..KK....KK......', '................', '................', '................', '................'],
    ['....KKKK........', '....KWWK........', '....KKKK........', '..KKKKKKKK......', '..K..KK..K......', '.....KK.........', '.....KK.........', '....KKKK........', '...KK...K.......', '..KK....KK......', '.KK......KK.....', '.K........KK....', '................', '................', '................', '................'],
    ['....KKKK........', '....KWWK........', '....KKKK........', '...KKKKKK.......', '...K.KK.K.......', '.....KK.........', '.....KK.........', '....KKKK........', '....K..K........', '....K..K........', '....K..K........', '...KK..KK.......', '................', '................', '................', '................']
  ],
  jump: ['..K.KKKK.K......', '..K.KWWK.K......', '..KKKKKKKK......', '.....KK.........', '.....KK.........', '....KKKK........', '...KK..KK.......', '..KK....KK......', '.KK......KK.....', '.K........K.....', '................', '................', '................', '................', '................', '................']
};
function mgEnemy(kind, frame) {
  const g = G(16, 16);
  if (kind === 'blob') { ell(g, 8, 10 + frame, 6, 5 - frame, 'M'); rect(g, 4, 14, 9, 1, 'K'); rect(g, 6, 9, 2, 2, 'K'); rect(g, 10, 9, 2, 2, 'K'); }
  if (kind === 'spike') { for (let i = 0; i < 5; i++) rect(g, 2 + i * 3, 8 - (i % 2) - frame, 2, 7, 'V'); rect(g, 1, 14, 14, 1, 'K'); }
  if (kind === 'flyer') { rect(g, 6, 7, 5, 5, 'Z'); rect(g, 1 + frame, 6, 5, 3, 'P'); rect(g, 11 - frame, 6, 5, 3, 'P'); rect(g, 7, 8, 1, 1, 'K'); rect(g, 9, 8, 1, 1, 'K'); }
  return g;
}
function mgGround() {
  const g = G(16, 16);
  rect(g, 0, 0, 16, 4, 'G'); rect(g, 0, 4, 16, 12, 'B');
  rect(g, 0, 0, 16, 1, 'K'); rect(g, 3, 7, 3, 2, 'K'); rect(g, 10, 11, 4, 2, 'K');
  return g;
}
function mgBack() {
  const g = G(180, 60);
  rect(g, 0, 0, 180, 60, 'D');
  for (let i = 0; i < 6; i++) { const x = i * 30; rect(g, x, 24 + (i % 3) * 6, 26, 40, 'S'); for (let w = 0; w < 3; w++) rect(g, x + 4 + w * 8, 30 + (i % 3) * 6, 4, 4, 'Z'); }
  for (let i = 0; i < 24; i++) px(g, Math.floor(rnd(i) * 180), Math.floor(rnd(i + 5) * 22), 'P');
  return g;
}
function mgButton(label) {
  const g = G(40, 40);
  rect(g, 0, 0, 40, 40, 'K'); rect(g, 2, 2, 36, 36, label === 'JUMP' ? 'A' : 'M'); rect(g, 2, 2, 36, 4, 'W');
  text(g, label === 'JUMP' ? 12 : 10, 17, label === 'JUMP' ? 'JUMP' : 'SHOOT', 'K');
  return g;
}
function mgProgress(fill) {
  const g = G(180, 20);
  rect(g, 0, 0, 180, 20, 'K'); rect(g, 2, 2, 176, 16, 'D');
  if (fill > 0) rect(g, 2, 2, Math.round(176 * fill), 16, 'V');
  rect(g, 2, 2, 176, 1, 'S');
  return g;
}

/* ---------- UI kit ---------- */
function hud() {
  const g = G(180, 24);
  rect(g, 0, 0, 180, 24, 'K'); rect(g, 0, 0, 180, 22, 'D'); rect(g, 0, 21, 180, 3, 'K');
  text(g, 4, 3, '482', 'W'); text(g, 130, 3, '511', 'A');
  rect(g, 2, 12, 176, 1, 'S');
  ['case', 'heart', 'pair', 'brain', 'cat'].forEach((k, i) => { const x = 6 + i * 34; stampIcon(g, x, 15, k, 'P'); for (let p = 0; p < 5; p++) rect(g, x + 14 + p * 4, 16, 3, 3, p < 3 ? 'A' : 'S'); });
  return g;
}
function stampIcon(g, x, y, kind, c) {
  if (kind === 'case') { rect(g, x, y + 3, 12, 8, c); rect(g, x + 4, y + 1, 4, 2, c); rect(g, x + 5, y + 6, 2, 2, 'K'); }
  if (kind === 'heart') { rect(g, x + 1, y + 3, 4, 3, c); rect(g, x + 7, y + 3, 4, 3, c); rect(g, x + 1, y + 5, 10, 3, c); rect(g, x + 3, y + 8, 6, 2, c); rect(g, x + 5, y + 10, 2, 1, c); }
  if (kind === 'pair') { ell(g, x + 3, y + 3, 2, 2, c); rect(g, x + 1, y + 6, 5, 6, c); ell(g, x + 9, y + 3, 2, 2, c); rect(g, x + 7, y + 6, 5, 6, c); }
  if (kind === 'brain') { ell(g, x + 6, y + 6, 5, 5, c); rect(g, x + 4, y + 3, 2, 2, 'K'); rect(g, x + 7, y + 6, 3, 1, 'K'); rect(g, x + 3, y + 8, 3, 1, 'K'); }
  if (kind === 'cat') { rect(g, x + 1, y, 2, 4, c); rect(g, x + 9, y, 2, 4, c); ell(g, x + 6, y + 7, 5, 4, c); rect(g, x + 4, y + 6, 1, 1, 'K'); rect(g, x + 7, y + 6, 1, 1, 'K'); }
}
function meterIcon(kind) { const g = G(12, 12); stampIcon(g, 0, 0, kind, 'P'); return g; }
function pip(filled) { const g = G(4, 4); rect(g, 0, 0, 4, 4, filled ? 'A' : 'S'); px(g, 0, 0, 'K'); px(g, 3, 3, 'K'); return g; }
function dialogueBox() {
  const g = G(180, 64);
  rect(g, 0, 0, 180, 64, 'K'); rect(g, 2, 2, 176, 60, 'D'); rect(g, 4, 4, 172, 56, 'K');
  rect(g, 4, 4, 172, 10, 'D'); rect(g, 6, 6, 60, 6, 'S');
  for (let i = 0; i < 4; i++) rect(g, 8, 20 + i * 9, 140 - i * 22, 3, 'P');
  rect(g, 166, 52, 6, 2, 'A'); rect(g, 167, 54, 4, 2, 'A'); rect(g, 168, 56, 2, 2, 'A');
  return g;
}
function choiceButton(pressed) {
  const g = G(168, 22);
  rect(g, 0, 0, 168, 22, 'K');
  rect(g, 2, 2, 164, 18, pressed ? 'S' : 'D');
  rect(g, 2, 2, 164, 2, pressed ? 'D' : 'T');
  for (let i = 0; i < 3; i++) rect(g, 10 + i * 34, 10, 26, 3, pressed ? 'P' : 'W');
  return g;
}
function ticker() {
  const g = G(90, 12);
  rect(g, 0, 0, 90, 12, 'K'); rect(g, 1, 1, 88, 10, 'D');
  text(g, 4, 4, '511', 'A');
  rect(g, 74, 6, 5, 4, 'R'); rect(g, 75, 4, 3, 2, 'R'); px(g, 76, 3, 'R');
  return g;
}
function mute(on) {
  const g = G(16, 16);
  rect(g, 3, 6, 3, 4, 'P'); rect(g, 6, 4, 2, 8, 'P'); rect(g, 8, 2, 2, 12, 'P');
  if (on) { rect(g, 11, 5, 1, 6, 'P'); rect(g, 13, 3, 1, 10, 'P'); }
  else { for (let i = 0; i < 5; i++) { px(g, 11 + i, 4 + i, 'R'); px(g, 15 - i, 4 + i, 'R'); } }
  return g;
}
function dayCard() {
  const g = G(180, 60);
  rect(g, 0, 0, 180, 60, 'K'); rect(g, 0, 6, 180, 48, 'D');
  rect(g, 0, 6, 180, 2, 'A'); rect(g, 0, 52, 180, 2, 'A');
  text(g, 20, 24, 'MONDAY', 'W');
  num7(g, 132, 18, 12, 22, '1', 'A', 3, 4);
  return g;
}
function galleryCell(found) {
  const g = G(40, 34);
  rect(g, 0, 0, 40, 34, 'K'); rect(g, 1, 1, 38, 32, 'D');
  if (found) {
    rect(g, 2, 2, 36, 22, 'Z'); rect(g, 2, 16, 36, 8, 'B');
    ell(g, 20, 12, 7, 6, 'A'); rect(g, 2, 24, 36, 8, 'S'); rect(g, 5, 27, 20, 2, 'W');
  } else {
    ell(g, 20, 14, 8, 9, 'S'); rect(g, 14, 20, 12, 8, 'S');
    text(g, 18, 12, '2', 'D');
    rect(g, 2, 24, 36, 8, 'K');
  }
  return g;
}

/* ---------- Anna + Matt ---------- */
const ANNA_CF = { skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'long', glasses: 0, shirt: 'K' };
const MATT_CF = { skin: ['N', 'B', 'K'], hair: 'X', hairStyle: 'messy', glasses: 0, shirt: 'M' };
const ANNA_HEAD = ['........................', '......BBBBBBBBBB........', '......BBBBBBBBBB........', '......BCCCCCCCCB........',
  '......BCCCCCCCCB........', '......BCKCCCCKCB........', '......BCKCCCCKCB........', '......BCCCNNCCCB........',
  '......BCCCBBCCCB........', '......BCCCCCCCCB........', '......BNCCCCCCNB........', '......B.NCCCCN.B........', '.......B.NCCN..B........'];
const MATT_HEAD = ['........................', '.....XX.XXX.XX..........', '.....XXXXXXXXXX.........', '.....XXXXXXXXXX.........',
  '.....XNNNNNNNNX.........', '.....XNKNNNNKNX.........', '.....XNKNNNNKNX.........', '.....XNNNBBNNNX.........',
  '.....XNNNBBNNNX.........', '.....XNNNNNNNNX.........', '......BNNNNNNB..........', '.......BNNNNB...........', '........BNNB............'];

/* ---------- endings: environment bases, foreground swapped ---------- */
function fgPerson(g, x, y, shirt, hair) {
  rect(g, x, y + 10, 16, 24, shirt); rect(g, x, y + 10, 16, 2, 'K');
  rect(g, x - 3, y + 12, 3, 14, shirt); rect(g, x + 16, y + 12, 3, 14, shirt);
  ell(g, x + 8, y + 4, 7, 7, 'K'); ell(g, x + 8, y + 4, 6, 6, 'C'); ellC(g, x + 8, y + 3, 6, 6, hair, y + 2);
  rect(g, x + 4, y + 4, 2, 2, 'K'); rect(g, x + 10, y + 4, 2, 2, 'K');
}
function fgLoaf(g, x, y) {
  ell(g, x + 10, y + 8, 11, 6, 'K'); ell(g, x + 10, y + 8, 10, 5, 'O'); ell(g, x + 10, y + 10, 8, 3, 'L');
  rect(g, x + 4, y, 2, 5, 'K'); rect(g, x + 14, y, 2, 5, 'K'); rect(g, x + 4, y + 1, 2, 4, 'O'); rect(g, x + 14, y + 1, 2, 4, 'O');
  ell(g, x + 10, y + 3, 6, 4, 'K'); ell(g, x + 10, y + 3, 5, 3, 'O'); px(g, x + 8, y + 3, 'A'); px(g, x + 12, y + 3, 'A');
}
function fgConfetti(g, n) { for (let i = 0; i < n; i++) rect(g, Math.floor(rnd(i + 11) * 178), Math.floor(rnd(i + 71) * 104), 2, 3, ['M', 'A', 'Z', 'W', 'R'][i % 5]); }
function fgWash(g, c, n, seed) { for (let i = 0; i < n; i++) px(g, Math.floor(rnd(i + seed) * 180), Math.floor(rnd(i + seed + 31) * 110), c); }
function fgBox(g, x, y) { rect(g, x, y, 22, 16, 'K'); rect(g, x + 1, y + 1, 20, 14, 'N'); rect(g, x + 1, y + 6, 20, 2, 'B'); rect(g, x + 8, y - 3, 6, 4, 'B'); }
function fgStain(g, x, y, r) { ell(g, x, y, r + 2, r, 'V'); rect(g, x - r - 1, y + r, (r + 1) * 2, 1, 'K'); px(g, x + 1, y - 1, 'R'); }
function withOv(base, ov) { const g = base; for (let i = 0; i < g.d.length; i++) if (ov.d[i] !== '.') g.d[i] = ov.d[i]; return g; }

const END_ART = [
  ['01 the window', 'She got out. The sill is warm and there is nothing on it.', () => { const g = windowCard(false); clear(g, 96, 56, 36, 24); rect(g, 96, 56, 36, 24, 'S'); rect(g, 96, 66, 36, 9, 'K'); rect(g, 97, 67, 34, 7, 'D'); rect(g, 96, 76, 36, 4, 'S'); rect(g, 2, 80, 176, 12, 'K'); rect(g, 4, 81, 172, 8, 'P'); rect(g, 4, 81, 172, 2, 'W'); return g; }],
  ['02 caught in time', 'Two hands, one cat, no explanation offered.', () => { const g = windowCard(false); clear(g, 96, 56, 36, 24); rect(g, 96, 56, 36, 24, 'S'); rect(g, 96, 66, 36, 9, 'K'); rect(g, 97, 67, 34, 7, 'D'); rect(g, 96, 76, 36, 4, 'S'); rect(g, 2, 80, 176, 12, 'K'); rect(g, 4, 81, 172, 8, 'P'); rect(g, 4, 81, 172, 2, 'W'); fgPerson(g, 84, 50, 'W', 'H'); rect(g, 78, 68, 30, 13, 'K'); rect(g, 79, 69, 28, 11, 'O'); rect(g, 81, 74, 22, 5, 'L'); rect(g, 80, 64, 3, 5, 'K'); rect(g, 86, 64, 3, 5, 'K'); px(g, 82, 71, 'A'); px(g, 88, 71, 'A'); rect(g, 74, 70, 6, 5, 'K'); rect(g, 75, 71, 5, 3, 'C'); rect(g, 105, 70, 6, 5, 'K'); rect(g, 105, 71, 5, 3, 'C'); return g; }],
  ['03 third floor', 'The window is open. It was open all afternoon.', () => { const g = apartment(true); rect(g, 103, 11, 56, 26, 'C'); rect(g, 103, 11, 56, 5, 'W'); rect(g, 103, 30, 56, 7, 'E'); rect(g, 103, 37, 56, 4, 'K'); rect(g, 104, 38, 54, 2, 'B'); rect(g, 103, 41, 56, 3, 'D'); rect(g, 129, 11, 3, 30, 'K'); rect(g, 100, 8, 4, 54, 'K'); rect(g, 158, 20, 4, 42, 'K'); shimmer(g, 104, 14, 54, 20, 'A', 10, 61); fgStain(g, 128, 96, 4); return g; }],
  ['04 Anna has her', 'Three floors down, asleep on a black wool coat.', () => { const g = annaFlat(); clear(g, 104, 38, 60, 58); rect(g, 104, 38, 60, 40, 'D'); rect(g, 104, 78, 60, 18, 'K'); rect(g, 104, 77, 60, 1, 'S'); rect(g, 116, 68, 30, 4, 'K'); rect(g, 117, 69, 28, 2, 'S'); rect(g, 118, 72, 4, 20, 'K'); rect(g, 140, 72, 4, 20, 'K'); rect(g, 114, 46, 34, 24, 'K'); rect(g, 115, 47, 32, 22, 'D'); rect(g, 120, 50, 3, 18, 'S'); rect(g, 132, 50, 3, 18, 'S'); rect(g, 114, 68, 34, 3, 'K'); fgLoaf(g, 118, 40); px(g, 121, 43, 'A'); px(g, 133, 43, 'A'); return g; }],
  ['05 the vet, too late', 'The carrier is on the floor and it is empty.', () => { const g = vet(); rect(g, 126, 90, 20, 14, 'S'); rect(g, 128, 92, 16, 11, 'D'); return g; }],
  ['06 the vet, in time', 'Furious, alive, and extremely expensive.', () => { const g = vet(); rect(g, 128, 92, 16, 11, 'O'); rect(g, 130, 95, 3, 3, 'K'); rect(g, 139, 95, 3, 3, 'K'); return g; }],
  ['07 sold the console', 'The shelf is clean for the first time in four years.', () => { const g = apartment(false); rect(g, 26, 46, 30, 17, 'T'); rect(g, 24, 61, 34, 3, 'S'); fgPerson(g, 130, 62, 'M', 'X'); return g; }],
  ['08 Matt waits', 'He came to the airport anyway. Nobody asked him to.', () => { const g = airport(); rect(g, 118, 50, 22, 32, 'S'); fgPerson(g, 70, 48, 'M', 'X'); return g; }],
  ['09 two coffees', 'Neither of them says anything and it is fine.', () => { const g = airport(); return g; }],
  ['10 alone at the gate', 'One cup. It went cold about an hour ago.', () => { const g = airport(); rect(g, 118, 48, 24, 34, 'S'); rect(g, 86, 70, 7, 9, 'S'); return g; }],
  ['11 plov for one', 'It is still the best thing he has ever eaten.', () => uzbek('c')],
  ['12 plov for two', 'Both chairs taken. Nobody is checking a phone.', () => uzbek('a')],
  ['13 the table set, nobody came', 'Two plates, ordered in advance, out of hope.', () => uzbek('b')],
  ['14 undeserved confetti', 'The game celebrates. You know what you did.', () => { const g = uzbek('c'); fgConfetti(g, 60); return g; }],
  ['15 still saving', 'Twenty-nine euros short. The button stays grey.', () => booking(false)],
  ['16 booked', 'One button. He presses it before he can think.', () => { const g = booking(true); fgWash(g, 'A', 40, 12); return g; }],
  ['17 interim head of enablement', 'A new title. The same desk. No more money.', () => { const g = office(); rect(g, 52, 44, 36, 4, 'A'); rect(g, 64, 36, 14, 9, 'A'); return g; }],
  ['18 fired', 'A box. Somebody helpfully labelled it.', () => { const g = office(); fgBox(g, 78, 84); return g; }],
  ['19 promoted, somehow', 'Nobody can explain it, least of all him.', () => { const g = office(); rect(g, 12, 24, 40, 22, 'A'); rect(g, 16, 28, 26, 2, 'K'); rect(g, 16, 33, 20, 2, 'K'); return g; }],
  ['20 Friday never ended', 'The pan is still on. It has been on for some time.', () => { const g = kitchen(); ell(g, 42, 56, 13, 4, 'R'); shimmer(g, 24, 30, 40, 24, 'R', 26, 44); fgWash(g, 'R', 40, 9); return g; }],
  ['21 the sausage confession', 'Not angry. Just curious. That is the worst part.', () => { const g = kitchen(); fgPerson(g, 108, 58, 'W', 'Y'); return g; }],
  ['22 fish sauce found', 'It was behind the jars the entire week.', () => { const g = kitchen(); rect(g, 144, 68, 15, 34, 'A'); rect(g, 148, 76, 7, 22, 'K'); rect(g, 149, 77, 5, 20, 'B'); rect(g, 149, 84, 5, 6, 'R'); return g; }],
  ['23 the dinner held', 'Four guests, one car, and a great deal of opinion.', () => { const g = apartment(true); [10, 44, 78, 112].forEach((x, i) => fgPerson(g, x, 56 + (i % 2) * 4, ['W', 'T', 'G', 'P'][i], ['B', 'H', 'Y', 'B'][i])); return g; }],
  ['24 the dinner ended', 'Everybody left at once. Nobody took anything.', () => { const g = apartment(true); [[34, 92, 3], [96, 98, 4], [140, 90, 2], [70, 104, 5]].forEach(s => fgStain(g, s[0], s[1], s[2])); return g; }],
  ['25 Julius stayed', 'He is holding a jar. He is not going anywhere.', () => withOv(apartment(false), ovJulius(true))],
  ['26 Julius left', 'The sofa is exactly as large as it always was.', () => { const g = apartment(false); rect(g, 18, 86, 144, 20, 'S'); rect(g, 18, 86, 144, 5, 'T'); return g; }],
  ['27 seven bins, no boyfriend', 'He kept the system. He kept nothing else.', () => withOv(apartment(false), ovBins())],
  ['28 the bar won', 'More glasses than the table was designed for.', () => { const g = bar(); for (let i = 0; i < 6; i++) { const x = 30 + i * 22, y = 66 + (i % 2) * 5; rect(g, x, y, 9, 14, 'K'); rect(g, x + 1, y + 1, 7, 12, 'P'); rect(g, x + 1, y + 1, 7, 3, 'M'); } return g; }],
  ['29 Susan and Joy paid', 'They will never mention it. That is the point.', () => { const g = bar(); rect(g, 112, 84, 30, 14, 'A'); rect(g, 116, 88, 22, 1, 'K'); rect(g, 116, 92, 16, 1, 'K'); return g; }],
  ['30 one more round', 'It is 02:00. Joy is crying. Joy is also ordering.', () => { const g = bar(); fgWash(g, 'M', 90, 17); return g; }],
  ['31 the loaf', 'Perfectly symmetrical. Entirely unbothered.', () => { const g = apartment(false); fgLoaf(g, 78, 76); return g; }],
  ['32 nothing happened', 'Seven days. Same room. Still thirty-four degrees.', () => apartment(true)]
];

/* ---------- v3 · cutaway cards ---------- */
function planeDescent() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'K');
  rect(g, 120, 0, 60, 110, 'D'); rect(g, 118, 0, 3, 110, 'S');
  rect(g, 126, 20, 46, 70, 'S'); rect(g, 128, 22, 42, 66, 'D');
  const wx = 14, wy = 12, ww = 92, wh = 86;
  const m = new Uint8Array(180 * 110);
  const mark = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < 180 && Y < 110) m[Y * 180 + X] = 1; } };
  const markEll = (cx, cy, r) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r) { const X = cx + x, Y = cy + y; if (X >= 0 && Y >= 0 && X < 180 && Y < 110) m[Y * 180 + X] = 1; } };
  mark(wx, wy - 4, ww, wh + 8); mark(wx - 4, wy, ww + 8, wh);
  markEll(wx + 16, wy + 16, 20); markEll(wx + ww - 17, wy + 16, 20);
  markEll(wx + 16, wy + wh - 17, 20); markEll(wx + ww - 17, wy + wh - 17, 20);
  const mput = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < 180 && Y < 110 && m[Y * 180 + X]) px(g, X, Y, c); } };
  for (let y = 0; y < 110; y++) for (let x = 0; x < 180; x++) if (m[y * 180 + x]) px(g, x, y, 'S');
  const inset = new Uint8Array(m);
  for (let y = 1; y < 109; y++) for (let x = 1; x < 179; x++) if (m[y * 180 + x] && (!m[(y - 3) * 180 + x] || !m[(y + 3) * 180 + x] || !m[y * 180 + x - 3] || !m[y * 180 + x + 3])) inset[y * 180 + x] = 0;
  for (let y = 0; y < 110; y++) for (let x = 0; x < 180; x++) m[y * 180 + x] = inset[y * 180 + x];
  mput(0, 0, 180, wy + 22, 'C');
  mput(0, wy + 22, 180, 6, 'A');
  mput(0, wy + 28, 180, 90, 'N');
  for (let i = 0; i < 8; i++) mput(wx - 2 + i * 13, wy + 36 + (i % 3) * 13, 12, 6, 'B');
  for (let i = 0; i < 5; i++) mput(wx + 4 + i * 18, wy + 70, 14, 4, 'B');
  for (let i = 0; i < 26; i++) { const x = wx - 4 + i * 4, y = wy + 44 + Math.round(Math.sin(i / 3.2) * 14); mput(x, y, 5, 4, 'Z'); mput(x, y + 4, 4, 1, 'P'); }
  for (let i = 0; i < 9; i++) mput(wx + 62 + (i % 3) * 11, wy + 58 + Math.floor(i / 3) * 11, 9, 9, 'S');
  mput(wx + 58, wy + 56, 40, 2, 'A');
  for (let i = 0; i < 9; i++) mput(wx + 64 + (i % 3) * 11, wy + 60 + Math.floor(i / 3) * 11, 3, 3, 'A');
  rect(g, 8, 96, 104, 12, 'S'); rect(g, 8, 96, 104, 2, 'T');
  return g;
}
function dinnerTable(variant) {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'D'); rect(g, 0, 0, 180, 34, 'K');
  const guests = [
    { x: 6, shirt: 'T', hair: 'B', hat: 'G', beard: 1 },
    { x: 40, shirt: 'W', hair: null },
    { x: 74, shirt: 'G', hair: 'B', aino: 1 },
    { x: 108, shirt: 'W', hair: 'B', stripe: 1, glasses: 1 },
    { x: 142, shirt: 'G', hair: 'B', long: 1, jar: 1 }
  ];
  guests.forEach((p, i) => {
    if (variant === 'c' && (i === 1 || i === 3)) { rect(g, p.x + 4, 44, 22, 30, 'K'); rect(g, p.x + 6, 46, 18, 26, 'S'); return; }
    const x = p.x, y = 30 + (i % 2) * 3;
    rect(g, x + 2, y + 16, 26, 34, p.shirt); rect(g, x + 2, y + 16, 26, 2, 'K');
    if (p.stripe) for (let s = y + 20; s < y + 50; s += 4) rect(g, x + 2, s, 26, 1, 'P');
    ell(g, x + 15, y + 8, 9, 10, 'K'); ell(g, x + 15, y + 8, 8, 9, 'C');
    if (p.hair) { ellC(g, x + 15, y + 7, 8, 9, p.hair, y + 5); if (p.aino) for (let yy = y - 2; yy < y + 8; yy++) for (let xx = x + 6; xx < x + 25; xx++) if (g.d[yy * 180 + xx] === 'B' && (xx + yy) % 3 === 0) px(g, xx, yy, 'R'); }
    if (p.long) { rect(g, x + 6, y + 4, 3, 16, 'B'); rect(g, x + 21, y + 4, 3, 16, 'B'); }
    if (p.hat) { rect(g, x + 6, y - 1, 18, 3, p.hat); rect(g, x + 9, y - 5, 12, 5, p.hat); }
    if (p.beard) { ell(g, x + 15, y + 14, 7, 5, 'B'); }
    if (p.glasses) { rect(g, x + 10, y + 7, 4, 3, 'K'); rect(g, x + 16, y + 7, 4, 3, 'K'); rect(g, x + 14, y + 8, 2, 1, 'K'); }
    else { rect(g, x + 11, y + 7, 2, 2, 'K'); rect(g, x + 17, y + 7, 2, 2, 'K'); }
    const eating = variant === 'a' || (variant === 'b' && i !== 3);
    if (p.aino) { rect(g, x + 11, y + 12, 8, 3, 'K'); rect(g, x + 12, y + 13, 6, 1, 'W'); }
    else if (eating) { rect(g, x + 13, y + 12, 4, 2, 'B'); }
    else { rect(g, x + 12, y + 13, 6, 1, 'B'); }
    if (p.jar) { rect(g, x + 24, y + 2, 9, 12, 'K'); rect(g, x + 25, y + 3, 7, 10, 'V'); rect(g, x + 25, y + 1, 7, 2, 'B'); }
  });
  rect(g, 66, 44, 10, 24, 'K'); rect(g, 67, 45, 8, 22, 'G'); rect(g, 68, 39, 6, 6, 'K'); rect(g, 69, 40, 4, 5, 'G'); rect(g, 67, 52, 8, 6, 'W'); rect(g, 68, 54, 6, 2, 'R');
  rect(g, 86, 54, 24, 14, 'K'); rect(g, 88, 56, 20, 10, 'A'); rect(g, 90, 51, 16, 4, 'C'); rect(g, 96, 48, 4, 4, 'C');
  [22, 50, 122, 150].forEach(x => { rect(g, x, 58, 4, 10, 'W'); px(g, x + 1, 56, 'A'); px(g, x + 1, 55, 'C'); rect(g, x - 1, 66, 6, 2, 'S'); });
  rect(g, 0, 64, 180, 4, 'K'); rect(g, 0, 66, 180, 6, 'N'); rect(g, 0, 72, 180, 38, 'B'); rect(g, 0, 71, 180, 1, 'K');
  for (let y = 78; y < 110; y += 7) rect(g, 0, y, 180, 1, 'N');
  for (let i = 0; i < 5; i++) { const x = 12 + i * 34; if (variant === 'c' && i === 2) { ell(g, x + 10, 68, 8, 4, 'V'); rect(g, x + 2, 71, 17, 1, 'K'); px(g, x + 12, 66, 'R'); continue; } if (variant === 'c' && i === 3) { ell(g, x + 10, 68, 11, 4, 'K'); ell(g, x + 10, 67, 10, 3, 'W'); continue; } ell(g, x + 10, 68, 11, 4, 'K'); ell(g, x + 10, 67, 10, 3, 'W'); ell(g, x + 10, 66, 6, 2, 'N'); }
  if (variant === 'b') { rect(g, 116, 64, 11, 2, 'P'); rect(g, 118, 62, 2, 3, 'P'); rect(g, 122, 62, 2, 3, 'P'); }
  shimmer(g, 20, 20, 140, 14, 'E', 14, 77);
  return g;
}
function browserTab(price, tail) {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'K');
  rect(g, 8, 6, 164, 82, 'S'); rect(g, 10, 8, 160, 78, 'D');
  rect(g, 10, 8, 160, 10, 'S'); rect(g, 12, 9, 40, 8, 'D'); for (let i = 0; i < 6; i++) rect(g, 14 + i * 5, 12, 3, 2, 'T');
  rect(g, 56, 10, 60, 6, 'S');
  rect(g, 14, 22, 80, 3, 'T'); rect(g, 14, 28, 52, 3, 'T');
  num7(g, 16, 38, 15, 26, String(price), 'P', 3, 5);
  const w = String(price).length * 20;
  rect(g, 20 + w, 44, 5, 8, 'R'); rect(g, 21 + w, 40, 3, 5, 'R'); px(g, 22 + w, 38, 'R');
  rect(g, 14, 70, 60, 10, 'Z'); rect(g, 14, 70, 60, 1, 'P');
  for (let i = 0; i < 3; i++) rect(g, 110, 40 + i * 8, 50, 3, 'S');
  rect(g, 4, 88, 172, 18, 'S'); rect(g, 4, 88, 172, 2, 'T');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 13; c++) { rect(g, 10 + c * 13, 92 + r * 8, 10, 6, 'D'); rect(g, 10 + c * 13, 92 + r * 8, 10, 1, 'T'); }
  if (tail) { for (let i = 0; i < 30; i++) { const x = 20 + i * 4, y = 104 - Math.round(Math.sin(i / 5) * 6); rect(g, x, y, 4, 4, 'O'); if (i > 26) rect(g, x, y, 4, 4, 'K'); } }
  return g;
}
function standupLaptop(puke) {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'B'); rect(g, 0, 0, 180, 26, 'K');
  rect(g, 18, 6, 144, 60, 'S'); rect(g, 22, 10, 136, 52, 'D');
  for (let i = 0; i < 4; i++) {
    const x = 28 + (i % 2) * 66, y = 14 + Math.floor(i / 2) * 24;
    rect(g, x, y, 60, 20, 'S'); rect(g, x + 2, y + 2, 56, 16, 'T');
    ell(g, x + 30, y + 10, 6, 6, 'S');
    if (i === 1) { rect(g, x, y, 60, 20, 'Z'); rect(g, x + 2, y + 2, 56, 16, 'T'); ell(g, x + 30, y + 10, 6, 6, 'S'); }
  }
  rect(g, 10, 66, 160, 6, 'P'); rect(g, 6, 72, 168, 32, 'S'); rect(g, 6, 72, 168, 2, 'P');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) {
    const x = 12 + c * 11, y = 76 + r * 7;
    rect(g, x, y, 9, 5, 'T'); rect(g, x, y, 9, 1, 'P'); rect(g, x, y + 4, 9, 1, 'D');
  }
  rect(g, 46, 104, 60, 4, 'T');
  if (puke) { ell(g, 88, 88, 7, 4, 'V'); rect(g, 82, 91, 13, 1, 'K'); px(g, 90, 86, 'R'); }
  rect(g, 0, 104, 180, 6, 'B');
  return g;
}
function calendar() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'S');
  rect(g, 0, 0, 180, 12, 'D');
  for (let c = 0; c < 7; c++) {
    const x = 4 + c * 25;
    rect(g, x, 2, 21, 8, 'T'); rect(g, x + 4, 5, 12, 2, 'P');
    rect(g, x, 14, 21, 92, 'D');
    for (let y = 20; y < 106; y += 12) rect(g, x, y, 21, 1, 'S');
    const bh = 14, by = 34 + c * 2;
    rect(g, x, by, 21, bh, 'Z'); rect(g, x, by, 21, 1, 'P');
    const tw = 5 + c * 4;
    rect(g, x + 2, by + 4, Math.min(tw, 17), 2, 'W');
    if (tw > 17) { rect(g, x + 2, by + 8, Math.min(tw - 15, 17), 2, 'W'); }
    if (tw > 31) { rect(g, x + 2, by + bh, 21, 2, 'W'); rect(g, x + 2, by + bh + 4, 14, 2, 'W'); }
  }
  return g;
}
function phoneCase(kind) {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'D');
  rect(g, 40, 60, 40, 50, 'B'); rect(g, 42, 58, 36, 8, 'N');
  for (let i = 0; i < 4; i++) { rect(g, 44 + i * 9, 40, 7, 22, 'N'); rect(g, 44 + i * 9, 40, 7, 2, 'C'); rect(g, 44 + i * 9, 61, 7, 1, 'B'); }
  const body = kind === 'temu' ? 'A' : kind === 'hemp' ? 'C' : 'S';
  rect(g, 62, 12, 62, 90, 'K'); rect(g, 64, 14, 58, 86, body);
  rect(g, 68, 20, 50, 70, 'K'); rect(g, 69, 21, 48, 68, kind === 'crack' ? 'S' : 'P');
  rect(g, 69, 21, 48, 8, 'T'); for (let i = 0; i < 4; i++) rect(g, 72, 34 + i * 12, 36 - i * 6, 4, 'T');
  if (kind === 'tape' || kind === 'crack') { rect(g, 60, 30, 66, 6, 'P'); rect(g, 60, 74, 66, 6, 'P'); rect(g, 68, 32, 20, 2, 'W'); rect(g, 90, 76, 20, 2, 'W'); }
  if (kind === 'crack') { let x = 72, y = 24; for (let i = 0; i < 34; i++) { px(g, x, y, 'K'); px(g, x + 1, y, 'K'); x += 1 + (i % 2); y += 2; } rect(g, 84, 44, 10, 1, 'K'); rect(g, 96, 60, 12, 1, 'K'); rect(g, 78, 68, 8, 1, 'K'); }
  if (kind === 'temu') {
    rect(g, 74, 12, 36, 10, 'A'); rect(g, 76, 4, 8, 10, 'A'); rect(g, 100, 4, 8, 10, 'A');
    rect(g, 78, 6, 4, 6, 'M'); rect(g, 102, 6, 4, 6, 'M');
    rect(g, 80, 92, 6, 6, 'K'); rect(g, 98, 92, 6, 6, 'K'); rect(g, 86, 96, 12, 3, 'M');
    rect(g, 64, 90, 58, 10, 'A');
  }
  if (kind === 'hemp') { for (let y = 14; y < 100; y += 3) rect(g, 64, y, 58, 1, 'N'); rect(g, 104, 22, 10, 10, 'K'); rect(g, 106, 24, 6, 6, 'D'); rect(g, 102, 20, 2, 14, 'C'); }
  else { rect(g, 106, 24, 8, 8, 'K'); rect(g, 108, 26, 4, 4, 'D'); }
  return g;
}
function stairwell() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'S');
  rect(g, 0, 0, 180, 8, 'P'); rect(g, 40, 0, 34, 8, 'W'); rect(g, 120, 0, 34, 8, 'W');
  rect(g, 0, 8, 180, 44, 'T');
  for (let i = 0; i < 6; i++) { rect(g, 0, 52 + i * 6, 60 - i * 8, 6, 'P'); rect(g, 0, 52 + i * 6, 60 - i * 8, 1, 'W'); }
  for (let i = 0; i < 6; i++) { rect(g, 120 + i * 8, 52 + i * 6, 60 - i * 8, 6, 'P'); rect(g, 120 + i * 8, 52 + i * 6, 60 - i * 8, 1, 'W'); }
  rect(g, 56, 46, 68, 8, 'P'); rect(g, 56, 46, 68, 1, 'W'); rect(g, 56, 54, 68, 56, 'T');
  for (let i = 0; i < 5; i++) rect(g, 58 + i * 15, 56, 2, 20, 'S');
  rect(g, 40, 38, 100, 3, 'S'); rect(g, 40, 41, 3, 20, 'S'); rect(g, 137, 41, 3, 20, 'S');
  rect(g, 56, 54, 68, 3, 'S');
  const x = 82;
  ell(g, x + 8, 12, 8, 9, 'K'); ell(g, x + 8, 12, 7, 8, 'H'); px(g, x + 5, 15, 'N'); px(g, x + 11, 15, 'N');
  rect(g, x + 5, 20, 7, 3, 'N');
  rect(g, x + 1, 22, 15, 24, 'K'); rect(g, x + 2, 23, 13, 22, 'P');
  rect(g, x + 2, 23, 13, 2, 'S');
  rect(g, x - 3, 25, 4, 13, 'K'); rect(g, x - 2, 26, 3, 11, 'P');
  rect(g, x + 16, 25, 4, 13, 'K'); rect(g, x + 17, 26, 3, 11, 'P');
  rect(g, x + 6, 24, 2, 11, 'M'); rect(g, x + 9, 24, 2, 11, 'M'); rect(g, x + 6, 35, 5, 4, 'W');
  rect(g, x + 12, 20, 5, 5, 'K'); rect(g, x + 13, 21, 3, 3, 'E'); px(g, x + 14, 22, 'A');
  rect(g, x + 1, 46, 15, 12, 'K'); rect(g, x + 2, 47, 13, 11, 'S');
  return g;
}
function toriListings() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'D');
  rect(g, 0, 0, 180, 14, 'S'); rect(g, 6, 4, 40, 6, 'P'); rect(g, 152, 4, 22, 6, 'T');
  const rows = [
    ['console', '80'], ['phone', '40'], ['espresso', '150'], ['crock', '25']
  ];
  rows.forEach((r, i) => {
    const y = 18 + i * 23;
    rect(g, 4, y, 172, 21, 'S'); rect(g, 4, y, 172, 1, 'T');
    rect(g, 7, y + 2, 17, 17, 'K'); rect(g, 8, y + 3, 15, 15, 'D');
    if (r[0] === 'console') { rect(g, 10, y + 8, 11, 6, 'S'); rect(g, 11, y + 9, 9, 4, 'T'); px(g, 19, y + 10, 'G'); }
    if (r[0] === 'phone') { rect(g, 13, y + 5, 6, 12, 'S'); rect(g, 14, y + 6, 4, 9, 'P'); }
    if (r[0] === 'espresso') { rect(g, 10, y + 5, 11, 9, 'P'); rect(g, 12, y + 14, 7, 3, 'S'); rect(g, 13, y + 9, 5, 4, 'K'); }
    if (r[0] === 'crock') { rect(g, 11, y + 6, 9, 11, 'B'); rect(g, 10, y + 5, 11, 2, 'N'); }
    rect(g, 28, y + 5, 60, 3, 'P'); rect(g, 28, y + 11, 40, 2, 'T');
    text(g, 146, y + 7, r[1], 'A');
    rect(g, 141, y + 7, 3, 5, 'A');
  });
  return g;
}
function bathroom() {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'K');
  rect(g, 0, 0, 180, 74, 'D'); rect(g, 0, 74, 180, 36, 'K');
  rect(g, 0, 73, 180, 1, 'S');
  rect(g, 26, 12, 44, 34, 'S'); rect(g, 28, 14, 40, 30, 'K');
  rect(g, 30, 52, 36, 14, 'S'); rect(g, 32, 54, 32, 10, 'D'); rect(g, 46, 46, 3, 7, 'S'); rect(g, 44, 45, 8, 2, 'S');
  rect(g, 120, 0, 4, 96, 'S');
  rect(g, 124, 0, 12, 96, 'W'); rect(g, 136, 0, 3, 96, 'C');
  rect(g, 139, 0, 41, 96, 'D'); rect(g, 139, 0, 3, 96, 'S');
  for (let i = 0; i < 26; i++) px(g, 124 + Math.floor(rnd(i) * 12), 96 + Math.floor(rnd(i + 9) * 12), 'P');
  rect(g, 124, 96, 14, 4, 'P'); rect(g, 126, 100, 10, 2, 'S');
  return g;
}
function ceiling(stain) {
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'P');
  rect(g, 0, 0, 180, 12, 'T'); rect(g, 0, 98, 180, 12, 'T');
  rect(g, 0, 0, 12, 110, 'T'); rect(g, 168, 0, 12, 110, 'T');
  rect(g, 0, 12, 180, 1, 'S'); rect(g, 0, 97, 180, 1, 'S'); rect(g, 12, 0, 1, 110, 'S'); rect(g, 167, 0, 1, 110, 'S');
  ell(g, 78, 50, 16, 14, 'S'); ell(g, 78, 50, 14, 12, 'W'); ell(g, 78, 50, 7, 6, 'C');
  ell(g, 78, 50, 16, 14, 'S'); ell(g, 78, 49, 15, 13, 'W'); ell(g, 78, 49, 6, 5, 'C');
  for (let y = 20; y < 96; y += 9) rect(g, 14, y, 152, 1, 'W');
  if (stain) { ell(g, 132, 26, 11, 8, 'V'); ell(g, 130, 25, 8, 6, 'V'); rect(g, 122, 33, 20, 1, 'K'); px(g, 134, 22, 'R'); px(g, 142, 30, 'V'); }
  return g;
}

/* ---------- v3 · animation ---------- */
function copyG(g) { const n = G(g.w, g.h); n.d = g.d.slice(); return n; }
function shiftBand(g, y0, y1, dy) {
  const n = copyG(g);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < g.w; x++) n.d[y * g.w + x] = '.';
  for (let y = y0; y <= y1; y++) for (let x = 0; x < g.w; x++) { const c = g.d[y * g.w + x]; if (c !== '.') { const ny = y + dy; if (ny >= 0 && ny < g.h) n.d[ny * g.w + x] = c; } }
  return n;
}
function shiftAll(g, dx) {
  const n = G(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const c = g.d[y * g.w + x]; if (c !== '.' && x + dx >= 0 && x + dx < g.w) n.d[y * g.w + x + dx] = c; }
  return n;
}
function dither(g, keep) { const n = copyG(g); for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if ((x * 3 + y * 5) % 4 >= keep) n.d[y * g.w + x] = '.'; return n; }
function catSide(frame, pose) {
  const g = G(24, 24);
  const bob = pose === 'walk' ? [0, 1, 0, 1][frame] : 0;
  catProfile(g, 2, 1 + bob, 'O', 'L');
  if (pose === 'walk') {
    const legs = [[[4, 0], [9, 2], [13, 0], [17, 2]], [[5, 2], [10, 0], [14, 2], [18, 0]], [[6, 1], [11, 1], [15, 1], [19, 1]], [[4, 2], [9, 0], [13, 2], [17, 0]]][frame];
    rect(g, 4, 21 + bob, 16, 2, '.');
    legs.forEach(([x, d]) => { rect(g, x, 19 + bob, 2, 3 + d, 'K'); rect(g, x, 19 + bob, 2, 2 + d, 'O'); });
  }
  return g;
}
function kinuVomitFrame(n) {
  let g = fromRows(KINU.idle, 24, 24);
  if (n === 0) { g = shiftBand(g, 0, 12, 1); rect(g, 10, 11, 4, 2, 'K'); }
  if (n === 1) { g = shiftBand(g, 0, 12, 3); rect(g, 9, 13, 6, 3, 'K'); rect(g, 10, 14, 4, 2, 'D'); px(g, 16, 8, 'V'); }
  if (n === 2) { g = shiftBand(g, 0, 12, 2); rect(g, 9, 12, 6, 4, 'K'); rect(g, 10, 13, 4, 3, 'V'); ell(g, 12, 21, 6, 3, 'V'); rect(g, 7, 23, 11, 1, 'K'); px(g, 13, 19, 'R'); }
  return g;
}


/* ---------- Aino (from the sheet's dinner-guest section) ---------- */
const AINO_HEAD = ['........................', '......BBBBBBBBBBB.......', '......BBBBBBBBBBB.......', '......BBBBBBBBBBB.......',
      '......BCCCCCCCCCB.......', '......BCKCCCCCKCB.......', '......BCKCCCCCKCB.......', '......BCCCCNCCCCB.......',
      '......BCCCRRRCCCB.......', '......BCCCCCCCCCB.......', '......BNCCCCCCCNB.......', '.......NCCCCCCCN........', '........NCCCCN..........'];
    const AINO_CF = { skin: ['C', 'N', 'B'], hair: 'B', hairMix: 'R', hairStyle: 'bob', glasses: 0, shirt: 'G' };
    const ainoStand = () => { const g = sprite(AINO_HEAD, { map: { '1': 'G', '2': 'Z', '3': 'S', '4': 'S', '5': 'K' } }); for (let y = 1; y < 4; y++) for (let x = 6; x < 17; x++) if (g.d[y * 24 + x] === 'B' && (x + y) % 3 === 0) g.d[y * 24 + x] = 'R'; return g; };
    
/* ---------- game-side additions ---------- */
const PAL20 = HEX;
function gridToCanvas(g) {
  const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
  const x = c.getContext('2d');
  for (let y = 0; y < g.h; y++) for (let i = 0; i < g.w; i++) {
    const ch = g.d[y * g.w + i];
    if (ch !== '.') { x.fillStyle = HEX[ch] || '#ff00ff'; x.fillRect(i, y, 1, 1); }
  }
  return c;
}
function registan() {   // the prologue photograph: the Uzbekistan card, empty
  const g = uzbek('b');
  clear(g, 0, 66, 180, 44);
  rect(g, 0, 60, 180, 8, 'N'); rect(g, 0, 66, 180, 44, 'B');
  rect(g, 0, 66, 180, 2, 'K');
  for (let y = 72; y < 110; y += 6) rect(g, 0, y, 180, 1, 'N');
  rect(g, 14, 44, 20, 24, 'Z'); rect(g, 146, 44, 20, 24, 'Z');
  for (let i = 0; i < 30; i++) px(g, Math.floor(rnd(i + 3) * 180), 20 + Math.floor(rnd(i + 60) * 70), 'C');
  return g;
}
function guesthouseNight() {   // 3.6 base: dark room, 04:00, nothing on the floor
  const g = G(180, 110);
  rect(g, 0, 0, 180, 110, 'K');
  rect(g, 0, 0, 180, 80, 'H'); rect(g, 0, 80, 180, 30, 'K');
  rect(g, 112, 10, 50, 44, 'D'); rect(g, 114, 12, 46, 40, 'S');
  rect(g, 114, 12, 46, 14, 'D'); rect(g, 136, 12, 2, 40, 'K');
  for (let i = 0; i < 14; i++) px(g, 116 + (i * 7) % 42, 14 + (i * 5) % 10, 'P');
  rect(g, 10, 62, 76, 30, 'D'); rect(g, 12, 64, 72, 12, 'S');
  rect(g, 12, 76, 72, 14, 'D'); rect(g, 8, 60, 4, 34, 'K'); rect(g, 86, 60, 4, 34, 'K');
  rect(g, 150, 4, 26, 12, 'K'); text(g, 153, 7, '0400', 'S');
  return g;
}

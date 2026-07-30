/* Viewer glue for art/character-sheets.html.
   All generators live in ../js/art.js (ported verbatim from the Claude Design
   project "Zheng Character & World Sheets", v2). This file only assembles the
   sheet sections the viewer renders. */

function buildSheets() {
  const S = [], mk = (label, g, spec) => ({ label, g, spec: spec || (g.w + '×' + g.h) });
  const Pg = (fn, w, h) => { const g = G(w, h); fn(g); return g; };

  /* 01 · ZHENG */
  const zSpr = OUTFITS.map(o => { const g = sprite(ZHENG_HEAD, o[1] || o); sweat(g, (o[1] || o).bare ? 2 : 1); return mk(o[0] || 'outfit', g); });
  S.push({
    title: '01 · ZHENG', note: 'The cowlick and the glasses glint carry the silhouette.',
    groups: [
      { label: 'GAMEPLAY SPRITES', spec: '24×32 · 5 outfits', cells: zSpr },
      {
        label: 'PORTRAITS', spec: '48×48 · 8 expressions',
        cells: Object.keys(EX).map(k => mk(k, portrait(ZHENG_CF, EX[k])))
      },
      { label: 'THE PHONE', spec: '16×16', cells: [mk('taped case', phoneVariant('tape')), mk('Temu cat case', phoneVariant('temu')), mk('Day 5 · cracked', phoneVariant('crack'))] },
    ]
  });

  /* 02 · KINU */
  S.push({
    title: '02 · KINU', note: 'The ears are the whole silhouette. Crouch is the tell.',
    groups: [
      { label: 'POSES', spec: '24×24', cells: Object.keys(KINU).map(k => mk(k, fromRows(KINU[k], 24, 24))) },
      { label: 'PORTRAITS', spec: '48×48', cells: [['innocent', 'inn'], ['about-to', 'about'], ['mid-vomit', 'mid'], ['smug', 'smug'], ['salmon', 'salmon']].map(k => mk(k[0], kinuPortrait(k[1]))) },
      { label: 'VOMIT DECALS', spec: '16×16 · 5 sizes', cells: [1, 2, 3, 4, 5].map(n => mk('decal 0' + n, vomit(n))) },
    ]
  });

  /* 03-05 · the household and the girls */
  S.push({
    title: '03 · JULIUS, SANDAL, SUSAN & JOY', note: 'He is not the villain. Julius is not a vegetarian either — his friends are.',
    groups: [
      {
        label: 'JULIUS PORTRAITS', spec: '48×48',
        cells: [['warm', { brow: 'up', eye: 'arc', mouth: 'smile' }], ['disappointed', { brow: 'sad', eye: 'open', mouth: 'small' }],
          ['explaining', { brow: 'up', eye: 'wide', mouth: 'talk' }], ['hurt', { brow: 'sad', eye: 'down', mouth: 'frown', tear: 1 }],
          ['curious', { brow: 'up', eye: 'open', mouth: 'line' }], ['smug-composting', { brow: 'flat', eye: 'closed', mouth: 'smile' }]]
          .map(e => mk(e[0], portrait(JULIUS_CF, e[1])))
      },
      {
        label: 'SANDAL PORTRAITS', spec: '48×48 · cool greys only',
        cells: [['neutral-menace', { brow: 'flat', eye: 'open', mouth: 'flat' }], ['fake-warm', { brow: 'up', eye: 'open', mouth: 'grin' }],
          ['disappointed', { brow: 'down', eye: 'down', mouth: 'frown' }]]
          .map(e => mk(e[0], portrait(SANDAL_CF, e[1], { cy: 24, rx: 15, ry: 17 })))
      },
      {
        label: 'SUSAN + JOY', spec: '48×48',
        cells: [mk('Susan · inviting', portrait(SUSAN_CF, { brow: 'up', eye: 'open', mouth: 'grin' })),
          mk('Susan · wounded-by-your-no', portrait(SUSAN_CF, { brow: 'sad', eye: 'wide', mouth: 'frown' })),
          mk('Joy · delighted', portrait(JOY_CF, { brow: 'up', eye: 'arc', mouth: 'grin' })),
          mk('Joy · emotional', portrait(JOY_CF, { brow: 'sad', eye: 'down', mouth: 'frown', tear: 1 }))]
      },
    ]
  });

  /* 06 · guests */
  S.push({
    title: '06 · THE DINNER GUESTS', note: 'A matched set. They arrived together, in one car, which they will mention.',
    groups: [{
      label: 'PORTRAITS', spec: '48×48 · 4', cells: [
        mk('AAPO', portrait({ skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'bucket', hat: 'G', glasses: 0, shirt: 'T', beard: 1, beardColor: 'B' }, { brow: 'up', eye: 'open', mouth: 'talk' })),
        mk('SUN', portrait({ skin: ['C', 'N', 'B'], hair: 'H', hairStyle: 'bald', glasses: 0, shirt: 'W' }, { brow: 'down', eye: 'down', mouth: 'small' })),
        mk('RASMUS', portrait({ skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'blond', glasses: 1, shirt: 'W', stripes: 1 }, { brow: 'flat', eye: 'open', mouth: 'line' })),
        mk('MIRO', portrait({ skin: ['C', 'N', 'B'], hair: 'B', hairStyle: 'long', glasses: 0, shirt: 'G' }, { brow: 'up', eye: 'arc', mouth: 'grin' })),
      ]
    }]
  });

  /* 07-12 · the world */
  S.push({
    title: '07 · ENVIRONMENTS', note: 'HOT and COOL are separate art, not runtime tints. The Registan shares the exact palette and light of the Uzbekistan card, on purpose.',
    groups: [
      {
        label: 'CARDS', spec: '180×110', cells: [
          mk('apartment · HOT', apartment(true)), mk('apartment · COOL', apartment(false)),
          mk('the window · HOT', windowCard(true)), mk('the window · COOL', windowCard(false)),
          mk('the office', office()), mk('the kitchen', kitchen()), mk('the bar', bar()),
          mk("Anna's flat · never hot", annaFlat()), mk('the vet', vet()),
          mk('booking · active', booking(true)), mk('booking · greyed', booking(false)),
          mk('THE REGISTAN · prologue', registan()),
          mk('Uzbekistan · both seats taken', uzbek('a')), mk('Uzbekistan · nobody there', uzbek('b')),
          mk('Uzbekistan · undeserved confetti', uzbek('c')), mk('Helsinki gate · dawn', airport()),
        ]
      },
      {
        label: 'APARTMENT OVERLAYS', spec: '180×110 · composed live in-game', cells: [
          mk('+ bins', withOv(apartment(true), ovBins())),
          mk('+ stains · never mentioned', withOv(apartment(true), ovStains())),
          mk('+ Julius absent', withOv(apartment(false), ovJulius(false))),
          mk('+ the fan', withOv(apartment(true), ovFan('left'))),
        ]
      },
    ]
  });

  /* 13 · ANNA */
  const annaOutfit = { map: { '1': 'K', '2': 'D', '3': 'K', '4': 'K', '5': 'K' } };
  const annaBase = () => { const g = sprite(ANNA_HEAD, annaOutfit); rect(g, 5, 2, 2, 18, 'B'); rect(g, 15, 2, 2, 18, 'B'); return g; };
  S.push({
    title: '13 · ANNA', note: 'Three floors down. Never wrong, never useful, never hurried. Black every single day.',
    groups: [
      { label: 'SPRITE', spec: '24×32', cells: [mk('standing', annaBase())] },
      {
        label: 'PORTRAITS', spec: '48×48', cells: [
          ['neutral and level', { brow: 'flat', eye: 'open', mouth: 'line' }], ['mid-reading', { brow: 'flat', eye: 'down', mouth: 'small' }],
          ['faintly amused', { brow: 'up', eye: 'open', mouth: 'smile' }], ['genuinely warm', { brow: 'up', eye: 'arc', mouth: 'grin' }],
        ].map(e => mk(e[0], portrait(ANNA_CF, e[1])))
      },
      {
        label: 'TAROT', spec: '24×40 · two-colour woodcut',
        cells: [['tower', 'The Tower'], ['cups', 'Three of Cups'], ['hierophant', 'The Hierophant'], ['pentacles', 'Eight of Pentacles'],
          ['devil', 'The Devil'], ['wheel', 'Wheel of Fortune'], ['fool', 'The Fool'], ['back', 'card back']].map(t => mk(t[1], tarot(t[0])))
      },
    ]
  });

  /* 14-15 · MATT and the co-op game */
  const mattOutfit = { map: { '1': 'M', '2': 'D', '3': 'A', '4': 'N', '5': 'W' } };
  S.push({
    title: '14 · MATT & THE CO-OP GAME', note: 'The only thing in the entire game that is MATT_BLUE. His suggestion is the healthiest one anybody makes.',
    groups: [
      { label: 'SPRITE', spec: '24×32', cells: [mk('standing', sprite(MATT_HEAD, mattOutfit))] },
      {
        label: 'PORTRAITS', spec: '48×48', cells: [
          ['delighted', { brow: 'up', eye: 'arc', mouth: 'grin' }], ['deeply focused', { brow: 'down', eye: 'wide', mouth: 'line' }],
          ['mock-outraged', { brow: 'up', eye: 'wide', mouth: 'open' }], ['quietly disappointed', { brow: 'sad', eye: 'down', mouth: 'small' }],
        ].map(e => mk(e[0], portrait(MATT_CF, e[1], { rx: 13, ry: 14 })))
      },
      {
        label: 'THE GAME INSIDE THE GAME', spec: 'deliberately ten years cruder', cells: [
          ...MG.run.map((r, i) => mk('run f' + (i + 1), fromRows(r, 16, 16, { K: 'A' }))),
          mk('jump', fromRows(MG.jump, 16, 16, { K: 'A' })),
          mk('blob', mgEnemy('blob', 0)), mk('spike', mgEnemy('spike', 0)), mk('flyer', mgEnemy('flyer', 0)),
          mk('ground tile', mgGround()), mk('parallax strip', mgBack()),
          mk('JUMP', mgButton('JUMP')), mk('SHOOT', mgButton('SHOOT')),
        ]
      },
    ]
  });

  /* 16 · UI kit */
  S.push({
    title: '16 · UI KIT', note: "Everything that sits on top of the 180×320 screen. Sandal's job title goes in the header bar — it is built to overflow.",
    groups: [
      { label: 'FRAMES', spec: 'HUD · box · card', cells: [mk('HUD strip', hud()), mk('dialogue box', dialogueBox()), mk('day title card', dayCard())] },
      {
        label: 'METERS + CONTROLS', spec: '', cells: [
          ...['case', 'heart', 'pair', 'brain', 'cat'].map(k => mk(k, meterIcon(k))),
          mk('choice button', choiceButton(false)), mk('pressed', choiceButton(true)),
          mk('ticker', ticker()), mk('mute on', mute(true)), mk('mute off', mute(false)),
          mk('gallery · found', galleryCell(true)), mk('gallery · locked', galleryCell(false)),
        ]
      },
      { label: 'KITCHEN MINIGAME', spec: '16×16 shelf', cells: Object.keys(ING).map(k => mk(k, ingredient(k))).concat([mk('the pan', panTop()), mk('TASTE', meterBar('TASTE', false)), mk('MEAT', meterBar('MEAT', true))]) },
    ]
  });

  /* 17 · the 32 endings */
  S.push({
    title: '17 · THE 32 ENDINGS', note: 'Environment bases with the foreground swapped. Thirty-two illustrations from about a dozen rooms.',
    groups: [{ label: 'ILLUSTRATIONS', spec: '180×110', cells: END_ART.map(e => mk(e[0] + ' · ' + e[1], e[2]())) }]
  });

  return S;
}

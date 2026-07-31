/* Content is data. Logic never contains a line of dialogue (spec 2.8).
   Transcribed from SPEC.md v2. Sections 2.13-2.20 override v1 on every conflict.
   JULIUS IS NOT A VEGETARIAN. His friends are. If a line makes him sound
   vegetarian, it is wrong. */

/* economy v3 (spec 3.3). do not adjust without re-running the simulation. */
const ELECTRICITY_BASE = 140, CAR_LOAN = 225;

const SANDAL_TITLES = [null,
  'Team Lead', 'Senior Team Lead', 'Team Lead, Enablement', 'Head of Enablement',
  'Head of Enablement & Delivery', 'Head of Enablement, Delivery & Velocity',
  'Interim Head of Enablement & Velocity (Acting)'];

const MEETING_NAMES = [null,
  'Quick Sync', 'Quick Sync (Final) (v3) (ACTUAL FINAL)', 'Quick Sync / Alignment (30m) (was 15m)',
  'Quick Sync (Recurring) (Do Not Decline)', 'Quick Sync (Optional) (Attendance Tracked)',
  'Quick Sync (Weekend Catch-Up) (Very Optional)', 'Quick Sync (Mon 07:45) (Sorry!)'];

/* Anna's daily card: a real hint, useless in the moment, obvious in hindsight */
const TAROT_DAYS = [null,
  ['tower', 'THE TOWER', "Something you built is going to come apart. It's fine. It was badly built."],
  ['cups', 'THREE OF CUPS', "You are going to be invited somewhere. Go, or don't. Both are expensive."],
  ['hierophant', 'THE HIEROPHANT', 'A man will be right today. At length. In your direction.'],
  ['pentacles', 'EIGHT OF PENTACLES', 'Work will offer you something. It is not a gift.'],
  ['devil', 'THE DEVIL', 'You will want something you have decided not to want.'],
  ['wheel', 'WHEEL OF FORTUNE', 'Money moves today. It does not come back.'],
  ['fool', 'THE FOOL', 'Go.'],
];
/* the full deck Anna works from: three offered a day, a card read once is never read again */
const TAROT_POOL = [
  ...TAROT_DAYS.slice(1),
  ['moon', 'THE MOON', 'You are being lied to by something small and domestic.'],
  ['star', 'THE STAR', 'Help will be offered. Accepting it is the expensive part.'],
  ['hermit', 'THE HERMIT', 'You will be alone today. Decide whether that is a punishment.'],
  ['lovers', 'THE LOVERS', 'A choice between two things you want. You have already chosen. Stop pretending.'],
  ['swords', 'TWO OF SWORDS', 'You will avoid a decision today. The decision will not avoid you.'],
  ['temperance', 'TEMPERANCE', 'Moderation is coming. Not by choice.'],
  ['sun', 'THE SUN', 'One good hour today. You will not notice it until it is over.'],
  ['hanged', 'THE HANGED MAN', 'Nothing moves today. That is somehow progress.'],
  ['death', 'DEATH', 'An ending. Not the big kind. The kind that makes room.'],
  ['magician', 'THE MAGICIAN', 'You have everything you need. That is not the same as enough.'],
  ['priestess', 'THE HIGH PRIESTESS', 'You already know. You have known for some time.'],
  ['empress', 'THE EMPRESS', 'Something in your care is thriving. It is not you.'],
  ['justice', 'JUSTICE', 'The scales balance today. Not in your favour. Balanced, though.'],
  ['strength', 'STRENGTH', 'You are stronger than the thing you are carrying. You will carry it anyway.'],
  ['chariot', 'THE CHARIOT', 'You will be moved today. You will not be driving.'],
  ['world', 'THE WORLD', 'The far away place is real. It stays real whether you go or not.'],
  ['ace', 'ACE OF CUPS', 'Something overflows today. It was full for longer than you knew.'],
];

const N = (text) => ({ t: 'say', who: 'NARRATOR', text });
const Z = (text, face) => ({ t: 'say', who: 'ZHENG', text, face });
const SAY = (who, text, face) => ({ t: 'say', who, text, face });
const SFXB = (id, pitch) => ({ t: 'sfx', id, pitch });

/* Kinu's daily vomit + the clean-up. Every day. Non-negotiable.
   Unless she lives at Anna's now, in which case the 15 seconds come back
   and it feels awful. */
/* where Kinu's week actually happens: decal, narration and clean-up all agree */
const VOMIT_ART = [null, 'laptop_puke', 'boots_ruined', 'kitchen', 'apartment_hot', 'dinner', 'apartment_hot', 'ceiling'];
const VOMIT_DAY = (day, size, lines) => [{ t: 'if', cond: s => s.kinu >= 1, then: [
  { t: 'art', img: VOMIT_ART[day] },
  SFXB('S_VOMIT_WARN'), { t: 'pause', s: 0.6 },
  SFXB('S_VOMIT', 1 + (day - 1) * 0.18), { t: 'decal', size: size || Math.min(5, day) },
  ...(lines || []),
  { t: 'game', id: 'CLEAN_UP' },
] }];

const KINU_GONE_CHECK = () => ({ t: 'if', cond: s => s.kinu === 0 && !s.f.kinuLeft, then: [
  { t: 'do', fn: s => { s.f.kinuLeft = true; s.f.kinuLeftDay = s.day; } },
  N("At some point in the evening, without ceremony, Kinu moves to Anna's."),
  N('Nobody sees her decide. Nobody ever sees her decide.'),
] });

const DAYS = {};

/* ================= DAY 0: THE PROMISE (prologue, run one only) ================= */
DAYS[0] = [
  { t: 'card', title: 'SUNDAY', sub: 'ONE WEEK EARLIER' },
  { t: 'art', img: 'bar', music: 'M_NIGHT' },
  N('There is a place Zheng has thought about every day since March.'),
  N('It arrived as a forty-second reel. Wedged, algorithmically, between two videos of shirtless men he does not follow.'),
  { t: 'art', img: 'registan', music: 'M_TITLE' },
  { t: 'hold', s: 3 },
  { t: 'music', id: null },
  N('Domes. A tiled square at golden hour. Bread the size of a wheel.'),
  N('He watched the domes eleven times. He watched the other videos a normal amount of times.'),
  { t: 'art', img: 'bar', music: 'M_NIGHT' },
  SAY('SUSAN', 'right'),
  SAY('SUSAN', "so we're doing it"),
  Z('Doing what.'),
  SAY('SUSAN', "don't"),
  SAY('JOY', "she's got a spreadsheet"),
  SAY('SUSAN', 'I HAVE A SPREADSHEET'),
  N('Nine tabs. Eight of them are places she wants to stand in. One of them is the price.'),
  SFXB('S_SLACK_PING'),
  N('TASHKENT · €882'),
  SAY('SUSAN', 'eight eighty-two. each. today.'),
  SAY('SUSAN', 'it goes up every day. i checked every day for eleven days. it goes up every single day.'),
  Z('I know.'),
  SAY('SUSAN', "you don't know. you've had that tab open since march and you have never once pressed anything."),
  SAY('JOY', 'zheng'),
  SAY('JOY', 'zheng look at me'),
  SAY('JOY', "we're not booking ours until you book yours"),
  Z('...'),
  SAY('SUSAN', "that's not a threat"),
  SAY('JOY', "it's a bit of a threat"),
  Z("There's the car loan. And the electricity. And Kinu's teeth are..."),
  SAY('SUSAN', 'we know'),
  SAY('JOY', 'we KNOW'),
  SAY('SUSAN', "that's why it's a week. one week. sunday to sunday. you get it together, you press the button, we press ours."),
  { t: 'pause', s: 1 },
  { t: 'music', id: null },
  SAY('JOY', "i haven't left my office in months.", 'emotional'),   // the load-bearing line. no music.
  { t: 'pause', s: 1.2 },
  N('Zheng looks at the number until it stops being a number.'),
  Z('Okay.'),
  SAY('SUSAN', 'no'),
  SAY('SUSAN', 'say it properly'),
  Z('...'),
  SAY('SUSAN', 'zheng'),
  Z("I'll book the tickets. By Sunday."),
  SAY('JOY', 'SAY IT LIKE YOU MEAN IT'),
  Z("I'll book the tickets by Sunday."),
  { t: 'do', fn: s => { s.promised = true; } },
  SFXB('S_CHOICE_CONFIRM'),
  { t: 'pause', s: 1 },
  SAY('JOY', 'okay. okay good.'),
  SAY('JOY', 'so anyway aleksi liked my story'),
  Z('Mm.'),   // the first "mm". he does this six times. on Sunday, she says the kind thing.
  { t: 'terms' },
  N('On Monday morning the price is nine hundred and twenty euros.'),
  N('He has six hundred and fifty.'),
  SFXB('S_PRICE_UP'),
  { t: 'pause', s: 1 },
  N('The price goes up every day. Nobody in this game will mention that again.'),
];

CHOICES = {};

/* daily tarot: once, free, optional, one tap. never wrong, never useful. */
CHOICES.TAROT = {
  noAuto: true,   // the ritual always asks, even on the bad days
  prompt: [],
  options: [
    { label: 'Ask Anna to read the cards', apply: s => {
        s.tarotCount++; bump('sanity', 1);
        s.tarotUsed = s.tarotUsed || [];
        const unused = TAROT_POOL.filter(c => !s.tarotUsed.includes(c[0]));
        const offer = []; let seed = s.day * 31 + s.tarotCount * 7 + 3;
        for (let i = 0; i < 3 && unused.length; i++) { seed = (seed * 13 + 17) % unused.length; offer.push(unused.splice(seed, 1)[0]); }
        s._tarotOffer = offer;
      },
      after: [
        { t: 'art', img: 'anna' },
        SAY('ANNA', 'Sit.', 'neutral'),
        { t: 'say', who: 'NARRATOR', dyn: s => [
          'She lays three cards face down. She does not look at them. She has never needed to look at them.',
          'Three cards, face down. The coffee is already poured. She knew he was coming.',
          'She shuffles once. The cards were already in the right order. The shuffle is for him.',
          'Three cards go down on the low table, next to the last card, which she has left out.',
          'She lays the cards without looking up from her crossword.',
          'The cards are dealt before he finishes knocking.',
          'Three cards, face down, dealt like a verdict.',
        ][(s.tarotCount - 1) % 7] },
        { t: 'choice', id: 'TAROT_PICK' },
      ] },
    { label: 'Not today', apply: () => {},
      after: [{ t: 'say', who: 'NARRATOR', dyn: s => [
        'Three floors down, a card gets turned over anyway. Unwitnessed.',
        'Somewhere below, a kettle goes on for one cup instead of two.',
        'The cards keep his appointment without him.',
      ][s.day % 3] }] },
  ],
};
CHOICES.TAROT_PICK = {
  noAuto: true,
  prompt: [],
  options: [
    { label: 'The left card', apply: s => { s._tarotPick = s._tarotOffer[0]; s.tarotUsed.push(s._tarotPick[0]); },
      after: [{ t: 'tarotcard' }, { t: 'say', who: 'ANNA', face: 'reading', dyn: s => s._tarotPick[2] }] },
    { label: 'The middle card', hide: s => (s._tarotOffer || []).length < 2,
      apply: s => { s._tarotPick = s._tarotOffer[1]; s.tarotUsed.push(s._tarotPick[0]); },
      after: [{ t: 'tarotcard' }, { t: 'say', who: 'ANNA', face: 'reading', dyn: s => s._tarotPick[2] }] },
    { label: 'The right card', hide: s => (s._tarotOffer || []).length < 3,
      apply: s => { s._tarotPick = s._tarotOffer[2]; s.tarotUsed.push(s._tarotPick[0]); },
      after: [{ t: 'tarotcard' }, { t: 'say', who: 'ANNA', face: 'reading', dyn: s => s._tarotPick[2] }] },
  ],
};

CHOICES.JULIUS_BREAK = {
  prompt: [],
  options: [
    { label: 'Ask him to stay.', apply: s => { bump('love', 1); bump('sanity', -2); },
      after: [
        Z('Stay.'),
        SAY('JULIUS', '...', 'hurt'),
        SAY('JULIUS', "That's one word."),
        Z('Stay. Please.'),
        SAY('JULIUS', 'Two words.'),
        N('He does not unpack. But he stops packing.'),
        N('For now, he stops packing.'),
      ] },
    { label: 'Say nothing.', apply: () => {},
      after: [
        N('The packing continues, one gentle thing at a time.'),
        N('Nobody says the word that would stop it. The word is available. It is one syllable.'),
      ] },
  ],
};

CHOICES.JOY_WED = {
  prompt: [
    { t: 'art', img: 'phone' },
    SFXB('S_MSG_FLOOD'),
    N('A text. Joy. The Aleksi situation, developing in real time.'),
    SAY('JOY', "he hasn't replied in nine hours"),
    SAY('JOY', 'nine. hours.'),
  ],
  options: [
    { label: '"Mm."', apply: s => { s.contactToday = true; s.sagaHeard++; },
      after: [N('It is the right thing to say. It is the only thing he has ever said about it.')] },
    { label: '"Maybe he is busy?"', apply: s => { s.contactToday = true; s.sagaHeard++; bump('sanity', -1); bump('friends', 1); },
      after: [
        SAY('JOY', 'BUSY'),
        SAY('JOY', 'nine hours zheng'),
        Z('Mm.'),
        N('He should have opened with that.'),
      ] },
    { label: 'Leave it on read', apply: s => { s.unread += 2; },
      after: [N('Joy sees the read receipt. The read receipt sees her. Two follow-ups join the queue.')] },
  ],
};

CHOICES.JOY_THU = {
  prompt: [
    { t: 'art', img: 'phone' },
    SFXB('S_MSG_FLOOD'),
    N('Joy again. Labels are being discussed. Not the recycling kind.'),
    SAY('JOY', "okay so we're not doing labels"),
    SAY('JOY', 'which is fine'),
    SAY('JOY', 'which is what i wanted'),
  ],
  options: [
    { label: '"Mm."', apply: s => { s.contactToday = true; s.sagaHeard++; },
      after: [N('Another Mm. She reads it as wisdom. It might be.')] },
    { label: '"Do YOU want labels?"', apply: s => { s.contactToday = true; s.sagaHeard++; bump('sanity', -1); bump('friends', 1); },
      after: [
        SAY('JOY', '...'),
        SAY('JOY', 'anyway'),
        Z('Mm.'),
        N('He went too far. He knows it. Even the "anyway" knows it.'),
        SAY('JOY', 'sometimes i wish i was a lesbian'),
        Z('Mm.'),
        N('The Mm has never worked harder.'),
      ] },
    { label: 'Leave it on read', apply: s => { s.unread += 2; },
      after: [N('The three dots appear, and think better of it, and go away. Two unread somethings stay behind.')] },
  ],
};

CHOICES.WORK_CALL = {
  prompt: [
    SFXB('S_SANDAL_STING'),
    { t: 'say', who: 'SANDAL', dyn: s => (s.callsToday || 0) === 0
      ? ['Zheng! Quick call? Five minutes.',
         'Zheng! Tiny one. Genuinely tiny.',
         'Zheng! Two minutes. Three, max. Five.',
         'Zheng! You free? You look free.',
         'Zheng! Quick align before the other align.'][s.day % 5]
      : ["Zheng. One more quick one. It's about the first one.",
         'Zheng. Follow-up to the follow-up. Last one.',
         'Zheng. Same topic, new energy.',
         "Zheng. The first call raised some questions. This call is the questions.",
         'Zheng. Circling back on the circle-back.'][s.day % 5] },
  ],
  options: [
    { label: 'Answer it', apply: s => { if ((s.callsToday || 0) === 0) bump('job', 1); s.callsToday = (s.callsToday || 0) + 1; bump('sanity', -1); },
      after: [{ t: 'say', who: 'NARRATOR', dyn: s => [
        'It is not quick. It is never quick. Nothing aligns, and the not-aligning takes twenty minutes.',
        'The call is nineteen minutes about a slide that does not exist yet and one minute of "anyway".',
        'Someone shares a screen. The screen is a spreadsheet of other screens.',
        'Sandal says "quick housekeeping" and then holds a small parliament.',
        'The five minutes contain forty minutes. Physics has stopped applying to this company.',
        'Two people say "can you hear me" to each other for some time. Zheng can hear both of them.',
      ][((s.day * 2 + (s.callsToday || 0)) % 6)] }] },
    { label: 'Let it ring out', apply: s => { s.callsToday = (s.callsToday || 0) + 1; bump('sanity', 1); s.unread += 3; },
      after: [{ t: 'say', who: 'NARRATOR', dyn: s => [
        'The ringing stops. Three messages arrive in its place. They join the queue, and the queue does not forget.',
        'The ringing gives up. Three messages take its shift.',
        'Silence, then three pings, like rain starting.',
      ][s.day % 3] }] },
  ],
};

CHOICES.BORROW = {
  prompt: [N('The account is nearly empty. There are people who would help.')],
  options: [
    { label: 'Matt: €200, no strings', require: s => s.mattBond >= 3 && !s.sold.includes('ps5') && Object.keys(s.borrowed).length === 0,
      apply: s => { s.money += 200; s.borrowed.matt = true; },
      after: [SAY('MATT', 'you looked stressed on tuesday. pay me back whenever. or not.', 'delighted'), N('He never mentions it again, ever, in any ending.')] },
    { label: 'Joy: €200', require: s => s.friends >= 3 && Object.keys(s.borrowed).length === 0,
      apply: s => { s.money += 200; s.borrowed.joy = true; },
      after: [SAY('JOY', 'take it. TAKE IT. this is the trip fund and you are the trip.'), N('She will mention it constantly, and lovingly, for years.')] },
    { label: 'Anna: €150', require: s => Object.keys(s.borrowed).length === 0,
      apply: s => { s.money += 150; s.borrowed.anna = true; bump('sanity', -2); },
      after: [SAY('ANNA', 'I will not take interest. Sit down. We are going to look at what the cards think of this.', 'reading'), N('The cards think a great deal of it.')] },
    { label: 'Manage without', apply: s => { bump('sanity', -1) },
      after: [N('He manages. The word for this feeling is not "managing".')] },
  ],
};

/* ================= DAY 1: MONDAY ================= */
DAYS[1] = [
  { t: 'card', title: 'MONDAY', sub: '09:00 · 26°C · €650' },
  { t: 'art', img: 'apartment_hot', music: 'M_HOME_HOT' },
  N('The other person in this apartment is Julius. Boyfriend. Three years. Currently asleep, holding the duvet like a jar.'),
  { t: 'art', img: 'apartment_hot', music: 'M_HOME_HOT', temp: 26 },
  N('Six hundred and fifty euros, and a promise he made in a bar.'),
  { t: 'choice', id: 'TAROT' },
  { t: 'art', img: 'laptop' }, SFXB('S_SLACK_PING'),
  SAY('SANDAL', "Morning morning morning. Zheng, you're on mute.", 'fake'),
  Z("I'm not on mute."),
  SAY('SANDAL', "You're on mute, Zheng."),
  Z("I'm speaking."),
  SAY('SANDAL', 'Yeah.'),
  ...VOMIT_DAY(1, 3, [
    { t: 'art', img: 'laptop_puke' },
    Z('...', 'alarm'),
    N('Kinu has vomited into the laptop keyboard.'),
    N('Right between the J key and the K key. She had the entire apartment to choose from.'),
    SAY('SANDAL', 'Zheng, was that you?'),
    Z('No.'),
    SAY('SANDAL', 'Okay. Because it sounded like you.'),
  ]),
  { t: 'choice', id: 'WINDOW' },
  { t: 'choice', id: 'SYNC' },
  // Matt appears Monday. His suggestion is the healthiest one anybody makes.
  SFXB('S_SLACK_PING'),
  SAY('MATT', 'yo. co-op tonight. twenty minutes. i counted and you have not played since MAY.', 'delighted'),
  { t: 'choice', id: 'MATT_PLAY' },
  { t: 'ledger', title: 'MONDAY CLOSED', lines: s => ['Electricity meter: running', 'Fund: €' + s.money, 'Tashkent tomorrow: €958'] },
];
CHOICES.WINDOW = {
  prompt: [
    { t: 'art', img: 'window' },
    { t: 'if', cond: s => !s.windowOpen, then: [
      { t: 'say', who: 'NARRATOR', dyn: s => s.day <= 1
        ? 'It is ' + Math.round(s.temp) + ' degrees and climbing. The window works perfectly. That is the problem.'
        : s.day <= 3
          ? Math.round(s.temp) + ' degrees now. The window has not moved. It is waiting to be asked.'
          : Math.round(s.temp) + ' degrees, and guests at seven. The window is the only air conditioning this apartment will ever know.' },
    ], else: [
      { t: 'say', who: 'NARRATOR', dyn: s => s.day <= 3
        ? 'The window is open. The apartment is bearable. Kinu has discovered the sill.'
        : 'The window is still open. The sill is Kinu\'s now. She has notarised it.' },
    ] },
  ],
  options: [
    { label: 'Open it', hide: s => s.windowOpen,
      apply: s => { s.temp -= 8; bump('sanity', 1); s.windowOpen = true; s.windowEverOpened = true; s.windowOpens++; },
      after: [
        Z("She's asleep. She's been asleep for four hours."),
        SFXB('S_WINDOW_OPEN'),
        N('Kinu opens one eye.'),
      ] },
    { label: 'Keep it shut', hide: s => s.windowOpen,
      apply: s => { s.temp += 2; bump('sanity', -1); },
      after: [
        Z("I'll be fine. I'm from a hot country. Sort of. My parents are."),
        SFXB('S_WINDOW_SHUT'),
        N('He is from Nanchang. It is, in fact, one of the famous furnace cities of China. This information helps him in no way whatsoever.'),
      ] },
    { label: 'Leave it open', hide: s => !s.windowOpen, apply: s => { s.windowOpens++; },
      after: [
        N('Kinu, on the sill, watching the street with the stillness of a professional.'),
        Z('Not the birds. We talked about the birds.'),
      ] },
    { label: 'Close it', hide: s => !s.windowOpen,
      apply: s => { s.temp += 2; bump('sanity', -1); s.windowOpen = false; },
      after: [
        SFXB('S_WINDOW_SHUT'),
        N('Kinu files a silent complaint. The heat moves back in within the hour, and unpacks.'),
      ] },
  ],
};
CHOICES.SYNC = {
  prompt: [
    SFXB('S_SANDAL_STING'), SFXB('S_SLACK_PING'),
    SAY('SANDAL', 'hey, quick sync? 5 mins'),
    N('It is never five minutes. It has not once, in three years, been five minutes.'),
  ],
  options: [
    { label: 'Accept', apply: s => { bump('job', 1); bump('sanity', -2); },
      after: [
        SAY('SANDAL', "So I haven't actually read it yet, but my instinct is..."),
        N('Thirty four minutes. About a document he does not open at any point during the call, including the part where he describes what is wrong with it.'),
        Z('...', 'tired'),
      ] },
    { label: '"sorry, in a call"', apply: s => { bump('job', -1); bump('sanity', 1); },
      after: [
        SAY('SANDAL', 'ok.'),
        N('A full stop. He used a full stop.'),
        Z('...'),
        N('Zheng looks at the full stop for a while.'),
      ] },
  ],
};
CHOICES.MATT_PLAY = {
  prompt: [],
  options: [
    { label: 'One session', apply: () => {}, after: [{ t: 'game', id: 'CO_OP' }] },
    { label: '"can\'t. work."', apply: s => { s.mattBond = Math.max(0, s.mattBond - 1); },
      after: [SAY('MATT', 'ok. tomorrow tho', 'disappointed'), N('It will not be tomorrow.')] },
  ],
};

/* ================= DAY 2: TUESDAY ================= */
DAYS[2] = [
  { t: 'card', title: 'TUESDAY', sub: '08:15 · THE OFFICE' },
  { t: 'art', img: 'calendar', music: 'M_OFFICE' },
  { t: 'choice', id: 'TAROT' },
  N('Overnight, the recurring meeting was renamed.'),
  SFXB('S_TITLE_STAMP'),
  N('"' + MEETING_NAMES[2] + '"'),
  N('It has also been moved to 08:15.'),
  Z('Why.'),
  SFXB('S_SANDAL_STING'),
  { t: 'art', img: 'office' },
  SAY('SANDAL', 'Zheng! Big week. Big, big week. How are we?', 'fake'),
  Z('Good.'),
  SAY('SANDAL', 'Yeah? Yeah. Good. Good. Because I am hearing some things about velocity.'),
  Z('From who?'),
  SAY('SANDAL', 'From the ecosystem.'),
  Z('...', 'tired'),
  N('Eight messages. One of them matters.'),
  { t: 'game', id: 'SLACK_STORM' },
  SAY('SANDAL', "Just four words, Zheng. Four words, on how you would describe your own contribution. For the form. It's just for the form."),
  { t: 'game', id: 'PERFORMANCE_REVIEW' },
  { t: 'art', img: 'apartment_hot' },
  ...VOMIT_DAY(2, 2, [
    { t: 'art', img: 'boots_ruined' },
  N('Kinu has vomited inside his left shoe. He will find out about it at 18:40, with his foot.'),
  ]),
  { t: 'choice', id: 'SUSANJOY' },
  { t: 'ledger', title: 'TUESDAY CLOSED', lines: s => ['Fund: €' + s.money, 'Tashkent tomorrow: €996'] },
];
CHOICES.SUSANJOY = {
  prompt: [
    { t: 'art', img: 'phone' },
    N('The phone lights up twice, then five more times. The group chat is named "flight club". He has muted it twice. It does not take.'),
    SFXB('S_MSG_FLOOD'),
    SAY('SUSAN', 'zheng'),
    SAY('SUSAN', 'zheng'),
    SAY('SUSAN', "we're already there"),
    N("They are in a taxi. The taxi has not moved. The taxi is outside Joy's building. Joy is upstairs, in a towel."),
    SAY('JOY', "SUSAN said we're already there so we're already there"),
  ],
  options: [
    { label: 'Go', apply: s => { s.money -= 65; bump('sanity', 2); bump('friends', 2); bump('love', -1); s.contactToday = true; },
      after: [
        SFXB('S_CLINK'), { t: 'music', id: 'M_NIGHT' }, { t: 'art', img: 'bar' },
        SAY('JOY', 'okay so this is a small one. this is a SMALL one.'),
        SAY('JOY', 'he liked my story. aleksi. he LIKED it. what does it mean.'),
        Z('Mm.'),
        { t: 'do', fn: s => { s.sagaHeard++; } },
        N("Four hours. Sixty five euros. Zheng now understands the collapse of Joy's manager's marriage in more detail than Joy's manager does."),
        SAY('SUSAN', 'this was so good. this was SO good. same time thursday?'),
        SAY('JULIUS', "no worries! there's food in the thing"),
        N('There was food in the thing.'),
      ] },
    { label: 'Decline', apply: s => { bump('sanity', -1); },
      after: [
        N('Susan sends forty-one messages. Each one is a single word.'),
        { t: 'msgflood' },
        N('Eleven of them are "okay".'),
      ] },
  ],
};

/* ================= DAY 3: WEDNESDAY ================= */
DAYS[3] = [
  { t: 'card', title: 'WEDNESDAY', sub: s => Math.round(s.temp) + '°C · CAR LOAN DUE' },
  { t: 'art', img: 'apartment_hot', music: 'M_JULIUS' },
  { t: 'choice', id: 'TAROT' },
  { t: 'choice', id: 'WINDOW' },
  SAY('JULIUS', 'So I did a thing?', 'warm'),
  N('There are seven bins.'),
  Z('There are seven bins.'),
  SAY('JULIUS', "There's eight actually. The eighth one is for the ones that don't go in the other seven."),
  Z('What goes in the eighth one.'),
  SAY('JULIUS', "You'll get a feel for it."),
  { t: 'game', id: 'SORTING_HELL' },
  ...VOMIT_DAY(3, 3, [N('Kinu has vomited in the tote bag. On the leek. Julius rinses the leek. Julius uses the leek.')]),
  { t: 'choice', id: 'TEMU' },
  SFXB('S_SLACK_PING'),
  SAY('MATT', 'tonight? i unlocked a hat for you. a HAT.', 'delighted'),
  { t: 'choice', id: 'MATT_PLAY' },
  SFXB('S_BILL_STAMP'),
  { t: 'money', delta: -CAR_LOAN, label: 'CAR LOAN: €225' },
  N('The car is fine. The car is completely fine. That has never been the issue with the car.'),
  { t: 'ledger', title: 'WEDNESDAY CLOSED', lines: s => ['Fund: €' + s.money, 'Tashkent tomorrow: €1,034'] },
];
CHOICES.TEMU = {
  prompt: [
    { t: 'art', img: 'phone' },
    N("Zheng's phone case is two strips of tape and the memory of a phone case."),
    N('The listing: "Cute Silicone Cat Bomb Case". Plus a screen protector. Plus shipping. All of it together, two euros.'),
    Z("It's two euros."),
    SAY('JULIUS', 'Do you know what that actually costs?', 'curious'),
    Z('Two euros nineteen.'),
    SAY('JULIUS', 'No.'),
    Z('It says two euros.'),
    SAY('JULIUS', 'Zheng.'),
  ],
  options: [
    { label: 'Buy the Temu case + protector. Say nothing.', apply: s => { s.money -= 2; bump('sanity', 3); s.f.temuSecret = true; s.f.packageArrives = Math.random() < 0.4; },
      after: [
        SFXB('S_TEMU_BUY'),
        { t: 'art', img: 'dark' },
        Z('"Cute Silicone Cat Bomb Case."', 'joy'),
        N('Ships in nineteen days. The flight is in five.'),
        Z("That's fine."),
      ] },
    { label: "Don't buy it.", apply: s => { bump('sanity', -2); s.f.caseCracks = true; },
      after: [
        SAY('JULIUS', "Thank you. I know it's small? It's not small.", 'warm'),
        N('It was small.'),
      ] },
    { label: 'Buy the €39 Finnish hemp-composite one.', apply: s => { s.money -= 39; bump('love', 2); bump('sanity', -1); },
      after: [
        { t: 'art', img: 'case_hemp' },
        SAY('JULIUS', 'This is SO much better.', 'warm'),
        N('It does not fit the camera hole. Every photograph taken this week has a dark corner in it. Including the good ones.'),
      ] },
  ],
};

/* ================= DAY 4: THURSDAY ================= */
DAYS[4] = [
  { t: 'card', title: 'THURSDAY', sub: s => Math.round(s.temp) + '°C AT HOME' },
  { t: 'art', img: 'apartment_hot', music: 'M_HOME_HOT' },
  { t: 'choice', id: 'TAROT' },
  ...VOMIT_DAY(4, 3, [N('Kinu has vomited on the wifi router. There are sparks. The internet is gone for forty minutes and nobody at work believes him.')]),
  N('There is no air conditioning. There has never been air conditioning. There is one fan, on a stand, and it points at exactly one thing at a time.'),
  { t: 'game', id: 'THE_FAN' },
  SAY('JULIUS', "I unplugged the fan? It was making a noise and I was on a call. I'm really sorry. I mean that."),
  N('He apologises sincerely and at length and does not plug it back in.'),
  { t: 'if', cond: s => s.smell >= 3, then: [
    { t: 'art', img: 'vet', music: 'M_DREAD' },
    N('The smell has reached a threshold with a name, and the name is "vet visit".'),
    { t: 'money', delta: -140, label: 'THE VET: €140' },
    SAY('VET', "She's completely healthy."),
    N('She said it in a tone.'),
    Z('What tone?'),
    SAY('VET', 'No tone.'),
    SFXB('S_BILL_STAMP'), SFXB('S_VOMIT', 1.3),
    N('In the carrier. On the way home.'),
    { t: 'do', fn: s => bump('kinu', -1) },
    KINU_GONE_CHECK(),
  ] },
  { t: 'art', img: 'office', music: 'M_OFFICE' },
  SFXB('S_SANDAL_STING'),
  SAY('SANDAL', "Zheng! I've got something exciting for you. Bit of a stretch opportunity.", 'fake'),
  Z("Is it Maria's deck."),
  SAY('SANDAL', "It's a stretch opportunity."),
  Z("Where's Maria."),
  SAY('SANDAL', "Maria's taking some time."),
  Z('Where.'),
  SAY('SANDAL', '...'),
  SAY('SANDAL', 'Uzbekistan.'),
  { t: 'face', who: 'ZHENG', face: 'dead' },
  { t: 'hold', s: 3 },
  SFXB('S_FLUORESCENT'),
  N('Somewhere above him, a fluorescent light ticks.'),
  { t: 'choice', id: 'OVERTIME' },
  { t: 'ledger', title: 'THURSDAY CLOSED', lines: s => ['Electricity so far: €' + (ELECTRICITY_BASE + 12 * s.fanTaps), 'Tashkent tomorrow: €1,072'] },
];
CHOICES.OVERTIME = {
  prompt: [
    { t: 'if', cond: s => s.overtime === 0, then: [
      SAY('SANDAL', 'No pressure at all. Genuinely, none. But it would be really visible.'),
    ] },
    { t: 'if', cond: s => s.overtime === 1, then: [
      SAY('SANDAL', "One more push? We're basically there."),
      N('He does not say where there is. Nobody has ever seen there.'),
    ] },
    { t: 'if', cond: s => s.overtime === 2, then: [
      SAY('SANDAL', "You're a machine, Zheng."),
      N('He means it as a compliment. He means everything as a compliment.'),
    ] },
  ],
  options: [
    { label: 'Stay', apply: s => { s.money += s.job >= 2 ? 40 : 0; bump('sanity', -2); bump('love', -1); s.overtime++; },
      after: [
        { t: 'if', cond: s => s.job >= 2, then: [SFXB('S_COIN')], else: [{ t: 'say', who: 'NARRATOR', dyn: s => [
          'There is no overtime money at this level. There is only the being seen.',
          'Still no money in it. The visibility compounds, presumably, somewhere.',
          'Unpaid, unasked, unmissable. The lights hum their approval.',
        ][Math.min(2, Math.max(0, s.overtime - 1))] }] },
        { t: 'if', cond: s => s.overtime === 1, then: [
          SAY('JULIUS', 'are you coming home'),
          SAY('JULIUS', "it's okay if not"),
          SAY('JULIUS', "it's just the thing was tonight"),
          Z('What thing.'),
          N('No reply. There is no reply for the rest of the game.'),
        ] },
        { t: 'if', cond: s => s.overtime === 2, then: [
          SAY('SANDAL', 'Still here! Love it. LOVE it.'),
          N('The office empties around him, desk by desk, like a tide going out.'),
        ] },
        { t: 'if', cond: s => s.overtime === 3, then: [
          { t: 'do', fn: s => bump('job', 1) },
          N('The cleaner comes through at nine. They nod at each other like colleagues, which by now they are.'),
          SAY('SANDAL', "Go home, Zheng. Even I'm going home."),
          N('Sandal leaves. Zheng stays another forty minutes, out of something that is not loyalty.'),
        ] },
        { t: 'if', cond: s => s.overtime < 3, then: [{ t: 'choice', id: 'OVERTIME' }] },
      ] },
    { label: 'Go home', apply: s => { bump('job', -1); bump('love', 1); },
      after: [
        { t: 'if', cond: s => s.overtime === 0, then: [
          SAY('SANDAL', 'no worries at all!!'),
          N('Two exclamation marks. Sandal is going to remember them in March.'),
          { t: 'say', who: 'NARRATOR', dyn: s => s.f.breakAnnounced
            ? 'At home, somebody has stopped packing for the evening, and is glad to see him. The trade is not close.'
            : 'At home, the crock is bubbling and somebody is glad to see him. The trade is not close.' },
        ] },
        { t: 'if', cond: s => s.overtime === 1, then: [
          SAY('SANDAL', 'Totally! Rest is part of the work, honestly.'),
          N('He writes one word in his notebook. The word is not "rest".'),
        ] },
        { t: 'if', cond: s => s.overtime === 2, then: [
          SAY('SANDAL', 'Of course. We got it. We always get it.'),
          N('The "we" hangs in the air. There is no we left in the building.'),
        ] },
      ] },
  ],
};
/* ================= DAY 5: FRIDAY ================= */
DAYS[5] = [
  { t: 'card', title: 'FRIDAY', sub: 'PAYDAY' },
  { t: 'art', img: 'apartment_hot', music: 'M_HOME_HOT' },
  { t: 'choice', id: 'TAROT' },
  { t: 'choice', id: 'WINDOW' },
  { t: 'if', cond: s => s.windowOpens >= 3 && s.kinu >= 1, then: [
    { t: 'pause', s: 1 },
    { t: 'art', img: 'window' },
    N('The sill is empty.'),
    Z('...'),
    Z('Kinu?'),
    SFXB('S_VOMIT_WARN'),
    N('The apartment is thirty-four square metres. He checks all of them twice.'),
    N('The window stays open the whole time, like an accusation.'),
    Z('Kinu. KINU.'),
    SFXB('S_DOORBELL'),
    { t: 'art', img: 'anna_kinu' },
    SAY('ANNA', 'Yours, I believe.', 'neutral'),
    N("Kinu, in Anna's arms, purring like an engine that started without him."),
    SAY('ANNA', 'She knocked. Your cat knocks.'),
    Z('She knocked.'),
    N('He carries her back up three floors. She allows it, the way royalty allows things.'),
    { t: 'do', fn: s => { bump('sanity', -1); s.f.kinuWandered = true; } },
  ] },
  SFXB('S_COIN_BIG'),
  { t: 'money', delta: 800, label: 'SALARY: €800' },
  { t: 'face', who: 'ZHENG', face: 'happy' },
  N('Eight hundred euros. For four seconds, Zheng is a wealthy man.'),
  SFXB('S_BILL_STAMP'),
  { t: 'money', delta: s => -(ELECTRICITY_BASE + 12 * s.fanTaps), label: 'ELECTRICITY' },
  N('The four seconds are over.'),
  { t: 'if', cond: s => Math.floor(s.sanity) < 4, then: [
    SFXB('S_SLACK_PING'),
    N('A Slack message arrives. It is from Zheng. It is timestamped eleven minutes from now.'),
    Z('...'),
  ] },
  { t: 'if', cond: s => s.unread >= 12, then: [
    { t: 'do', fn: s => bump('job', -2) },
    SFXB('S_SLACK_STORM'),
    N('Every ping he swiped away this week arrives at once.'),
    SAY('SANDAL', "I've been trying to reach you.", 'disappointed'),
    N('He says it in front of two other people.'),
  ] },
  { t: 'if', cond: s => s.f.caseCracks, then: [
    { t: 'art', img: 'phone' },
    N('The tape gives out at 11:40. Corner to corner. Nobody mentions it again, including this game, after this line.'),
  ] },
  { t: 'art', img: 'stairwell' },
  { t: 'do', fn: s => { s.f.sausage = true; } },
  N('At 11:42, in a stairwell, standing up, alone, Zheng ate a sausage.'),
  { t: 'face', who: 'ZHENG', face: 'joy' },
  { t: 'money', delta: -3, label: 'THE SAUSAGE: €2.90' },
  N('It cost two euros ninety. He has thought about it four times since.'),
  { t: 'art', img: 'kitchen', music: 'M_JULIUS' },
  { t: 'if', cond: s => s.juliusTrust !== 'LOW', then: [
    SAY('JULIUS', "My friends are coming at seven? You're cooking.", 'warm'),
    Z("I'm not a vegetarian."),
    SAY('JULIUS', 'Neither am I?'),
    Z('...'),
    SAY('JULIUS', "It's for them. Sun doesn't do meat, Aapo's got the gluten thing, and Rasmus won't say anything but he will notice."),
    Z('You eat meat.'),
    SAY('JULIUS', 'I had a chicken thing on Tuesday. You were there.'),
    Z('...'),
    N('He was there.'),
    SAY('JULIUS', "Miro's bringing a thing."),
    Z('What thing.'),
    SAY('JULIUS', 'A thing.'),
  ] },
  { t: 'choice', id: 'OATCREAM' },
  { t: 'if', cond: s => s.juliusTrust === 'LOW', then: [
    // Wednesday's bins hard-locked this. He has already cooked.
    N('Julius does not ask Zheng to cook. He has already cooked. The kitchen is done.'),
    N('Zheng has nothing to do at his own dinner party.'),
    { t: 'hold', s: 2 },
    N('He stands in the doorway of his own kitchen for the length of this box.'),
  ], else: [
    { t: 'game', id: 'THE_DINNER' },
  ] },
  SAY('AINO', "I brought wine. It's vegan, but that's not a thing I need anyone to care about.", 'warm'),
  N('There was a scandal about the last wine. Rasmus will know. Rasmus always knows.'),
  { t: 'if', cond: s => s.juliusTrust === 'HIGH', then: [
    SAY('JULIUS', 'He did the whole bag. On Wednesday. Every single one, right first time.', 'warm'),
    SAY('AAPO', 'The whole bag?'),
    SAY('JULIUS', 'The whole bag.'),
    SAY('AINO', 'Including the tea bags?'),
    SAY('JULIUS', 'Including the tea bags.'),
    { t: 'hold', s: 2 },
    N('Zheng is standing in the kitchen doorway, holding the empty pot.'),
    N('Nobody is talking to him. Julius is talking about him, to four people, and every one of them is impressed.'),
    { t: 'pause', s: 2 },
    N('It is the nicest thing that happens to him all week, and he hears it holding an empty pot.'),
    { t: 'do', fn: s => bump('sanity', 2) },
  ] },
  { t: 'if', cond: s => s.smell >= 4, then: [
    SAY('SUN', 'Could we eat on the balcony, possibly?'),
    N('There is no balcony.'),
    { t: 'do', fn: s => { bump('love', -2); bump('friends', -1); } },
  ] },
  { t: 'choice', id: 'SAUSAGE' },
  { t: 'art', img: 'dinner' },
  ...VOMIT_DAY(5, 5, [
    N('Kinu has vomited in the exact centre of the table.'),
    SAY('SUN', "That's very honest."),
    SFXB('S_CAMERA'),
    N('Rasmus photographs it.'),
    SAY('JULIUS', "She's just processing."),
    Z('...'),
  ]),
  N('The dinner continues for one hour and fifty minutes.'),
  { t: 'if', cond: s => s.juliusTrust !== 'LOW', then: [
    SAY('AINO', "Thank you for cooking. That's a lot of work for five people.", 'warm'),
    N('She means it, which is the confusing part.'),
  ], else: [
    SAY('AINO', "Thank you both for tonight. That's a lot of work for five people.", 'warm'),
    N('She says it to Julius. Zheng agrees, from the doorway.'),
  ] },
  { t: 'if', cond: s => s.f.breakAnnounced && s.love >= 2, then: [
    N('Julius does the dishes. All of them. Slowly. The pans as well.'),
    { t: 'say', who: 'NARRATOR', dyn: s => s.f.soldCrock
      ? 'Then, without a word, he unpacks the bag.'
      : 'Then, without a word, he unpacks the bag. The crock goes back on the shelf.' },
    N('Nobody calls the break off out loud. It is off.'),
    { t: 'do', fn: s => { s.f.breakAnnounced = false; } },
  ] },
  { t: 'if', cond: s => s.f.breakAnnounced && s.love < 2, then: [
    N('Julius does the dishes. All of them. The bag stays by the door. Packed, and polite, and patient.'),
  ] },
  { t: 'ledger', title: 'FRIDAY CLOSED', lines: s => ['Fund: €' + s.money, 'Tashkent tomorrow: €1,110'] },
];
CHOICES.OATCREAM = {
  prompt: [],
  options: [
    { label: 'The normal oat cream (-€45)', apply: s => { s.money -= 45; s.f.rasmusKnows = true; }, after: [] },
    { label: 'The artisanal one, wooden-sign shop (-€68)', apply: s => { s.money -= 68; }, after: [] },
  ],
};
CHOICES.SAUSAGE = {
  prompt: [
    N('Somebody asks Zheng what he had for lunch. It is not a trap. Nobody at this table is capable of setting a trap.'),
  ],
  options: [
    { label: '"I had a sausage."', apply: s => { bump('love', 1); bump('sanity', 5); s.f.confessed = true; },
      after: [
        SAY('JULIUS', '...okay?', 'curious'),
        Z('In a stairwell.'),
        SAY('JULIUS', 'Why in a stairwell?'),
        Z('...'),
        SAY('JULIUS', 'Zheng. I had a chicken thing on Tuesday.'),
        Z('I know.'),
        SAY('JULIUS', 'So why the stairwell?'),
        { t: 'pause', s: 2 },
        N('He does not have an answer. He has thought about it four times since and he still does not have one.'),
        N('He hid it from a man who would not have minded. That is most of what is wrong this week, in one sausage.'),
      ] },
    { label: '"I had the soup."', apply: s => { bump('sanity', -4); s.f.lied = true; },
      after: [
        N('There was no soup.'),
        SAY('AAPO', 'Which soup?'),
        Z('The soup.'),
        SAY('AAPO', 'From the place?'),
        Z('From the place.'),
        N('There is no place.'),
        N('He will maintain the soup for the rest of the week. Nobody was ever going to ask him about it again.'),
      ] },
  ],
};

/* ================= DAY 6: SATURDAY ================= */
DAYS[6] = [
  { t: 'card', title: 'SATURDAY', sub: '14:00' },
  { t: 'art', img: 'apartment_hot', music: null },
  { t: 'choice', id: 'TAROT' },
  ...VOMIT_DAY(6, 4, [
    N('Kinu has vomited on the good jacket. The one he was going to wear tonight.'),
    Z('...'),
    Z('That was the one.'),
  ]),
  { t: 'if', cond: s => s.friends >= 3, then: [
    { t: 'art', img: 'phone', music: 'M_NIGHT' },
    SAY('SUSAN', 'brunch??'),
    N('It is not brunch. It has never been brunch. There is no brunch and there never was.'),
    N('The bar. Twenty minutes later. There was never a chance of it being brunch.'),
    { t: 'art', img: 'bar' },
    { t: 'do', fn: s => { s.contactToday = true; } },
    SAY('SUSAN', 'sit. we have a table. rounds are happening.'),
    N('Accept a round and pay for it, or decline and pay differently.'),
    { t: 'game', id: 'DRINK_DODGE' },
    { t: 'if', cond: s => s.guilt >= 4, then: [
      SFXB('S_DOORBELL'),
      { t: 'hold', s: 2 },   // two full seconds of total silence. never skippable.
      { t: 'music', id: null },
      { t: 'art', img: 'apartment_hot' },
      { t: 'if', cond: s => true, then: [
        N("Zheng's apartment. Susan and Joy in the doorway. Julius holding a bin lid."),
        SAY('JULIUS', 'Hi! Come in, take your shoes off, we do shoes off.', 'warm'),
        SAY('JOY', 'why is there a bucket of cabbage'),
        SAY('JULIUS', "That's a crock."),
        SAY('SUSAN', 'why are there NINE BINS'),
        SAY('JULIUS', 'Eight. The ninth one is a plant.'),
        SAY('JOY', 'i love him. zheng. zheng. i love him.', 'emotional'),
        SAY('SUSAN', 'is this the boyfriend that unplugged the fan'),
        SAY('JULIUS', 'It was making a noise!'),
        SAY('SUSAN', 'a NOISE'),
        SAY('JOY', "i think this is the nicest apartment i've ever been in"),
        { t: 'if', cond: s => s.f.breakAnnounced, then: [
          N('The packed bag is by the door. Neither Susan nor Joy asks about it. Both of them see it.'),
        ] },
        { t: 'say', who: 'NARRATOR', dyn: s => 'It is ' + Math.round(s.temp) + ' degrees. There is a bucket of cabbage. Eight bins and a plant. Grey toilet paper.' },
        N("For eleven minutes, Zheng's two worlds are in the same room. He says nothing at all. He has never been happier, or more frightened."),
        { t: 'do', fn: s => { bump('sanity', 3); bump('love', 1); bump('friends', 1); } },
      ] },
    ] },
  ], else: [
    { t: 'music', id: null },
    N('Saturday. The phone does not buzz.'),
    N('The invitation used to arrive around two. It is half past three.'),
    { t: 'do', fn: s => bump('sanity', -1) },
    N('The apartment is very quiet, and it is his fault, and he knows it.'),
  ] },
  { t: 'choice', id: 'TORI' },
  { t: 'if', cond: s => s.sold.includes('ps5'), then: [
    SFXB('S_DOORBELL'),
    N('Matt is in the doorway. He is holding two controllers.'),
    SAY('MATT', 'Oh.', 'disappointed'),
    SAY('MATT', 'When?'),
    { t: 'do', fn: s => { s.mattBond = Math.max(0, s.mattBond - 3); } },
    N('He leaves the second controller on the shelf where the console was. Nobody asked him to.'),
  ], else: [
    { t: 'if', cond: s => s.mattBond >= 3 && Object.keys(s.borrowed).length === 0, then: [
      SFXB('S_SLACK_PING'),
      SAY('MATT', 'hey. you looked stressed on tuesday. i can do 200. not a loan. a "whenever".', 'delighted'),
      { t: 'choice', id: 'MATT_LOAN' },
    ] },
  ] },
  { t: 'if', cond: s => s.kinu >= 1, then: [
    { t: 'if', cond: s => s.fanKinu, then: [
      { t: 'art', img: 'apartment_hot' },
      N('Kinu is lying flat in front of where the fan was, in the memory of the breeze.'),
      N('She does not go for the window. She is not going anywhere.'),
      { t: 'hold', s: 3 },   // the single most restful moment in the game
    ], else: [
      { t: 'if', cond: s => s.windowEverOpened, then: [
        { t: 'art', img: 'window' },
        { t: 'if', cond: s => !s.windowOpen, then: [
          N('The window is shut. This does not concern her. She has been studying the handle all week.'),
          SFXB('S_WINDOW_OPEN'),
        ] },
        SFXB('S_VOMIT_WARN'),
        { t: 'say', who: 'NARRATOR', dyn: s => s.f.kinuWandered
          ? 'Kinu is crouched on the windowsill with her tail going. Yesterday was the rehearsal. This is the real one.'
          : 'Kinu is crouched on the windowsill with her tail going. This is the real one, and she has been practising all week.' },
        { t: 'game', id: 'DEFENESTRATION' },
      ], else: [
        { t: 'art', img: 'apartment_hot' },
        { t: 'do', fn: s => { bump('sanity', -2); } },
        { t: 'say', who: 'NARRATOR', dyn: s => Math.round(s.temp) + ' degrees. He is typing in a towel. There is no minigame here. This is the minigame.' },
      ] },
    ] },
  ] },
  { t: 'if', cond: s => s.f.temuSecret && s.f.packageArrives, then: [
    SFXB('S_PACKAGE'),
    SAY('JULIUS', "There's a package?", 'curious'),
    Z('...', 'alarm'),
    { t: 'art', img: 'case_temu' },
    N('Julius opens it. Slowly. The case is a cheerful cartoon cat.'),
    SAY('JULIUS', '...'),
    SAY('JULIUS', "It's really cute.", 'hurt'),
    { t: 'pause', s: 2 },
    N('That is the worst available outcome and every single person in the room understands it immediately.'),
    { t: 'do', fn: s => { bump('love', -3); } },
  ] },
  { t: 'ledger', title: 'SATURDAY CLOSED', lines: s => ['Fund: €' + s.money, 'Tashkent tomorrow: €1,148'] },
];
CHOICES.MATT_LOAN = {
  prompt: [],
  options: [
    { label: 'Take it', require: s => Object.keys(s.borrowed).length === 0, apply: s => { s.money += 200; s.borrowed.matt = true; },
      after: [SAY('MATT', 'cool. anyway. hat looks great on you btw'), N('He never mentions it again, ever, in any ending.')] },
    { label: '"I\'m okay. Thank you."', apply: s => { s.mattBond = Math.min(5, s.mattBond + 1); },
      after: [SAY('MATT', 'ok. offer stands. forever. no expiry.'), N('He means the forever. Something between them gets quietly stronger.')] },
  ],
};
CHOICES.TORI = {
  prompt: [
    { t: 'art', img: 'listings' },
    N('Tori.fi. Everything must go. Well. Up to two things.'),
  ],
  options: [
    { label: 'PS5 (+€180)', hide: s => s.sold.includes('ps5'), apply: s => { s.money += 180; bump('sanity', -2); s.sold.push('ps5'); },
      after: [
        SFXB('S_COIN'),
        N('He sells it to a man named Teemu, who says "nice" and then nothing else, the entire drive to Kerava.'),
        { t: 'if', cond: s => s.sold.length < 2, then: [{ t: 'choice', id: 'TORI' }] },
      ] },
    { label: 'The old iPhone (+€90)', hide: s => s.sold.includes('iphone'), apply: s => { s.money += 90; s.sold.push('iphone'); },
      after: [
        SFXB('S_COIN'),
        N('It still has 2019 on it. He does not look.'),
        { t: 'if', cond: s => s.sold.length < 2, then: [{ t: 'choice', id: 'TORI' }] },
      ] },
    { label: 'The espresso machine (+€120)', hide: s => s.sold.includes('espresso'), apply: s => { s.money += 120; s.sold.push('espresso'); },
      after: [
        SFXB('S_COIN'),
        N('Monday exists. Monday still exists, and now it has no espresso in it.'),
        { t: 'if', cond: s => s.sold.length < 2, then: [{ t: 'choice', id: 'TORI' }] },
      ] },
    { label: "Julius's fermentation crock (+€60)", hide: s => s.sold.includes('crock'), apply: s => { s.money += 60; bump('love', -3); s.sold.push('crock'); s.f.soldCrock = true; },
      after: [
        SFXB('S_COIN'),
        N('Julius notices within the hour. He does not say anything. He just stands where it was for a while, and then goes to bed early.'),
        { t: 'if', cond: s => s.sold.length < 2, then: [{ t: 'choice', id: 'TORI' }] },
      ] },
    { label: '3 more items', hide: s => s.sold.length === 0,
      apply: () => {}, after: [{ t: 'choice', id: 'TORI_MORE' }] },
    { label: 'Sell nothing', apply: s => { bump('sanity', 1) },
      after: [N('Everything stays. Everything always stays. It is oddly restful.')] },
  ],
};

CHOICES.TORI_MORE = {
  prompt: [N('Further down the listings page. Where the strange things live.')],
  options: [
    { label: 'The car (+€2,400)', hide: s => s.f.triedSellCar, apply: s => { s.f.triedSellCar = true; },
      after: [
        N('He writes the listing. Good condition. One owner. Reluctant sale.'),
        N('He gets as far as the photograph. In the photograph the car is looking at him.'),
        Z('No.'),
        N('Some money is not money. The car has always known this about him.'),
      ] },
    { label: "His mother's rug", apply: () => {},
      after: [N('He reads the listing draft twice. He closes it. Some money is not money.')] },
    { label: 'A bicycle', apply: () => {},
      after: [N('The bicycle is not his. He knows whose it is. Neither of them has ever mentioned it.')] },
    { label: 'Back', apply: () => {}, after: [{ t: 'if', cond: s => s.sold.length < 2, then: [{ t: 'choice', id: 'TORI' }] }] },
  ],
};

/* ================= DAY 7: SUNDAY ================= */
DAYS[7] = [
  { t: 'card', title: 'SUNDAY', sub: 'THE TAB' },
  { t: 'art', img: 'tab', music: null },
  N('The tab has been open since March. It has survived two software updates and one crash.'),
  { t: 'choice', id: 'TAROT' },
  { t: 'if', cond: s => s.tarotCount === 0, then: [
    SAY('ANNA', 'You never asked.', 'neutral'),
    N('It stings, slightly, exactly as intended.'),
  ] },
  { t: 'if', cond: s => s.friends === 0, then: [
    SFXB('S_SLACK_PING'),
    SAY('JOY', 'hey. you good?'),
    N('There is no follow-up.'),
  ] },
  { t: 'art', img: 'ceiling' },
  ...VOMIT_DAY(7, 5, [
    N('Kinu has vomited on the ceiling.'),
    { t: 'pause', s: 2 },
    Z('How.'),
    N('The game does not know either.'),
  ]),
  { t: 'if', cond: s => s.sold.includes('iphone'), then: [
    SAY('JULIUS', 'Do you still have the photo from New Year? The one from New Year?', 'curious'),
    Z('...'),
    N('The New Year photo was on the iPhone. The iPhone is in Espoo now.'),
    { t: 'do', fn: s => bump('love', -2) },
  ] },
  { t: 'if', cond: s => s.job >= 1, then: [{ t: 'choice', id: 'SANDAL7' }], else: [
    N('The phone does not ring. There is nobody left to ring it.'),
  ] },
  { t: 'choice', id: 'JULIUS7' },
  { t: 'if', cond: s => s.kinu >= 1, then: [{ t: 'choice', id: 'KINU7' }], else: [
    { t: 'say', who: 'NARRATOR', dyn: s => (s.f.kinuLeftDay || 4) >= 6
      ? 'Three floors down, Kinu is asleep on a coat Anna took off the moment the fire truck left.'
      : 'Three floors down, Kinu is asleep on a coat Anna stopped wearing on Thursday so Kinu could sleep on it.' },
    Z('...'),
    Z('She looks good.'),
  ] },
  { t: 'booking' },
  { t: 'if', cond: s => s.booked && s.friends >= 4, then: [
    SAY('JOY', 'you said sunday.'),
    { t: 'pause', s: 1 },
    SAY('JOY', 'you actually said sunday.'),
  ] },
  { t: 'if', cond: s => s.booked && s.friends === 3, then: [
    SFXB('S_SLACK_PING'),
    SAY('JOY', 'ours says "pending". susan is ON IT.'),
    N('Pending is a Susan word for a Joy problem. They will land on Wednesday.'),
  ] },
  { t: 'if', cond: s => s.booked && s.friends <= 2, then: [
    N('Susan books hers separately. She sends one message.'),
    SAY('SUSAN', 'glad you got sorted x'),
    N('The x is the worst part.'),
  ] },
  { t: 'judge' },
];
CHOICES.SANDAL7 = {
  prompt: [
    SFXB('S_SANDAL_STING'),
    SAY('SANDAL', 'Zheng! Sunday! Love the energy. Quick one.', 'fake'),
    { t: 'if', cond: s => (s.reviewWords || []).length > 0, then: [
      { t: 'say', who: 'SANDAL', dyn: s => 'Also, the form came back. Your words. "' + (s.reviewWords.includes('no') ? s.reviewWords.filter(w => w !== 'no').concat('developing').join(', ') : s.reviewWords.join(', ')) + '". Great words.' },
    ] },
  ],
  options: [
    { label: 'Hang up.', apply: () => {},
      after: [
        N('He hangs up. It rings again, twice, and gives up.'),
        N('Monday will still exist. He has decided not to think about it from here.'),
      ] },
    { label: '"I\'m resigning."', apply: s => { s.job = 0; bump('sanity', 4); },
      after: [
        SAY('SANDAL', "Let's circle back Monday."),
        Z("I'm resigning."),
        SAY('SANDAL', 'Yeah, no, I hear you. Monday?'),
        Z('...'),
        SAY('SANDAL', 'Great chat.'),
      ] },
    { label: 'Apologise for the week.', require: s => Math.floor(s.sanity) > 2, apply: s => { bump('job', 2); bump('sanity', -2); },
      after: [
        Z("I know this week hasn't been my strongest."),
        SAY('SANDAL', "Hey. Hey. We've all got stuff. Yeah? We've all got stuff."),
        SAY('SANDAL', "Maria's back Tuesday, by the way. She looks amazing."),
      ] },
    { label: 'Send the email you drafted on Tuesday.', require: s => Math.floor(s.sanity) > 4, apply: s => { s.job = 0; bump('sanity', 6); },
      after: [
        N('Four hundred and ten words. He wrote it on Tuesday at 08:19 and saved it as "notes.txt".'),
        N('He reads it once. He sends it.'),
        SFXB('S_SEND'),
        N('He does not read it again, and neither do you. That is the arrangement.'),
      ] },
  ],
};
CHOICES.JULIUS7 = {
  prompt: [
    { t: 'art', img: 'apartment_hot' },
    { t: 'if', cond: s => s.love >= 1, then: [N('Julius, on the sofa, holding a jar.')], else: [
      { t: 'if', cond: s => s.f.breakAnnounced, then: [
        { t: 'say', who: 'NARRATOR', dyn: s => s.f.soldCrock
          ? 'Julius, on the sofa, next to a packed bag. The jars are in the bag. The hair gels are still in the bathroom.'
          : 'Julius, on the sofa, next to a packed bag. The crock is in the bag. The hair gels are still in the bathroom.' },
        N('He leaves after the weekend. Nothing about this evening will be said out loud.'),
      ], else: [
        N('Julius, on the sofa, at the far end of it. The distance is new, and neither of them mentions it.'),
      ] },
    ] },
  ],
  options: [
    { label: '"Come to the airport."', require: s => s.love >= 1, apply: s => { bump('love', 2); s.f.airportEnding = true; },
      after: [
        SAY('JULIUS', 'To see you off?', 'warm'),
        Z('Yes.'),
        SAY('JULIUS', 'Obviously. Obviously yes.'),
        N('He was never going to be on the plane. Both of them have always known that. Neither has ever said it.'),
      ] },
    { label: 'Say nothing.', require: s => s.love >= 1, apply: s => { bump('love', -1); },
      after: [
        N('It is a long evening. Neither of them says the thing. They watch most of a documentary about soil.'),
      ] },
    { label: 'Tell him everything.', require: s => s.love >= 1,
      apply: s => {
        const sins = (s.f.temuSecret ? 1 : 0) + (s.f.lied ? 1 : 0) + (s.f.soldCrock ? 1 : 0);
        if (sins === 0) { bump('sanity', 2); bump('love', 1); }
        else { bump('sanity', 5); bump('love', s.f.confessed ? 3 : -3); }
      },
      after: [
        { t: 'if', cond: s => (s.f.temuSecret || s.f.lied || s.f.soldCrock), then: [
          { t: 'say', who: 'ZHENG', dyn: s => {
            const parts = [];
            if (s.f.temuSecret) parts.push('I bought the phone case');
            if (s.f.lied) parts.push('I lied about the soup');
            if (s.f.soldCrock) parts.push('I sold the crock');
            return parts.join('. And ') + '.';
          } },
          { t: 'if', cond: s => s.f.temuSecret, then: [
            SAY('JULIUS', 'I knew about the case.', 'curious'),
            Z('How.'),
            SAY('JULIUS', 'The cardboard was in the recycling, Zheng.'),
            SAY('JULIUS', 'You sorted it correctly.'),
            { t: 'pause', s: 2 },
            N('He sorted it correctly. That is the part that hurts.'),
          ], else: [
            SAY('JULIUS', 'I knew on Wednesday.', 'curious'),
            SAY('JULIUS', "It's fine. It's not fine, but it's fine."),
            N('Both halves of that sentence are true. That is the trick of him.'),
          ] },
        ], else: [
          Z('I need to tell you everything.'),
          SAY('JULIUS', '...', 'curious'),
          Z('...'),
          SAY('JULIUS', "I know. There's nothing. That's sort of the problem?"),
          N('A confession with nothing in it. Somehow that is worse, and both of them know it.'),
        ] },
      ] },
    { label: 'The evening passes.', require: s => s.love < 1, apply: () => {},
      after: [N('The documentary about soil plays. Neither of them is watching it.')] },
  ],
};
CHOICES.KINU7 = {
  prompt: [N('Kinu cannot come to Uzbekistan. This was never in question. The question is the week.')],
  options: [
    { label: "Ask Anna to keep her for the week.", require: s => s.smell < 5, apply: s => { bump('sanity', 1); },
      after: [
        N('Anna says yes before he finishes the sentence. Anna has been waiting to be asked since March. Anna already has a bowl.'),
        { t: 'art', img: 'anna_kinu' },
        N('The bowl has her name on it. Anna wrote the name.'),
        { t: 'if', cond: s => s.f.kinuWandered, then: [
          N('She has, after all, already stayed once. Briefly. Without permission.'),
        ] },
      ] },
    { label: 'Both bowls full, and hope.', require: s => s.smell >= 5, apply: s => { s.kinu = 0; },
      after: [
        N('Anna looks past him into the apartment, and closes her door, gently.'),
        N('Two full bowls is not a plan. It is a hope with bowls.'),
      ] },
    { label: 'Leave the window open a crack.', apply: s => { s.kinu = 0; },
      after: [
        N('He thinks about this one for a long time. Longer than any other choice this week.'),
        SFXB('S_WINDOW_OPEN'),
      ] },
  ],
};

/* ================= THE 32 ENDINGS ================= */
const ENDINGS = {
  '11111': { title: 'SAMARKAND, BABY', tone: 'GOLD', text: [
    'Job intact. Kinu at Anna\'s, photographed daily. Julius at home, watering things, texting him photographs of the plants with no caption. Mind entirely his own.',
    'On Monday at 07:45 the Quick Sync happens without him.',
    'Nothing breaks. Nobody notices.',
    'He thinks about that on the flight home. Both ways.'] },
  '11110': { title: 'PLOV DREAM SEQUENCE', tone: 'WEIRD', text: [
    'At 02:00 he has a long, detailed conversation with Kinu through the hotel minibar. Kinu is not in the minibar. Kinu is in Helsinki.',
    'He orders two plates again the next day, and the day after.',
    'By every measurable standard, the trip is a triumph.'] },
  '11101': { title: 'ONE PHOTOGRAPH OF A MOSQUE', tone: 'GOOD', text: [
    'He posts one photograph of a mosque. One. Captioned with the name of the mosque and nothing else.',
    'Julius likes it in ninety seconds.',
    'Julius always likes it in ninety seconds.'] },
  '11100': { title: 'THE TASHKENT INCIDENT', tone: 'WEIRD', text: [
    'On day four he is asked to leave a bazaar. Not thrown out. Asked. Politely. Permanently.',
    'He will never explain what happened and this game will not either.',
    'He comes home with a scarf he cannot account for.'] },
  '11011': { title: "KINU LIVES AT ANNA'S NOW", tone: 'GOOD', text: [
    'In Bukhara he buys a carpet the size of a placemat.',
    '"It\'s for a cat," he tells the seller. "A cat that isn\'t mine anymore."',
    'He gives it to Anna on the Tuesday. She says "she\'ll hate it" and puts it down anyway.',
    'Kinu is asleep on it within the hour, and Anna sends him one photograph with no message attached.'] },
  '11010': { title: 'HE STILL HEARS THE VOMIT', tone: 'WEIRD', text: [
    'He wakes at four to a sound he knows the way other people know their own name.',
    'There is nothing there. There is never anything there.',
    'He checks anyway. He will check for years.'] },
  '11001': { title: 'NO CAT, NO MAN, FULL WALLET', tone: 'CALM', text: [
    'He has money left over. He eats well. He walks eleven kilometres a day and sleeps like a stone.',
    'He looks extraordinary in the photographs.',
    'There are a great many photographs. He is not in any of them.'] },
  '11000': { title: 'MAN, ABROAD, UNWELL', tone: 'BLEAK', text: [
    'He orders plov for two and eats both plates.',
    'Afterwards he describes the meal, out loud, in detail, for eleven minutes.',
    'Nobody asked about the meal. He describes it anyway.'] },
  '10111': { title: 'UNEMPLOYED IN UZBEKISTAN', tone: 'GOOD', text: [
    'Jobless by Sunday. Airborne by Monday. Eating garlic out of a metal tray by lunchtime.',
    "Sandal's farewell message is four hundred and ten words long and arrives in twelve parts.",
    'He deletes it eleven days later, from a train, without opening it.',
    'It is the single best week of his adult life.'] },
  '10110': { title: 'FREEDOM (DERANGED)', tone: 'WEIRD', text: [
    'He walked out. He flew out. He is fine.',
    'He is not fine.',
    'He is fine.',
    'On night three, Anna sends a photograph of her bathroom door, open, and Kinu in it. Kinu opened it herself. Nobody taught her. She decided it was time.'] },
  '10101': { title: 'THE REBUILD', tone: 'GOOD', text: [
    'No job, no boyfriend, one cat, one visa, one very good week.',
    'He starts a note called "ideas". By Thursday it has four things in it.',
    'Two of them are good.'] },
  '10100': { title: 'BURN IT DOWN, PACK LIGHT', tone: 'WEIRD', text: [
    'Career: gone. Julius: gone. Grip on the situation: negotiable.',
    'Cat: at Anna\'s, unconsulted, unforgiving.',
    'He has never been more himself, and that is the frightening part.'] },
  '10011': { title: 'THE AIRPORT HAND-HOLD', tone: 'GOOD', text: [
    '"I\'m proud of you," Julius says, at gate 24, and means it so sincerely that Zheng has to look at the departures board for a moment.',
    'Julius does not get on the plane. He was never going to.',
    'He goes home and waters things and likes every photograph within ninety seconds.'] },
  '10010': { title: 'TWO MEN, ONE GATE, NO WORDS', tone: 'BLEAK', text: [
    'No job. No cat. Not much left in him at all.',
    'Julius comes to the airport anyway. They sit for forty minutes.',
    'He brought a reusable cup. Neither of them drinks from it.',
    'Four days later Zheng sends a photograph of a plate. Julius replies with a heart. That is the whole conversation and it is enough.'] },
  '10001': { title: 'NOTHING LEFT TO CARRY', tone: 'CALM', text: [
    'One bag. Fired, on a break, catless, and completely calm.',
    'At the gate, unasked, holding two coffees: Matt. Nobody texted him the time. He knew the time.',
    'He has never felt lighter.',
    'Everyone who knows him finds this concerning, and he understands why, and it does not change anything.'] },
  '10000': { title: 'ONE-WAY TICKET', tone: 'BLEAK', text: [
    'Everything is gone except the money and the ticket.',
    'Matt came to the airport anyway. He hands over the second coffee and says nothing at all.',
    'He is here. He wanted to be here.',
    'He is here.'] },
  '01111': { title: 'SO CLOSE', tone: 'GOOD', usesShortfall: true, text: [
    'Job, cat, boyfriend, sanity, and €{SHORTFALL} short.',
    'A whole life, held together perfectly, minus one number.',
    'The tab stays open in his browser for four years.',
    'It survives two laptops.'] },
  '01110': { title: 'THE €{SHORTFALL} PSYCHOSIS', tone: 'WEIRD', usesShortfall: true, text: [
    'He had everything except a small, specific amount of money.',
    'He now mentions that exact figure in every conversation, including ones about other topics, including ones he is not in.'] },
  '01101': { title: 'NEXT YEAR, DEFINITELY', tone: 'CALM', text: [
    'Job, cat, sanity, no money, no Julius.',
    'He says "next year" with total, uncomplicated sincerity and he is not lying.',
    'The sincerity is total, and totally uncomplicated, and that is the new part.'] },
  '01100': { title: 'REFRESHING THE PRICE AT 04:00', tone: 'BLEAK', text: [
    'Employed, on a break, broke, unravelling.',
    'The apartment is 31°C. The window is shut. The tab is open.',
    'The price has gone up again.'] },
  '01011': { title: 'THE CAT TAX', tone: 'WEIRD', text: [
    'The trip did not happen. The cat is gone. The two facts are not even related. He has checked.',
    'The universe invoiced him in full and delivered nothing.',
    'He keeps the receipts. He does not know why.'] },
  '01010': { title: 'THE INVOICE FOLDER', tone: 'BLEAK', text: [
    "He files the week's receipts in the same folder as the flight quotes.",
    'The folder is called "later". It has forty-one things in it.',
    'He opens it on Sundays.'] },
  '01001': { title: 'A REAL ASSET (SARCASTICALLY)', tone: 'BLEAK', text: [
    'No money, no cat, no boyfriend.',
    'But on Tuesday, in a meeting, Sandal called him "a real asset".',
    'Zheng knows exactly how it was meant.',
    'He has thought about it every day since.'] },
  '01000': { title: 'MONDAY AGAIN', tone: 'BLEAK', text: [
    'Employed.',
    "That's it. That's the whole ending."] },
  '00111': { title: 'THE HAPPIEST BROKE MAN IN HELSINKI', tone: 'GOOD', text: [
    'Fired, penniless, cat purring on the windowsill, Julius composting in the kitchen, brain fully operational.',
    'The second-best ending in the game.',
    "He isn't going to Uzbekistan. He's fine.",
    "It's annoying how fine he is."] },
  '00110': { title: 'OFF-GRID (INVOLUNTARY)', tone: 'WEIRD', text: [
    'No job, no money, no sense.',
    'But a cat, a boyfriend, and a hallway that smells of fermented cabbage, and always will.',
    'They are going to be okay in a way that frightens their families.'] },
  '00101': { title: 'JUST HIM AND THE CAT', tone: 'CALM', text: [
    'Lost the job, the money, the man.',
    'Kinu vomits directly onto his chest at 05:00.',
    'He decides, lying there, in the dark, that this is love.',
    "He is right. That's the tragedy."] },
  '00100': { title: 'CO-TENANTS', tone: 'WEIRD', text: [
    'He and Kinu are now peers. Neither is employed. Both vomit. Neither judges.',
    'The lease is in his name but they both know that means nothing.'] },
  '00011': { title: 'UNDER THE HEMP DUVET', tone: 'CALM', text: [
    'Broke, jobless, catless, sane, and sleeping under a duvet he did not choose, in a colour he cannot describe, that Julius says is "just undyed".',
    "It's grey. It's fine. He sleeps well."] },
  '00010': { title: 'HE HAS JOINED THE COLLECTIVE', tone: 'WEIRD', text: [
    'He has stopped saying "I". He says "we".',
    'Rasmus is visibly proud of him. Sun has given him a jar.',
    'He does not know what is in it and has stopped needing to know.'] },
  '00001': { title: 'NOTHING, BUT CALMLY', tone: 'CALM', text: [
    'Zero on every counter except one.',
    'He sits in the hot room in the good chair and he is, against all available evidence, at peace.',
    'This is the ending the game respects most and it plays no music at all.'] },
  '00000': { title: 'THE OPEN WINDOW', tone: 'CALM', breeze: true, text: [
    'No money. No job. No cat. No Julius. No mind.',
    'The window is open. There is a breeze.',
    'The corner readout reads 21°C, OPTIMAL.',
    'For the first time in seven days, Zheng is comfortable.',
    "It's the first good thing all week."] },
};

/* ---- the Uzbekistan sequence, v2: everything branches on GIRLS ---- */
function arrivalBeats(s) {
  const E = s.job >= 1, K = s.kinu >= 1, SA = s.sanity >= 1;
  const GIRLS = s.friends >= 4;   // Susan and Joy are on the plane. Julius never is.
  const b = [];
  // ARRIVAL 1: THE DESCENT
  b.push({ t: 'art', img: 'plane', music: 'M_TITLE' });
  b.push(N('Two thousand kilometres of nothing. Then a river. Then a city that is mostly the colour of bread.'));
  if (SA) { b.push(Z('Oh.')); b.push(N('That is the only thing he says for eleven minutes.')); }
  else {
    b.push(Z('I can see our building.'));
    b.push(N('He cannot see their building. Their building is in Helsinki.'));
    b.push(Z('There it is.'));
  }
  if (GIRLS) {
    b.push(SAY('JOY', 'is that it. zheng is that it.', 'delighted'));
    b.push(SAY('SUSAN', "that's a river"));
    b.push(SAY('JOY', 'is the river it'));
    b.push(SAY('SUSAN', 'joy the river is not the country'));
    b.push(N('They have been awake for nineteen hours. Susan has a spreadsheet. It is colour coded. It has a tab called "THE BLUE ONES" and a tab called "backup restaurants".'));
    b.push(SAY('JOY', "i didn't tell you. aleksi messaged."));
    b.push(Z('Mm.'));
  } else {
    b.push(N('The seat beside him holds a sleeping man who has been asleep since Riga.'));
    b.push(N('It is fine. It is completely fine.'));
  }
  if (K) {
    b.push(N("Three floors below an empty apartment, Kinu is having a holiday of her own, at Anna's, on the black wool coat."));
    b.push(N('The name on the bowl is in permanent marker. It was never going to be pencil.'));
  } else {
    b.push(N('Three floors below his empty apartment, a cat is asleep on the black wool coat, which lives on the chair now.'));
    b.push(N('She is not thinking about him. That is not a criticism. That is just what cats are.'));
  }
  // ARRIVAL 2: THE TAXI
  b.push({ t: 'art', img: 'taxi' });
  b.push(N('It is thirty six degrees.'));
  b.push({ t: 'tempshow', v: 36 });
  b.push(N('He notices this.'));
  b.push({ t: 'pause', s: 2 });
  b.push(N('And then, for the first time in eight days, he does not think about it again.'));
  b.push({ t: 'tempshow', v: null });
  if (E) {
    b.push(SFXB('S_SLACK_PING'));
    b.push(N('"' + MEETING_NAMES[7] + '"'));
    b.push(Z('...'));
    b.push(N('The phone goes face down on the seat. It stays face down for nine days.'));
  } else {
    b.push(N('His phone does not buzz. It will not buzz for eleven days.'));
    b.push(N('He checks it anyway. Twice. Out of muscle memory. Then he stops.'));
  }
  if (GIRLS) {
    b.push(SAY('SUSAN', 'hi, hello, do you take card? card? do you, sorry, do you take card?'));
    b.push(N('He takes card.'));
    b.push(SAY('SUSAN', 'he takes card!'));
    b.push(SAY('JOY', 'susan he said that'));
    b.push(SAY('SUSAN', "i'm CONFIRMING"));
    b.push(N('Susan pays for the taxi without looking at the amount. She is looking at the map on her phone. The map has seventeen pins on it.'));
    b.push(SAY('SUSAN', 'tomorrow: the big square at sunrise. then the bread market. then the very blue one.'));
    b.push(SAY('JOY', 'which one is the very blue one'));
    b.push(SAY('SUSAN', "you'll know it when we're in it"));
  }
  if (!SA) {
    b.push(N('The meter says a number. Then a slightly different number. Then the first one again.'));
    b.push(Z("That's fine."));
  }
  // ARRIVAL 3: THE PLOV
  b.push({ t: 'art', img: GIRLS ? 'uzbek' : 'uzbek_solo' });
  b.push(N('A plastic table. A metal tray.'));
  b.push(N('Rice, and lamb, and one entire head of garlic, and a boiled egg, for reasons nobody explains and nobody questions.'));
  b.push({ t: 'pause', s: 2 });
  b.push(N('It costs the equivalent of two euros forty.'));
  b.push(Z('...'));
  b.push(Z("It's two euros forty."));
  if (s.f.temuSecret) b.push(N('The Temu case is in his hand. Cheerful cartoon cat. Absolutely clashing with everything.'));
  b.push(N('He thinks about the phone case.'));
  b.push(N('He thinks about it for a long time.'));
  b.push(N('Then he eats.'));
  if (GIRLS) {
    b.push(SAY('JOY', 'this is the best thing i have ever eaten', 'delighted'));
    b.push(SAY('SUSAN', 'the plov was number four on the list. we are at number four already.', 'delighted'));
    b.push(SAY('JOY', 'SUSAN'));
    b.push(SAY('SUSAN', "i'm saying it's HAPPENING"));
    b.push(N('Susan orders four more. Susan pays. She never mentions it, then or ever.'));
    b.push(SAY('JOY', 'you did this. this was you.', 'emotional'));
    b.push(Z('...'));
    b.push(SAY('JOY', "don't do the mm. not now."));
    b.push(Z('...'));
    b.push(Z('Okay.'));
  } else {
    b.push(N('He eats alone at a plastic table in a city he has thought about every day since March.'));
    b.push(N('It is not sad. People keep expecting it to be sad.'));
  }
  if (K) {
    b.push(N('Anna sends one photograph a day. No message. Just Kinu, asleep, somewhere new each time.'));
    b.push(N('He looks at each one for a while. Longer than the mosques.'));
  }
  if (!SA && !GIRLS) {
    b.push(N('He orders two plates.'));
    b.push(N('Nobody asks who the second one is for, and he is grateful, because he does not have an answer ready.'));
  }
  return b;
}

/* ---- the unfunded coda, v2: nine seconds, the mirror of the plov ---- */
function codaBeats(s) {
  const K = s.kinu >= 1, SA = s.sanity >= 1;
  const b = [];
  b.push({ t: 'do', fn: s => { s.tabPriceOverride = 1186; } });
  b.push({ t: 'art', img: 'tab', music: null });
  b.push(N('It is Monday.'));
  b.push(SFXB('S_PRICE_UP'));
  b.push(N('€1,186.'));
  if (SA) {
    b.push(Z('Next week.'));
    b.push(N('He is not lying. He might even be right.'));
  } else {
    b.push(Z('€1,186.'));
    b.push(Z('€1,186.'));
    b.push(N('He says the number eleven times over the next four days.'));
  }
  if (K) {
    b.push(N('Anna brought her back up on Monday morning. Neither of them mentions the week that did not happen.'));
    b.push(N('Kinu walks across the keyboard and closes the tab.'));
    b.push(N('She closes the tab. She did not mean to. She has never meant to do anything in her life.'));
    b.push(Z('...'));
    b.push(N('He opens it again.'));
  }
  b.push(SAY('JOY', "it's fine. we'll do it next year."));
  b.push(N('Joy has said "next year" about four separate things since March.'));
  if (s.friends >= 4) {
    b.push(SAY('JOY', "i still haven't left my office."));
    b.push({ t: 'pause', s: 1.5 });
  }
  return b;
}

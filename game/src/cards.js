// ROTDECK — the card definitions.
// Four suits, each a faction told apart by colour AND glyph. Twelve card
// designs, two copies of each, make the 24-card deck.
export const SUITS = {
  ember: { name: 'Ember', glyph: '♥', color: '#d43d2a', dark: '#8f1d12', bg: '#fde8e4' },
  tide: { name: 'Tide', glyph: '♠', color: '#2563c9', dark: '#123a7d', bg: '#e4edfd' },
  thorn: { name: 'Thorn', glyph: '♣', color: '#2e7d32', dark: '#17451b', bg: '#e6f4e6' },
  bone: { name: 'Bone', glyph: '♦', color: '#b8860b', dark: '#6d4e05', bg: '#fdf3d7' },
};

export const KINDS = {
  strike: { name: 'Strike', verb: 'Deal', target: 'damage' },
  guard: { name: 'Guard', verb: 'Gain', target: 'shield' },
  mend: { name: 'Mend', verb: 'Restore', target: 'life' },
};

// power: Strike = damage, Guard = shield, Mend = healing. Cost is paid in embers.
export const CARD_DESIGNS = [
  { id: 'cinder-jab', name: 'Cinder Jab', suit: 'ember', kind: 'strike', cost: 1, power: 4, text: 'A quick spark to the face.' },
  { id: 'wildfire-slash', name: 'Wildfire Slash', suit: 'ember', kind: 'strike', cost: 2, power: 7, text: 'Flames leap from edge to edge.' },
  { id: 'inferno-crown', name: 'Inferno Crown', suit: 'ember', kind: 'strike', cost: 3, power: 9, text: 'Wear the fire. Become the fire.' },
  { id: 'hearth-warmth', name: 'Hearth Warmth', suit: 'ember', kind: 'mend', cost: 2, power: 6, text: 'Embers hum a healing song.' },
  { id: 'still-water', name: 'Still Water', suit: 'tide', kind: 'guard', cost: 2, power: 6, text: 'Calm surface, iron underneath.' },
  { id: 'tidewall', name: 'Tidewall', suit: 'tide', kind: 'guard', cost: 1, power: 4, text: 'The sea stands up for you.' },
  { id: 'deep-current', name: 'Deep Current', suit: 'tide', kind: 'strike', cost: 2, power: 6, text: 'Drags the foe under, quietly.' },
  { id: 'thicket-wall', name: 'Thicket Wall', suit: 'thorn', kind: 'guard', cost: 1, power: 5, text: 'Thorns grow where you stand.' },
  { id: 'briar-snare', name: 'Briar Snare', suit: 'thorn', kind: 'strike', cost: 2, power: 5, text: 'Vines close around the ankle.' },
  { id: 'root-mend', name: 'Root Mend', suit: 'thorn', kind: 'mend', cost: 1, power: 4, text: 'Old roots knit torn flesh.' },
  { id: 'gravemaw-bite', name: 'Gravemaw Bite', suit: 'bone', kind: 'strike', cost: 3, power: 10, text: 'The grave itself takes a bite.' },
  { id: 'bone-charm', name: 'Bone Charm', suit: 'bone', kind: 'mend', cost: 2, power: 5, text: 'A lucky knuckle, warm to touch.' },
];

export function suitOf(design) {
  return SUITS[design.suit];
}

export function effectText(design) {
  const kind = KINDS[design.kind];
  return `${kind.verb} ${design.power} ${kind.target}.`;
}

// A live card in a hand or deck: a design plus its current (possibly rotted) power.
export function makeCard(design, uid) {
  return { uid, designId: design.id, name: design.name, suit: design.suit, kind: design.kind, cost: design.cost, power: design.power, basePower: design.power, text: design.text, rotted: 0 };
}

export function buildDeck(rng) {
  const cards = [];
  let uid = 0;
  for (const design of CARD_DESIGNS) {
    for (let copy = 0; copy < 2; copy++) cards.push(makeCard(design, uid++));
  }
  // Fisher-Yates with the seeded rng so a match is reproducible.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

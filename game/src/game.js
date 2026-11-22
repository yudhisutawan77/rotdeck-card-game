// ROTDECK — pure match logic, no DOM. Importable from Node for tests.
// Rules: each side has 30 life and a 24-card deck. A turn: draw 2, +3 embers,
// play cards by paying their cost. ROT: at the end of your turn every card
// still in your hand loses 1 power; a card at 0 power crumbles to dust.
// BLOOM: play two cards of the same suit in one turn and the second gains +2.
import { buildDeck } from './cards.js';

export const START_HP = 30;
export const HAND_SIZE = 5;
export const DRAW_PER_TURN = 2;
export const EMBERS_PER_TURN = 3;
export const MAX_EMBERS = 10;
export const BLOOM_BONUS = 2;

// Small seeded RNG (mulberry32) so staged screenshots are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newMatch(seed, playerHp = START_HP, wardenHp = START_HP) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    phase: 'title', // title | play | won | lost
    round: 1,
    player: { hp: playerHp, maxHp: START_HP, shield: 0, embers: EMBERS_PER_TURN, deck: [], hand: [], discard: [] },
    warden: { hp: wardenHp, maxHp: START_HP, shield: 0, embers: EMBERS_PER_TURN, deck: [], hand: [], discard: [] },
    score: 0, // total damage the player has dealt
    rotted: 0, // cards that crumbled to dust in the player's hand
    wardenRotted: 0,
    log: [],
    playedSuitsThisTurn: [],
    turn: 'player',
  };
  state.player.deck = buildDeck(rng);
  state.warden.deck = buildDeck(rng);
  return state;
}

export function log(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log.shift();
}

export function drawCards(state, side, count) {
  const who = state[side];
  for (let i = 0; i < count; i++) {
    if (who.deck.length === 0) break;
    who.hand.push(who.deck.shift());
  }
}

export function startMatch(state) {
  state.phase = 'play';
  drawCards(state, 'player', HAND_SIZE);
  drawCards(state, 'warden', HAND_SIZE);
  log(state, 'The Warden rises. Your hand is dealt — spend it before it rots.');
}

// Damage first eats shield, then life. Returns the life damage actually dealt.
export function hurt(state, side, amount) {
  const who = state[side];
  let left = amount;
  if (who.shield > 0) {
    const absorbed = Math.min(who.shield, left);
    who.shield -= absorbed;
    left -= absorbed;
  }
  who.hp = Math.max(0, who.hp - left);
  return left;
}

export function canPlay(state, card) {
  return state.phase === 'play' && state.turn === 'player' && state.player.embers >= card.cost;
}

// Apply one card's effect. Returns a short description for the log.
export function playCard(state, side, card) {
  const who = state[side];
  const idx = who.hand.indexOf(card);
  if (idx < 0) return null;
  if (who.embers < card.cost) return null;
  who.embers -= card.cost;
  who.hand.splice(idx, 1);
  who.discard.push(card);

  let power = card.power;
  let bloom = false;
  if (side === 'player') {
    if (state.playedSuitsThisTurn.includes(card.suit)) {
      power += BLOOM_BONUS;
      bloom = true;
    }
    state.playedSuitsThisTurn.push(card.suit);
  }

  let line;
  if (card.kind === 'strike') {
    const foeSide = side === 'player' ? 'warden' : 'player';
    const shieldBefore = state[foeSide].shield;
    const dealt = hurt(state, foeSide, power);
    const blocked = shieldBefore - state[foeSide].shield;
    if (side === 'player') state.score += dealt;
    line = `${card.name} hits ${foeSide === 'warden' ? 'the Warden' : 'you'} for ${dealt}${blocked > 0 ? ` (${blocked} blocked by shield)` : ''}${bloom ? ' — BLOOM +2!' : ''}`;
  } else if (card.kind === 'guard') {
    who.shield += power;
    line = `${card.name} raises ${power} shield${bloom ? ' — BLOOM +2!' : ''}`;
  } else {
    who.hp = Math.min(who.maxHp, who.hp + power);
    line = `${card.name} restores ${power} life${bloom ? ' — BLOOM +2!' : ''}`;
  }
  log(state, line);
  checkEnd(state);
  return line;
}

function checkEnd(state) {
  if (state.phase !== 'play') return;
  if (state.warden.hp <= 0) {
    state.phase = 'won';
    log(state, 'The Warden crumbles. ROTDECK is yours!');
  } else if (state.player.hp <= 0) {
    state.phase = 'lost';
    log(state, 'You rot away. The Warden keeps the table.');
  }
}

// ROT: every card left in the player's hand loses 1 power; a card at 0
// crumbles to dust. Then the Warden takes its turn, then a fresh round.
export function endPlayerTurn(state, wardenTurn) {
  if (state.phase !== 'play' || state.turn !== 'player') return;
  const hand = state.player.hand;
  const survivors = [];
  for (const card of hand) {
    card.power -= 1;
    card.rotted += 1;
    if (card.power <= 0) {
      state.rotted += 1;
      state.player.discard.push(card);
      log(state, `${card.name} rotted away to dust.`);
    } else {
      survivors.push(card);
    }
  }
  state.player.hand = survivors;
  state.turn = 'warden';
  if (wardenTurn) wardenTurn(state);
  if (state.phase !== 'play') return;
  state.turn = 'player';
  state.round += 1;
  state.playedSuitsThisTurn = [];
  state.player.embers = Math.min(MAX_EMBERS, state.player.embers + EMBERS_PER_TURN);
  drawCards(state, 'player', DRAW_PER_TURN);
  log(state, `Round ${state.round} — draw 2, +3 embers. Spend them before they rot.`);
}

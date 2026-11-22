// ROTDECK — the Warden's brain. Readable and counterable on purpose:
// it draws 2, gains 3 embers, plays at most 2 cards, and every action is
// written to the log so the player can see what it values and answer it.
import { drawCards, playCard, log, EMBERS_PER_TURN, DRAW_PER_TURN } from './game.js';

function cardValue(state, card) {
  const warden = state.warden;
  const player = state.player;
  // The Warden strikes when the player is exposed, guards and mends when hurt.
  if (card.kind === 'strike') {
    let v = card.power * 2;
    if (player.hp <= 10) v += 6; // smell blood
    if (player.shield > 0) v -= player.shield; // shield blunts the blow
    return v;
  }
  if (card.kind === 'guard') {
    let v = card.power;
    if (warden.hp <= 12) v += 8;
    if (player.hp <= 8) v -= 4; // no time to hide when the kill is near
    return v;
  }
  // mend
  let v = card.power;
  if (warden.hp <= 10) v += 10;
  else if (warden.hp >= warden.maxHp - 2) v -= 20; // already whole, wasteful
  return v;
}

export function wardenTurn(state) {
  drawCards(state, 'warden', DRAW_PER_TURN);
  state.warden.embers = Math.min(10, state.warden.embers + EMBERS_PER_TURN);
  log(state, `The Warden draws 2 and gathers ${EMBERS_PER_TURN} embers.`);
  let played = 0;
  while (played < 2 && state.phase === 'play') {
    const affordable = state.warden.hand
      .filter((c) => c.cost <= state.warden.embers)
      .sort((a, b) => cardValue(state, b) - cardValue(state, a));
    if (affordable.length === 0) break;
    const pick = affordable[0];
    if (cardValue(state, pick) <= 0) break;
    playCard(state, 'warden', pick); // playCard already logs the action
    played += 1;
  }
  if (played === 0) log(state, 'The Warden holds its hand, watching you rot.');
  // The Warden's hand rots too — slowly, one card at a time, so its grip
  // on strong cards loosens just like yours.
  const survivors = [];
  for (const card of state.warden.hand) {
    card.power -= 1;
    card.rotted += 1;
    if (card.power <= 0) {
      state.wardenRotted += 1;
      state.warden.discard.push(card);
    } else {
      survivors.push(card);
    }
  }
  state.warden.hand = survivors;
}

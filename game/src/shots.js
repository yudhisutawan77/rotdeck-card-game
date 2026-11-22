// ROTDECK — staged scenes for screenshots. Each scene plays the REAL rules
// forward from a fresh match with a fixed seed and a simple autopilot, so
// every screenshot is a genuine render of the game's own code.
import { newMatch, startMatch, playCard, endPlayerTurn } from './game.js';
import { wardenTurn } from './ai.js';

// The autopilot: play the cheapest affordable card, but NEVER the strongest
// card in hand — it is held, and ROT eats it, which is the game's whole point.
// Strikes go first, so the scene shows real damage and a rising score.
function autopilotRound(state) {
  for (let n = 0; n < 2; n++) {
    if (state.phase !== 'play') return;
    const strongest = Math.max(...state.player.hand.map((c) => c.power));
    const options = state.player.hand
      .filter((c) => c.cost <= state.player.embers && c.power < strongest)
      .sort((a, b) => (a.kind === 'strike' ? 0 : 1) - (b.kind === 'strike' ? 0 : 1) || a.cost - b.cost || b.power - a.power);
    if (options.length === 0) return;
    playCard(state, 'player', options[0]);
  }
}

export function stageShot(name, seed = 1) {
  if (name === 'title') {
    const state = newMatch(seed);
    return state; // phase 'title', never started
  }
  if (name === 'play') {
    const state = newMatch(seed);
    startMatch(state);
    // Three full rounds of autopilot: hold the strongest card, play the rest.
    for (let r = 0; r < 3; r++) {
      autopilotRound(state);
      if (state.phase !== 'play') break;
      endPlayerTurn(state, wardenTurn);
    }
    return state;
  }
  if (name === 'win') {
    const state = newMatch(seed, 30, 3); // the Warden is nearly dead
    startMatch(state);
    // Strike until the Warden falls.
    let guard = 0;
    while (state.phase === 'play' && guard++ < 40) {
      const strikes = state.player.hand
        .filter((c) => c.kind === 'strike' && c.cost <= state.player.embers)
        .sort((a, b) => b.power - a.power);
      if (strikes.length > 0) {
        playCard(state, 'player', strikes[0]);
        continue;
      }
      const any = state.player.hand
        .filter((c) => c.cost <= state.player.embers)
        .sort((a, b) => b.power - a.power);
      if (any.length > 0) {
        playCard(state, 'player', any[0]);
        continue;
      }
      endPlayerTurn(state, wardenTurn);
    }
    return state;
  }
  if (name === 'loss') {
    const state = newMatch(seed, 5, 30); // the player is nearly dead
    startMatch(state);
    // Play nothing. The Warden finishes the job in a round or two.
    let guard = 0;
    while (state.phase === 'play' && guard++ < 10) {
      endPlayerTurn(state, wardenTurn);
    }
    return state;
  }
  throw new Error(`unknown shot: ${name}`);
}

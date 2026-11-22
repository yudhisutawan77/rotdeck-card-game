// ROTDECK — boot. `?shot=<name>&seed=<n>` stages one scene for a screenshot
// (no animation, no input). Otherwise the title screen, then a live match.
import { newMatch, startMatch, playCard, endPlayerTurn, canPlay } from './game.js';
import { wardenTurn } from './ai.js';
import { render, renderTitle, renderEnd } from './render.js';
import { stageShot } from './shots.js';

const root = document.getElementById('app');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

let state = null;
let audio = null;

function blip(freq = 520, ms = 70) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + ms / 1000);
  } catch { /* sound is decoration, never a failure */ }
}

function draw() {
  if (!state) return;
  if (state.phase === 'title') renderTitle(root);
  else if (state.phase === 'won' || state.phase === 'lost') renderEnd(root, state);
  else render(root, state, onPlayCard, onEndTurn);
  wireButtons();
}

function wireButtons() {
  const start = document.getElementById('start-btn');
  if (start) start.addEventListener('click', () => { blip(660); startMatch(state); draw(); });
  const again = document.getElementById('again-btn');
  if (again) again.addEventListener('click', () => { blip(660); state = newMatch(state.seed); draw(); });
}

function onPlayCard(card) {
  if (!canPlay(state, card)) {
    blip(180, 120);
    return;
  }
  blip(740, 60);
  playCard(state, 'player', card);
  draw();
}

function onEndTurn() {
  blip(440, 90);
  endPlayerTurn(state, wardenTurn);
  draw();
}

if (shotName) {
  // Staged scene: deterministic, no input, no animation.
  document.body.classList.add('shot');
  state = stageShot(shotName, seed);
  draw();
} else {
  state = newMatch(seed);
  draw();
  document.addEventListener('keydown', (event) => {
    if (!state) return;
    const key = event.key.toLowerCase();
    if (state.phase === 'title' && (key === 'enter' || key === ' ')) {
      blip(660); startMatch(state); draw();
    } else if ((state.phase === 'won' || state.phase === 'lost') && key === 'r') {
      blip(660); state = newMatch(state.seed); draw();
    } else if (state.phase === 'play' && key === 'e') {
      onEndTurn();
    } else if (state.phase === 'play' && /^[1-6]$/.test(key)) {
      const card = state.player.hand[Number(key) - 1];
      if (card) onPlayCard(card);
    }
  });
}

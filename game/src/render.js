// ROTDECK — DOM rendering. One job: turn a match state into a readable table.
import { SUITS, KINDS, effectText } from './cards.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function lifeBar(who, label) {
  const wrap = el('div', 'life');
  const name = el('div', 'life-name', label);
  const bar = el('div', 'bar');
  const fill = el('div', 'bar-fill');
  fill.style.width = `${Math.max(0, (who.hp / who.maxHp) * 100)}%`;
  if (who.hp <= 10) fill.classList.add('low');
  bar.appendChild(fill);
  const nums = el('div', 'life-nums', `${who.hp} / ${who.maxHp} HP`);
  if (who.shield > 0) nums.appendChild(el('span', 'shield', `  🛡 ${who.shield}`));
  wrap.append(name, bar, nums);
  return wrap;
}

// One face-up card. Cost top-left, suit glyph big, name, kind, power huge,
// effect line, and a ROT stain + crossed-out power when it has rotted.
export function cardNode(card, opts = {}) {
  const suit = SUITS[card.suit];
  const node = el('article', `card suit-${card.suit}`);
  if (opts.playable) node.classList.add('playable');
  if (opts.selected) node.classList.add('selected');
  if (card.rotted > 0) node.classList.add('rotted');
  node.style.setProperty('--suit', suit.color);
  node.style.setProperty('--suit-dark', suit.dark);
  node.style.setProperty('--suit-bg', suit.bg);

  const head = el('div', 'card-head');
  head.appendChild(el('span', 'cost', `◆ ${card.cost}`));
  head.appendChild(el('span', 'suit-glyph', suit.glyph));
  node.appendChild(head);
  node.appendChild(el('div', 'card-name', card.name));
  node.appendChild(el('div', 'card-kind', KINDS[card.kind].name));
  const power = el('div', 'card-power', String(card.power));
  if (card.rotted > 0) {
    const old = el('span', 'power-old', String(card.basePower));
    power.textContent = '';
    power.append(old, document.createTextNode(` → ${card.power}`));
  }
  node.appendChild(power);
  node.appendChild(el('div', 'card-effect', effectText({ ...card, power: card.power })));
  node.appendChild(el('div', 'card-text', card.text));
  if (card.rotted > 0) {
    node.appendChild(el('div', 'rot-label', `☠ ROT −${card.rotted}`));
  }
  if (opts.index !== undefined) {
    node.appendChild(el('div', 'card-key', `[${opts.index + 1}]`));
  }
  if (opts.onClick) node.addEventListener('click', opts.onClick);
  return node;
}

export function cardBackNode() {
  const node = el('article', 'card card-back');
  node.appendChild(el('div', 'back-glyph', '☠'));
  node.appendChild(el('div', 'back-word', 'WARDEN'));
  return node;
}

function hud(state) {
  const hud = el('div', 'hud');
  const chips = [
    ['ROUND', String(state.round)],
    ['EMBERS', `◆ ${state.player.embers}`],
    ['DECK', `${state.player.deck.length} cards`],
    ['SCORE', String(state.score)],
    ['ROTTED', `${state.rotted} dust`],
  ];
  for (const [label, value] of chips) {
    const chip = el('div', 'chip');
    chip.append(el('span', 'chip-label', label), el('span', 'chip-value', value));
    hud.appendChild(chip);
  }
  return hud;
}

function logPanel(state) {
  const panel = el('div', 'log');
  panel.appendChild(el('div', 'log-title', 'TABLE LOG'));
  const lines = state.log.slice(-6);
  for (const line of lines) panel.appendChild(el('div', 'log-line', line));
  return panel;
}

export function renderTitle(root) {
  root.innerHTML = '';
  const screen = el('div', 'screen title-screen');
  screen.appendChild(el('div', 'eyebrow', 'A CARD BATTLER AGAINST THE WARDEN'));
  screen.appendChild(el('h1', 'game-title', 'ROTDECK'));
  screen.appendChild(el('p', 'tagline', 'Every card left in your hand rots −1 power at the end of each turn.'));
  screen.appendChild(el('p', 'tagline2', 'A strong card held too long crumbles to dust. Spend it, or lose it.'));
  const rules = el('div', 'title-rules');
  const items = [
    ['♥ Ember', 'Burn bright, burn fast'],
    ['♠ Tide', 'Shield the shore'],
    ['♣ Thorn', 'Snare and mend'],
    ['♦ Bone', 'The grave hits hardest'],
  ];
  for (const [suit, text] of items) {
    const row = el('div', 'rule-row');
    row.append(el('span', 'rule-suit', suit), el('span', 'rule-text', text));
    rules.appendChild(row);
  }
  screen.appendChild(rules);
  const mechanics = el('div', 'mechanics');
  mechanics.appendChild(el('div', 'mech', '☠ ROT — hand cards lose 1 power each turn'));
  mechanics.appendChild(el('div', 'mech', '✿ BLOOM — two cards of one suit in a turn: second gains +2'));
  mechanics.appendChild(el('div', 'mech', 'Beat The Warden to 0 life. 30 life each. Draw 2, +3 embers a turn.'));
  screen.appendChild(mechanics);
  const btn = el('button', 'big-btn', '▶  SIT AT THE TABLE  (Enter)');
  btn.id = 'start-btn';
  screen.appendChild(btn);
  screen.appendChild(el('p', 'hint', 'Click a card or press 1–6 to play it · E ends your turn · R restarts'));
  root.appendChild(screen);
}

export function renderEnd(root, state) {
  root.innerHTML = '';
  const won = state.phase === 'won';
  const screen = el('div', `screen end-screen ${won ? 'win' : 'loss'}`);
  screen.appendChild(el('h1', 'end-title', won ? '★ THE WARDEN FALLS ★' : '☠ YOU ROT AWAY ☠'));
  screen.appendChild(el('p', 'end-sub', won
    ? 'Thirty life, spent before it rotted. The table is yours.'
    : 'Your hand crumbled, your life with it. The Warden keeps the table.'));
  const stats = el('div', 'end-stats');
  const rows = [
    ['Final score', `${state.score} damage dealt`],
    ['Rounds played', String(state.round)],
    ['Your life left', `${state.player.hp} / ${state.player.maxHp}`],
    ['Warden life left', `${state.warden.hp} / ${state.warden.maxHp}`],
    ['Cards rotted to dust', `${state.rotted} (yours) · ${state.wardenRotted} (Warden)`],
    ['Cards left in deck', String(state.player.deck.length)],
  ];
  for (const [label, value] of rows) {
    const row = el('div', 'stat-row');
    row.append(el('span', 'stat-label', label), el('span', 'stat-value', value));
    stats.appendChild(row);
  }
  screen.appendChild(stats);
  const btn = el('button', 'big-btn', '↻  PLAY AGAIN  (R)');
  btn.id = 'again-btn';
  screen.appendChild(btn);
  root.appendChild(screen);
}

// The live table: Warden row on top, log + END TURN in the middle, your hand below.
export function render(root, state, onPlay, onEndTurn) {
  root.innerHTML = '';
  const table = el('div', 'table');

  const top = el('div', 'foe-row');
  top.appendChild(lifeBar(state.warden, 'THE WARDEN'));
  const foeHand = el('div', 'foe-hand');
  for (let i = 0; i < Math.min(state.warden.hand.length, 5); i++) foeHand.appendChild(cardBackNode());
  foeHand.appendChild(el('div', 'foe-count', `${state.warden.hand.length} in hand · ${state.warden.deck.length} in deck`));
  top.appendChild(foeHand);
  table.appendChild(top);

  const mid = el('div', 'mid-row');
  mid.appendChild(logPanel(state));
  const endBtn = el('button', 'end-btn', 'END TURN  [E]');
  endBtn.id = 'end-turn-btn';
  endBtn.addEventListener('click', onEndTurn);
  mid.appendChild(endBtn);
  table.appendChild(mid);

  const bottom = el('div', 'player-row');
  bottom.appendChild(lifeBar(state.player, 'YOU'));
  bottom.appendChild(hud(state));
  table.appendChild(bottom);

  const handRow = el('div', 'hand-row');
  state.player.hand.forEach((card, i) => {
    const playable = state.player.embers >= card.cost;
    handRow.appendChild(cardNode(card, {
      index: i, playable,
      onClick: () => onPlay(card),
    }));
  });
  if (state.player.hand.length === 0) {
    handRow.appendChild(el('div', 'empty-hand', 'Your hand is empty — end the turn to draw.'));
  }
  table.appendChild(handRow);
  table.appendChild(el('p', 'hint', 'Click a card or press 1–6 to play it · E ends your turn · cards left in hand ROT −1 at end of turn'));
  root.appendChild(table);
}

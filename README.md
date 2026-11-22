[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/yudhisutawan77/rotdeck-card-game/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/yudhisutawan77/rotdeck-card-game/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# ROTDECK — the cards rot in your hand

A card battler against the AI **Warden**, built for the
[make.fun best card game bounty](https://make.fun/c/best-card-game-20261122-1826).

**The one mechanic:** every card left in your hand rots **−1 power** at the
end of each turn. A strong card held too long crumbles to dust. Spend it, or
lose it.

## How to play

- You and the Warden each have **30 life** and a **24-card deck** (12 designs × 2).
- Each round: **draw 2, +3 embers**. Click a card (or press `1–5`) to play it.
- **Strike** deals damage, **Guard** raises shield, **Mend** restores life.
  Shield absorbs damage first.
- **BLOOM:** play two cards of the same suit in one turn and the second gains **+2 power**.
- **ROT:** at the end of your turn, every card still in your hand loses 1
  power. A card at 0 power rots away to dust (counted on the end screen).
- **E** ends your turn. The Warden draws 2, gains 3 embers, plays up to 2
  cards — and logs every move, so you can read it and counter it.
- Win by bringing the Warden to 0 life. Lose yours, and you rot away.

## The four suits (colour AND glyph)

| Suit | Glyph | Colour | Character |
| --- | --- | --- | --- |
| Ember | ♥ | red | Burn bright, burn fast |
| Tide | ♠ | blue | Shield the shore |
| Thorn | ♣ | green | Snare and mend |
| Bone | ♦ | gold | The grave hits hardest |

## Layout

- `main.ts` — hand-in program: copies `game/` + `screenshots/` to `/output`, writes `dossier.json` via `vendor/makefun-game.ts`
- `game/index.html` — page shell
- `game/app.css` — the felt table, bone-white cards, suit colours
- `game/src/cards.js` — suits, kinds, the 12 card designs, deck builder
- `game/src/game.js` — pure match logic (no DOM): turns, ROT, BLOOM, damage
- `game/src/ai.js` — the Warden: values cards, plays at most 2, logs everything
- `game/src/render.js` — DOM: cards, life bars, HUD, log, title and end screens
- `game/src/shots.js` — staged scenes (`title`, `play`, `win`, `loss`) for screenshots
- `game/src/main.js` — boot, keyboard + mouse input, WebAudio blips
- `serve.ts` — local static server for playtesting (`node serve.ts`, then http://localhost:8080)
- `shots.json` — the four screenshot scenes
- `screenshots/` — 4 real renders of the game's own code

## Play it

```sh
node serve.ts
# open http://localhost:8080 — no network, no build step
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

SPDX-License-Identifier: MIT

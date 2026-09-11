# Word Maize

Living product and engineering guide. Completed plans, old prompts, and unused art live in `/Users/kurt/Documents/mobile-apps/word-maize-archive`.

## What it is

Word Maize is a portrait farm word game (iOS, Android, web preview). The player is a Word Harvester helping Patch and Farmer May restore a valley before the Harvest Festival.

There are two families of play:

1. **World Maize** (main campaign, Play tab) — walk a corn maze, inspect hidden letters, remember where they were, and harvest them in spelling order.
2. **The Fair** (arcade) — Cob Harvest on a rotating cylindrical cob, Endless Harvest, Crossword Cob, Twist & Spell, daily prizes, and farm restoration.

Letters and HUD are always native text. Generated PNGs are reusable art, never gameplay data. There is no account system or game backend. Progress lives on the device.

## Goals

- World Maize is the game you open: explore, remember, harvest.
- Cob puzzles remain as Fair extras, not a second home screen.
- Fair challenge: discovering the wrong maze letter costs nothing; tools are help, never a required paywall.
- Calm, readable farm presentation. Reduced Motion shortens nonessential animation.
- Ship locally: coins, energy, inventory, settings, and streaks persist in AsyncStorage.

## How play works

### World Maize

Eighty fields in eight chapters of ten: Sandy Point, Green Valley, Zion Word Hunt, Wingfield, Crow Country, Half Moon, Misty Nevis Peak, Storm Season.

- Pause or Settings (Profile tab) chooses the farmer; Profile also stores a personal name.
- Peek a plant in range to show its letter. Harvest a **showing** FIND letter in range even if you are not facing it. Wrong plants cost nothing.
- Later chapters ask you to type the clue answer before walking. Storm fields add a forecast clock. Mist and evening limit sight. Wildlife can block a plant until you shoo it.
- Maze helpers (mower, tractor, lantern, raincoat, husk clip, scarecrow) are used from the left tool belt. Path crates can add finds for that field. First mower and husk-clip use a how-to. Each helper plays a short field animation.
- Sandy Point: fields 1–3 teach walk/peek/harvest. BARN is an authored hub with decoy wings. SEED hides a required letter behind decorative corn until you mow.
- Corn walls stay solid after a harvest. A mower may cut decorative corn only. Header and footer use the same decorative corn wall as the maze.
- After all 80 fields, Free Play on the Play hub replays those boards with chosen difficulty (easy 1–20, medium 21–50, hard 51–80) and optional storms, mist/evening, and wildlife. Completions do not grant campaign unlocks or first-clear bonuses.

Deterministic rules: `src/game/maze*.ts`. Boards and 80-level targets: `src/data/mazeLevels.ts`, `src/data/mazeCatalog.ts`, `src/data/maze-campaign-levels.json`. Screen: `src/screens/MazeScreen.tsx`.

### Cob Harvest

Sixty authored cobs across four map worlds (Frankland's Corn Fields, Cayon Creek, Fig Tree Hollow, Pinney's Maize).

- The board is a cylinder: column zero neighbors the last column.
- A cell may have stacked layers. Only the first unharvested layer is exposed.
- Tap any visible kernels in spelling order, then press the word display to submit. Letters need not be neighbors. Horizontal drag rotates the cob.
- Level 1 keeps planted words readable. From level 2, exposed letters shuffle so you turn the cob. Level 5 adds a sun-clock star (find a word in ~45s; missing it still completes harvest %). Rot on level 9 spoils one kernel; harvest it in a word or it falls off for good.
- Varieties add rules (White wakes neighbors, Flint cracks then harvests, Popcorn charges, Blue veils side letters, Golden pays long-word bonuses).
- Obstacles and weather are turn-based board states, not a separate minigame.
- Completing level 60 unlocks Endless Harvest, which replays validated templates from a saved seed.

Rules: `src/game` (board, selection, harvest, obstacles, weather, cornVarieties, endless). Levels: `src/data/levels.ts`. Screen: `src/screens/GameScreen.tsx`. Opened from the Fair tab.

### Fair extras

- **Crossword Cob** and **Twist & Spell** — practice puzzles that do not spend energy. Rules: `src/game/cobPuzzles.ts`.
- **Pop-a-Word** — tap matching letters. Completing a word adds 8s (capped remaining time). Words shuffle each play. Personal best lives on the local fair save.
- **Daily Harvest** — seven-day local streak.
- **Restoration** — cob-campaign stars reopen farm milestones and pay a one-time coin grant.

### Economy

Campaign cob attempts cost one energy unless you resume a saved cob. Maze fields do not use that energy meter. Coins buy Barn/Fair tools in the Farm Store. RevenueCat IAP and AdMob rewarded ads run only in an Expo development or production build; Expo Go uses safe fallbacks. Keys live in `app.json` extras / EAS secrets.

## Layout of the repo

| Path | Role |
| --- | --- |
| `app/` | Expo Router routes only |
| `src/game/` | Deterministic rules and tests |
| `src/data/` | Levels, maze campaign JSON, shop |
| `src/screens/` | Screen composition |
| `src/components/` | Native UI, cob renderer, maze scene |
| `src/store/` | Save schema, migration, actions |
| `src/monetization/` | Purchases and rewarded ads |
| `assets/word-maize/` | Registered artwork |
| `tools/art/` | Corn-variant, wood tile, fog texture scripts |

Screens consume `src/game`. Do not duplicate rules in React.

Save key `word-maize.save.v1`, schema version 13. `migrateSave` fills new fields (maze, fair, maze tools, story flags, tool primers, Pop-a-Word best, free-play prefs) without wiping older cob progress.

## Art contract

- Approved Sweet kernel + socket define canvas, alpha footprint, and lighting. Variety scripts must keep that geometry (`npm run art:corn`).
- Perspective is computed at runtime. No separate left/right kernel sprites.
- Maze letters float as native text over `open-v4` plants. Do not bake letters into PNGs.
- Maze HUD overlays the scrolling field. Decorative corn is maze walls and off-board hedge, so it moves with the camera. Harvest sits on the field instead of a fixed corn bar.

## Verify

```bash
npm test
npm run typecheck
npm run art:corn:validate
```

Also smoke compact iPhone and web, maze walk/harvest, cob rotate/submit, Fair puzzles, resume, Reduced Motion, and Level 60 → Endless.

## What is next

The rules and campaign shells are playable. Completing the game now means making World Maize look and feel like one field, then locking rewards so a session pays off.

### 1. Maze presentation (current focus)

- Header and footer are HUD overlays on the scrolling field. Keep Harvest compact so more of the maze stays on screen.
- Harvest still needs the gold-rimmed mockup treatment. The game pad is optional from Pause.
- Plant, farmer, and fog still need a phone pass: peek letter readability, fog density, storm readability.

### 2. Gameplay feel

- Play the 80 generated fields on a phone. Tune with `src/data/maze-campaign-levels.json` (size, timers, mist, wildlife), not one-off screens.
- Confirm inspect/harvest reach, camera centering, and that wrong-letter peeks never feel like a fail.
- Solve-then-walk chapters and storm forecasts need to be understandable without a tutorial dump.

### 3. Rewards and economy

- Maze first-clear coins and ribbons should be obvious on the chapter list and home continue card.
- Barn stock (mower, lantern, tractor, raincoat, husk clip) should have a readable reason to buy vs find in a crate.
- Daily Harvest and cob restoration still exist under Fair; they should not compete with World Maize for attention until maze rewards feel done.

### 4. After the maze loop is fun

- Device-test Fair cob, Crossword, and Twist.
- Store packaging last: real RevenueCat/AdMob IDs, EAS project, privacy/terms pages. Sample Google IDs must not ship.

**Out of scope for this pass:** accounts, cloud sync, leaderboards, live-ops, 3D cob GLBs.
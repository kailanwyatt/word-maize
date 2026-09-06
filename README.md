# Word Maize

Word Maize is a portrait casual word game for iOS, Android, and web. Players rotate a dimensional corn-cob board, tap visible kernels in spelling order, and press the assembled word to submit it. Valid words send kernels into the harvest basket, expose sockets and deeper layers, and restore a farming valley across a 60-level campaign.

This repository contains the Expo + React Native MVP, including the approved cob presentation, campaign maps, local progression, six corn varieties, obstacles, weather, tools, shop scaffolding, rewarded ads/IAP adapters, and the post-campaign Endless Harvest mode.

## Authoritative documentation

- [Game overview](docs/GAME_OVERVIEW.md) — identity, audience, pillars, modes, story, and MVP boundaries
- [Gameplay systems](docs/GAMEPLAY_SYSTEMS.md) — controls, rules, objectives, scoring, corn varieties, obstacles, weather, and tools
- [Campaign and content](docs/CAMPAIGN_CONTENT.md) — Levels 1–60, worlds, progression, tutorials, maps, and Endless Harvest
- [Technical architecture](docs/TECHNICAL_ARCHITECTURE.md) — runtime, modules, save format, asset pipeline, testing, and release constraints
- [Corn art contract](docs/CORN_VARIETIES_AND_ENDLESS_PLAN.md) — approved sprite geometry and variety production rules

Older planning and handoff files remain useful historical context, but the documents above describe the current implementation.

## Run

```bash
npm install
npm start
```

Use `npm run ios`, `npm run android`, or `npm run web` for a target platform.

Gameplay and the local purchase/ad fallbacks run in Expo Go. Real RevenueCat purchases and AdMob rewarded ads require an Expo development build:

```bash
npx eas build --profile development --platform ios
npm run start:dev
```

Production keys belong in `app.json` extras and EAS secrets. Expo Go cannot load those native SDKs.

## Verify

```bash
npm run typecheck
npm test
npm run art:corn:validate
```

The deterministic game rules live in `src/game`; screens consume those rules and must not reproduce them.

# Word Maize

Portrait casual word game for iOS, Android, and web. World Maize is the main campaign: walk a corn maze, remember hidden letters, and harvest a word. The Fair keeps Cob Harvest, Endless Harvest, and extra cob puzzles.

## Guide

[docs/WORD_MAIZE.md](docs/WORD_MAIZE.md) — how play works, repo layout, goals, and remaining work.

Completed plans and unused art are outside this repo, in `../word-maize-archive`.

## Run

```bash
npm install
npm start
```

`npm run ios`, `npm run android`, or `npm run web` for a target. Gameplay and local purchase/ad fallbacks run in Expo Go. Real RevenueCat and AdMob need an Expo development build:

```bash
npx eas build --profile development --platform ios
npm run start:dev
```

Keys belong in `app.json` extras and EAS secrets.

## Verify

```bash
npm run typecheck
npm test
npm run art:corn:validate
```

Deterministic rules live in `src/game`. Screens consume those APIs and must not reproduce them.
